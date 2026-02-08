export const READ_ONLY_MODE_ENV_VAR = 'JOBBOSS2_READ_ONLY_MODE';

const MUTATION_TOOL_NAME_PATTERNS: RegExp[] = [
    /^create_/i,
    /^update_/i,
    /^run_report$/i,
    /authenticate/i,
    /_set_/i,
    /_reset_/i,
];

const MUTATING_HTTP_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const READ_ONLY_TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function isReadOnlyModeEnabled(env: NodeJS.ProcessEnv): boolean {
    const rawValue = env[READ_ONLY_MODE_ENV_VAR];
    if (!rawValue) {
        return false;
    }

    return READ_ONLY_TRUTHY_VALUES.has(rawValue.trim().toLowerCase());
}

export function isMutationToolName(toolName: string): boolean {
    // custom_api_call is evaluated by method because GET should remain allowed in read-only mode.
    if (toolName === 'custom_api_call') {
        return false;
    }

    return MUTATION_TOOL_NAME_PATTERNS.some((pattern) => pattern.test(toolName));
}

export function isMutatingHttpMethod(method: string): boolean {
    return MUTATING_HTTP_METHODS.has(method.toUpperCase());
}
