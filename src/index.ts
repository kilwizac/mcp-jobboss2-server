#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { JobBOSS2Client } from './jobboss2-client.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const API_URL = process.env.JOBBOSS2_API_URL;
const API_KEY = process.env.JOBBOSS2_API_KEY;
const API_SECRET = process.env.JOBBOSS2_API_SECRET;
const OAUTH_TOKEN_URL = process.env.JOBBOSS2_OAUTH_TOKEN_URL;

if (!API_URL || !API_KEY || !API_SECRET || !OAUTH_TOKEN_URL) {
  console.error('Error: Missing required environment variables');
  console.error('Please ensure JOBBOSS2_API_URL, JOBBOSS2_API_KEY, JOBBOSS2_API_SECRET, and JOBBOSS2_OAUTH_TOKEN_URL are set');
  process.exit(1);
}

// Initialize JobBOSS2 client
const jobboss2Client = new JobBOSS2Client({
  apiUrl: API_URL,
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  tokenUrl: OAUTH_TOKEN_URL,
  timeout: parseInt(process.env.API_TIMEOUT || '30000'),
});

// Define tool schemas with query parameter support
const QueryParamsSchema = z.object({
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
  sort: z.string().optional().describe('Sort expression (e.g., -dateEntered,+customerCode)'),
  skip: z.number().optional().describe('Number of records to skip (pagination)'),
  take: z.number().optional().describe('Number of records to take (pagination)'),
}).catchall(z.any()); // Allow dynamic filter parameters

// Order schemas
const GetOrdersSchema = QueryParamsSchema.describe('Query parameters for getting orders');

const GetOrderByIdSchema = z.object({
  orderNumber: z.string().describe('The order number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateOrderSchema = z.object({
  orderNumber: z.string().optional().describe('Order number (optional if auto-numbering enabled)'),
  customerCode: z.string().describe('Customer code'),
  PONumber: z.string().optional().describe('Purchase order number'),
  status: z.string().optional().describe('Order status'),
  dueDate: z.string().optional().describe('Due date (ISO format)'),
}).catchall(z.any());

const UpdateOrderSchema = z.object({
  orderNumber: z.string().describe('The order number to update'),
  customerCode: z.string().optional().describe('Customer code'),
  PONumber: z.string().optional().describe('Purchase order number'),
  status: z.string().optional().describe('Order status'),
  dueDate: z.string().optional().describe('Due date (ISO format)'),
}).catchall(z.any());

// Order Line Item schemas
const GetOrderLineItemsSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetOrderLineItemByIdSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  itemNumber: z.number().describe('The line item number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateOrderLineItemSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  partNumber: z.string().optional().describe('Part number'),
  description: z.string().optional().describe('Item description'),
  quantity: z.number().optional().describe('Quantity'),
  price: z.number().optional().describe('Price per unit'),
}).catchall(z.any());

const UpdateOrderLineItemSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  itemNumber: z.number().describe('The line item number'),
  partNumber: z.string().optional().describe('Part number'),
  description: z.string().optional().describe('Item description'),
  quantity: z.number().optional().describe('Quantity'),
  price: z.number().optional().describe('Price per unit'),
}).catchall(z.any());

// Customer schemas
const GetCustomersSchema = QueryParamsSchema.describe('Query parameters for getting customers');

const GetCustomerByIdSchema = z.object({
  customerCode: z.string().describe('The customer code to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateCustomerSchema = z.object({
  customerCode: z.string().describe('Customer code'),
  customerName: z.string().describe('Customer name'),
  phone: z.string().optional().describe('Phone number'),
  billingAddress1: z.string().optional().describe('Billing address'),
}).catchall(z.any());

const UpdateCustomerSchema = z.object({
  customerCode: z.string().describe('The customer code to update'),
  customerName: z.string().optional().describe('Customer name'),
  phone: z.string().optional().describe('Phone number'),
  billingAddress1: z.string().optional().describe('Billing address'),
}).catchall(z.any());

// Quote schemas
const GetQuotesSchema = QueryParamsSchema.describe('Query parameters for getting quotes');

const GetQuoteByIdSchema = z.object({
  quoteNumber: z.string().describe('The quote number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateQuoteSchema = z.object({
  quoteNumber: z.string().optional().describe('Quote number (optional if auto-numbering enabled)'),
  customerCode: z.string().describe('Customer code'),
  expirationDate: z.string().optional().describe('Expiration date (ISO format)'),
}).catchall(z.any());

const UpdateQuoteSchema = z.object({
  quoteNumber: z.string().describe('The quote number to update'),
  customerCode: z.string().optional().describe('Customer code'),
  status: z.string().optional().describe('Quote status'),
  expirationDate: z.string().optional().describe('Expiration date (ISO format)'),
}).catchall(z.any());

// Material schemas
const GetMaterialsSchema = QueryParamsSchema.describe('Query parameters for getting materials');

const GetMaterialByPartNumberSchema = z.object({
  partNumber: z.string().describe('The part number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

// Employee schemas
const GetEmployeesSchema = QueryParamsSchema.describe('Query parameters for getting employees');

const GetEmployeeByIdSchema = z.object({
  employeeID: z.string().describe('The employee ID to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

// Estimate schemas (Part Master)
const GetEstimatesSchema = QueryParamsSchema.describe('Query parameters for getting estimates');

const GetEstimateByPartNumberSchema = z.object({
  partNumber: z.string().describe('The part number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateEstimateSchema = z.object({
  partNumber: z.string().describe('Part number (required)'),
  description: z.string().optional().describe('Part description'),
  active: z.boolean().optional().describe('Whether the part is active'),
  alternatePartNumber: z.string().optional().describe('Alternate part number'),
  calculationMethod: z.string().optional().describe('Calculation method'),
  customerCode: z.string().optional().describe('Customer code'),
  GLCode: z.string().optional().describe('GL account code'),
  leadTime: z.number().optional().describe('Lead time in days'),
  productCode: z.string().optional().describe('Product code'),
  purchaseFactor: z.number().optional().describe('Purchase factor'),
  purchasingGLCode: z.string().optional().describe('Purchasing GL code'),
  purchasingUnit: z.string().optional().describe('Purchasing unit of measure'),
  pricingUnit: z.string().optional().describe('Pricing unit of measure'),
  revision: z.string().optional().describe('Revision'),
  partWeight: z.number().optional().describe('Part weight'),
  useDefaultQuantities: z.boolean().optional().describe('Use default quantity breaks from company settings'),
}).catchall(z.any());

const UpdateEstimateSchema = z.object({
  partNumber: z.string().describe('The part number to update'),
  description: z.string().optional().describe('Part description'),
  revision: z.string().optional().describe('Revision'),
  revisionDate: z.string().optional().describe('Revision date (ISO format)'),
}).catchall(z.any());

// Attendance Ticket schemas
const GetAttendanceTicketsSchema = QueryParamsSchema.describe('Query parameters for getting attendance tickets');

const GetAttendanceTicketByIdSchema = z.object({
  ticketDate: z.string().describe('The ticket date (ISO format: yyyy-MM-dd)'),
  employeeCode: z.number().describe('The employee code'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateAttendanceTicketSchema = z.object({
  employeeCode: z.number().describe('Employee code'),
  ticketDate: z.string().describe('Ticket date (ISO format: yyyy-MM-dd)'),
}).catchall(z.any());

// Attendance Ticket Detail schemas
const GetAttendanceTicketDetailsSchema = QueryParamsSchema.describe('Query parameters for getting attendance ticket details');

const CreateAttendanceTicketDetailSchema = z.object({
  ticketDate: z.string().describe('The ticket date (ISO format: yyyy-MM-dd)'),
  employeeCode: z.number().describe('The employee code'),
  actualClockInDate: z.string().optional().describe('Actual clock in date'),
  actualClockInTime: z.string().optional().describe('Actual clock in time'),
  actualClockOutDate: z.string().optional().describe('Actual clock out date'),
  actualClockOutTime: z.string().optional().describe('Actual clock out time'),
  adjustedClockInDate: z.string().optional().describe('Adjusted clock in date'),
  adjustedClockInTime: z.string().optional().describe('Adjusted clock in time'),
  adjustedClockOutDate: z.string().optional().describe('Adjusted clock out date'),
  adjustedClockOutTime: z.string().optional().describe('Adjusted clock out time'),
  attendanceCode: z.number().optional().describe('Attendance code'),
  comments: z.string().optional().describe('Comments'),
  shift: z.number().optional().describe('Shift number'),
}).catchall(z.any());

const UpdateAttendanceTicketDetailSchema = z.object({
  id: z.number().describe('The attendance ticket detail ID'),
  actualClockInDate: z.string().optional().describe('Actual clock in date'),
  actualClockInTime: z.string().optional().describe('Actual clock in time'),
  actualClockOutDate: z.string().optional().describe('Actual clock out date'),
  actualClockOutTime: z.string().optional().describe('Actual clock out time'),
  adjustedClockInDate: z.string().optional().describe('Adjusted clock in date'),
  adjustedClockInTime: z.string().optional().describe('Adjusted clock in time'),
  adjustedClockOutDate: z.string().optional().describe('Adjusted clock out date'),
  adjustedClockOutTime: z.string().optional().describe('Adjusted clock out time'),
  attendanceCode: z.number().optional().describe('Attendance code'),
  comments: z.string().optional().describe('Comments'),
}).catchall(z.any());

// Attendance Report schema
const GetAttendanceReportSchema = z.object({
  startDate: z.string().describe('Start date for the report (ISO format: yyyy-MM-dd)'),
  endDate: z.string().describe('End date for the report (ISO format: yyyy-MM-dd)'),
  employeeCodes: z.array(z.number()).optional().describe('Optional array of employee codes to filter by'),
});

const CustomApiCallSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe('HTTP method'),
  endpoint: z.string().describe('API endpoint path (e.g., orders/12345 or /api/v1/orders/12345)'),
  data: z.any().optional().describe('Request body data (for POST/PUT/PATCH)'),
  params: z.any().optional().describe('Query parameters'),
});

// Initialize MCP server
const server = new Server(
  {
    name: 'jobboss2-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  // Order tools
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
  // Order Line Item tools
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
  // Customer tools
  {
    name: 'get_customers',
    description: 'Retrieve a list of customers from JobBOSS2. Supports filtering, sorting, pagination, and field selection.',
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
    name: 'get_customer_by_code',
    description: 'Retrieve a specific customer by their customer code.',
    inputSchema: {
      type: 'object',
      properties: {
        customerCode: { type: 'string', description: 'The customer code to retrieve' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['customerCode'],
    },
  },
  {
    name: 'create_customer',
    description: 'Create a new customer in JobBOSS2.',
    inputSchema: {
      type: 'object',
      properties: {
        customerCode: { type: 'string', description: 'Customer code' },
        customerName: { type: 'string', description: 'Customer name' },
        phone: { type: 'string', description: 'Phone number' },
        billingAddress1: { type: 'string', description: 'Billing address' },
      },
      required: ['customerCode', 'customerName'],
      additionalProperties: true,
    },
  },
  {
    name: 'update_customer',
    description: 'Update an existing customer in JobBOSS2.',
    inputSchema: {
      type: 'object',
      properties: {
        customerCode: { type: 'string', description: 'The customer code to update' },
        customerName: { type: 'string', description: 'Customer name' },
        phone: { type: 'string', description: 'Phone number' },
        billingAddress1: { type: 'string', description: 'Billing address' },
      },
      required: ['customerCode'],
      additionalProperties: true,
    },
  },
  // Quote tools
  {
    name: 'get_quotes',
    description: 'Retrieve a list of quotes from JobBOSS2. Supports filtering, sorting, pagination, and field selection.',
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
    name: 'get_quote_by_id',
    description: 'Retrieve a specific quote by its quote number.',
    inputSchema: {
      type: 'object',
      properties: {
        quoteNumber: { type: 'string', description: 'The quote number to retrieve' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['quoteNumber'],
    },
  },
  {
    name: 'create_quote',
    description: 'Create a new quote in JobBOSS2.',
    inputSchema: {
      type: 'object',
      properties: {
        quoteNumber: { type: 'string', description: 'Quote number (optional if auto-numbering enabled)' },
        customerCode: { type: 'string', description: 'Customer code' },
        expirationDate: { type: 'string', description: 'Expiration date (ISO format: yyyy-MM-dd)' },
      },
      required: ['customerCode'],
      additionalProperties: true,
    },
  },
  {
    name: 'update_quote',
    description: 'Update an existing quote in JobBOSS2.',
    inputSchema: {
      type: 'object',
      properties: {
        quoteNumber: { type: 'string', description: 'The quote number to update' },
        customerCode: { type: 'string', description: 'Customer code' },
        status: { type: 'string', description: 'Quote status' },
        expirationDate: { type: 'string', description: 'Expiration date (ISO format: yyyy-MM-dd)' },
      },
      required: ['quoteNumber'],
      additionalProperties: true,
    },
  },
  // Material tools
  {
    name: 'get_materials',
    description: 'Retrieve a list of materials from JobBOSS2. Supports filtering, sorting, pagination, and field selection.',
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
    name: 'get_material_by_part_number',
    description: 'Retrieve a specific material by its part number.',
    inputSchema: {
      type: 'object',
      properties: {
        partNumber: { type: 'string', description: 'The part number to retrieve' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['partNumber'],
    },
  },
  // Employee tools
  {
    name: 'get_employees',
    description: 'Retrieve a list of employees from JobBOSS2. Supports filtering, sorting, pagination, and field selection.',
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
    name: 'get_employee_by_id',
    description: 'Retrieve a specific employee by their employee ID.',
    inputSchema: {
      type: 'object',
      properties: {
        employeeID: { type: 'string', description: 'The employee ID to retrieve' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['employeeID'],
    },
  },
  // Estimate tools (Part Master)
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
  // Attendance Ticket tools
  {
    name: 'get_attendance_tickets',
    description: 'Retrieve a list of attendance tickets from JobBOSS2. Supports filtering by employee, date range, and other fields.',
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
    name: 'get_attendance_ticket_by_id',
    description: 'Retrieve a specific attendance ticket by ticket date and employee code.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketDate: { type: 'string', description: 'The ticket date (ISO format: yyyy-MM-dd)' },
        employeeCode: { type: 'number', description: 'The employee code' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['ticketDate', 'employeeCode'],
    },
  },
  {
    name: 'create_attendance_ticket',
    description: 'Create a new attendance ticket in JobBOSS2.',
    inputSchema: {
      type: 'object',
      properties: {
        employeeCode: { type: 'number', description: 'Employee code' },
        ticketDate: { type: 'string', description: 'Ticket date (ISO format: yyyy-MM-dd)' },
      },
      required: ['employeeCode', 'ticketDate'],
      additionalProperties: true,
    },
  },
  // Attendance Ticket Detail tools
  {
    name: 'get_attendance_ticket_details',
    description: 'Retrieve a list of attendance ticket details (clock in/out times) from JobBOSS2. Supports filtering by employee, date, and other criteria.',
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
    name: 'create_attendance_ticket_detail',
    description: 'Create a new attendance ticket detail (clock in/out entry) for a specific ticket.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketDate: { type: 'string', description: 'The ticket date (ISO format: yyyy-MM-dd)' },
        employeeCode: { type: 'number', description: 'The employee code' },
        actualClockInDate: { type: 'string', description: 'Actual clock in date' },
        actualClockInTime: { type: 'string', description: 'Actual clock in time' },
        actualClockOutDate: { type: 'string', description: 'Actual clock out date' },
        actualClockOutTime: { type: 'string', description: 'Actual clock out time' },
        adjustedClockInDate: { type: 'string', description: 'Adjusted clock in date' },
        adjustedClockInTime: { type: 'string', description: 'Adjusted clock in time' },
        adjustedClockOutDate: { type: 'string', description: 'Adjusted clock out date' },
        adjustedClockOutTime: { type: 'string', description: 'Adjusted clock out time' },
        attendanceCode: { type: 'number', description: 'Attendance code' },
        comments: { type: 'string', description: 'Comments' },
        shift: { type: 'number', description: 'Shift number' },
      },
      required: ['ticketDate', 'employeeCode'],
      additionalProperties: true,
    },
  },
  {
    name: 'update_attendance_ticket_detail',
    description: 'Update an existing attendance ticket detail (clock in/out times).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'The attendance ticket detail ID' },
        actualClockInDate: { type: 'string', description: 'Actual clock in date' },
        actualClockInTime: { type: 'string', description: 'Actual clock in time' },
        actualClockOutDate: { type: 'string', description: 'Actual clock out date' },
        actualClockOutTime: { type: 'string', description: 'Actual clock out time' },
        adjustedClockInDate: { type: 'string', description: 'Adjusted clock in date' },
        adjustedClockInTime: { type: 'string', description: 'Adjusted clock in time' },
        adjustedClockOutDate: { type: 'string', description: 'Adjusted clock out date' },
        adjustedClockOutTime: { type: 'string', description: 'Adjusted clock out time' },
        attendanceCode: { type: 'number', description: 'Attendance code' },
        comments: { type: 'string', description: 'Comments' },
      },
      required: ['id'],
      additionalProperties: true,
    },
  },
  // Attendance Report tool
  {
    name: 'get_attendance_report',
    description: 'Generate a comprehensive attendance report for a date range. This report includes ALL attendance types: regular work time, sick time, vacation, and other leave. Perfect for weekly/daily attendance reports that need to show both worked hours and absences.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date for the report (ISO format: yyyy-MM-dd, e.g., 2025-10-20)' },
        endDate: { type: 'string', description: 'End date for the report (ISO format: yyyy-MM-dd, e.g., 2025-10-24)' },
        employeeCodes: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional: Specific employee codes to include. If omitted, includes all employees.'
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  // Custom API call
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
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Order operations
      case 'get_orders': {
        const params = GetOrdersSchema.parse(args);
        const orders = await jobboss2Client.getOrders(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(orders, null, 2) }],
        };
      }

      case 'get_order_by_id': {
        const { orderNumber, fields } = GetOrderByIdSchema.parse(args);
        const order = await jobboss2Client.getOrderById(orderNumber, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(order, null, 2) }],
        };
      }

      case 'create_order': {
        const orderData = CreateOrderSchema.parse(args);
        const order = await jobboss2Client.createOrder(orderData);
        return {
          content: [{ type: 'text', text: JSON.stringify(order, null, 2) }],
        };
      }

      case 'update_order': {
        const { orderNumber, ...updateData } = UpdateOrderSchema.parse(args);
        const order = await jobboss2Client.updateOrder(orderNumber, updateData);
        return {
          content: [{ type: 'text', text: JSON.stringify(order, null, 2) }],
        };
      }

      // Order Line Item operations
      case 'get_order_line_items': {
        const { orderNumber, fields } = GetOrderLineItemsSchema.parse(args);
        const items = await jobboss2Client.getOrderLineItems(orderNumber, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
        };
      }

      case 'get_order_line_item_by_id': {
        const { orderNumber, itemNumber, fields } = GetOrderLineItemByIdSchema.parse(args);
        const item = await jobboss2Client.getOrderLineItemById(orderNumber, itemNumber, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      }

      case 'create_order_line_item': {
        const { orderNumber, ...itemData } = CreateOrderLineItemSchema.parse(args);
        const item = await jobboss2Client.createOrderLineItem(orderNumber, itemData);
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      }

      case 'update_order_line_item': {
        const { orderNumber, itemNumber, ...updateData } = UpdateOrderLineItemSchema.parse(args);
        const item = await jobboss2Client.updateOrderLineItem(orderNumber, itemNumber, updateData);
        return {
          content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
        };
      }

      // Customer operations
      case 'get_customers': {
        const params = GetCustomersSchema.parse(args);
        const customers = await jobboss2Client.getCustomers(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(customers, null, 2) }],
        };
      }

      case 'get_customer_by_code': {
        const { customerCode, fields } = GetCustomerByIdSchema.parse(args);
        const customer = await jobboss2Client.getCustomerById(customerCode, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(customer, null, 2) }],
        };
      }

      case 'create_customer': {
        const customerData = CreateCustomerSchema.parse(args);
        const customer = await jobboss2Client.createCustomer(customerData);
        return {
          content: [{ type: 'text', text: JSON.stringify(customer, null, 2) }],
        };
      }

      case 'update_customer': {
        const { customerCode, ...updateData } = UpdateCustomerSchema.parse(args);
        const customer = await jobboss2Client.updateCustomer(customerCode, updateData);
        return {
          content: [{ type: 'text', text: JSON.stringify(customer, null, 2) }],
        };
      }

      // Quote operations
      case 'get_quotes': {
        const params = GetQuotesSchema.parse(args);
        const quotes = await jobboss2Client.getQuotes(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(quotes, null, 2) }],
        };
      }

      case 'get_quote_by_id': {
        const { quoteNumber, fields } = GetQuoteByIdSchema.parse(args);
        const quote = await jobboss2Client.getQuoteById(quoteNumber, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(quote, null, 2) }],
        };
      }

      case 'create_quote': {
        const quoteData = CreateQuoteSchema.parse(args);
        const quote = await jobboss2Client.createQuote(quoteData);
        return {
          content: [{ type: 'text', text: JSON.stringify(quote, null, 2) }],
        };
      }

      case 'update_quote': {
        const { quoteNumber, ...updateData } = UpdateQuoteSchema.parse(args);
        const quote = await jobboss2Client.updateQuote(quoteNumber, updateData);
        return {
          content: [{ type: 'text', text: JSON.stringify(quote, null, 2) }],
        };
      }

      // Material operations
      case 'get_materials': {
        const params = GetMaterialsSchema.parse(args);
        const materials = await jobboss2Client.getMaterials(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(materials, null, 2) }],
        };
      }

      case 'get_material_by_part_number': {
        const { partNumber, fields } = GetMaterialByPartNumberSchema.parse(args);
        const material = await jobboss2Client.getMaterialByPartNumber(partNumber, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(material, null, 2) }],
        };
      }

      // Employee operations
      case 'get_employees': {
        const params = GetEmployeesSchema.parse(args);
        const employees = await jobboss2Client.getEmployees(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(employees, null, 2) }],
        };
      }

      case 'get_employee_by_id': {
        const { employeeID, fields } = GetEmployeeByIdSchema.parse(args);
        const employee = await jobboss2Client.getEmployeeById(employeeID, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(employee, null, 2) }],
        };
      }

      // Estimate operations
      case 'get_estimates': {
        const params = GetEstimatesSchema.parse(args);
        const estimates = await jobboss2Client.getEstimates(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(estimates, null, 2) }],
        };
      }

      case 'get_estimate_by_part_number': {
        const { partNumber, fields } = GetEstimateByPartNumberSchema.parse(args);
        const estimate = await jobboss2Client.getEstimateByPartNumber(partNumber, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(estimate, null, 2) }],
        };
      }

      case 'create_estimate': {
        const estimateData = CreateEstimateSchema.parse(args);
        const estimate = await jobboss2Client.createEstimate(estimateData);
        return {
          content: [{ type: 'text', text: JSON.stringify(estimate, null, 2) }],
        };
      }

      case 'update_estimate': {
        const { partNumber, ...updateData } = UpdateEstimateSchema.parse(args);
        await jobboss2Client.updateEstimate(partNumber, updateData);
        return {
          content: [{ type: 'text', text: `Estimate ${partNumber} updated successfully` }],
        };
      }

      // Attendance Ticket operations
      case 'get_attendance_tickets': {
        const params = GetAttendanceTicketsSchema.parse(args);
        const tickets = await jobboss2Client.getAttendanceTickets(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(tickets, null, 2) }],
        };
      }

      case 'get_attendance_ticket_by_id': {
        const { ticketDate, employeeCode, fields } = GetAttendanceTicketByIdSchema.parse(args);
        const ticket = await jobboss2Client.getAttendanceTicketById(ticketDate, employeeCode, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
        };
      }

      case 'create_attendance_ticket': {
        const ticketData = CreateAttendanceTicketSchema.parse(args);
        const ticket = await jobboss2Client.createAttendanceTicket(ticketData);
        return {
          content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }],
        };
      }

      // Attendance Ticket Detail operations
      case 'get_attendance_ticket_details': {
        const params = GetAttendanceTicketDetailsSchema.parse(args);
        const details = await jobboss2Client.getAttendanceTicketDetails(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(details, null, 2) }],
        };
      }

      case 'create_attendance_ticket_detail': {
        const { ticketDate, employeeCode, ...detailData } = CreateAttendanceTicketDetailSchema.parse(args);
        const detail = await jobboss2Client.createAttendanceTicketDetail(ticketDate, employeeCode, detailData);
        return {
          content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
        };
      }

      case 'update_attendance_ticket_detail': {
        const { id, ...updateData } = UpdateAttendanceTicketDetailSchema.parse(args);
        await jobboss2Client.updateAttendanceTicketDetail(id, updateData);
        return {
          content: [{ type: 'text', text: `Attendance ticket detail ${id} updated successfully` }],
        };
      }

      // Attendance Report
      case 'get_attendance_report': {
        const { startDate, endDate, employeeCodes } = GetAttendanceReportSchema.parse(args);
        const rawData = await jobboss2Client.getAttendanceReport(startDate, endDate, employeeCodes);

        // Format the report into a compact, readable summary
        const employeeMap = new Map<number, any>();

        for (const entry of rawData) {
          const empCode = entry.employeeCode || 0;
          if (!employeeMap.has(empCode)) {
            employeeMap.set(empCode, {
              employeeCode: empCode,
              employeeName: entry.employeeName || 'Unknown',
              days: new Map<string, any>(),
              totalHours: 0,
              overtimeHours: 0,
            });
          }

          const emp = employeeMap.get(empCode);
          const date = entry.ticketDate?.split('T')[0] || 'Unknown Date';

          if (!emp.days.has(date)) {
            emp.days.set(date, { entries: [], totalHours: 0 });
          }

          const dayData = emp.days.get(date);
          dayData.entries.push({
            attendanceCode: entry.attendanceCode || 0,
            hours: entry.totalAdjustedTime || entry.totalActualTime || 0,
            isOvertime: entry.isOvertime || false,
            isHoliday: entry.isHoliday || false,
            comments: entry.comments || '',
          });

          const hours = entry.totalAdjustedTime || entry.totalActualTime || 0;
          dayData.totalHours += hours;
          emp.totalHours += hours;
          if (entry.isOvertime) {
            emp.overtimeHours += hours;
          }
        }

        // Build formatted output
        let output = `ATTENDANCE REPORT: ${startDate} to ${endDate}\n`;
        output += `${'='.repeat(80)}\n\n`;
        output += `Total Employees: ${employeeMap.size}\n`;
        output += `Total Records: ${rawData.length}\n\n`;

        // Sort employees by code
        const sortedEmployees = Array.from(employeeMap.values()).sort((a, b) => a.employeeCode - b.employeeCode);

        for (const emp of sortedEmployees) {
          output += `\n${'─'.repeat(80)}\n`;
          output += `EMPLOYEE: ${emp.employeeName} (${emp.employeeCode})\n`;
          output += `Total Hours: ${emp.totalHours.toFixed(2)} | Overtime Hours: ${emp.overtimeHours.toFixed(2)}\n`;
          output += `${'─'.repeat(80)}\n`;

          // Sort days chronologically
          const daysArray: Array<[string, any]> = Array.from(emp.days.entries());
          const sortedDays = daysArray.sort((a, b) => a[0].localeCompare(b[0]));

          for (const [date, dayData] of sortedDays) {
            output += `\n  ${date} - Total: ${dayData.totalHours.toFixed(2)} hours\n`;

            for (const entry of dayData.entries) {
              let entryType = `Code ${entry.attendanceCode}`;
              if (entry.isHoliday) entryType += ' (Holiday)';
              if (entry.isOvertime) entryType += ' (OT)';

              output += `    • ${entryType}: ${entry.hours.toFixed(2)} hrs`;
              if (entry.comments) output += ` - ${entry.comments}`;
              output += '\n';
            }
          }
        }

        output += `\n${'='.repeat(80)}\n`;
        output += `NOTE: Attendance codes distinguish time types (work, sick, vacation, etc.)\n`;
        output += `Check your JobBOSS2 settings for specific code definitions.\n`;

        return {
          content: [{ type: 'text', text: output }],
        };
      }

      // Custom API call
      case 'custom_api_call': {
        const { method, endpoint, data, params } = CustomApiCallSchema.parse(args);
        const result = await jobboss2Client.apiCall(method, endpoint, data, params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('JobBOSS2 MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
