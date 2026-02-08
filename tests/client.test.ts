import { JobBOSS2Client } from '../src/jobboss2-client';
import type { JobBOSS2Config } from '../src/types';
import nock from 'nock';

describe('JobBOSS2Client', () => {
    const config: JobBOSS2Config = {
        apiUrl: 'https://api.jobboss2.com',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        tokenUrl: 'https://api.jobboss2.com/oauth/token',
    };

    let client: JobBOSS2Client;

    beforeEach(() => {
        client = new JobBOSS2Client(config);
        nock.cleanAll();
    });

    afterEach(() => {
        client.destroy();
    });

    it('should fetch an access token', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
                token_type: 'Bearer',
            });

        // We can't easily test private methods, but making a call should trigger token fetch
        nock('https://api.jobboss2.com')
            .get('/api/v1/orders')
            .reply(200, { Data: [] });

        await client.getOrders({});
        // If no error, token fetch worked
    });

    it('should get orders', async () => {
        // Mock token call
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        const mockOrders = [{ orderNumber: '123' }, { orderNumber: '456' }];

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders')
            .query(true) // Match any query params
            .reply(200, { Data: mockOrders });

        const orders = await client.getOrders({});
        expect(orders).toEqual(mockOrders);
    });

    it('should create an order', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        const newOrder = { customerCode: 'ACME' };
        const createdOrder = { orderNumber: '789', ...newOrder };

        nock('https://api.jobboss2.com')
            .post('/api/v1/orders', newOrder)
            .reply(200, { Data: createdOrder });

        const result = await client.createOrder(newOrder);
        expect(result).toEqual(createdOrder);
    });

    it('should handle API errors', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders')
            .reply(500, { Message: 'Internal Server Error' });

        await expect(client.getOrders({})).rejects.toThrow(/JobBOSS2 API Error: 500/);
    });

    it('should include API error response details when available', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders')
            .reply(400, { message: 'Invalid filter', code: 'BAD_FILTER' });

        await expect(client.getOrders({})).rejects.toThrow(
            /JobBOSS2 API Error: 400.*Invalid filter/
        );
    });

    it('should include OAuth token error response details when available', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(401, { error: 'invalid_client' });

        await expect(client.getOrders({})).rejects.toThrow(
            /OAuth2 Token Error: 401.*invalid_client/
        );
    });

    it('should reject invalid custom API methods', async () => {
        await expect(client.apiCall('TRACE', '/api/v1/orders')).rejects.toThrow(
            'Invalid HTTP method: TRACE'
        );
    });

    it('should reject unsafe custom API endpoints', async () => {
        await expect(client.apiCall('GET', '../orders')).rejects.toThrow('Invalid endpoint path');
    });

    it('should encode path parameters to prevent path traversal', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        // The encoded path should be /api/v1/orders/..%2F..%2Fcustomers%2FACME
        // NOT /api/v1/orders/../../customers/ACME (which would resolve to /api/v1/customers/ACME)
        nock('https://api.jobboss2.com')
            .get('/api/v1/orders/..%2F..%2Fcustomers%2FACME')
            .reply(200, { Data: { orderNumber: 'safe' } });

        const result = await client.getOrderById('../../customers/ACME');
        expect(result).toEqual({ orderNumber: 'safe' });
    });

    it('should encode special characters in path parameters', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/customers/ACME%20INC')
            .reply(200, { Data: { customerCode: 'ACME INC' } });

        const result = await client.getCustomerById('ACME INC');
        expect(result).toEqual({ customerCode: 'ACME INC' });
    });

    it('should fall back to list query when nested order line items endpoint is not allowed', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders/ORD1/order-line-items')
            .query(true)
            .reply(405, { title: 'Method Not Allowed' });

        const fallbackLineItems = [{ orderNumber: 'ORD1', itemNumber: 2 }];
        nock('https://api.jobboss2.com')
            .get('/api/v1/order-line-items')
            .query((query) => query.orderNumber === 'ORD1' && String(query.take) === '1')
            .reply(200, { Data: fallbackLineItems });

        const result = await client.getOrderLineItems('ORD1', { take: 1 });
        expect(result).toEqual(fallbackLineItems);
    });

    it('should fall back to list query when nested order line item endpoint is not allowed', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders/ORD1/order-line-items/2')
            .query(true)
            .reply(405, { title: 'Method Not Allowed' });

        const fallbackLineItem = { orderNumber: 'ORD1', itemNumber: 2 };
        nock('https://api.jobboss2.com')
            .get('/api/v1/order-line-items')
            .query(
                (query) =>
                    query.orderNumber === 'ORD1' &&
                    String(query.itemNumber) === '2' &&
                    String(query.take) === '1'
            )
            .reply(200, { Data: [fallbackLineItem] });

        const result = await client.getOrderLineItemById('ORD1', 2);
        expect(result).toEqual(fallbackLineItem);
    });

    it('should fall back to employee list query when employee detail endpoint is not allowed', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/employees/1')
            .query(true)
            .reply(405, { title: 'Method Not Allowed' });

        const fallbackEmployee = { employeeCode: 1, employeeName: 'Dummy' };
        nock('https://api.jobboss2.com')
            .get('/api/v1/employees')
            .query((query) => String(query.employeeCode) === '1' && String(query.take) === '1')
            .reply(200, { Data: [fallbackEmployee] });

        const result = await client.getEmployeeById('1');
        expect(result).toEqual(fallbackEmployee);
    });

    it('should fall back to materials list query when material detail endpoint is unavailable', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/materials/ALPA%2010042')
            .query(true)
            .reply(404, { title: 'Not Found' });

        const fallbackMaterial = { partNumber: 'ALPA 10042', subPartNumber: 'ALPA 10042 MATERIAL' };
        nock('https://api.jobboss2.com')
            .get('/api/v1/materials')
            .query((query) => query.partNumber === 'ALPA 10042' && String(query.take) === '1')
            .reply(200, { Data: [fallbackMaterial] });

        const result = await client.getMaterialByPartNumber('ALPA 10042');
        expect(result).toEqual(fallbackMaterial);
    });

    it('should fall back to PO line item list query when keyed detail endpoint is not allowed', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/purchase-order-line-items/PO1/PART1/1')
            .query(true)
            .reply(405, { title: 'Method Not Allowed' });

        const fallbackLineItem = {
            purchaseOrderNumber: 'PO1',
            partNumber: 'PART1',
            itemNumber: 1,
        };
        nock('https://api.jobboss2.com')
            .get('/api/v1/purchase-order-line-items')
            .query(
                (query) =>
                    query.purchaseOrderNumber === 'PO1' &&
                    query.partNumber === 'PART1' &&
                    String(query.itemNumber) === '1' &&
                    String(query.take) === '1'
            )
            .reply(200, { Data: [fallbackLineItem] });

        const result = await client.getPurchaseOrderLineItem('PO1', 'PART1', 1);
        expect(result).toEqual(fallbackLineItem);
    });

    it('should schedule token refresh after fetching token', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 3600,
                token_type: 'Bearer',
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders')
            .reply(200, { Data: [] });

        const beforeCall = Date.now();
        await client.getOrders({});
        const afterCall = Date.now();

        const refreshTimer = (client as unknown as { tokenRefreshTimer?: NodeJS.Timeout }).tokenRefreshTimer;
        expect(refreshTimer).toBeDefined();
        const delayMs = (refreshTimer as unknown as { _idleTimeout?: number })._idleTimeout as number;
        const expectedDelay = 3300_000;
        expect(delayMs).toBeGreaterThanOrEqual(expectedDelay - (afterCall - beforeCall));
        expect(delayMs).toBeLessThanOrEqual(expectedDelay + (afterCall - beforeCall));
    });

    it('should keep a usable refresh window for short-lived tokens', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 30,
                token_type: 'Bearer',
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders')
            .reply(200, { Data: [] });

        const beforeCall = Date.now();
        await client.getOrders({});
        const afterCall = Date.now();

        const refreshTimer = (client as unknown as { tokenRefreshTimer?: NodeJS.Timeout }).tokenRefreshTimer;
        expect(refreshTimer).toBeDefined();
        const delayMs = (refreshTimer as unknown as { _idleTimeout?: number })._idleTimeout as number;
        const expectedDelay = 25_000;
        expect(delayMs).toBeGreaterThanOrEqual(expectedDelay - (afterCall - beforeCall));
        expect(delayMs).toBeLessThanOrEqual(expectedDelay + (afterCall - beforeCall));
    });

    it('should clamp very short token lifetimes to a minimum one-second window', async () => {
        nock('https://api.jobboss2.com')
            .post('/oauth/token')
            .reply(200, {
                access_token: 'mock-access-token',
                expires_in: 5,
                token_type: 'Bearer',
            });

        nock('https://api.jobboss2.com')
            .get('/api/v1/orders')
            .reply(200, { Data: [] });

        const beforeCall = Date.now();
        await client.getOrders({});
        const afterCall = Date.now();

        const refreshTimer = (client as unknown as { tokenRefreshTimer?: NodeJS.Timeout }).tokenRefreshTimer;
        expect(refreshTimer).toBeDefined();
        const delayMs = (refreshTimer as unknown as { _idleTimeout?: number })._idleTimeout as number;
        const minDelay = 1_000;
        expect(delayMs).toBeGreaterThanOrEqual(minDelay);
        expect(delayMs).toBeLessThanOrEqual(2_000);
    });

    it('should log a warning when background token refresh fails', async () => {
        jest.useFakeTimers();
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        const anyClient = client as any;
        anyClient.tokenExpiry = Date.now() + 1_000;
        const refreshSpy = jest
            .spyOn(anyClient, 'fetchAccessToken')
            .mockRejectedValue(new Error('OAuth2 Token Error: 500 Internal Server Error - {"message":"refresh failed"}'));
        anyClient.scheduleTokenRefresh();
        await jest.advanceTimersByTimeAsync(1_100);

        expect(warnSpy).toHaveBeenCalledWith(
            '[jobboss2-client] background token refresh failed; retrying on next request',
            expect.objectContaining({
                message: expect.stringContaining('OAuth2 Token Error: 500'),
            })
        );

        refreshSpy.mockRestore();
        warnSpy.mockRestore();
        jest.useRealTimers();
    });
});
