import { z } from 'zod';
import { JobBOSS2Client } from '../../src/jobboss2-client';
import type { Tier1ToolCandidate } from './tier1.helpers';
import {
    addDiscoveredScalars,
    buildTier1ToolInventory,
    createDiscoveryContext,
    formatTier1SmokeSummary,
    isTier1SmokePassing,
    loadTier1SeedConfig,
    parseTier1SmokeConfig,
    resolveToolArgs,
    runTier1Smoke,
    printTier1SmokeReport,
    writeTier1SmokeReport,
} from './tier1.helpers';

function createBaseEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
    return {
        SMOKE_TIER1: '1',
        JOBBOSS2_API_URL: 'https://staging.example.internal',
        JOBBOSS2_API_KEY: 'test-key',
        JOBBOSS2_API_SECRET: 'test-secret',
        JOBBOSS2_OAUTH_TOKEN_URL: 'https://staging.example.internal/oauth/token',
        SMOKE_ALLOWED_HOSTS: 'staging.example.internal',
        API_TIMEOUT: '30000',
        ...overrides,
    };
}

describe('Tier-One smoke preflight guardrails', () => {
    it('fails when SMOKE_TIER1 is missing', () => {
        const env = createBaseEnv({ SMOKE_TIER1: undefined });
        expect(() => parseTier1SmokeConfig(env)).toThrow('SMOKE_TIER1 must be set to 1');
    });

    it('fails when API hostname is not in allowlist', () => {
        const env = createBaseEnv({
            JOBBOSS2_API_URL: 'https://staging-east.example.internal',
            SMOKE_ALLOWED_HOSTS: 'staging-west.example.internal',
        });
        expect(() => parseTier1SmokeConfig(env)).toThrow('is not in SMOKE_ALLOWED_HOSTS');
    });

    it('fails when API hostname matches blocked pattern', () => {
        const env = createBaseEnv({
            JOBBOSS2_API_URL: 'https://api.prod.example.internal',
            JOBBOSS2_OAUTH_TOKEN_URL: 'https://api.prod.example.internal/oauth/token',
            SMOKE_ALLOWED_HOSTS: 'api.prod.example.internal',
        });
        expect(() => parseTier1SmokeConfig(env)).toThrow('is blocked by safety policy');
    });
});

describe('Tier-One smoke tool selection', () => {
    it('selects only GET-classified tools and excludes mutation-like names', () => {
        const tools = buildTier1ToolInventory();
        expect(tools).toHaveLength(97);

        const invalidByPattern = tools.filter((tool) => {
            const looksLikeGet = tool.name.startsWith('get_') || tool.name.includes('_get_');
            const looksLikeMutation = /^create_|^update_|^custom_api_call$|^run_report$|authenticate|_set_|_reset_/i.test(tool.name);
            return !looksLikeGet || looksLikeMutation;
        });

        expect(invalidByPattern).toEqual([]);
        expect(tools.some((tool) => tool.name === 'get_report_status')).toBe(false);
    });
});

describe('Tier-One smoke resolver behavior', () => {
    it('resolves from unique runtime-discovered values', () => {
        const discovery = createDiscoveryContext();
        addDiscoveredScalars(discovery, 'get_orders', [{ orderNumber: 'ORD-1' }]);

        const resolution = resolveToolArgs(
            {
                name: 'get_order_by_id',
                requiredKeys: ['orderNumber'],
                acceptsTake: false,
            },
            {},
            discovery
        );

        expect(resolution.args).toEqual({ orderNumber: 'ORD-1' });
        expect(resolution.missingKeys).toEqual([]);
        expect(resolution.ambiguousKeys).toEqual([]);
    });

    it('prefers tool-specific seed values over discovered values', () => {
        const discovery = createDiscoveryContext();
        addDiscoveredScalars(discovery, 'get_orders', [{ orderNumber: 'ORD-DISCOVERED' }]);

        const resolution = resolveToolArgs(
            {
                name: 'get_order_by_id',
                requiredKeys: ['orderNumber'],
                acceptsTake: false,
            },
            {
                tools: {
                    get_order_by_id: {
                        orderNumber: 'ORD-SEED',
                    },
                },
            },
            discovery
        );

        expect(resolution.args).toEqual({ orderNumber: 'ORD-SEED' });
        expect(resolution.missingKeys).toEqual([]);
        expect(resolution.ambiguousKeys).toEqual([]);
    });

    it('fails resolution when required key is missing', () => {
        const resolution = resolveToolArgs(
            {
                name: 'get_order_by_id',
                requiredKeys: ['orderNumber'],
                acceptsTake: false,
            },
            {},
            createDiscoveryContext()
        );

        expect(resolution.args).toEqual({});
        expect(resolution.missingKeys).toEqual(['orderNumber']);
        expect(resolution.ambiguousKeys).toEqual([]);
    });

    it('fails resolution when discovered key is ambiguous without tool-specific seed', () => {
        const discovery = createDiscoveryContext();
        addDiscoveredScalars(discovery, 'get_orders', [{ orderNumber: 'ORD-1' }]);
        addDiscoveredScalars(discovery, 'get_orders_second', [{ orderNumber: 'ORD-2' }]);

        const resolution = resolveToolArgs(
            {
                name: 'get_order_by_id',
                requiredKeys: ['orderNumber'],
                acceptsTake: false,
            },
            {
                global: {
                    orderNumber: 'ORD-GLOBAL',
                },
            },
            discovery
        );

        expect(resolution.args).toEqual({});
        expect(resolution.missingKeys).toEqual([]);
        expect(resolution.ambiguousKeys).toHaveLength(1);
        expect(resolution.ambiguousKeys[0]).toContain('orderNumber');
    });
});

describe('Tier-One smoke runtime behavior', () => {
    it('collects failures and unresolved tools, then reports non-passing status', async () => {
        const fakeTools: Tier1ToolCandidate[] = [
            {
                name: 'get_orders',
                source: 'manual',
                schema: z.object({ take: z.number().optional() }),
                requiredKeys: [],
                acceptsTake: true,
                execute: async () => [{ orderNumber: 'ORD-1', customerCode: 'CUST-1' }],
            },
            {
                name: 'get_customer_by_code',
                source: 'manual',
                schema: z.object({ customerCode: z.string() }),
                requiredKeys: ['customerCode'],
                acceptsTake: false,
                execute: async () => ({ customerCode: 'CUST-1' }),
            },
            {
                name: 'get_order_by_id',
                source: 'manual',
                schema: z.object({ orderNumber: z.string() }),
                requiredKeys: ['orderNumber'],
                acceptsTake: false,
                execute: async () => {
                    throw new Error('forced failure');
                },
            },
            {
                name: 'get_quote_by_id',
                source: 'manual',
                schema: z.object({ quoteNumber: z.string() }),
                requiredKeys: ['quoteNumber'],
                acceptsTake: false,
                execute: async () => ({ quoteNumber: 'Q-1' }),
            },
        ];

        const report = await runTier1Smoke(fakeTools, {} as JobBOSS2Client, {});

        expect(report.totalTools).toBe(4);
        expect(report.passed).toBe(2);
        expect(report.failed).toBe(1);
        expect(report.unresolved).toBe(1);
        expect(isTier1SmokePassing(report)).toBe(false);

        const summary = formatTier1SmokeSummary(report);
        expect(summary).toContain('total=4');
        expect(summary).toContain('passed=2');
        expect(summary).toContain('failed=1');
        expect(summary).toContain('unresolved=1');
    });
});

const liveSmokeDescribe = process.env.SMOKE_TIER1 === '1' ? describe : describe.skip;

liveSmokeDescribe('Tier-One live smoke (staging read-only)', () => {
    it('runs all resolvable GET tools and fails on any failed/unresolved result', async () => {
        const config = parseTier1SmokeConfig(process.env);
        const seeds = loadTier1SeedConfig(config.seedsFilePath);
        const tools = buildTier1ToolInventory();

        const client = new JobBOSS2Client({
            apiUrl: config.apiUrl,
            apiKey: config.apiKey,
            apiSecret: config.apiSecret,
            tokenUrl: config.tokenUrl,
            timeout: config.timeoutMs,
        });

        try {
            const report = await runTier1Smoke(tools, client, seeds);
            printTier1SmokeReport(report);
            const reportPath = writeTier1SmokeReport(report);
            console.log(`[tier1-smoke] reportPath=${reportPath}`);
            expect(isTier1SmokePassing(report)).toBe(true);
        } finally {
            client.destroy();
        }
    });
});
