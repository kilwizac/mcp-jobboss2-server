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

    it('should reject invalid custom API methods', async () => {
        await expect(client.apiCall('TRACE', '/api/v1/orders')).rejects.toThrow(
            'Invalid HTTP method: TRACE'
        );
    });

    it('should reject unsafe custom API endpoints', async () => {
        await expect(client.apiCall('GET', '../orders')).rejects.toThrow('Invalid endpoint path');
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
});
