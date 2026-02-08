import {
    READ_ONLY_MODE_ENV_VAR,
    isMutationToolName,
    isMutatingHttpMethod,
    isReadOnlyModeEnabled,
} from '../src/fastmcp/mutationPolicy';

describe('mutation policy', () => {
    it('classifies mutation tool names', () => {
        expect(isMutationToolName('create_order')).toBe(true);
        expect(isMutationToolName('update_customer')).toBe(true);
        expect(isMutationToolName('run_report')).toBe(true);
        expect(isMutationToolName('shopview_set_grid_option')).toBe(true);
        expect(isMutationToolName('shopview_reset_grid_options')).toBe(true);
        expect(isMutationToolName('eci_aps_authenticate_user')).toBe(true);
        expect(isMutationToolName('get_orders')).toBe(false);
        expect(isMutationToolName('custom_api_call')).toBe(false);
    });

    it('classifies mutating HTTP methods', () => {
        expect(isMutatingHttpMethod('POST')).toBe(true);
        expect(isMutatingHttpMethod('patch')).toBe(true);
        expect(isMutatingHttpMethod('delete')).toBe(true);
        expect(isMutatingHttpMethod('GET')).toBe(false);
    });

    it('parses read-only env values', () => {
        expect(isReadOnlyModeEnabled({ [READ_ONLY_MODE_ENV_VAR]: '1' })).toBe(true);
        expect(isReadOnlyModeEnabled({ [READ_ONLY_MODE_ENV_VAR]: 'true' })).toBe(true);
        expect(isReadOnlyModeEnabled({ [READ_ONLY_MODE_ENV_VAR]: 'YES' })).toBe(true);
        expect(isReadOnlyModeEnabled({ [READ_ONLY_MODE_ENV_VAR]: 'on' })).toBe(true);
        expect(isReadOnlyModeEnabled({ [READ_ONLY_MODE_ENV_VAR]: '0' })).toBe(false);
        expect(isReadOnlyModeEnabled({} as NodeJS.ProcessEnv)).toBe(false);
    });
});
