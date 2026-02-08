import { JobBOSS2Client } from '../jobboss2-client.js';
import { ToolDefinition } from './tool-definition.js';
import {
    GetMaterialsSchema,
    GetMaterialByPartNumberSchema,
    GetBinLocationsSchema,
    GetJobMaterialByIdSchema,
    GetJobRequirementByIdSchema,
    GetProductCodeSchema,
    GetPurchaseOrderLineItemSchema,
    GetPurchaseOrderByNumberSchema,
    GetVendorByCodeSchema,
    QueryParamsSchema,
    GetPOBundleSchema,
} from '../schemas.js';

export const inventoryTools: ToolDefinition[] = [
    {
        name: 'get_materials',
        description: 'Retrieve a list of materials from JobBOSS2. Supports filtering, sorting, pagination, and field selection.',
    },
    {
        name: 'get_material_by_part_number',
        description: 'Retrieve a specific material by its part number.',
    },
    {
        name: 'get_bin_locations',
        description: 'Retrieve a list of bin locations from JobBOSS2. Supports filtering, sorting, and pagination.',
    },
    {
        name: 'get_job_materials',
        description: 'Retrieve job material postings (issues/receipts) with bin locations, costs, and related job/order information.',
    },
    {
        name: 'get_job_material_by_id',
        description: 'Retrieve a specific job material record by its unique ID.',
    },
    {
        name: 'get_job_requirements',
        description: 'Retrieve job requirement/purchase suggestions including vendor codes, lead times, and required quantities.',
    },
    {
        name: 'get_job_requirement_by_id',
        description: 'Retrieve a specific job requirement by unique ID.',
    },
    {
        name: 'get_packing_list_line_items',
        description: 'Retrieve packing list line items showing what was shipped, quantities, and job references.',
    },
    {
        name: 'get_packing_lists',
        description: 'Retrieve packing list headers including ship-to, freight, and container information.',
    },
    {
        name: 'get_product_codes',
        description: 'Retrieve product codes with related GL accounts and cash discount settings.',
    },
    {
        name: 'get_product_code',
        description: 'Retrieve a specific product code by its identifier.',
    },
    {
        name: 'get_purchase_order_line_items',
        description: 'Retrieve purchase order line items with quantities, costs, and routing information. Supports filtering (e.g., purchaseOrderNumber=1001).',
    },
    {
        name: 'get_purchase_order_line_item',
        description: 'Retrieve a specific purchase order line item by PO number, part number, and line item number.',
    },
    {
        name: 'get_purchase_order_releases',
        description: 'Retrieve purchase order release schedules showing quantities and due dates.',
    },
    {
        name: 'get_purchase_orders',
        description: 'Retrieve purchase order headers including vendor, ship-to, and totals.',
    },
    {
        name: 'get_purchase_order_by_number',
        description: 'Retrieve a specific purchase order by PO number.',
    },
    {
        name: 'get_vendors',
        description: 'Retrieve vendor master records including payment terms and lead times.',
    },
    {
        name: 'get_vendor_by_code',
        description: 'Retrieve a specific vendor by vendor code.',
    },
    {
        name: 'get_po_bundle',
        description: 'Retrieve a purchase order with its line items and optionally releases in a single call. Returns a complete bundle for the PO.',
    },
];

export const inventoryHandlers: Record<string, (args: any, client: JobBOSS2Client) => Promise<any>> = {
    get_materials: async (args, client) => {
        const params = GetMaterialsSchema.parse(args);
        return client.getMaterials(params);
    },
    get_material_by_part_number: async (args, client) => {
        const { partNumber, fields } = GetMaterialByPartNumberSchema.parse(args);
        return client.getMaterialByPartNumber(partNumber, { fields });
    },
    get_bin_locations: async (args, client) => {
        const params = GetBinLocationsSchema.parse(args);
        return client.getBinLocations(params);
    },
    get_job_materials: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getJobMaterials(params);
    },
    get_job_material_by_id: async (args, client) => {
        const { uniqueID, fields } = GetJobMaterialByIdSchema.parse(args);
        return client.getJobMaterialById(uniqueID, { fields });
    },
    get_job_requirements: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getJobRequirements(params);
    },
    get_job_requirement_by_id: async (args, client) => {
        const { uniqueID, fields } = GetJobRequirementByIdSchema.parse(args);
        return client.getJobRequirementById(uniqueID, { fields });
    },
    get_packing_list_line_items: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getPackingListLineItems(params);
    },
    get_packing_lists: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getPackingLists(params);
    },
    get_product_codes: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getProductCodes(params);
    },
    get_product_code: async (args, client) => {
        const { productCode, fields } = GetProductCodeSchema.parse(args);
        return client.getProductCode(productCode, { fields });
    },
    get_purchase_order_line_items: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getPurchaseOrderLineItems(params);
    },
    get_purchase_order_line_item: async (args, client) => {
        const { purchaseOrderNumber, partNumber, itemNumber, fields } = GetPurchaseOrderLineItemSchema.parse(args);
        return client.getPurchaseOrderLineItem(purchaseOrderNumber, partNumber, itemNumber, { fields });
    },
    get_purchase_order_releases: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getPurchaseOrderReleases(params);
    },
    get_purchase_orders: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getPurchaseOrders(params);
    },
    get_purchase_order_by_number: async (args, client) => {
        const { poNumber, fields } = GetPurchaseOrderByNumberSchema.parse(args);
        return client.getPurchaseOrderByNumber(poNumber, { fields });
    },
    get_vendors: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getVendors(params);
    },
    get_vendor_by_code: async (args, client) => {
        const { vendorCode, fields } = GetVendorByCodeSchema.parse(args);
        return client.getVendorByCode(vendorCode, { fields });
    },
    get_po_bundle: async (args, client) => {
        const { poNumber, fields, lineItemFields, includeReleases = true } = GetPOBundleSchema.parse(args);
        
        // Fetch PO header, line items, and optionally releases in parallel
        const lineItemParams: any = { purchaseOrderNumber: poNumber };
        if (lineItemFields) lineItemParams.fields = lineItemFields;

        const [purchaseOrder, lineItems, releases] = await Promise.all([
            client.getPurchaseOrderByNumber(poNumber, fields ? { fields } : undefined),
            client.getPurchaseOrderLineItems(lineItemParams),
            includeReleases ? client.getPurchaseOrderReleases({ PONumber: poNumber }) : undefined,
        ]);
        
        return {
            purchaseOrder,
            lineItems,
            releases: includeReleases ? releases : undefined,
        };
    },
};
