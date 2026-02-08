import { JobBOSS2Client } from '../src/jobboss2-client';
import { orderHandlers } from '../src/tools/orders';
import { customerHandlers } from '../src/tools/customers';
import { inventoryHandlers } from '../src/tools/inventory';
import { employeeHandlers } from '../src/tools/employees';
import { productionHandlers } from '../src/tools/production';
import { generalHandlers } from '../src/tools/general';

// Mock the client
const mockClient = {
    getOrders: jest.fn(),
    createOrder: jest.fn(),
    getOrderById: jest.fn(),
    getOrderLineItems: jest.fn(),
    getOrderRoutings: jest.fn(),
    getQuoteById: jest.fn(),
    getQuoteLineItems: jest.fn(),
    getQuoteLineItem: jest.fn(),
    apiCall: jest.fn(),
    getCustomers: jest.fn(),
    getJobMaterials: jest.fn(),
    getSalespersons: jest.fn(),
    getRoutings: jest.fn(),
    getDocumentControls: jest.fn(),
    getPurchaseOrderByNumber: jest.fn(),
    getPurchaseOrderLineItems: jest.fn(),
    getPurchaseOrderReleases: jest.fn(),
    updateEstimate: jest.fn(),
    updateAttendanceTicketDetail: jest.fn(),
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

        it('get_order_bundle should forward fields for header/line items/routings', async () => {
            const args = {
                orderNumber: 'ORD3',
                fields: 'orderNumber,status',
                lineItemFields: 'itemNumber,partNumber',
                routingFields: 'stepNumber,workCenter',
            };
            (mockClient.getOrderById as jest.Mock).mockResolvedValue({ orderNumber: 'ORD3' });
            (mockClient.getOrderLineItems as jest.Mock).mockResolvedValue([{ itemNumber: 1 }]);
            (mockClient.getOrderRoutings as jest.Mock).mockResolvedValue([{ stepNumber: 10 }]);

            await orderHandlers.get_order_bundle(args, mockClient);

            expect(mockClient.getOrderById).toHaveBeenCalledWith('ORD3', { fields: 'orderNumber,status' });
            expect(mockClient.getOrderLineItems).toHaveBeenCalledWith('ORD3', {
                fields: 'itemNumber,partNumber',
            });
            expect(mockClient.getOrderRoutings).toHaveBeenCalledWith({
                orderNumber: 'ORD3',
                fields: 'stepNumber,workCenter',
            });
        });

        it('get_order_releases should call shared releases endpoint', async () => {
            const args = { fields: 'orderNumber,itemNumber', take: 5 };
            const mockReleases = [{ orderNumber: 'ORD1', itemNumber: 1 }];
            (mockClient.apiCall as jest.Mock).mockResolvedValue(mockReleases);

            const result = await orderHandlers.get_order_releases(args, mockClient);

            expect(mockClient.apiCall).toHaveBeenCalledWith('GET', '/api/v1/releases', undefined, args);
            expect(result).toEqual(mockReleases);
        });

        it('create_order_release should encode path parameters and send payload', async () => {
            const args = {
                orderNumber: 'ORD/100 A',
                itemNumber: 2,
                dueDate: '2026-01-01',
                quantityOrdered: 5,
            };
            (mockClient.apiCall as jest.Mock).mockResolvedValue({ uniqueID: 10 });

            await orderHandlers.create_order_release(args, mockClient);

            expect(mockClient.apiCall).toHaveBeenCalledWith(
                'POST',
                '/api/v1/orders/ORD%2F100%20A/order-line-items/2/releases',
                { dueDate: '2026-01-01', quantityOrdered: 5 }
            );
        });

        it('get_order_release_by_id should encode keys and forward fields', async () => {
            const args = {
                orderNumber: 'ORD/100 A',
                itemNumber: '2/3',
                uniqueID: 'REL 7',
                fields: 'dueDate,quantityOrdered',
            };
            (mockClient.apiCall as jest.Mock).mockResolvedValue({ uniqueID: 'REL 7' });

            await orderHandlers.get_order_release_by_id(args, mockClient);

            expect(mockClient.apiCall).toHaveBeenCalledWith(
                'GET',
                '/api/v1/orders/ORD%2F100%20A/order-line-items/2%2F3/releases/REL%207',
                undefined,
                { fields: 'dueDate,quantityOrdered' }
            );
        });

        it('create_order_from_quote should fetch quote and all line items when copyAllLineItems is true', async () => {
            const args = { quoteNumber: 'Q1', customerCode: 'CUST1' };
            (mockClient.getQuoteById as jest.Mock).mockResolvedValue({ customerCode: 'CUST1' });
            (mockClient.getQuoteLineItems as jest.Mock).mockResolvedValue([]);
            (mockClient.createOrder as jest.Mock).mockResolvedValue({ orderNumber: 'ORD2' });

            const result = await orderHandlers.create_order_from_quote(args, mockClient);

            expect(mockClient.getQuoteById).toHaveBeenCalledWith('Q1');
            expect(mockClient.getQuoteLineItems).toHaveBeenCalledWith({ quoteNumber: 'Q1' });
            expect(mockClient.getQuoteLineItem).not.toHaveBeenCalled();
            expect(mockClient.createOrder).toHaveBeenCalledWith(expect.objectContaining({ customerCode: 'CUST1' }));
            expect(result).toEqual(
                expect.objectContaining({ success: true, order: { orderNumber: 'ORD2' }, lineItemsCopied: 0 })
            );
        });

        it('create_order_from_quote should require lineItemNumbers when copyAllLineItems is false', async () => {
            await expect(
                orderHandlers.create_order_from_quote(
                    {
                        quoteNumber: 'Q2',
                        copyAllLineItems: false,
                    },
                    mockClient
                )
            ).rejects.toThrow('lineItemNumbers is required when copyAllLineItems is false');
        });

        it('create_order_from_quote should fetch only requested line items when copyAllLineItems is false', async () => {
            const args = {
                quoteNumber: 'Q2',
                copyAllLineItems: false,
                lineItemNumbers: [1, 3, 3],
                orderNumber: 'ORD-OVERRIDE',
                overrides: { status: 'Open' },
            };
            const mockQuote = { customerCode: 'CUST2' };
            const quoteLineItem1 = {
                itemNumber: 1,
                partNumber: 'P1',
                description: 'Part 1',
                quantity1: 5,
                price1: 10,
                unit1: 'EA',
                revision: 'A',
            };
            const quoteLineItem3 = {
                itemNumber: 3,
                partNumber: 'P3',
                description: 'Part 3',
                quantity1: 7,
                price1: 15,
                unit1: 'EA',
                revision: 'B',
            };
            (mockClient.getQuoteById as jest.Mock).mockResolvedValue(mockQuote);
            (mockClient.getQuoteLineItem as jest.Mock)
                .mockResolvedValueOnce(quoteLineItem1)
                .mockResolvedValueOnce(quoteLineItem3);
            (mockClient.createOrder as jest.Mock).mockResolvedValue({ orderNumber: 'ORD3' });

            const result = await orderHandlers.create_order_from_quote(args, mockClient);

            expect(mockClient.getQuoteLineItems).not.toHaveBeenCalled();
            expect(mockClient.getQuoteLineItem).toHaveBeenCalledTimes(2);
            expect(mockClient.getQuoteLineItem).toHaveBeenNthCalledWith(1, 'Q2', 1);
            expect(mockClient.getQuoteLineItem).toHaveBeenNthCalledWith(2, 'Q2', 3);
            expect(result.lineItemsCopied).toBe(2);
            const createCall = (mockClient.createOrder as jest.Mock).mock.calls[0][0];
            expect(createCall.customerCode).toBe('CUST2');
            expect(createCall.orderNumber).toBe('ORD-OVERRIDE');
            expect(createCall.status).toBe('Open');
            expect(createCall.orderLineItems).toHaveLength(2);
            expect(createCall.orderLineItems[0].partNumber).toBe('P1');
            expect(createCall.orderLineItems[1].partNumber).toBe('P3');
            expect(createCall.orderLineItems[0]).toEqual(
                expect.objectContaining({
                    quantityOrdered: 5,
                    unitPrice: 10,
                    pricingUnit: 'EA',
                    revision: 'A',
                    quoteItemNumber: 1,
                    quoteNumber: 'Q2',
                })
            );
        });
    });

    describe('Inventory Handlers', () => {
        it('get_job_materials should parse query params before calling client', async () => {
            const args = { skip: 5, customFilter: 'x' };
            const mockResult = [{ uniqueID: '1' }];
            (mockClient.getJobMaterials as jest.Mock).mockResolvedValue(mockResult);

            const result = await inventoryHandlers.get_job_materials(args, mockClient);

            expect(mockClient.getJobMaterials).toHaveBeenCalledWith(args);
            expect(result).toEqual(mockResult);
        });

        it('get_job_materials should reject invalid query params', async () => {
            const args = { skip: 'bad-type' };

            await expect(inventoryHandlers.get_job_materials(args, mockClient)).rejects.toThrow();
            expect(mockClient.getJobMaterials).not.toHaveBeenCalled();
        });

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
            expect(mockClient.getPurchaseOrderReleases).toHaveBeenCalledWith({ PONumber: 'PO1' });
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

        it('get_po_bundle should forward fields for header and line items', async () => {
            const args = {
                poNumber: 'PO3',
                fields: 'poNumber,status',
                lineItemFields: 'partNumber,quantityOrdered',
            };
            (mockClient.getPurchaseOrderByNumber as jest.Mock).mockResolvedValue({ poNumber: 'PO3' });
            (mockClient.getPurchaseOrderLineItems as jest.Mock).mockResolvedValue([]);
            (mockClient.getPurchaseOrderReleases as jest.Mock).mockResolvedValue([]);

            await inventoryHandlers.get_po_bundle(args, mockClient);

            expect(mockClient.getPurchaseOrderByNumber).toHaveBeenCalledWith('PO3', {
                fields: 'poNumber,status',
            });
            expect(mockClient.getPurchaseOrderLineItems).toHaveBeenCalledWith({
                purchaseOrderNumber: 'PO3',
                fields: 'partNumber,quantityOrdered',
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

    describe('Employee Handlers', () => {
        it('get_salespersons should reject invalid query params', async () => {
            const args = { take: 'bad-type' };

            await expect(employeeHandlers.get_salespersons(args, mockClient)).rejects.toThrow();
            expect(mockClient.getSalespersons).not.toHaveBeenCalled();
        });

        it('update_attendance_ticket_detail should return success true', async () => {
            (mockClient.updateAttendanceTicketDetail as jest.Mock).mockResolvedValue(undefined);

            const result = await employeeHandlers.update_attendance_ticket_detail(
                { id: 42, comments: 'Updated' },
                mockClient
            );

            expect(mockClient.updateAttendanceTicketDetail).toHaveBeenCalledWith(42, { comments: 'Updated' });
            expect(result).toEqual({ success: true });
        });
    });

    describe('Production Handlers', () => {
        it('get_routings should reject invalid query params', async () => {
            const args = { skip: 'bad-type' };

            await expect(productionHandlers.get_routings(args, mockClient)).rejects.toThrow();
            expect(mockClient.getRoutings).not.toHaveBeenCalled();
        });

        it('update_estimate should return success true', async () => {
            (mockClient.updateEstimate as jest.Mock).mockResolvedValue(undefined);

            const result = await productionHandlers.update_estimate(
                { partNumber: 'PART-1', description: 'Updated' },
                mockClient
            );

            expect(mockClient.updateEstimate).toHaveBeenCalledWith('PART-1', { description: 'Updated' });
            expect(result).toEqual({ success: true });
        });
    });

    describe('General Handlers', () => {
        it('get_document_controls should reject invalid query params', async () => {
            const args = { take: 'bad-type' };

            await expect(generalHandlers.get_document_controls(args, mockClient)).rejects.toThrow();
            expect(mockClient.getDocumentControls).not.toHaveBeenCalled();
        });
    });
});
