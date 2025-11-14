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

const GetBinLocationsSchema = QueryParamsSchema.describe('Query parameters for getting bin locations');
const GetOrderRoutingsSchema = QueryParamsSchema.describe('Query parameters for getting order routings');

// Order schemas
const GetOrdersSchema = QueryParamsSchema.describe('Query parameters for getting orders');

const GetOrderByIdSchema = z.object({
  orderNumber: z.string().describe('The order number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

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

const CreateOrderRoutingSchema = z.object({
  orderNumber: z.string().describe('The order number that owns the routing'),
  itemNumber: z.number().describe('The line item number that owns the routing'),
  certificationRequired: z.boolean().optional().describe('Whether the routing requires certification'),
  cyclePrice: z.number().nullable().optional().describe('Cycle price'),
  cycleTime: z.number().nullable().optional().describe('Cycle time'),
  cycleUnit: z.string().nullable().optional().describe('Cycle time unit'),
  departmentNumber: z.string().nullable().optional().describe('Department number handling the routing'),
  description: z.string().nullable().optional().describe('Routing description'),
  employeeCode: z.string().nullable().optional().describe('Employee code assigned to the routing'),
  estimatedEndDate: z.string().nullable().optional().describe('Estimated end date (ISO format)'),
  estimatedQuantity: z.number().nullable().optional().describe('Estimated quantity'),
  estimatedStartDate: z.string().nullable().optional().describe('Estimated start date (ISO format)'),
  ignoreVendorMinimum: z.boolean().optional().describe('Whether to ignore vendor minimum time'),
  operationCode: z.string().nullable().optional().describe('Routing operation code'),
  overlapSteps: z.boolean().optional().describe('Whether routing steps may overlap'),
  setupPrice: z.number().nullable().optional().describe('Setup price'),
  setupTime: z.number().nullable().optional().describe('Setup time'),
  shift2DefaultEmployeeCode: z.string().nullable().optional().describe('Default employee code for shift 2'),
  shift3DefaultEmployeeCode: z.string().nullable().optional().describe('Default employee code for shift 3'),
  stepNumber: z.number().nullable().optional().describe('Routing step number'),
  timeUnit: z.string().nullable().optional().describe('Time unit for the routing'),
  total: z.number().nullable().optional().describe('Total cost for the routing'),
  vendorCode: z.string().nullable().optional().describe('Vendor code'),
  workCenter: z.string().nullable().optional().describe('Work center assigned to the routing'),
  workCenterOrVendor: z.string().describe('Work center or vendor identifier'),
}).catchall(z.any());

const UpdateOrderRoutingSchema = z.object({
  orderNumber: z.string().describe('The order number that owns the routing'),
  itemNumber: z.number().describe('The line item number that owns the routing'),
  stepNumber: z.number().describe('The routing step number to update'),
  operationCode: z.string().nullable().optional().describe('Routing operation code'),
  employeeCode: z.string().nullable().optional().describe('Employee code assigned to the routing'),
  estimatedEndDate: z.string().nullable().optional().describe('Estimated end date (ISO format)'),
  estimatedStartDate: z.string().nullable().optional().describe('Estimated start date (ISO format)'),
  workCenter: z.string().nullable().optional().describe('Work center assigned to the routing'),
}).catchall(z.any());

const GetOrderRoutingByKeysSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  itemNumber: z.number().describe('The line item number'),
  stepNumber: z.number().describe('The routing step number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateOrderLineItemSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  partNumber: z.string().describe('Part number'),
  billingRate: z.number().nullable().optional().describe('Billing rate'),
  commissionPercent: z.number().nullable().optional().describe('Commission percent'),
  discountPercent: z.number().nullable().optional().describe('Discount percent'),
  dueDate: z.string().nullable().optional().describe('Due date (ISO format)'),
  estimatedEndDate: z.string().nullable().optional().describe('Estimated end date (ISO format)'),
  estimatedStartDate: z.string().nullable().optional().describe('Estimated start date (ISO format)'),
  FOB: z.string().nullable().optional().describe('Free on board code'),
  isTaxable: z.boolean().optional().describe('Mark line item as taxable'),
  jobNotes: z.string().nullable().optional().describe('Job notes'),
  miscCharges: z.number().nullable().optional().describe('Miscellaneous charges'),
  miscDescription: z.string().nullable().optional().describe('Miscellaneous description'),
  partDescription: z.string().nullable().optional().describe('Part description'),
  pricingUnit: z.string().nullable().optional().describe('Pricing unit of measure'),
  priority: z.number().nullable().optional().describe('Priority'),
  productCode: z.string().nullable().optional().describe('Product code'),
  quantityOrdered: z.number().nullable().optional().describe('Quantity ordered'),
  quoteItemNumber: z.number().nullable().optional().describe('Quote item number'),
  quoteNumber: z.string().nullable().optional().describe('Quote number'),
  revision: z.string().nullable().optional().describe('Revision'),
  totalEstimatedHours: z.number().nullable().optional().describe('Total estimated hours'),
  unitPrice: z.number().nullable().optional().describe('Unit price'),
  user_Currency1: z.number().nullable().optional().describe('User currency field 1'),
  user_Currency2: z.number().nullable().optional().describe('User currency field 2'),
  user_Date1: z.string().nullable().optional().describe('User date field 1'),
  user_Date2: z.string().nullable().optional().describe('User date field 2'),
  user_Memo1: z.string().nullable().optional().describe('User memo field 1'),
  user_Number1: z.number().nullable().optional().describe('User number field 1'),
  user_Number2: z.number().nullable().optional().describe('User number field 2'),
  user_Number3: z.number().nullable().optional().describe('User number field 3'),
  user_Number4: z.number().nullable().optional().describe('User number field 4'),
  user_Text1: z.string().nullable().optional().describe('User text field 1'),
  user_Text2: z.string().nullable().optional().describe('User text field 2'),
  user_Text3: z.string().nullable().optional().describe('User text field 3'),
  user_Text4: z.string().nullable().optional().describe('User text field 4'),
  workCode: z.string().nullable().optional().describe('Work code'),
  releases: z.array(z.any()).nullable().optional().describe('Release payloads'),
  orderRoutings: z.array(CreateOrderRoutingSchema).nullable().optional().describe('Routing payloads attached to the line item'),
}).catchall(z.any());

const UpdateOrderLineItemSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  itemNumber: z.number().describe('The line item number'),
  user_Currency1: z.number().nullable().optional().describe('User currency field 1'),
  user_Currency2: z.number().nullable().optional().describe('User currency field 2'),
  user_Date1: z.string().nullable().optional().describe('User date field 1'),
  user_Date2: z.string().nullable().optional().describe('User date field 2'),
  user_Memo1: z.string().nullable().optional().describe('User memo field 1'),
  user_Number1: z.number().nullable().optional().describe('User number field 1'),
  user_Number2: z.number().nullable().optional().describe('User number field 2'),
  user_Number3: z.number().nullable().optional().describe('User number field 3'),
  user_Number4: z.number().nullable().optional().describe('User number field 4'),
  user_Text1: z.string().nullable().optional().describe('User text field 1'),
  user_Text2: z.string().nullable().optional().describe('User text field 2'),
  user_Text3: z.string().nullable().optional().describe('User text field 3'),
  user_Text4: z.string().nullable().optional().describe('User text field 4'),
}).catchall(z.any());

const CreateOrderSchema = z.object({
  customerCode: z.string().describe('Customer code'),
  orderNumber: z.string().nullable().optional().describe('Order number (optional if auto-numbering enabled)'),
  addCustomerFromQuote: z.boolean().optional().describe('Add customer data from a quote'),
  allowExpiredQuoteItems: z.boolean().optional().describe('Allow line items from expired quotes'),
  country: z.string().nullable().optional().describe('Country code'),
  currencyCode: z.string().nullable().optional().describe('Currency code'),
  customerDescription: z.string().nullable().optional().describe('Customer description'),
  dateEntered: z.string().nullable().optional().describe('Entry date (ISO format)'),
  exchangeRate: z.number().nullable().optional().describe('Exchange rate'),
  fax: z.string().nullable().optional().describe('Fax number'),
  GSTCode: z.string().nullable().optional().describe('GST code'),
  holdUntilAccountIsCurrent: z.boolean().optional().describe('Hold the order until the account is current'),
  location: z.string().nullable().optional().describe('Location code'),
  mainDueDate: z.string().nullable().optional().describe('Primary due date (ISO format)'),
  mainPriority: z.number().int().nullable().optional().describe('Primary priority'),
  markCustomerActive: z.boolean().optional().describe('Activate the customer record'),
  notesToCustomer: z.string().nullable().optional().describe('Notes to send to the customer'),
  phone: z.string().nullable().optional().describe('Phone number'),
  PONumber: z.string().nullable().optional().describe('Customer PO number'),
  purchasingContact: z.string().nullable().optional().describe('Purchasing contact'),
  quoteNumber: z.string().nullable().optional().describe('Originating quote number'),
  salesID: z.string().nullable().optional().describe('Salesperson ID'),
  saveOnDuplicateCustomerPONumber: z.boolean().optional().describe('Allow saving when duplicate customer PO is entered'),
  shippingAddress1: z.string().nullable().optional().describe('Shipping address line 1'),
  shippingCity: z.string().nullable().optional().describe('Shipping city'),
  shippingCode: z.string().nullable().optional().describe('Shipping code'),
  shippingState: z.string().nullable().optional().describe('Shipping state'),
  shipToName: z.string().nullable().optional().describe('Ship-to name'),
  shipVia: z.string().nullable().optional().describe('Shipping method'),
  shipZIP: z.string().nullable().optional().describe('Shipping ZIP code'),
  status: z.string().nullable().optional().describe('Order status'),
  taxCode: z.string().nullable().optional().describe('Tax code'),
  termsCode: z.string().nullable().optional().describe('Terms code'),
  territory: z.string().nullable().optional().describe('Territory code'),
  user_Currency1: z.number().nullable().optional().describe('User currency field 1'),
  user_Currency2: z.number().nullable().optional().describe('User currency field 2'),
  user_Date1: z.string().nullable().optional().describe('User date field 1'),
  user_Date2: z.string().nullable().optional().describe('User date field 2'),
  user_Memo1: z.string().nullable().optional().describe('User memo field 1'),
  user_Number1: z.number().nullable().optional().describe('User number field 1'),
  user_Number2: z.number().nullable().optional().describe('User number field 2'),
  user_Number3: z.number().nullable().optional().describe('User number field 3'),
  user_Number4: z.number().nullable().optional().describe('User number field 4'),
  user_Text1: z.string().nullable().optional().describe('User text field 1'),
  user_Text2: z.string().nullable().optional().describe('User text field 2'),
  user_Text3: z.string().nullable().optional().describe('User text field 3'),
  user_Text4: z.string().nullable().optional().describe('User text field 4'),
  orderLineItems: z.array(CreateOrderLineItemSchema).nullable().optional().describe('Line items to add to the order'),
}).catchall(z.any());

const UpdateOrderSchema = z.object({
  orderNumber: z.string().describe('The order number to update'),
  user_Currency1: z.number().nullable().optional().describe('User currency field 1'),
  user_Currency2: z.number().nullable().optional().describe('User currency field 2'),
  user_Date1: z.string().nullable().optional().describe('User date field 1'),
  user_Date2: z.string().nullable().optional().describe('User date field 2'),
  user_Memo1: z.string().nullable().optional().describe('User memo field 1'),
  user_Number1: z.number().nullable().optional().describe('User number field 1'),
  user_Number2: z.number().nullable().optional().describe('User number field 2'),
  user_Number3: z.number().nullable().optional().describe('User number field 3'),
  user_Number4: z.number().nullable().optional().describe('User number field 4'),
  user_Text1: z.string().nullable().optional().describe('User text field 1'),
  user_Text2: z.string().nullable().optional().describe('User text field 2'),
  user_Text3: z.string().nullable().optional().describe('User text field 3'),
  user_Text4: z.string().nullable().optional().describe('User text field 4'),
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
  active: z.boolean().optional(),
  alternatePartNumber: z.string().nullable().optional(),
  calculationMethod: z.string().nullable().optional(),
  customerCode: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  GLCode: z.string().nullable().optional(),
  leadTime: z.number().nullable().optional(),
  lockPrice: z.boolean().optional(),
  markup1: z.number().nullable().optional(),
  markup2: z.number().nullable().optional(),
  markup3: z.number().nullable().optional(),
  markup4: z.number().nullable().optional(),
  markup5: z.number().nullable().optional(),
  markup6: z.number().nullable().optional(),
  markup7: z.number().nullable().optional(),
  markup8: z.number().nullable().optional(),
  partWeight: z.number().nullable().optional(),
  price1: z.number().nullable().optional(),
  price2: z.number().nullable().optional(),
  price3: z.number().nullable().optional(),
  price4: z.number().nullable().optional(),
  price5: z.number().nullable().optional(),
  price6: z.number().nullable().optional(),
  price7: z.number().nullable().optional(),
  price8: z.number().nullable().optional(),
  pricingUnit: z.string().nullable().optional(),
  productCode: z.string().nullable().optional(),
  purchaseCost1: z.number().nullable().optional(),
  purchaseCost2: z.number().nullable().optional(),
  purchaseCost3: z.number().nullable().optional(),
  purchaseCost4: z.number().nullable().optional(),
  purchaseCost5: z.number().nullable().optional(),
  purchaseCost6: z.number().nullable().optional(),
  purchaseCost7: z.number().nullable().optional(),
  purchaseCost8: z.number().nullable().optional(),
  purchaseFactor: z.number().nullable().optional(),
  purchaseQuantity1: z.number().nullable().optional(),
  purchaseQuantity2: z.number().nullable().optional(),
  purchaseQuantity3: z.number().nullable().optional(),
  purchaseQuantity4: z.number().nullable().optional(),
  purchaseQuantity5: z.number().nullable().optional(),
  purchaseQuantity6: z.number().nullable().optional(),
  purchaseQuantity7: z.number().nullable().optional(),
  purchaseQuantity8: z.number().nullable().optional(),
  purchasingGLCode: z.string().nullable().optional(),
  purchasingUnit: z.string().nullable().optional(),
  quantity1: z.number().nullable().optional(),
  quantity2: z.number().nullable().optional(),
  quantity3: z.number().nullable().optional(),
  quantity4: z.number().nullable().optional(),
  quantity5: z.number().nullable().optional(),
  quantity6: z.number().nullable().optional(),
  quantity7: z.number().nullable().optional(),
  quantity8: z.number().nullable().optional(),
  revision: z.string().nullable().optional(),
  revisionDate: z.string().nullable().optional(),
  useDefaultQuantities: z.boolean().optional().describe('Use default quantity breaks from company settings'),
  user_Currency1: z.number().nullable().optional(),
  user_Currency2: z.number().nullable().optional(),
  user_Date1: z.string().nullable().optional(),
  user_Date2: z.string().nullable().optional(),
  user_Memo1: z.string().nullable().optional(),
  user_Number1: z.number().nullable().optional(),
  user_Number2: z.number().nullable().optional(),
  user_Number3: z.number().nullable().optional(),
  user_Number4: z.number().nullable().optional(),
  user_Text1: z.string().nullable().optional(),
  user_Text2: z.string().nullable().optional(),
  user_Text3: z.string().nullable().optional(),
  user_Text4: z.string().nullable().optional(),
  vendorCode1: z.string().nullable().optional(),
  materials: z.array(z.any()).nullable().optional(),
  routings: z.array(z.any()).nullable().optional(),
}).catchall(z.any());

const UpdateEstimateSchema = z.object({
  partNumber: z.string().describe('The part number to update'),
  revision: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  revisionDate: z.string().nullable().optional(),
  user_Currency1: z.number().nullable().optional(),
  user_Currency2: z.number().nullable().optional(),
  user_Date1: z.string().nullable().optional(),
  user_Date2: z.string().nullable().optional(),
  user_Memo1: z.string().nullable().optional(),
  user_Number1: z.number().nullable().optional(),
  user_Number2: z.number().nullable().optional(),
  user_Number3: z.number().nullable().optional(),
  user_Number4: z.number().nullable().optional(),
  user_Text1: z.string().nullable().optional(),
  user_Text2: z.string().nullable().optional(),
  user_Text3: z.string().nullable().optional(),
  user_Text4: z.string().nullable().optional(),
}).catchall(z.any());

// Shared helpers for new resource schemas
const StringIdSchema = z.preprocess(
  (value) => {
    if (typeof value === 'number') {
      return value.toString();
    }
    return value;
  },
  z.string()
);

const GetJobMaterialByIdSchema = z.object({
  uniqueID: StringIdSchema.describe('Unique ID of the job material'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetJobRequirementByIdSchema = z.object({
  uniqueID: StringIdSchema.describe('Unique ID of the job requirement'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetProductCodeSchema = z.object({
  productCode: z.string().describe('Product code to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetPurchaseOrderLineItemSchema = z.object({
  purchaseOrderNumber: z.string().describe('Purchase order number'),
  partNumber: z.string().describe('Part number on the PO'),
  itemNumber: StringIdSchema.describe('Line item number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetPurchaseOrderByNumberSchema = z.object({
  poNumber: z.string().describe('Purchase order number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetQuoteLineItemByIdSchema = z.object({
  quoteNumber: z.string().describe('Quote number'),
  itemNumber: StringIdSchema.describe('Quote line item number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const CreateQuoteLineItemSchema = z
  .object({
    quoteNumber: z.string().describe('Quote number to attach the line item to'),
  })
  .catchall(z.any());

const UpdateQuoteLineItemSchema = z
  .object({
    quoteNumber: z.string().describe('Quote number that owns the line item'),
    itemNumber: StringIdSchema.describe('Item number to update'),
  })
  .catchall(z.any());

const RunReportSchema = z.object({
  body: z
    .record(z.any())
    .describe('Request payload to POST to /api/v1/reports (e.g., { reportName, parameters })'),
});

const GetReportStatusSchema = z.object({
  requestId: z.string().describe('Report request ID returned from /api/v1/reports'),
});

const GetRoutingByPartSchema = z.object({
  partNumber: z.string().describe('Estimate part number'),
  stepNumber: StringIdSchema.describe('Routing step number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetTimeTicketDetailByIdSchema = z.object({
  timeTicketGUID: z.string().describe('Time ticket detail GUID'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetTimeTicketByIdSchema = z.object({
  ticketDate: z.string().describe('Ticket date (yyyy-MM-dd)'),
  employeeCode: StringIdSchema.describe('Employee code'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetVendorByCodeSchema = z.object({
  vendorCode: z.string().describe('Vendor code to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

const GetWorkCenterByCodeSchema = z.object({
  workCenter: z.string().describe('Work center identifier'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

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

const QueryOnlyToolInputSchema = {
  type: 'object',
  properties: {
    fields: { type: 'string', description: 'Comma-separated list of fields (e.g., field1,field2)' },
    sort: { type: 'string', description: 'Sort expression such as -dateEntered,+customerCode' },
    skip: { type: 'number', description: 'Number of records to skip (pagination)' },
    take: { type: 'number', description: 'Number of records to take (pagination)' },
  },
  additionalProperties: true,
} as const;

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
  {
    name: 'get_bin_locations',
    description: 'Retrieve a list of bin locations from JobBOSS2. Supports filtering, sorting, and pagination.',
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
  // Document management tools
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
  // Job material and requirement tools
  {
    name: 'get_job_materials',
    description: 'Retrieve job material postings (issues/receipts) with bin locations, costs, and related job/order information.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_job_material_by_id',
    description: 'Retrieve a specific job material record by its unique ID.',
    inputSchema: {
      type: 'object',
      properties: {
        uniqueID: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
          description: 'Unique identifier for the job material',
        },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['uniqueID'],
    },
  },
  {
    name: 'get_job_requirements',
    description: 'Retrieve job requirement/purchase suggestions including vendor codes, lead times, and required quantities.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_job_requirement_by_id',
    description: 'Retrieve a specific job requirement by unique ID.',
    inputSchema: {
      type: 'object',
      properties: {
        uniqueID: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
          description: 'Unique identifier for the job requirement',
        },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['uniqueID'],
    },
  },
  // Packing and logistics tools
  {
    name: 'get_packing_list_line_items',
    description: 'Retrieve packing list line items showing what was shipped, quantities, and job references.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_packing_lists',
    description: 'Retrieve packing list headers including ship-to, freight, and container information.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  // Product code tools
  {
    name: 'get_product_codes',
    description: 'Retrieve product codes with related GL accounts and cash discount settings.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_product_code',
    description: 'Retrieve a specific product code by its identifier.',
    inputSchema: {
      type: 'object',
      properties: {
        productCode: { type: 'string', description: 'Product code to retrieve' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['productCode'],
    },
  },
  // Purchase order tools
  {
    name: 'get_purchase_order_line_items',
    description: 'Retrieve purchase order line items with quantities, costs, and routing information. Supports filtering (e.g., purchaseOrderNumber=1001).',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_purchase_order_line_item',
    description: 'Retrieve a specific purchase order line item by PO number, part number, and line item number.',
    inputSchema: {
      type: 'object',
      properties: {
        purchaseOrderNumber: { type: 'string', description: 'Purchase order number' },
        partNumber: { type: 'string', description: 'Part number on the purchase order' },
        itemNumber: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
          description: 'Line item number',
        },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['purchaseOrderNumber', 'partNumber', 'itemNumber'],
    },
  },
  {
    name: 'get_purchase_order_releases',
    description: 'Retrieve purchase order release schedules showing quantities and due dates.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_purchase_orders',
    description: 'Retrieve purchase order headers including vendor, ship-to, and totals.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_purchase_order_by_number',
    description: 'Retrieve a specific purchase order by PO number.',
    inputSchema: {
      type: 'object',
      properties: {
        poNumber: { type: 'string', description: 'Purchase order number' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['poNumber'],
    },
  },
  // Quote line item tools
  {
    name: 'get_quote_line_items',
    description: 'Retrieve quote line items across all quotes. Filter by quoteNumber, partNumber, status, etc.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_quote_line_item_by_id',
    description: 'Retrieve a specific quote line item using quote number and line item number.',
    inputSchema: {
      type: 'object',
      properties: {
        quoteNumber: { type: 'string', description: 'Quote number' },
        itemNumber: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
          description: 'Line item number',
        },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['quoteNumber', 'itemNumber'],
    },
  },
  {
    name: 'create_quote_line_item',
    description: 'Create a new quote line item. Provide any JobBOSS2 quote line item fields (pricing, quantities, work code, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        quoteNumber: { type: 'string', description: 'Quote number for the new line item' },
      },
      required: ['quoteNumber'],
      additionalProperties: true,
    },
  },
  {
    name: 'update_quote_line_item',
    description: 'Update an existing quote line item by quote number and item number. Supply any fields to patch.',
    inputSchema: {
      type: 'object',
      properties: {
        quoteNumber: { type: 'string', description: 'Quote number' },
        itemNumber: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
          description: 'Line item number',
        },
      },
      required: ['quoteNumber', 'itemNumber'],
      additionalProperties: true,
    },
  },
  // Report tools
  {
    name: 'run_report',
    description: 'Submit a JobBOSS2 report request. Pass the exact payload expected by /api/v1/reports (reportName, parameters, output format, etc.). Returns a requestId for polling.',
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          type: 'object',
          description: 'JSON payload accepted by the reports endpoint (e.g., { reportName: \"LateJobs\", parameters: {...} })',
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
  // Routing tools
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
  // Salesperson tools
  {
    name: 'get_salespersons',
    description: 'Retrieve salesperson master records including commission settings and contact info.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  // Time ticket tools
  {
    name: 'get_time_ticket_details',
    description: 'Retrieve shop floor time ticket detail entries (clocked labor) across jobs, work centers, or employees.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_time_ticket_detail_by_id',
    description: 'Retrieve a single time ticket detail by its GUID.',
    inputSchema: {
      type: 'object',
      properties: {
        timeTicketGUID: { type: 'string', description: 'Time ticket detail GUID' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['timeTicketGUID'],
    },
  },
  {
    name: 'get_time_tickets',
    description: 'Retrieve time ticket headers (per employee per day).',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_time_ticket_by_id',
    description: 'Retrieve a specific time ticket header by ticket date and employee code.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketDate: { type: 'string', description: 'Ticket date (ISO format: yyyy-MM-dd)' },
        employeeCode: {
          oneOf: [{ type: 'string' }, { type: 'number' }],
          description: 'Employee code',
        },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['ticketDate', 'employeeCode'],
    },
  },
  // Vendor tools
  {
    name: 'get_vendors',
    description: 'Retrieve vendor master records including payment terms and lead times.',
    inputSchema: QueryOnlyToolInputSchema,
  },
  {
    name: 'get_vendor_by_code',
    description: 'Retrieve a specific vendor by vendor code.',
    inputSchema: {
      type: 'object',
      properties: {
        vendorCode: { type: 'string', description: 'Vendor code' },
        fields: { type: 'string', description: 'Comma-separated list of fields to return' },
      },
      required: ['vendorCode'],
    },
  },
  // Work center tools
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

      case 'get_order_routings': {
        const params = GetOrderRoutingsSchema.parse(args);
        const routings = await jobboss2Client.getOrderRoutings(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(routings, null, 2) }],
        };
      }

      case 'get_order_routing': {
        const { orderNumber, itemNumber, stepNumber, fields } = GetOrderRoutingByKeysSchema.parse(args);
        const routing = await jobboss2Client.getOrderRouting(orderNumber, itemNumber, stepNumber, { fields });
        return {
          content: [{ type: 'text', text: JSON.stringify(routing, null, 2) }],
        };
      }

      case 'create_order_routing': {
        const { orderNumber, itemNumber, ...routingData } = CreateOrderRoutingSchema.parse(args);
        const routing = await jobboss2Client.createOrderRouting(orderNumber, itemNumber, routingData);
        return {
          content: [{ type: 'text', text: JSON.stringify(routing, null, 2) }],
        };
      }

      case 'update_order_routing': {
        const { orderNumber, itemNumber, stepNumber, ...updateData } = UpdateOrderRoutingSchema.parse(args);
        const routing = await jobboss2Client.updateOrderRouting(orderNumber, itemNumber, stepNumber, updateData);
        return {
          content: [{ type: 'text', text: JSON.stringify(routing, null, 2) }],
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

      case 'get_bin_locations': {
        const params = GetBinLocationsSchema.parse(args);
        const binLocations = await jobboss2Client.getBinLocations(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(binLocations, null, 2) }],
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

      // Document tools
      case 'get_document_controls': {
        const params = QueryParamsSchema.parse(args);
        const records = await jobboss2Client.getDocumentControls(params);
        return { content: [{ type: 'text', text: JSON.stringify(records, null, 2) }] };
      }

      case 'get_document_histories': {
        const params = QueryParamsSchema.parse(args);
        const histories = await jobboss2Client.getDocumentHistories(params);
        return { content: [{ type: 'text', text: JSON.stringify(histories, null, 2) }] };
      }

      case 'get_document_reviews': {
        const params = QueryParamsSchema.parse(args);
        const reviews = await jobboss2Client.getDocumentReviews(params);
        return { content: [{ type: 'text', text: JSON.stringify(reviews, null, 2) }] };
      }

      // Job material and requirement tools
      case 'get_job_materials': {
        const params = QueryParamsSchema.parse(args);
        const materials = await jobboss2Client.getJobMaterials(params);
        return { content: [{ type: 'text', text: JSON.stringify(materials, null, 2) }] };
      }

      case 'get_job_material_by_id': {
        const { uniqueID, fields } = GetJobMaterialByIdSchema.parse(args);
        const material = await jobboss2Client.getJobMaterialById(uniqueID, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(material, null, 2) }] };
      }

      case 'get_job_requirements': {
        const params = QueryParamsSchema.parse(args);
        const requirements = await jobboss2Client.getJobRequirements(params);
        return { content: [{ type: 'text', text: JSON.stringify(requirements, null, 2) }] };
      }

      case 'get_job_requirement_by_id': {
        const { uniqueID, fields } = GetJobRequirementByIdSchema.parse(args);
        const requirement = await jobboss2Client.getJobRequirementById(uniqueID, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(requirement, null, 2) }] };
      }

      // Packing list tools
      case 'get_packing_list_line_items': {
        const params = QueryParamsSchema.parse(args);
        const lineItems = await jobboss2Client.getPackingListLineItems(params);
        return { content: [{ type: 'text', text: JSON.stringify(lineItems, null, 2) }] };
      }

      case 'get_packing_lists': {
        const params = QueryParamsSchema.parse(args);
        const packingLists = await jobboss2Client.getPackingLists(params);
        return { content: [{ type: 'text', text: JSON.stringify(packingLists, null, 2) }] };
      }

      // Product code tools
      case 'get_product_codes': {
        const params = QueryParamsSchema.parse(args);
        const productCodes = await jobboss2Client.getProductCodes(params);
        return { content: [{ type: 'text', text: JSON.stringify(productCodes, null, 2) }] };
      }

      case 'get_product_code': {
        const { productCode, fields } = GetProductCodeSchema.parse(args);
        const product = await jobboss2Client.getProductCode(productCode, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(product, null, 2) }] };
      }

      // Purchase order tools
      case 'get_purchase_order_line_items': {
        const params = QueryParamsSchema.parse(args);
        const lineItems = await jobboss2Client.getPurchaseOrderLineItems(params);
        return { content: [{ type: 'text', text: JSON.stringify(lineItems, null, 2) }] };
      }

      case 'get_purchase_order_line_item': {
        const { purchaseOrderNumber, partNumber, itemNumber, fields } = GetPurchaseOrderLineItemSchema.parse(args);
        const lineItem = await jobboss2Client.getPurchaseOrderLineItem(
          purchaseOrderNumber,
          partNumber,
          itemNumber,
          fields ? { fields } : undefined
        );
        return { content: [{ type: 'text', text: JSON.stringify(lineItem, null, 2) }] };
      }

      case 'get_purchase_order_releases': {
        const params = QueryParamsSchema.parse(args);
        const releases = await jobboss2Client.getPurchaseOrderReleases(params);
        return { content: [{ type: 'text', text: JSON.stringify(releases, null, 2) }] };
      }

      case 'get_purchase_orders': {
        const params = QueryParamsSchema.parse(args);
        const purchaseOrders = await jobboss2Client.getPurchaseOrders(params);
        return { content: [{ type: 'text', text: JSON.stringify(purchaseOrders, null, 2) }] };
      }

      case 'get_purchase_order_by_number': {
        const { poNumber, fields } = GetPurchaseOrderByNumberSchema.parse(args);
        const po = await jobboss2Client.getPurchaseOrderByNumber(poNumber, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(po, null, 2) }] };
      }

      // Quote line item tools
      case 'get_quote_line_items': {
        const params = QueryParamsSchema.parse(args);
        const items = await jobboss2Client.getQuoteLineItems(params);
        return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
      }

      case 'get_quote_line_item_by_id': {
        const { quoteNumber, itemNumber, fields } = GetQuoteLineItemByIdSchema.parse(args);
        const item = await jobboss2Client.getQuoteLineItem(quoteNumber, itemNumber, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }

      case 'create_quote_line_item': {
        const { quoteNumber, ...lineItemData } = CreateQuoteLineItemSchema.parse(args);
        const item = await jobboss2Client.createQuoteLineItem(quoteNumber, lineItemData);
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }

      case 'update_quote_line_item': {
        const { quoteNumber, itemNumber, ...updateData } = UpdateQuoteLineItemSchema.parse(args);
        const item = await jobboss2Client.updateQuoteLineItem(quoteNumber, itemNumber, updateData);
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }

      // Report tools
      case 'run_report': {
        const { body } = RunReportSchema.parse(args);
        const submission = await jobboss2Client.submitReportRequest(body);
        return { content: [{ type: 'text', text: JSON.stringify(submission, null, 2) }] };
      }

      case 'get_report_status': {
        const { requestId } = GetReportStatusSchema.parse(args);
        const status = await jobboss2Client.getReportRequest(requestId);
        return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
      }

      // Routing tools
      case 'get_routings': {
        const params = QueryParamsSchema.parse(args);
        const routings = await jobboss2Client.getRoutings(params);
        return { content: [{ type: 'text', text: JSON.stringify(routings, null, 2) }] };
      }

      case 'get_routing_by_part_number': {
        const { partNumber, stepNumber, fields } = GetRoutingByPartSchema.parse(args);
        const routing = await jobboss2Client.getRoutingByPartNumber(partNumber, stepNumber, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(routing, null, 2) }] };
      }

      // Salesperson tools
      case 'get_salespersons': {
        const params = QueryParamsSchema.parse(args);
        const salespeople = await jobboss2Client.getSalespersons(params);
        return { content: [{ type: 'text', text: JSON.stringify(salespeople, null, 2) }] };
      }

      // Time ticket tools
      case 'get_time_ticket_details': {
        const params = QueryParamsSchema.parse(args);
        const details = await jobboss2Client.getTimeTicketDetails(params);
        return { content: [{ type: 'text', text: JSON.stringify(details, null, 2) }] };
      }

      case 'get_time_ticket_detail_by_id': {
        const { timeTicketGUID, fields } = GetTimeTicketDetailByIdSchema.parse(args);
        const detail = await jobboss2Client.getTimeTicketDetailByGuid(timeTicketGUID, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }] };
      }

      case 'get_time_tickets': {
        const params = QueryParamsSchema.parse(args);
        const tickets = await jobboss2Client.getTimeTickets(params);
        return { content: [{ type: 'text', text: JSON.stringify(tickets, null, 2) }] };
      }

      case 'get_time_ticket_by_id': {
        const { ticketDate, employeeCode, fields } = GetTimeTicketByIdSchema.parse(args);
        const ticket = await jobboss2Client.getTimeTicketById(ticketDate, employeeCode, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
      }

      // Vendor tools
      case 'get_vendors': {
        const params = QueryParamsSchema.parse(args);
        const vendors = await jobboss2Client.getVendors(params);
        return { content: [{ type: 'text', text: JSON.stringify(vendors, null, 2) }] };
      }

      case 'get_vendor_by_code': {
        const { vendorCode, fields } = GetVendorByCodeSchema.parse(args);
        const vendor = await jobboss2Client.getVendorByCode(vendorCode, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(vendor, null, 2) }] };
      }

      // Work center tools
      case 'get_work_centers': {
        const params = QueryParamsSchema.parse(args);
        const workCenters = await jobboss2Client.getWorkCenters(params);
        return { content: [{ type: 'text', text: JSON.stringify(workCenters, null, 2) }] };
      }

      case 'get_work_center_by_code': {
        const { workCenter, fields } = GetWorkCenterByCodeSchema.parse(args);
        const center = await jobboss2Client.getWorkCenterByCode(workCenter, fields ? { fields } : undefined);
        return { content: [{ type: 'text', text: JSON.stringify(center, null, 2) }] };
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

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
