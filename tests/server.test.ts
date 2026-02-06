import { JobBOSS2Client } from '../src/jobboss2-client';
import { orderHandlers } from '../src/tools/orders';
import { customerHandlers } from '../src/tools/customers';
import { inventoryHandlers } from '../src/tools/inventory';

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
    getPurchaseOrderByNumber: jest.fn(),
    getPurchaseOrderLineItems: jest.fn(),
    getPurchaseOrderReleases: jest.fn(),
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
        it('create_order_from_quote should filter line items using specific numbers', async () => {
            const args = { quoteNumber: 'Q2', copyAllLineItems: false, lineItemNumbers: [1, 3] };
            const mockQuote = { customerCode: 'CUST2' };
            const allLineItems = [
                { itemNumber: 1, partNumber: 'P1', quantity1: 5, price1: 10 },
                { itemNumber: 2, partNumber: 'P2', quantity1: 3, price1: 20 },
                { itemNumber: 3, partNumber: 'P3', quantity1: 7, price1: 15 },
            ];
            (mockClient.getQuoteById as jest.Mock).mockResolvedValue(mockQuote);
            (mockClient.getQuoteLineItems as jest.Mock).mockResolvedValue(allLineItems);
            (mockClient.createOrder as jest.Mock).mockResolvedValue({ orderNumber: 'ORD3' });

            const result = await orderHandlers.create_order_from_quote(args, mockClient);

            expect(result.lineItemsCopied).toBe(2);
            const createCall = (mockClient.createOrder as jest.Mock).mock.calls[0][0];
            expect(createCall.orderLineItems).toHaveLength(2);
            expect(createCall.orderLineItems[0].partNumber).toBe('P1');
            expect(createCall.orderLineItems[1].partNumber).toBe('P3');
        });
    });

    describe('Inventory Handlers', () => {
        it('get_po_bundle should fetch PO header, line items and releases in parallel', async () => {
            const args = { poNumber: 'PO1' };
            const mockPO = { poNumber: 'PO1' };
            const mockLineItems = [{ partNumber: 'P1' }];
            const mockReleases = [{ releaseId: 1 }];
            (mockClient.getPurchaseOrderByNumber as jest.Mock).mockResolvedValue(mockPO);
            (mockClient.getPurchaseOrderLineItems as jest.Mock).mockResolvedValue(mockLineItems);
            (mockClient.getPurchaseOrderReleases as jest.Mock).mockResolvedValue(mockReleases);

            const result = await inventoryHandlers.get_po_bundle(args, mockClient);

            expect(mockClient.getPurchaseOrderByNumber).toHaveBeenCalledWith('PO1', undefined);
            expect(mockClient.getPurchaseOrderLineItems).toHaveBeenCalledWith({ purchaseOrderNumber: 'PO1' });
            expect(mockClient.getPurchaseOrderReleases).toHaveBeenCalledWith({ purchaseOrderNumber: 'PO1' });
            expect(result).toEqual({
                purchaseOrder: mockPO,
                lineItems: mockLineItems,
                releases: mockReleases,
            });
        });

        it('get_po_bundle should skip releases when includeReleases is false', async () => {
            const args = { poNumber: 'PO2', includeReleases: false };
            const mockPO = { poNumber: 'PO2' };
            const mockLineItems = [{ partNumber: 'P2' }];
            (mockClient.getPurchaseOrderByNumber as jest.Mock).mockResolvedValue(mockPO);
            (mockClient.getPurchaseOrderLineItems as jest.Mock).mockResolvedValue(mockLineItems);

            const result = await inventoryHandlers.get_po_bundle(args, mockClient);

            expect(mockClient.getPurchaseOrderByNumber).toHaveBeenCalledWith('PO2', undefined);
            expect(mockClient.getPurchaseOrderLineItems).toHaveBeenCalledWith({ purchaseOrderNumber: 'PO2' });
            expect(mockClient.getPurchaseOrderReleases).not.toHaveBeenCalled();
            expect(result).toEqual({
                purchaseOrder: mockPO,
                lineItems: mockLineItems,
                releases: undefined,
            });
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
