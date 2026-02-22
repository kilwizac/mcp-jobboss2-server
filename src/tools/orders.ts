import { JobBOSS2Client } from '../jobboss2-client.js';
import { ToolDefinition } from './tool-definition.js';
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

export const orderTools: ToolDefinition[] = [
    {
        name: 'get_orders',
        description: 'Retrieve a list of orders from JobBOSS2. Supports filtering, sorting, pagination, and field selection. Example filters: customerCode=ACME, status[in]=Open|InProgress, orderTotal[gte]=1000',
    },
    {
        name: 'get_order_by_id',
        description: 'Retrieve a specific order by its order number.',
    },
    {
        name: 'create_order',
        description: 'Create a new order in JobBOSS2.',
    },
    {
        name: 'update_order',
        description: 'Update an existing order in JobBOSS2.',
    },
    {
        name: 'get_order_line_items',
        description: 'Retrieve line items for a specific order.',
    },
    {
        name: 'get_order_line_item_by_id',
        description: 'Retrieve a specific order line item.',
    },
    {
        name: 'create_order_line_item',
        description: 'Create a new line item for an order.',
    },
    {
        name: 'update_order_line_item',
        description: 'Update an existing order line item.',
    },
    {
        name: 'get_order_routings',
        description: 'Retrieve a list of order routings from JobBOSS2 with optional filtering, sorting, and pagination.',
    },
    {
        name: 'get_order_routing',
        description: 'Retrieve a specific order routing by order number, line item, and step.',
    },
    {
        name: 'create_order_routing',
        description: 'Create a new routing for a specific order line item.',
    },
    {
        name: 'update_order_routing',
        description: 'Update an existing order routing.',
    },
    {
        name: 'get_order_releases',
        description: 'Retrieve a list of order releases with optional filtering, sorting, and pagination.',
    },
    {
        name: 'create_order_release',
        description: 'Create a release for a specific order line item. Releases define delivery schedules with due dates and quantities.',
    },
    {
        name: 'get_order_release_by_id',
        description: 'Retrieve a specific release for an order line item by unique ID.',
    },
    {
        name: 'get_order_bundle',
        description: 'Retrieve an order with its line items and optionally routings in a single call. Returns a complete bundle for the order.',
    },
    {
        name: 'create_order_from_quote',
        description: 'Create a new order from an existing quote, copying customer info and line items. Streamlines quote-to-order conversion.',
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
        
        const routingParams: any = includeRoutings ? { orderNumber } : undefined;
        if (routingParams && routingFields) routingParams.fields = routingFields;

        const [order, lineItems, routings] = await Promise.all([
            client.getOrderById(orderNumber, fields ? { fields } : undefined),
            client.getOrderLineItems(orderNumber, lineItemFields ? { fields: lineItemFields } : undefined),
            includeRoutings ? client.getOrderRoutings(routingParams) : undefined,
        ]);
        
        return {
            order,
            lineItems,
            routings: includeRoutings ? routings : undefined,
        };
    },
    create_order_from_quote: async (args, client) => {
        const { quoteNumber, customerCode, orderNumber, copyAllLineItems = true, lineItemNumbers, overrides = {} } = CreateOrderFromQuoteSchema.parse(args);

        const mapQuoteLineItem = (qli: any) => ({
            partNumber: qli.partNumber,
            partDescription: qli.description,
            quantityOrdered: qli.quantity1,
            unitPrice: qli.price1,
            quoteNumber,
            quoteItemNumber: qli.itemNumber,
            pricingUnit: qli.unit1,
            revision: qli.revision,
        });

        const quotePromise = client.getQuoteById(quoteNumber);
        const quoteLineItemsPromise = copyAllLineItems
            ? client.getQuoteLineItems({ quoteNumber })
            : Promise.all(
                Array.from(new Set(lineItemNumbers ?? [])).map((itemNumber) =>
                    client.getQuoteLineItem(quoteNumber, itemNumber)
                )
            );

        const [quote, quoteLineItemsResult] = await Promise.all([quotePromise, quoteLineItemsPromise]);
        const lineItemsToCopy = (Array.isArray(quoteLineItemsResult) ? quoteLineItemsResult : []).filter(Boolean);

        const orderPayload: any = {
            customerCode: customerCode || quote.customerCode,
            quoteNumber,
            ...overrides,
        };

        if (orderNumber) {
            orderPayload.orderNumber = orderNumber;
        }

        // Quote line items expose price breaks (price1-8, quantity1-8, unit1-8); use break #1 as the default.
        if (lineItemsToCopy.length > 0) {
            orderPayload.orderLineItems = lineItemsToCopy.map(mapQuoteLineItem);
        }

        const newOrder = await client.createOrder(orderPayload);

        return {
            success: true,
            order: newOrder,
            lineItemsCopied: lineItemsToCopy.length,
            sourceQuote: quoteNumber,
        };
    },
};
