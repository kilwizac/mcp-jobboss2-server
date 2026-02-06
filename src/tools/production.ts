import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { JobBOSS2Client } from '../jobboss2-client.js';
import {
    GetEstimatesSchema,
    GetEstimateByPartNumberSchema,
    CreateEstimateSchema,
    UpdateEstimateSchema,
    GetRoutingByPartSchema,
    GetWorkCenterByCodeSchema,
    QueryOnlyToolInputSchema,
    GetEstimateMaterialBySubPartSchema,
    QueryParamsSchema,
} from '../schemas.js';

export const productionTools: Tool[] = [
    {
        name: 'get_estimates',
        description: 'Retrieve a list of estimates (part master records) from JobBOSS2. Supports filtering, sorting, pagination, and field selection.',
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
        name: 'get_estimate_by_part_number',
        description: 'Retrieve a specific estimate (part master record) by its part number.',
        inputSchema: {
            type: 'object',
            properties: {
                partNumber: { type: 'string', description: 'The part number to retrieve' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['partNumber'],
        },
    },
    {
        name: 'create_estimate',
        description: 'Create a new estimate (part master record) in JobBOSS2. This creates a new part number with pricing, costing, and bill of materials information.',
        inputSchema: {
            type: 'object',
            properties: {
                partNumber: { type: 'string', description: 'Part number (required)' },
                description: { type: 'string', description: 'Part description' },
                active: { type: 'boolean', description: 'Whether the part is active' },
                alternatePartNumber: { type: 'string', description: 'Alternate part number' },
                calculationMethod: { type: 'string', description: 'Calculation method' },
                customerCode: { type: 'string', description: 'Customer code' },
                GLCode: { type: 'string', description: 'GL account code' },
                leadTime: { type: 'number', description: 'Lead time in days' },
                productCode: { type: 'string', description: 'Product code' },
                purchaseFactor: { type: 'number', description: 'Purchase factor' },
                purchasingGLCode: { type: 'string', description: 'Purchasing GL code' },
                purchasingUnit: { type: 'string', description: 'Purchasing unit of measure' },
                pricingUnit: { type: 'string', description: 'Pricing unit of measure' },
                revision: { type: 'string', description: 'Revision' },
                partWeight: { type: 'number', description: 'Part weight' },
                useDefaultQuantities: { type: 'boolean', description: 'Use default quantity breaks from company settings' },
            },
            required: ['partNumber'],
            additionalProperties: true,
        },
    },
    {
        name: 'update_estimate',
        description: 'Update an existing estimate (part master record) in JobBOSS2.',
        inputSchema: {
            type: 'object',
            properties: {
                partNumber: { type: 'string', description: 'The part number to update' },
                description: { type: 'string', description: 'Part description' },
                revision: { type: 'string', description: 'Revision' },
                revisionDate: { type: 'string', description: 'Revision date (ISO format: yyyy-MM-dd)' },
            },
            required: ['partNumber'],
            additionalProperties: true,
        },
    },
    {
        name: 'get_routings',
        description: 'Retrieve routings (work center steps) independent of orders, filtered by part number, work center, etc.',
        inputSchema: QueryOnlyToolInputSchema,
    },
    {
        name: 'get_routing_by_part_number',
        description: 'Retrieve a specific routing tied to an estimate part number and step number.',
        inputSchema: {
            type: 'object',
            properties: {
                partNumber: { type: 'string', description: 'Estimate part number' },
                stepNumber: {
                    oneOf: [{ type: 'string' }, { type: 'number' }],
                    description: 'Routing step number',
                },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['partNumber', 'stepNumber'],
        },
    },
    {
        name: 'get_work_centers',
        description: 'Retrieve work center definitions including labor/burden rates and capacity factors.',
        inputSchema: QueryOnlyToolInputSchema,
    },
    {
        name: 'get_work_center_by_code',
        description: 'Retrieve a specific work center by its code.',
        inputSchema: {
            type: 'object',
            properties: {
                workCenter: { type: 'string', description: 'Work center code' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['workCenter'],
        },
    },
    {
        name: 'get_estimate_material_by_sub_part',
        description: 'Retrieve a specific material of an estimate by the parent part number and sub-part (material) number. Useful for checking bill of materials details.',
        inputSchema: {
            type: 'object',
            properties: {
                partNumber: { type: 'string', description: 'The parent estimate part number' },
                subPartNumber: { type: 'string', description: 'The sub-part (material) part number' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['partNumber', 'subPartNumber'],
        },
    },
];

export const productionHandlers: Record<string, (args: any, client: JobBOSS2Client) => Promise<any>> = {
    get_estimates: async (args, client) => {
        const params = GetEstimatesSchema.parse(args);
        return client.getEstimates(params);
    },
    get_estimate_by_part_number: async (args, client) => {
        const { partNumber, fields } = GetEstimateByPartNumberSchema.parse(args);
        return client.getEstimateByPartNumber(partNumber, { fields });
    },
    create_estimate: async (args, client) => {
        const estimateData = CreateEstimateSchema.parse(args);
        return client.createEstimate(estimateData);
    },
    update_estimate: async (args, client) => {
        const { partNumber, ...updateData } = UpdateEstimateSchema.parse(args);
        await client.updateEstimate(partNumber, updateData);
        return { success: true }; // updateEstimate returns void
    },
    get_routings: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getRoutings(params);
    },
    get_routing_by_part_number: async (args, client) => {
        const { partNumber, stepNumber, fields } = GetRoutingByPartSchema.parse(args);
        return client.getRoutingByPartNumber(partNumber, stepNumber, { fields });
    },
    get_work_centers: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getWorkCenters(params);
    },
    get_work_center_by_code: async (args, client) => {
        const { workCenter, fields } = GetWorkCenterByCodeSchema.parse(args);
        return client.getWorkCenterByCode(workCenter, { fields });
    },
    get_estimate_material_by_sub_part: async (args, client) => {
        const { partNumber, subPartNumber, fields } = GetEstimateMaterialBySubPartSchema.parse(args);
        return client.apiCall(
            'GET',
            `/api/v1/estimates/${encodeURIComponent(partNumber)}/materials/${encodeURIComponent(subPartNumber)}`,
            undefined,
            fields ? { fields } : undefined
        );
    },
};
