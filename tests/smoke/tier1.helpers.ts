import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { JobBOSS2Client } from '../../src/jobboss2-client';
import { allHandlers, toolSchemaMap } from '../../src/fastmcp/registerTools';
import { orderTools } from '../../src/tools/orders';
import { customerTools } from '../../src/tools/customers';
import { quoteTools } from '../../src/tools/quotes';
import { inventoryTools } from '../../src/tools/inventory';
import { productionTools } from '../../src/tools/production';
import { employeeTools } from '../../src/tools/employees';
import { generalTools } from '../../src/tools/general';
import { generatedToolConfigs } from '../../src/tools/generated';

export type Tier1Scalar = string | number | boolean;
export type Tier1ToolStatus = 'passed' | 'failed' | 'unresolved';
export type Tier1ToolSource = 'manual' | 'generated';

export interface Tier1SmokeConfig {
    smokeTier1Flag: string;
    apiUrl: string;
    apiHostname: string;
    apiKey: string;
    apiSecret: string;
    tokenUrl: string;
    timeoutMs: number;
    allowedHosts: string[];
    blockedHostPatterns: RegExp[];
    seedsFilePath?: string;
}

export interface Tier1SeedConfig {
    global?: Record<string, Tier1Scalar>;
    tools?: Record<string, Record<string, Tier1Scalar>>;
}

export interface Tier1ToolResult {
    toolName: string;
    source: Tier1ToolSource;
    status: Tier1ToolStatus;
    durationMs: number;
    args: Record<string, unknown>;
    requiredKeys: string[];
    error?: string;
    missingKeys?: string[];
    ambiguousKeys?: string[];
}

export interface Tier1SmokeReport {
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    totalTools: number;
    attemptedTools: number;
    passed: number;
    failed: number;
    unresolved: number;
    results: Tier1ToolResult[];
}

export interface Tier1ToolCandidate {
    name: string;
    source: Tier1ToolSource;
    schema: z.ZodTypeAny;
    requiredKeys: string[];
    acceptsTake: boolean;
    execute: (args: Record<string, unknown>, client: JobBOSS2Client) => Promise<unknown>;
}

export interface Tier1DiscoveryValue {
    value: Tier1Scalar;
    sources: Set<string>;
}

export type Tier1DiscoveryContext = Map<string, Map<string, Tier1DiscoveryValue>>;

export interface Tier1ResolutionResult {
    args: Record<string, unknown>;
    missingKeys: string[];
    ambiguousKeys: string[];
}

const EXPECTED_TIER1_CANDIDATE_COUNT = 97;
const QUERY_KEYS = new Set(['fields', 'sort', 'skip', 'take']);
const MUTATION_NAME_PATTERNS = [/^create_/i, /^update_/i, /^custom_api_call$/i, /^run_report$/i, /authenticate/i, /_set_/i, /_reset_/i];
const EXCLUDED_TIER1_GET_NAMES = new Set([
    // Requires requestId returned by run_report (POST), which is outside GET-only tier-one policy.
    'get_report_status',
]);
const DEFAULT_BLOCKED_HOST_PATTERNS = [
    /(^|[.-])prod([.-]|$)/i,
    /(^|[.-])production([.-]|$)/i,
    /(^|[.-])live([.-]|$)/i,
    /(^|\.)api\.jobboss2\.com$/i,
];

function toLowerTrimmed(value: string): string {
    return value.trim().toLowerCase();
}

function parseCsvList(value: string | undefined): string[] {
    if (!value) {
        return [];
    }
    return value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRegexToken(token: string): RegExp {
    const literalMatch = token.match(/^\/(.+)\/([a-z]*)$/i);
    if (literalMatch) {
        return new RegExp(literalMatch[1], literalMatch[2] || 'i');
    }
    return new RegExp(escapeRegex(token), 'i');
}

export function compileBlockedHostPatterns(customPatternValue: string | undefined): RegExp[] {
    const customPatterns = parseCsvList(customPatternValue).map(parseRegexToken);
    return [...DEFAULT_BLOCKED_HOST_PATTERNS, ...customPatterns];
}

function getRequiredEnv(env: NodeJS.ProcessEnv, key: string): string {
    const value = env[key];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export function parseTier1SmokeConfig(env: NodeJS.ProcessEnv): Tier1SmokeConfig {
    if (env.SMOKE_TIER1 !== '1') {
        throw new Error('SMOKE_TIER1 must be set to 1');
    }

    const apiUrl = getRequiredEnv(env, 'JOBBOSS2_API_URL');
    let apiHostname: string;
    try {
        apiHostname = toLowerTrimmed(new URL(apiUrl).hostname);
    } catch {
        throw new Error('JOBBOSS2_API_URL must be a valid absolute URL');
    }

    const allowedHosts = parseCsvList(env.SMOKE_ALLOWED_HOSTS).map(toLowerTrimmed);
    if (allowedHosts.length === 0) {
        throw new Error('SMOKE_ALLOWED_HOSTS is required and must contain at least one hostname');
    }
    if (!allowedHosts.includes(apiHostname)) {
        throw new Error(`API hostname ${apiHostname} is not in SMOKE_ALLOWED_HOSTS`);
    }

    const blockedHostPatterns = compileBlockedHostPatterns(env.SMOKE_BLOCKED_HOST_PATTERNS);
    const blockedMatch = blockedHostPatterns.find((pattern) => pattern.test(apiHostname));
    if (blockedMatch) {
        throw new Error(`API hostname ${apiHostname} is blocked by safety policy (${blockedMatch.toString()})`);
    }

    const timeoutRaw = env.API_TIMEOUT ?? '30000';
    const timeoutMs = Number.parseInt(timeoutRaw, 10);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new Error(`API_TIMEOUT must be a positive integer, received: ${timeoutRaw}`);
    }

    return {
        smokeTier1Flag: env.SMOKE_TIER1,
        apiUrl,
        apiHostname,
        apiKey: getRequiredEnv(env, 'JOBBOSS2_API_KEY'),
        apiSecret: getRequiredEnv(env, 'JOBBOSS2_API_SECRET'),
        tokenUrl: getRequiredEnv(env, 'JOBBOSS2_OAUTH_TOKEN_URL'),
        timeoutMs,
        allowedHosts,
        blockedHostPatterns,
        seedsFilePath: env.SMOKE_TIER1_SEEDS_FILE,
    };
}

function isScalar(value: unknown): value is Tier1Scalar {
    if (typeof value === 'string' || typeof value === 'boolean') {
        return true;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value);
    }
    return false;
}

function assertScalarRecord(value: unknown, scope: string): asserts value is Record<string, Tier1Scalar> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${scope} must be an object of scalar values`);
    }

    for (const [key, entry] of Object.entries(value)) {
        if (!isScalar(entry)) {
            throw new Error(`${scope}.${key} must be a scalar string/number/boolean`);
        }
    }
}

export function loadTier1SeedConfig(seedsFilePath: string | undefined): Tier1SeedConfig {
    if (!seedsFilePath) {
        return {};
    }

    const absolutePath = path.isAbsolute(seedsFilePath) ? seedsFilePath : path.resolve(process.cwd(), seedsFilePath);
    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    const parsed = JSON.parse(fileContents) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Seed config file ${absolutePath} must contain a top-level object`);
    }

    const parsedObject = parsed as Record<string, unknown>;
    const config: Tier1SeedConfig = {};

    if (parsedObject.global !== undefined) {
        assertScalarRecord(parsedObject.global, 'global');
        config.global = parsedObject.global;
    }

    if (parsedObject.tools !== undefined) {
        if (!parsedObject.tools || typeof parsedObject.tools !== 'object' || Array.isArray(parsedObject.tools)) {
            throw new Error('tools must be an object keyed by tool name');
        }

        const normalizedTools: Record<string, Record<string, Tier1Scalar>> = {};
        for (const [toolName, toolSeed] of Object.entries(parsedObject.tools)) {
            assertScalarRecord(toolSeed, `tools.${toolName}`);
            normalizedTools[toolName] = toolSeed;
        }
        config.tools = normalizedTools;
    }

    return config;
}

function getManualToolNames(): string[] {
    const manualTools = [...orderTools, ...customerTools, ...quoteTools, ...inventoryTools, ...productionTools, ...employeeTools, ...generalTools];
    return manualTools.map((tool) => tool.name);
}

function isMutationLikeName(name: string): boolean {
    return MUTATION_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

function isManualTier1Name(name: string): boolean {
    return name.startsWith('get_') && !isMutationLikeName(name) && !EXCLUDED_TIER1_GET_NAMES.has(name);
}

function isGeneratedTier1Name(name: string): boolean {
    return (name.startsWith('get_') || name.includes('_get_')) && !isMutationLikeName(name) && !EXCLUDED_TIER1_GET_NAMES.has(name);
}

function unwrapToObjectSchema(schema: z.ZodTypeAny): z.ZodObject<any> | null {
    let current: z.ZodTypeAny = schema;
    while (current instanceof z.ZodEffects) {
        current = current._def.schema;
    }
    if (current instanceof z.ZodObject) {
        return current;
    }
    return null;
}

export function extractRequiredKeysFromSchema(schema: z.ZodTypeAny): string[] {
    const objectSchema = unwrapToObjectSchema(schema);
    if (!objectSchema) {
        return [];
    }

    const shape = objectSchema.shape as Record<string, z.ZodTypeAny>;
    return Object.entries(shape)
        .filter(([key, value]) => !QUERY_KEYS.has(key) && !value.isOptional())
        .map(([key]) => key)
        .sort();
}

function schemaAcceptsTake(schema: z.ZodTypeAny): boolean {
    const objectSchema = unwrapToObjectSchema(schema);
    if (!objectSchema) {
        return false;
    }
    const shape = objectSchema.shape as Record<string, z.ZodTypeAny>;
    return Boolean(shape.take);
}

export function buildTier1ToolInventory(): Tier1ToolCandidate[] {
    const candidates: Tier1ToolCandidate[] = [];
    const seenNames = new Set<string>();

    for (const toolName of getManualToolNames()) {
        if (!isManualTier1Name(toolName)) {
            continue;
        }

        const handler = allHandlers[toolName];
        const schema = toolSchemaMap[toolName];
        if (typeof handler !== 'function' || !schema) {
            throw new Error(`Manual tool ${toolName} is missing handler or schema`);
        }
        if (seenNames.has(toolName)) {
            throw new Error(`Duplicate tool name in tier-one inventory: ${toolName}`);
        }

        seenNames.add(toolName);
        candidates.push({
            name: toolName,
            source: 'manual',
            schema,
            requiredKeys: extractRequiredKeysFromSchema(schema),
            acceptsTake: schemaAcceptsTake(schema),
            execute: async (args, client) => handler(args, client),
        });
    }

    for (const generated of generatedToolConfigs) {
        if (!isGeneratedTier1Name(generated.name)) {
            continue;
        }

        if (seenNames.has(generated.name)) {
            throw new Error(`Duplicate tool name in tier-one inventory: ${generated.name}`);
        }

        seenNames.add(generated.name);
        candidates.push({
            name: generated.name,
            source: 'generated',
            schema: generated.schema,
            requiredKeys: extractRequiredKeysFromSchema(generated.schema),
            acceptsTake: schemaAcceptsTake(generated.schema),
            execute: async (args, client) => generated.handler(args, client),
        });
    }

    candidates.sort((a, b) => a.name.localeCompare(b.name));

    if (candidates.length !== EXPECTED_TIER1_CANDIDATE_COUNT) {
        throw new Error(
            `Tier-one tool inventory count is ${candidates.length}, expected ${EXPECTED_TIER1_CANDIDATE_COUNT}. Review GET selection policy and update expected count if intentional.`
        );
    }

    return candidates;
}

export function createDiscoveryContext(): Tier1DiscoveryContext {
    return new Map();
}

function getFirstObjectRecord(result: unknown): Record<string, unknown> | null {
    if (Array.isArray(result)) {
        const first = result[0];
        if (first && typeof first === 'object' && !Array.isArray(first)) {
            return first as Record<string, unknown>;
        }
        return null;
    }

    if (result && typeof result === 'object' && !Array.isArray(result)) {
        return result as Record<string, unknown>;
    }

    return null;
}

export function addDiscoveredScalars(context: Tier1DiscoveryContext, toolName: string, result: unknown): void {
    const firstRecord = getFirstObjectRecord(result);
    if (!firstRecord) {
        return;
    }

    for (const [key, value] of Object.entries(firstRecord)) {
        if (!isScalar(value)) {
            continue;
        }

        const keyValues = context.get(key) ?? new Map<string, Tier1DiscoveryValue>();
        const serializedValue = JSON.stringify(value);
        const existing = keyValues.get(serializedValue) ?? {
            value,
            sources: new Set<string>(),
        };
        existing.sources.add(toolName);
        keyValues.set(serializedValue, existing);
        context.set(key, keyValues);
    }
}

function getToolSeedValue(seeds: Tier1SeedConfig, toolName: string, key: string): Tier1Scalar | undefined {
    return seeds.tools?.[toolName]?.[key];
}

function getGlobalSeedValue(seeds: Tier1SeedConfig, key: string): Tier1Scalar | undefined {
    return seeds.global?.[key];
}

function formatAmbiguousKey(key: string, values: Tier1DiscoveryValue[]): string {
    const rendered = values
        .map((entry) => `${String(entry.value)} (from ${Array.from(entry.sources).sort().join('|')})`)
        .sort();
    return `${key}: ${rendered.join(', ')}`;
}

export function resolveToolArgs(
    tool: Pick<Tier1ToolCandidate, 'name' | 'requiredKeys' | 'acceptsTake'>,
    seeds: Tier1SeedConfig,
    discovery: Tier1DiscoveryContext
): Tier1ResolutionResult {
    const args: Record<string, unknown> = {};
    const missingKeys: string[] = [];
    const ambiguousKeys: string[] = [];

    if (tool.acceptsTake) {
        args.take = 1;
    }

    for (const key of tool.requiredKeys) {
        const toolSeedValue = getToolSeedValue(seeds, tool.name, key);
        if (toolSeedValue !== undefined) {
            args[key] = toolSeedValue;
            continue;
        }

        const discoveredValues = Array.from(discovery.get(key)?.values() ?? []);
        if (discoveredValues.length > 1) {
            ambiguousKeys.push(formatAmbiguousKey(key, discoveredValues));
            continue;
        }
        if (discoveredValues.length === 1) {
            args[key] = discoveredValues[0].value;
            continue;
        }

        const globalSeedValue = getGlobalSeedValue(seeds, key);
        if (globalSeedValue !== undefined) {
            args[key] = globalSeedValue;
            continue;
        }

        missingKeys.push(key);
    }

    return { args, missingKeys, ambiguousKeys };
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function makeUnresolvedError(missingKeys: string[], ambiguousKeys: string[]): string {
    const parts: string[] = [];
    if (missingKeys.length > 0) {
        parts.push(`missing keys: ${missingKeys.join(', ')}`);
    }
    if (ambiguousKeys.length > 0) {
        parts.push(`ambiguous keys: ${ambiguousKeys.join('; ')}`);
    }
    return parts.join(' | ');
}

export async function runTier1Smoke(
    tools: Tier1ToolCandidate[],
    client: JobBOSS2Client,
    seeds: Tier1SeedConfig
): Promise<Tier1SmokeReport> {
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();
    const startMs = Date.now();
    const discovery = createDiscoveryContext();
    const results: Tier1ToolResult[] = [];
    const pending = new Map(tools.map((tool) => [tool.name, tool]));

    let madeProgress = true;
    while (madeProgress) {
        madeProgress = false;

        for (const tool of Array.from(pending.values()).sort((a, b) => a.name.localeCompare(b.name))) {
            const resolution = resolveToolArgs(tool, seeds, discovery);
            if (resolution.missingKeys.length > 0 || resolution.ambiguousKeys.length > 0) {
                continue;
            }

            pending.delete(tool.name);
            madeProgress = true;
            const toolStartMs = Date.now();

            try {
                const output = await tool.execute(resolution.args, client);
                const durationMs = Date.now() - toolStartMs;
                addDiscoveredScalars(discovery, tool.name, output);
                results.push({
                    toolName: tool.name,
                    source: tool.source,
                    status: 'passed',
                    durationMs,
                    args: resolution.args,
                    requiredKeys: tool.requiredKeys,
                });
            } catch (error) {
                const durationMs = Date.now() - toolStartMs;
                results.push({
                    toolName: tool.name,
                    source: tool.source,
                    status: 'failed',
                    durationMs,
                    args: resolution.args,
                    requiredKeys: tool.requiredKeys,
                    error: getErrorMessage(error),
                });
            }
        }
    }

    for (const tool of Array.from(pending.values()).sort((a, b) => a.name.localeCompare(b.name))) {
        const resolution = resolveToolArgs(tool, seeds, discovery);
        results.push({
            toolName: tool.name,
            source: tool.source,
            status: 'unresolved',
            durationMs: 0,
            args: resolution.args,
            requiredKeys: tool.requiredKeys,
            missingKeys: resolution.missingKeys,
            ambiguousKeys: resolution.ambiguousKeys,
            error: makeUnresolvedError(resolution.missingKeys, resolution.ambiguousKeys),
        });
    }

    const finishedAtDate = new Date();
    const finishedAt = finishedAtDate.toISOString();
    const durationMs = Date.now() - startMs;
    const passed = results.filter((result) => result.status === 'passed').length;
    const failed = results.filter((result) => result.status === 'failed').length;
    const unresolved = results.filter((result) => result.status === 'unresolved').length;

    return {
        startedAt,
        finishedAt,
        durationMs,
        totalTools: tools.length,
        attemptedTools: passed + failed,
        passed,
        failed,
        unresolved,
        results,
    };
}

export function formatTier1SmokeSummary(report: Tier1SmokeReport): string {
    return `[tier1-smoke] total=${report.totalTools} attempted=${report.attemptedTools} passed=${report.passed} failed=${report.failed} unresolved=${report.unresolved} durationMs=${report.durationMs}`;
}

export function isTier1SmokePassing(report: Tier1SmokeReport): boolean {
    return report.failed === 0 && report.unresolved === 0 && report.passed === report.totalTools;
}

export function printTier1SmokeReport(report: Tier1SmokeReport): void {
    console.log(formatTier1SmokeSummary(report));

    const failures = report.results
        .filter((result) => result.status === 'failed')
        .sort((a, b) => a.toolName.localeCompare(b.toolName));

    const unresolved = report.results
        .filter((result) => result.status === 'unresolved')
        .sort((a, b) => a.toolName.localeCompare(b.toolName));

    for (const result of failures) {
        console.log(
            `[tier1-smoke][failed] ${result.toolName} durationMs=${result.durationMs} args=${JSON.stringify(result.args)} error=${result.error ?? ''}`
        );
    }

    for (const result of unresolved) {
        console.log(
            `[tier1-smoke][unresolved] ${result.toolName} args=${JSON.stringify(result.args)} missingKeys=${JSON.stringify(
                result.missingKeys ?? []
            )} ambiguousKeys=${JSON.stringify(result.ambiguousKeys ?? [])}`
        );
    }
}

export function writeTier1SmokeReport(report: Tier1SmokeReport, outputPath: string = 'tmp/tier1-smoke-report.json'): string {
    const absolutePath = path.isAbsolute(outputPath) ? outputPath : path.resolve(process.cwd(), outputPath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, JSON.stringify(report, null, 2), 'utf8');
    return absolutePath;
}
