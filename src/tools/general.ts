import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { JobBOSS2Client } from '../jobboss2-client.js';
import {
    CustomApiCallSchema,
    RunReportSchema,
    GetReportStatusSchema,
    QueryOnlyToolInputSchema,
    QueryParamsSchema,
} from '../schemas.js';

export const generalTools: Tool[] = [
    {
        name: 'custom_api_call',
        description: 'Make a custom API call to any JobBOSS2 API endpoint. Use this for endpoints not covered by other tools. Endpoint will automatically be prefixed with /api/v1/ if not present.',
        inputSchema: {
            type: 'object',
            properties: {
                method: {
                    type: 'string',
                    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                    description: 'HTTP method',
                },
                endpoint: { type: 'string', description: 'API endpoint path (e.g., orders/12345 or /api/v1/orders/12345)' },
                data: { description: 'Request body data (for POST/PUT/PATCH)' },
                params: { description: 'Query parameters (for filtering, sorting, pagination, field selection)' },
            },
            required: ['method', 'endpoint'],
        },
    },
    {
        name: 'run_report',
        description: 'Submit a JobBOSS2 report request. Pass the exact payload expected by /api/v1/reports (reportName, parameters, output format, etc.). Returns a requestId for polling.',
        inputSchema: {
            type: 'object',
            properties: {
                body: {
                    type: 'object',
                    description: 'JSON payload accepted by the reports endpoint (e.g., { reportName: "LateJobs", parameters: {...} })',
                    additionalProperties: true,
                },
            },
            required: ['body'],
        },
    },
    {
        name: 'get_report_status',
        description: 'Fetch the status/result of a previously submitted report using the requestId returned by run_report.',
        inputSchema: {
            type: 'object',
            properties: {
                requestId: { type: 'string', description: 'Report request ID' },
            },
            required: ['requestId'],
        },
    },
    {
        name: 'get_document_controls',
        description: 'Retrieve document control headers including approval state, revision history, release information, and repository data. Supports filters, field selection, and pagination.',
        inputSchema: QueryOnlyToolInputSchema,
    },
    {
        name: 'get_document_histories',
        description: 'Retrieve document history entries that show revision notes, users, and affected jobs/parts.',
        inputSchema: QueryOnlyToolInputSchema,
    },
    {
        name: 'get_document_reviews',
        description: 'Retrieve document review assignments, including vendor/employee reviewers, start/end dates, and completion status.',
        inputSchema: QueryOnlyToolInputSchema,
    },
];

export const generalHandlers: Record<string, (args: any, client: JobBOSS2Client) => Promise<any>> = {
    custom_api_call: async (args, client) => {
        const { method, endpoint, data, params } = CustomApiCallSchema.parse(args);
        return client.apiCall(method, endpoint, data, params);
    },
    run_report: async (args, client) => {
        const { body } = RunReportSchema.parse(args);
        return client.submitReportRequest(body);
    },
    get_report_status: async (args, client) => {
        const { requestId } = GetReportStatusSchema.parse(args);
        return client.getReportRequest(requestId);
    },
    get_document_controls: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getDocumentControls(params);
    },
    get_document_histories: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getDocumentHistories(params);
    },
    get_document_reviews: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getDocumentReviews(params);
    },
};
