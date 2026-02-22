import { registerTools, toolSchemaMap, MAX_RESPONSE_CHARS } from '../src/mcp/registerTools';
import { orderHandlers } from '../src/tools/orders';

function getRegisteredToolByName(server: { registerTool: jest.Mock }, toolName: string): any {
    const registrations = server.registerTool.mock.calls.map(([name, config, cb]: [string, any, any]) => ({
        name,
        ...config,
        execute: cb,
    }));
    const found = registrations.find((reg: any) => reg.name === toolName);
    if (!found) {
        throw new Error(`Tool not found in registration mock: ${toolName}`);
    }
    return found;
}

describe('Response truncation', () => {
    it('should return small responses unchanged', async () => {
        const server = { registerTool: jest.fn() };
        const client = {
            getOrders: jest.fn().mockResolvedValue([{ orderNumber: '1001' }]),
        };

        registerTools(server as any, client as any);
        const tool = getRegisteredToolByName(server, 'get_orders');
        const result = await tool.execute({});

        expect(result.isError).not.toBe(true);
        const text = result.content[0].text;
        expect(text).toBe(JSON.stringify([{ orderNumber: '1001' }]));
        expect(text).not.toContain('truncated');
    });

    it('should truncate large array responses and include record counts', async () => {
        const largeArray = Array.from({ length: 50000 }, (_, i) => ({
            orderNumber: `ORD-${String(i).padStart(6, '0')}`,
            customerCode: 'CUSTOMER_' + 'X'.repeat(50),
            status: 'Open',
        }));

        const server = { registerTool: jest.fn() };
        const client = {
            getOrders: jest.fn().mockResolvedValue(largeArray),
        };

        registerTools(server as any, client as any);
        const tool = getRegisteredToolByName(server, 'get_orders');
        const result = await tool.execute({});

        expect(result.isError).not.toBe(true);
        const text = result.content[0].text;
        expect(text).toContain('of 50000 records shown');
        expect(text).toContain('take');
    });

    it('should truncate large string responses', async () => {
        const hugeString = 'A'.repeat(MAX_RESPONSE_CHARS + 1000);

        const server = { registerTool: jest.fn() };
        const client = {
            getOrders: jest.fn().mockResolvedValue(hugeString),
        };

        registerTools(server as any, client as any);
        const tool = getRegisteredToolByName(server, 'get_orders');
        const result = await tool.execute({});

        expect(result.isError).not.toBe(true);
        const text = result.content[0].text;
        expect(text.length).toBeLessThan(hugeString.length);
        expect(text).toContain('truncated');
    });

    it('should truncate large object responses', async () => {
        const largeObj: Record<string, string> = {};
        for (let i = 0; i < 50000; i++) {
            largeObj[`field_${i}`] = 'value_' + 'X'.repeat(50);
        }

        const server = { registerTool: jest.fn() };
        const client = {
            getOrders: jest.fn().mockResolvedValue(largeObj),
        };

        registerTools(server as any, client as any);
        const tool = getRegisteredToolByName(server, 'get_orders');
        const result = await tool.execute({});

        expect(result.isError).not.toBe(true);
        const text = result.content[0].text;
        expect(text).toContain('truncated');
    });
});

describe('Order bundle parallel fetch', () => {
    it('should fetch order, line items, and routings in a single Promise.all', async () => {
        const client = {
            getOrderById: jest.fn().mockResolvedValue({ orderNumber: '1001' }),
            getOrderLineItems: jest.fn().mockResolvedValue([{ itemNumber: 1 }]),
            getOrderRoutings: jest.fn().mockResolvedValue([{ stepNumber: 10 }]),
        };

        const result = await orderHandlers.get_order_bundle(
            { orderNumber: '1001' },
            client as any
        );

        expect(client.getOrderById).toHaveBeenCalledTimes(1);
        expect(client.getOrderLineItems).toHaveBeenCalledTimes(1);
        expect(client.getOrderRoutings).toHaveBeenCalledTimes(1);
        expect(result.order).toEqual({ orderNumber: '1001' });
        expect(result.lineItems).toEqual([{ itemNumber: 1 }]);
        expect(result.routings).toEqual([{ stepNumber: 10 }]);
    });

    it('should skip routings when includeRoutings is false', async () => {
        const client = {
            getOrderById: jest.fn().mockResolvedValue({ orderNumber: '1001' }),
            getOrderLineItems: jest.fn().mockResolvedValue([{ itemNumber: 1 }]),
            getOrderRoutings: jest.fn(),
        };

        const result = await orderHandlers.get_order_bundle(
            { orderNumber: '1001', includeRoutings: false },
            client as any
        );

        expect(client.getOrderRoutings).not.toHaveBeenCalled();
        expect(result.routings).toBeUndefined();
    });

    it('should pass routingFields to getOrderRoutings', async () => {
        const client = {
            getOrderById: jest.fn().mockResolvedValue({ orderNumber: '1001' }),
            getOrderLineItems: jest.fn().mockResolvedValue([]),
            getOrderRoutings: jest.fn().mockResolvedValue([]),
        };

        await orderHandlers.get_order_bundle(
            { orderNumber: '1001', routingFields: 'stepNumber,workCenter' },
            client as any
        );

        expect(client.getOrderRoutings).toHaveBeenCalledWith({
            orderNumber: '1001',
            fields: 'stepNumber,workCenter',
        });
    });
});
