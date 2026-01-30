import { JobBOSS2Client } from '../src/jobboss2-client';
import { orderHandlers } from '../src/tools/orders';
import { customerHandlers } from '../src/tools/customers';

// Mock the client
const mockClient = {
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    getOrderById: jest.fn(),
    getOrderLineItems: jest.fn(),
    getOrderRoutings: jest.fn(),
    getQuoteById: jest.fn(),
    getQuoteLineItems: jest.fn(),
    getCustomers: jest.fn(),
} as unknown as JobBOSS2Client;

describe('Server Handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Order Handlers', () => {
        it('get_orders should call client.getOrders', async () => {
            const args = { customerCode: 'ACME', take: 10 };
            const mockResult = [{ orderNumber: '123' }];
            (mockClient.getOrders as jest.Mock).mockResolvedValue(mockResult);

            const result = await orderHandlers.get_orders(args, mockClient);

            expect(mockClient.getOrders).toHaveBeenCalledWith(args);
            expect(result).toEqual(mockResult);
        });

        it('create_order should call client.createOrder', async () => {
            const args = { customerCode: 'ACME', orderNumber: 'NEW123' };
            const mockResult = { orderNumber: 'NEW123', customerCode: 'ACME' };
            (mockClient.createOrder as jest.Mock).mockResolvedValue(mockResult);

            const result = await orderHandlers.create_order(args, mockClient);

            expect(mockClient.createOrder).toHaveBeenCalledWith(args);
            expect(result).toEqual(mockResult);
        });

        it('get_order_bundle should request order and line items', async () => {
            const args = { orderNumber: 'ORD1', includeRoutings: false };
            const mockOrder = { orderNumber: 'ORD1' };
            const mockLineItems = [{ itemNumber: 1 }];
            (mockClient.getOrderById as jest.Mock).mockResolvedValue(mockOrder);
            (mockClient.getOrderLineItems as jest.Mock).mockResolvedValue(mockLineItems);

            const result = await orderHandlers.get_order_bundle(args, mockClient);

            expect(mockClient.getOrderById).toHaveBeenCalledWith('ORD1', undefined);
            expect(mockClient.getOrderLineItems).toHaveBeenCalledWith('ORD1', undefined);
            expect(mockClient.getOrderRoutings).not.toHaveBeenCalled();
            expect(result).toEqual({ order: mockOrder, lineItems: mockLineItems, routings: undefined });
        });

        it('get_order_bundle should fetch routings by default', async () => {
            const args = { orderNumber: 'ORD2' };
            const mockOrder = { orderNumber: 'ORD2' };
            const mockLineItems = [{ itemNumber: 1 }];
            const mockRoutings = [{ stepNumber: 10 }];
            (mockClient.getOrderById as jest.Mock).mockResolvedValue(mockOrder);
            (mockClient.getOrderLineItems as jest.Mock).mockResolvedValue(mockLineItems);
            (mockClient.getOrderRoutings as jest.Mock).mockResolvedValue(mockRoutings);

            const result = await orderHandlers.get_order_bundle(args, mockClient);

            expect(mockClient.getOrderById).toHaveBeenCalledWith('ORD2', undefined);
            expect(mockClient.getOrderLineItems).toHaveBeenCalledWith('ORD2', undefined);
            expect(mockClient.getOrderRoutings).toHaveBeenCalledWith({ orderNumber: 'ORD2' });
            expect(result).toEqual({ order: mockOrder, lineItems: mockLineItems, routings: mockRoutings });
        });

        it('create_order_from_quote should fetch quote and line items', async () => {
            const args = { quoteNumber: 'Q1', customerCode: 'CUST1' };
            (mockClient.getQuoteById as jest.Mock).mockResolvedValue({ customerCode: 'CUST1' });
            (mockClient.getQuoteLineItems as jest.Mock).mockResolvedValue([]);
            (mockClient.createOrder as jest.Mock).mockResolvedValue({ orderNumber: 'ORD2' });

            const result = await orderHandlers.create_order_from_quote(args, mockClient);

            expect(mockClient.getQuoteById).toHaveBeenCalledWith('Q1');
            expect(mockClient.getQuoteLineItems).toHaveBeenCalledWith({ quoteNumber: 'Q1' });
            expect(mockClient.createOrder).toHaveBeenCalledWith(expect.objectContaining({ customerCode: 'CUST1' }));
            expect(result).toEqual(
                expect.objectContaining({ success: true, order: { orderNumber: 'ORD2' }, lineItemsCopied: 0 })
            );
        });
    });

    describe('Customer Handlers', () => {
        it('get_customers should call client.getCustomers', async () => {
            const args = { sort: '+customerName' };
            const mockResult = [{ customerCode: 'ACME' }];
            (mockClient.getCustomers as jest.Mock).mockResolvedValue(mockResult);

            const result = await customerHandlers.get_customers(args, mockClient);

            expect(mockClient.getCustomers).toHaveBeenCalledWith(args);
            expect(result).toEqual(mockResult);
        });
    });
});
