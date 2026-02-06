import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { JobBOSS2Client } from '../jobboss2-client.js';
import {
    GetOrdersSchema,
    GetOrderByIdSchema,
    CreateOrderSchema,
    UpdateOrderSchema,
    GetOrderLineItemsSchema,
    GetOrderLineItemByIdSchema,
    CreateOrderLineItemSchema,
    UpdateOrderLineItemSchema,
    GetOrderRoutingsSchema,
    GetOrderRoutingByKeysSchema,
    CreateOrderRoutingSchema,
    UpdateOrderRoutingSchema,
    CreateOrderReleaseSchema,
    GetOrderReleaseByIdSchema,
    GetOrderReleasesSchema,
    GetOrderBundleSchema,
    CreateOrderFromQuoteSchema,
} from '../schemas.js';

export const orderTools: Tool[] = [
    {
        name: 'get_orders',
        description: 'Retrieve a list of orders from JobBOSS2. Supports filtering, sorting, pagination, and field selection. Example filters: customerCode=ACME, status[in]=Open|InProgress, orderTotal[gte]=1000',
        inputSchema: {
            type: 'object',
            properties: {
                fields: { type: 'string', description: 'Comma-separated list of fields (e.g., orderNumber,customerCode,orderTotal)' },
                sort: { type: 'string', description: 'Sort expression (e.g., -dateEntered for descending, +orderNumber for ascending)' },
                skip: { type: 'number', description: 'Skip N records (pagination)' },
                take: { type: 'number', description: 'Take N records (pagination, default 200)' },
            },
            additionalProperties: true,
        },
    },
    {
        name: 'get_order_by_id',
        description: 'Retrieve a specific order by its order number.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number to retrieve' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['orderNumber'],
        },
    },
    {
        name: 'create_order',
        description: 'Create a new order in JobBOSS2.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'Order number (optional if auto-numbering enabled)' },
                customerCode: { type: 'string', description: 'Customer code' },
                PONumber: { type: 'string', description: 'Purchase order number' },
                status: { type: 'string', description: 'Order status' },
                dueDate: { type: 'string', description: 'Due date (ISO format: yyyy-MM-dd)' },
            },
            required: ['customerCode'],
            additionalProperties: true,
        },
    },
    {
        name: 'update_order',
        description: 'Update an existing order in JobBOSS2.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number to update' },
                customerCode: { type: 'string', description: 'Customer code' },
                PONumber: { type: 'string', description: 'Purchase order number' },
                status: { type: 'string', description: 'Order status' },
                dueDate: { type: 'string', description: 'Due date (ISO format: yyyy-MM-dd)' },
            },
            required: ['orderNumber'],
            additionalProperties: true,
        },
    },
    {
        name: 'get_order_line_items',
        description: 'Retrieve line items for a specific order.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['orderNumber'],
        },
    },
    {
        name: 'get_order_line_item_by_id',
        description: 'Retrieve a specific order line item.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number' },
                itemNumber: { type: 'number', description: 'The line item number' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['orderNumber', 'itemNumber'],
        },
    },
    {
        name: 'create_order_line_item',
        description: 'Create a new line item for an order.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number' },
                partNumber: { type: 'string', description: 'Part number' },
                description: { type: 'string', description: 'Item description' },
                quantity: { type: 'number', description: 'Quantity' },
                price: { type: 'number', description: 'Price per unit' },
            },
            required: ['orderNumber'],
            additionalProperties: true,
        },
    },
    {
        name: 'update_order_line_item',
        description: 'Update an existing order line item.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number' },
                itemNumber: { type: 'number', description: 'The line item number' },
                partNumber: { type: 'string', description: 'Part number' },
                description: { type: 'string', description: 'Item description' },
                quantity: { type: 'number', description: 'Quantity' },
                price: { type: 'number', description: 'Price per unit' },
            },
            required: ['orderNumber', 'itemNumber'],
            additionalProperties: true,
        },
    },
    {
        name: 'get_order_routings',
        description: 'Retrieve a list of order routings from JobBOSS2 with optional filtering, sorting, and pagination.',
        inputSchema: {
            type: 'object',
            properties: {
                fields: { type: 'string', description: 'Comma-separated list of fields' },
                sort: { type: 'string', description: 'Sort expression' },
                skip: { type: 'number', description: 'Skip N records' },
                take: { type: 'number', description: 'Take N records' },
            },
            additionalProperties: true,
        },
    },
    {
        name: 'get_order_routing',
        description: 'Retrieve a specific order routing by order number, line item, and step.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number' },
                itemNumber: { type: 'number', description: 'The line item number' },
                stepNumber: { type: 'number', description: 'The routing step number' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['orderNumber', 'itemNumber', 'stepNumber'],
        },
    },
    {
        name: 'create_order_routing',
        description: 'Create a new routing for a specific order line item.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number' },
                itemNumber: { type: 'number', description: 'The line item number' },
                certificationRequired: { type: 'boolean', description: 'Whether the routing requires certification' },
                cyclePrice: { type: 'number', description: 'Cycle price' },
                cycleTime: { type: 'number', description: 'Cycle time' },
                cycleUnit: { type: 'string', description: 'Cycle time unit' },
                departmentNumber: { type: 'string', description: 'Department number' },
                description: { type: 'string', description: 'Routing description' },
                employeeCode: { type: 'string', description: 'Employee code' },
                estimatedEndDate: { type: 'string', description: 'Estimated end date (ISO format)' },
                estimatedQuantity: { type: 'number', description: 'Estimated quantity' },
                estimatedStartDate: { type: 'string', description: 'Estimated start date (ISO format)' },
                ignoreVendorMinimum: { type: 'boolean', description: 'Ignore vendor minimums' },
                operationCode: { type: 'string', description: 'Routing operation code' },
                overlapSteps: { type: 'boolean', description: 'Allow overlapping steps' },
                setupPrice: { type: 'number', description: 'Setup price' },
                setupTime: { type: 'number', description: 'Setup time' },
                shift2DefaultEmployeeCode: { type: 'string', description: 'Shift 2 default employee code' },
                shift3DefaultEmployeeCode: { type: 'string', description: 'Shift 3 default employee code' },
                stepNumber: { type: 'number', description: 'Routing step number' },
                timeUnit: { type: 'string', description: 'Time unit' },
                total: { type: 'number', description: 'Total cost' },
                vendorCode: { type: 'string', description: 'Vendor code' },
                workCenter: { type: 'string', description: 'Work center assigned' },
                workCenterOrVendor: { type: 'string', description: 'Work center or vendor identifier' },
            },
            required: ['orderNumber', 'itemNumber', 'workCenterOrVendor'],
            additionalProperties: true,
        },
    },
    {
        name: 'update_order_routing',
        description: 'Update an existing order routing.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number' },
                itemNumber: { type: 'number', description: 'The line item number' },
                stepNumber: { type: 'number', description: 'The routing step number' },
                operationCode: { type: 'string', description: 'Routing operation code' },
                employeeCode: { type: 'string', description: 'Employee code' },
                estimatedEndDate: { type: 'string', description: 'Estimated end date (ISO format)' },
                estimatedStartDate: { type: 'string', description: 'Estimated start date (ISO format)' },
                workCenter: { type: 'string', description: 'Work center assigned' },
            },
            required: ['orderNumber', 'itemNumber', 'stepNumber'],
            additionalProperties: true,
        },
    },
    {
        name: 'get_order_releases',
        description: 'Retrieve a list of order releases with optional filtering, sorting, and pagination.',
        inputSchema: {
            type: 'object',
            properties: {
                fields: { type: 'string', description: 'Comma-separated list of fields' },
                sort: { type: 'string', description: 'Sort expression' },
                skip: { type: 'number', description: 'Skip N records' },
                take: { type: 'number', description: 'Take N records' },
            },
            additionalProperties: true,
        },
    },
    {
        name: 'create_order_release',
        description: 'Create a release for a specific order line item. Releases define delivery schedules with due dates and quantities.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'Order number' },
                itemNumber: { oneOf: [{ type: 'string' }, { type: 'number' }], description: 'Order line item number' },
                dueDate: { type: 'string', description: 'Release due date (ISO format: yyyy-MM-dd)' },
                jobNumber: { type: 'string', description: 'Job number for the release' },
                priority: { type: 'number', description: 'Release priority' },
                quantityOrdered: { type: 'number', description: 'Quantity ordered for this release' },
                quantityShipped: { type: 'number', description: 'Quantity already shipped' },
                shipCode: { type: 'string', description: 'Ship code' },
                status: { type: 'string', description: 'Release status' },
            },
            required: ['orderNumber', 'itemNumber'],
            additionalProperties: true,
        },
    },
    {
        name: 'get_order_release_by_id',
        description: 'Retrieve a specific release for an order line item by unique ID.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'Order number' },
                itemNumber: { oneOf: [{ type: 'string' }, { type: 'number' }], description: 'Order line item number' },
                uniqueID: { oneOf: [{ type: 'string' }, { type: 'number' }], description: 'Release unique ID' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['orderNumber', 'itemNumber', 'uniqueID'],
        },
    },
    {
        name: 'get_order_bundle',
        description: 'Retrieve an order with its line items and optionally routings in a single call. Returns a complete bundle for the order.',
        inputSchema: {
            type: 'object',
            properties: {
                orderNumber: { type: 'string', description: 'The order number to retrieve' },
                fields: { type: 'string', description: 'Fields for the order header' },
                lineItemFields: { type: 'string', description: 'Fields for line items' },
                routingFields: { type: 'string', description: 'Fields for routings' },
                includeRoutings: { type: 'boolean', description: 'Include routings for each line item (default true)' },
            },
            required: ['orderNumber'],
        },
    },
    {
        name: 'create_order_from_quote',
        description: 'Create a new order from an existing quote, copying customer info and line items. Streamlines quote-to-order conversion.',
        inputSchema: {
            type: 'object',
            properties: {
                quoteNumber: { type: 'string', description: 'Source quote number' },
                customerCode: { type: 'string', description: 'Customer code (defaults to quote customer)' },
                orderNumber: { type: 'string', description: 'Order number (optional if auto-numbering enabled)' },
                copyAllLineItems: { type: 'boolean', description: 'Copy all line items from quote (default true)' },
                lineItemNumbers: { type: 'array', items: { type: 'number' }, description: 'Specific line item numbers to copy (if not copying all)' },
                overrides: { type: 'object', description: 'Field overrides for the new order' },
            },
            required: ['quoteNumber'],
        },
    },
];

export const orderHandlers: Record<string, (args: any, client: JobBOSS2Client) => Promise<any>> = {
    get_orders: async (args, client) => {
        const params = GetOrdersSchema.parse(args);
        return client.getOrders(params);
    },
    get_order_by_id: async (args, client) => {
        const { orderNumber, fields } = GetOrderByIdSchema.parse(args);
        return client.getOrderById(orderNumber, { fields });
    },
    create_order: async (args, client) => {
        const orderData = CreateOrderSchema.parse(args);
        return client.createOrder(orderData);
    },
    update_order: async (args, client) => {
        const { orderNumber, ...updateData } = UpdateOrderSchema.parse(args);
        return client.updateOrder(orderNumber, updateData);
    },
    get_order_line_items: async (args, client) => {
        const { orderNumber, fields } = GetOrderLineItemsSchema.parse(args);
        return client.getOrderLineItems(orderNumber, { fields });
    },
    get_order_line_item_by_id: async (args, client) => {
        const { orderNumber, itemNumber, fields } = GetOrderLineItemByIdSchema.parse(args);
        return client.getOrderLineItemById(orderNumber, itemNumber, { fields });
    },
    create_order_line_item: async (args, client) => {
        const { orderNumber, ...itemData } = CreateOrderLineItemSchema.parse(args);
        return client.createOrderLineItem(orderNumber, itemData);
    },
    update_order_line_item: async (args, client) => {
        const { orderNumber, itemNumber, ...updateData } = UpdateOrderLineItemSchema.parse(args);
        return client.updateOrderLineItem(orderNumber, itemNumber, updateData);
    },
    get_order_routings: async (args, client) => {
        const params = GetOrderRoutingsSchema.parse(args);
        return client.getOrderRoutings(params);
    },
    get_order_routing: async (args, client) => {
        const { orderNumber, itemNumber, stepNumber, fields } = GetOrderRoutingByKeysSchema.parse(args);
        return client.getOrderRouting(orderNumber, itemNumber, stepNumber, { fields });
    },
    create_order_routing: async (args, client) => {
        const { orderNumber, itemNumber, ...routingData } = CreateOrderRoutingSchema.parse(args);
        return client.createOrderRouting(orderNumber, itemNumber, routingData);
    },
    update_order_routing: async (args, client) => {
        const { orderNumber, itemNumber, stepNumber, ...updateData } = UpdateOrderRoutingSchema.parse(args);
        return client.updateOrderRouting(orderNumber, itemNumber, stepNumber, updateData);
    },
    get_order_releases: async (args, client) => {
        const params = GetOrderReleasesSchema.parse(args);
        return client.apiCall('GET', '/api/v1/releases', undefined, params);
    },
    create_order_release: async (args, client) => {
        const { orderNumber, itemNumber, ...payload } = CreateOrderReleaseSchema.parse(args);
        return client.apiCall(
            'POST',
            `/api/v1/orders/${encodeURIComponent(orderNumber)}/order-line-items/${encodeURIComponent(itemNumber)}/releases`,
            payload
        );
    },
    get_order_release_by_id: async (args, client) => {
        const { orderNumber, itemNumber, uniqueID, fields } = GetOrderReleaseByIdSchema.parse(args);
        return client.apiCall(
            'GET',
            `/api/v1/orders/${encodeURIComponent(orderNumber)}/order-line-items/${encodeURIComponent(itemNumber)}/releases/${encodeURIComponent(uniqueID)}`,
            undefined,
            fields ? { fields } : undefined
        );
    },
    get_order_bundle: async (args, client) => {
        const { orderNumber, fields, lineItemFields, routingFields, includeRoutings = true } = GetOrderBundleSchema.parse(args);
        
        const [order, lineItems] = await Promise.all([
            client.getOrderById(orderNumber, fields ? { fields } : undefined),
            client.getOrderLineItems(orderNumber, lineItemFields ? { fields: lineItemFields } : undefined),
        ]);

        let routings: any[] | undefined;
        if (includeRoutings && Array.isArray(lineItems)) {
            const routingParams: any = { orderNumber };
            if (routingFields) routingParams.fields = routingFields;
            routings = await client.getOrderRoutings(routingParams);
        }
        
        return {
            order,
            lineItems,
            routings: includeRoutings && Array.isArray(lineItems) ? routings : undefined,
        };
    },
    create_order_from_quote: async (args, client) => {
        const { quoteNumber, customerCode, orderNumber, copyAllLineItems = true, lineItemNumbers, overrides = {} } = CreateOrderFromQuoteSchema.parse(args);
        
        const [quote, allQuoteLineItems] = await Promise.all([
            client.getQuoteById(quoteNumber),
            client.getQuoteLineItems({ quoteNumber }),
        ]);
        
        // Filter line items if specific ones requested
        let lineItemsToCopy = allQuoteLineItems;
        if (!copyAllLineItems && lineItemNumbers && lineItemNumbers.length > 0) {
            const lineItemSet = new Set(lineItemNumbers);
            lineItemsToCopy = allQuoteLineItems.filter((item: any) => 
                lineItemSet.has(item.itemNumber)
            );
        }
        
        // Build order payload
        const orderPayload: any = {
            customerCode: customerCode || quote.customerCode,
            quoteNumber: quoteNumber,
            ...overrides,
        };
        if (orderNumber) {
            orderPayload.orderNumber = orderNumber;
        }
        
        // Map quote line items to order line items
        // QuoteLineItem uses price breaks (price1-8, quantity1-8, unit1-8) - use first break as default
        if (Array.isArray(lineItemsToCopy) && lineItemsToCopy.length > 0) {
            orderPayload.orderLineItems = lineItemsToCopy.map((qli: any) => ({
                partNumber: qli.partNumber,
                partDescription: qli.description,
                quantityOrdered: qli.quantity1,
                unitPrice: qli.price1,
                quoteNumber: quoteNumber,
                quoteItemNumber: qli.itemNumber,
                pricingUnit: qli.unit1,
                revision: qli.revision,
            }));
        }
        
        // Create the order
        const newOrder = await client.createOrder(orderPayload);
        
        return {
            success: true,
            order: newOrder,
            lineItemsCopied: lineItemsToCopy?.length || 0,
            sourceQuote: quoteNumber,
        };
    },
};
