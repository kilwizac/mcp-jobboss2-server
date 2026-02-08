import { orderHandlers } from '../src/tools/orders';
import { customerHandlers } from '../src/tools/customers';
import { quoteHandlers } from '../src/tools/quotes';
import { employeeHandlers } from '../src/tools/employees';
import { productionHandlers } from '../src/tools/production';
import { generalHandlers } from '../src/tools/general';

type MutationHandlerCase = {
    name: string;
    handler: (args: any, client: any) => Promise<any>;
    args: Record<string, unknown>;
    clientMethod: string;
    expectedCallArgs: unknown[];
    mockResult: unknown;
    expectedResult?: unknown;
};

const mutationHandlerCases: MutationHandlerCase[] = [
    {
        name: 'create_order',
        handler: orderHandlers.create_order,
        args: { customerCode: 'ACME', orderNumber: 'NEW1' },
        clientMethod: 'createOrder',
        expectedCallArgs: [{ customerCode: 'ACME', orderNumber: 'NEW1' }],
        mockResult: { orderNumber: 'NEW1' },
    },
    {
        name: 'update_order',
        handler: orderHandlers.update_order,
        args: { orderNumber: 'ORD1', status: 'Open' },
        clientMethod: 'updateOrder',
        expectedCallArgs: ['ORD1', { status: 'Open' }],
        mockResult: { orderNumber: 'ORD1', status: 'Open' },
    },
    {
        name: 'create_order_line_item',
        handler: orderHandlers.create_order_line_item,
        args: { orderNumber: 'ORD1', partNumber: 'PART1' },
        clientMethod: 'createOrderLineItem',
        expectedCallArgs: ['ORD1', { partNumber: 'PART1' }],
        mockResult: { itemNumber: 1 },
    },
    {
        name: 'update_order_line_item',
        handler: orderHandlers.update_order_line_item,
        args: { orderNumber: 'ORD1', itemNumber: 1, user_Text1: 'Updated' },
        clientMethod: 'updateOrderLineItem',
        expectedCallArgs: ['ORD1', 1, { user_Text1: 'Updated' }],
        mockResult: { itemNumber: 1, user_Text1: 'Updated' },
    },
    {
        name: 'create_order_routing',
        handler: orderHandlers.create_order_routing,
        args: { orderNumber: 'ORD1', itemNumber: 1, workCenterOrVendor: 'WORK' },
        clientMethod: 'createOrderRouting',
        expectedCallArgs: ['ORD1', 1, { workCenterOrVendor: 'WORK' }],
        mockResult: { stepNumber: 10 },
    },
    {
        name: 'update_order_routing',
        handler: orderHandlers.update_order_routing,
        args: { orderNumber: 'ORD1', itemNumber: 1, stepNumber: 10, workCenter: 'WC1' },
        clientMethod: 'updateOrderRouting',
        expectedCallArgs: ['ORD1', 1, 10, { workCenter: 'WC1' }],
        mockResult: { stepNumber: 10, workCenter: 'WC1' },
    },
    {
        name: 'create_order_release',
        handler: orderHandlers.create_order_release,
        args: { orderNumber: 'ORD/100 A', itemNumber: 2, dueDate: '2026-01-01' },
        clientMethod: 'apiCall',
        expectedCallArgs: [
            'POST',
            '/api/v1/orders/ORD%2F100%20A/order-line-items/2/releases',
            { dueDate: '2026-01-01' },
        ],
        mockResult: { uniqueID: 10 },
    },
    {
        name: 'create_customer',
        handler: customerHandlers.create_customer,
        args: { customerCode: 'CUST1', customerName: 'Customer One' },
        clientMethod: 'createCustomer',
        expectedCallArgs: [{ customerCode: 'CUST1', customerName: 'Customer One' }],
        mockResult: { customerCode: 'CUST1' },
    },
    {
        name: 'update_customer',
        handler: customerHandlers.update_customer,
        args: { customerCode: 'CUST1', phone: '555-0100' },
        clientMethod: 'updateCustomer',
        expectedCallArgs: ['CUST1', { phone: '555-0100' }],
        mockResult: { customerCode: 'CUST1', phone: '555-0100' },
    },
    {
        name: 'create_quote',
        handler: quoteHandlers.create_quote,
        args: { customerCode: 'CUST1' },
        clientMethod: 'createQuote',
        expectedCallArgs: [{ customerCode: 'CUST1' }],
        mockResult: { quoteNumber: 'Q1' },
    },
    {
        name: 'update_quote',
        handler: quoteHandlers.update_quote,
        args: { quoteNumber: 'Q1', status: 'Open' },
        clientMethod: 'updateQuote',
        expectedCallArgs: ['Q1', { status: 'Open' }],
        mockResult: { quoteNumber: 'Q1', status: 'Open' },
    },
    {
        name: 'create_quote_line_item',
        handler: quoteHandlers.create_quote_line_item,
        args: { quoteNumber: 'Q1', partNumber: 'PART1' },
        clientMethod: 'createQuoteLineItem',
        expectedCallArgs: ['Q1', { partNumber: 'PART1' }],
        mockResult: { quoteNumber: 'Q1', itemNumber: 1 },
    },
    {
        name: 'update_quote_line_item',
        handler: quoteHandlers.update_quote_line_item,
        args: { quoteNumber: 'Q1', itemNumber: 2, description: 'Updated item' },
        clientMethod: 'updateQuoteLineItem',
        expectedCallArgs: ['Q1', '2', { description: 'Updated item' }],
        mockResult: { quoteNumber: 'Q1', itemNumber: 2 },
    },
    {
        name: 'create_attendance_ticket',
        handler: employeeHandlers.create_attendance_ticket,
        args: { employeeCode: 101, ticketDate: '2026-01-31' },
        clientMethod: 'createAttendanceTicket',
        expectedCallArgs: [{ employeeCode: 101, ticketDate: '2026-01-31' }],
        mockResult: { employeeCode: 101, ticketDate: '2026-01-31' },
    },
    {
        name: 'create_attendance_ticket_detail',
        handler: employeeHandlers.create_attendance_ticket_detail,
        args: { ticketDate: '2026-01-31', employeeCode: 101, comments: 'Clocked in' },
        clientMethod: 'createAttendanceTicketDetail',
        expectedCallArgs: ['2026-01-31', 101, { comments: 'Clocked in' }],
        mockResult: { id: 1 },
    },
    {
        name: 'update_attendance_ticket_detail',
        handler: employeeHandlers.update_attendance_ticket_detail,
        args: { id: 42, comments: 'Updated note' },
        clientMethod: 'updateAttendanceTicketDetail',
        expectedCallArgs: [42, { comments: 'Updated note' }],
        mockResult: undefined,
        expectedResult: { success: true },
    },
    {
        name: 'create_estimate',
        handler: productionHandlers.create_estimate,
        args: { partNumber: 'PART-001' },
        clientMethod: 'createEstimate',
        expectedCallArgs: [{ partNumber: 'PART-001' }],
        mockResult: { partNumber: 'PART-001' },
    },
    {
        name: 'update_estimate',
        handler: productionHandlers.update_estimate,
        args: { partNumber: 'PART-001', description: 'Updated description' },
        clientMethod: 'updateEstimate',
        expectedCallArgs: ['PART-001', { description: 'Updated description' }],
        mockResult: undefined,
        expectedResult: { success: true },
    },
    {
        name: 'run_report',
        handler: generalHandlers.run_report,
        args: { body: { reportName: 'OpenOrders' } },
        clientMethod: 'submitReportRequest',
        expectedCallArgs: [{ reportName: 'OpenOrders' }],
        mockResult: { requestId: 'REQ-1' },
    },
    {
        name: 'custom_api_call',
        handler: generalHandlers.custom_api_call,
        args: {
            method: 'POST',
            endpoint: '/api/v1/orders',
            data: { customerCode: 'CUST1' },
            params: { take: 1 },
        },
        clientMethod: 'apiCall',
        expectedCallArgs: ['POST', '/api/v1/orders', { customerCode: 'CUST1' }, { take: 1 }],
        mockResult: { ok: true },
    },
];

describe('Manual mutation handlers', () => {
    it.each(mutationHandlerCases)('$name forwards payload to client adapter', async (testCase) => {
        const clientMock = {
            [testCase.clientMethod]: jest.fn().mockResolvedValue(testCase.mockResult),
        };

        const result = await testCase.handler(testCase.args, clientMock as any);

        expect(clientMock[testCase.clientMethod]).toHaveBeenCalledWith(...testCase.expectedCallArgs);
        if (testCase.expectedResult !== undefined) {
            expect(result).toEqual(testCase.expectedResult);
        } else {
            expect(result).toEqual(testCase.mockResult);
        }
    });

    it('create_order_from_quote should execute quote-to-order workflow', async () => {
        const clientMock = {
            getQuoteById: jest.fn().mockResolvedValue({ customerCode: 'CUST1' }),
            getQuoteLineItems: jest.fn(),
            getQuoteLineItem: jest.fn().mockResolvedValue({
                itemNumber: 1,
                partNumber: 'PART1',
                description: 'Widget',
                quantity1: 2,
                price1: 25,
                unit1: 'EA',
                revision: 'A',
            }),
            createOrder: jest.fn().mockResolvedValue({ orderNumber: 'NEW1' }),
        };

        const result = await orderHandlers.create_order_from_quote(
            {
                quoteNumber: 'Q1',
                copyAllLineItems: false,
                lineItemNumbers: [1],
            },
            clientMock as any
        );

        expect(clientMock.getQuoteById).toHaveBeenCalledWith('Q1');
        expect(clientMock.getQuoteLineItem).toHaveBeenCalledWith('Q1', 1);
        expect(clientMock.createOrder).toHaveBeenCalledWith(
            expect.objectContaining({
                customerCode: 'CUST1',
                quoteNumber: 'Q1',
            })
        );
        expect(result).toEqual(
            expect.objectContaining({
                success: true,
                lineItemsCopied: 1,
            })
        );
    });
});
