import { registerTools, toolSchemaMap, allHandlers } from '../src/fastmcp/registerTools';
import * as schemas from '../src/schemas';
import { orderTools } from '../src/tools/orders';
import { customerTools } from '../src/tools/customers';
import { quoteTools } from '../src/tools/quotes';
import { inventoryTools } from '../src/tools/inventory';
import { productionTools } from '../src/tools/production';
import { employeeTools } from '../src/tools/employees';
import { generalTools } from '../src/tools/general';
import { generatedToolConfigs } from '../src/tools/generated';
import { READ_ONLY_MODE_ENV_VAR } from '../src/fastmcp/mutationPolicy';

const manualTools = [
    ...orderTools,
    ...customerTools,
    ...quoteTools,
    ...inventoryTools,
    ...productionTools,
    ...employeeTools,
    ...generalTools,
];

function getRegisteredToolByName(server: { addTool: jest.Mock }, toolName: string): any {
    const registeredTools = server.addTool.mock.calls.map(([config]) => config);
    const found = registeredTools.find((toolConfig) => toolConfig.name === toolName);
    if (!found) {
        throw new Error(`Tool not found in registration mock: ${toolName}`);
    }
    return found;
}

describe('FastMCP Tool Registration', () => {
    it('should have explicit schema mappings for all manual tools', () => {
        const missing = manualTools
            .map((tool) => tool.name)
            .filter((toolName) => !toolSchemaMap[toolName]);

        expect(missing).toEqual([]);
    });

    it('should map formerly permissive order and bundle schemas explicitly', () => {
        expect(toolSchemaMap.create_order_release).toBe(schemas.CreateOrderReleaseSchema);
        expect(toolSchemaMap.get_order_release_by_id).toBe(schemas.GetOrderReleaseByIdSchema);
        expect(toolSchemaMap.get_order_bundle).toBe(schemas.GetOrderBundleSchema);
        expect(toolSchemaMap.create_order_from_quote).toBe(schemas.CreateOrderFromQuoteSchema);
        expect(toolSchemaMap.get_po_bundle).toBe(schemas.GetPOBundleSchema);
        expect(toolSchemaMap.get_order_releases).toBe(schemas.GetOrderReleasesSchema);
        expect(toolSchemaMap.get_estimate_material_by_sub_part).toBe(schemas.GetEstimateMaterialBySubPartSchema);
    });

    it('should fail fast when a manual tool schema mapping is missing', () => {
        const originalSchema = toolSchemaMap.get_orders;
        const server = { addTool: jest.fn() };

        try {
            delete toolSchemaMap.get_orders;
            expect(() => registerTools(server as any, {} as any)).toThrow(
                'Missing schema mapping for manual tool: get_orders'
            );
        } finally {
            toolSchemaMap.get_orders = originalSchema;
        }
    });

    it('should fail fast when a manual tool handler mapping is missing', () => {
        const handlers = allHandlers as Record<string, unknown>;
        const originalHandler = handlers.get_orders;
        const server = { addTool: jest.fn() };

        try {
            delete handlers.get_orders;
            expect(() => registerTools(server as any, {} as any)).toThrow(
                'Missing handler mapping for manual tool: get_orders'
            );
        } finally {
            handlers.get_orders = originalHandler;
        }
    });

    it('should fail fast when duplicate tool names are detected', () => {
        const duplicateName = manualTools[0].name;
        const duplicateConfig = { ...generatedToolConfigs[0], name: duplicateName };
        const server = { addTool: jest.fn() };

        try {
            generatedToolConfigs.push(duplicateConfig);
            expect(() => registerTools(server as any, {} as any)).toThrow(
                `Duplicate tool registration detected: ${duplicateName}`
            );
        } finally {
            generatedToolConfigs.pop();
        }
    });

    it('should register all manual and generated tools when mappings are complete', () => {
        const server = { addTool: jest.fn() };

        registerTools(server as any, {} as any);

        expect(server.addTool).toHaveBeenCalledTimes(manualTools.length + generatedToolConfigs.length);
    });

    it('should block mutation tools when read-only mode is enabled', async () => {
        const originalValue = process.env[READ_ONLY_MODE_ENV_VAR];
        process.env[READ_ONLY_MODE_ENV_VAR] = '1';

        const server = { addTool: jest.fn() };
        const client = {
            createOrder: jest.fn(),
        };

        try {
            registerTools(server as any, client as any);
            const createOrderTool = getRegisteredToolByName(server, 'create_order');
            const result = await createOrderTool.execute({ customerCode: 'ACME' });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain(READ_ONLY_MODE_ENV_VAR);
            expect(client.createOrder).not.toHaveBeenCalled();
        } finally {
            if (originalValue === undefined) {
                delete process.env[READ_ONLY_MODE_ENV_VAR];
            } else {
                process.env[READ_ONLY_MODE_ENV_VAR] = originalValue;
            }
        }
    });

    it('should allow read-only GET tools when read-only mode is enabled', async () => {
        const originalValue = process.env[READ_ONLY_MODE_ENV_VAR];
        process.env[READ_ONLY_MODE_ENV_VAR] = 'true';

        const server = { addTool: jest.fn() };
        const client = {
            getOrders: jest.fn().mockResolvedValue([{ orderNumber: '1001' }]),
        };

        try {
            registerTools(server as any, client as any);
            const getOrdersTool = getRegisteredToolByName(server, 'get_orders');
            const result = await getOrdersTool.execute({});

            expect(result.isError).not.toBe(true);
            expect(client.getOrders).toHaveBeenCalledWith({});
        } finally {
            if (originalValue === undefined) {
                delete process.env[READ_ONLY_MODE_ENV_VAR];
            } else {
                process.env[READ_ONLY_MODE_ENV_VAR] = originalValue;
            }
        }
    });

    it('should block mutating custom_api_call methods in read-only mode', async () => {
        const originalValue = process.env[READ_ONLY_MODE_ENV_VAR];
        process.env[READ_ONLY_MODE_ENV_VAR] = '1';

        const server = { addTool: jest.fn() };
        const client = {
            apiCall: jest.fn(),
        };

        try {
            registerTools(server as any, client as any);
            const customApiTool = getRegisteredToolByName(server, 'custom_api_call');
            const result = await customApiTool.execute({
                method: 'POST',
                endpoint: '/api/v1/orders',
                data: { orderNumber: 'NEW1' },
            });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain('blocked method: POST');
            expect(client.apiCall).not.toHaveBeenCalled();
        } finally {
            if (originalValue === undefined) {
                delete process.env[READ_ONLY_MODE_ENV_VAR];
            } else {
                process.env[READ_ONLY_MODE_ENV_VAR] = originalValue;
            }
        }
    });

    it('should allow non-mutating custom_api_call methods in read-only mode', async () => {
        const originalValue = process.env[READ_ONLY_MODE_ENV_VAR];
        process.env[READ_ONLY_MODE_ENV_VAR] = '1';

        const server = { addTool: jest.fn() };
        const client = {
            apiCall: jest.fn().mockResolvedValue({ Data: [] }),
        };

        try {
            registerTools(server as any, client as any);
            const customApiTool = getRegisteredToolByName(server, 'custom_api_call');
            const result = await customApiTool.execute({
                method: 'GET',
                endpoint: '/api/v1/orders',
                params: { take: 1 },
            });

            expect(result.isError).not.toBe(true);
            expect(client.apiCall).toHaveBeenCalledWith('GET', '/api/v1/orders', undefined, { take: 1 });
        } finally {
            if (originalValue === undefined) {
                delete process.env[READ_ONLY_MODE_ENV_VAR];
            } else {
                process.env[READ_ONLY_MODE_ENV_VAR] = originalValue;
            }
        }
    });

    it('should allow mutation tools when read-only mode is not enabled', async () => {
        const originalValue = process.env[READ_ONLY_MODE_ENV_VAR];
        delete process.env[READ_ONLY_MODE_ENV_VAR];

        const server = { addTool: jest.fn() };
        const client = {
            createOrder: jest.fn().mockResolvedValue({ orderNumber: 'NEW123' }),
        };

        try {
            registerTools(server as any, client as any);
            const createOrderTool = getRegisteredToolByName(server, 'create_order');
            const result = await createOrderTool.execute({ customerCode: 'ACME' });

            expect(result.isError).not.toBe(true);
            expect(client.createOrder).toHaveBeenCalledWith({ customerCode: 'ACME' });
        } finally {
            if (originalValue === undefined) {
                delete process.env[READ_ONLY_MODE_ENV_VAR];
            } else {
                process.env[READ_ONLY_MODE_ENV_VAR] = originalValue;
            }
        }
    });
});
