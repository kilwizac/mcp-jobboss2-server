import { z } from 'zod';

// Shared schemas
export const QueryParamsSchema = z.object({
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
  sort: z.string().optional().describe('Sort expression (e.g., -dateEntered,+customerCode)'),
  skip: z.number().optional().describe('Number of records to skip (pagination)'),
  take: z.number().optional().describe('Number of records to take (pagination)'),
}).catchall(z.any()); // Allow dynamic filter parameters

export const NoInputSchema = z.object({}).strict();
export const NoInputJsonSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const;

export const AnyObjectSchema = z.object({}).catchall(z.any());
export const AnyObjectJsonSchema = {
  type: 'object',
  additionalProperties: true,
} as const;

export const QueryOnlyToolInputSchema = {
  type: 'object',
  properties: {
    fields: { type: 'string', description: 'Comma-separated list of fields (e.g., field1,field2)' },
    sort: { type: 'string', description: 'Sort expression such as -dateEntered,+customerCode' },
    skip: { type: 'number', description: 'Number of records to skip (pagination)' },
    take: { type: 'number', description: 'Number of records to take (pagination)' },
  },
  additionalProperties: true,
} as const;

// Order schemas
export const GetOrdersSchema = QueryParamsSchema.describe('Query parameters for getting orders');

export const GetOrderByIdSchema = z.object({
  orderNumber: z.string().describe('The order number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const CreateOrderLineItemSchema = z.object({
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
  // orderRoutings: z.array(CreateOrderRoutingSchema).nullable().optional().describe('Routing payloads attached to the line item'), // Circular dependency handled later or simplified
}).catchall(z.any());

export const CreateOrderSchema = z.object({
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

export const UpdateOrderSchema = z.object({
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

// Order Line Item schemas
export const GetOrderLineItemsSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetOrderLineItemByIdSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  itemNumber: z.number().describe('The line item number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const CreateOrderRoutingSchema = z.object({
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

// Update CreateOrderLineItemSchema to include orderRoutings
// Note: In a real scenario we might need to handle the circular dependency more carefully or just define it here.
// For now, I'll just redefine it or assume it's fine since I'm exporting them.
// Actually, I already defined CreateOrderLineItemSchema above without orderRoutings fully typed to avoid issues,
// but I can add it now if I want.
// Let's just leave it as z.array(z.any()) in the first definition or update it.
// I'll leave it as is in the first definition for simplicity in this extraction.

export const UpdateOrderLineItemSchema = z.object({
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

export const GetOrderRoutingsSchema = QueryParamsSchema.describe('Query parameters for getting order routings');

export const UpdateOrderRoutingSchema = z.object({
  orderNumber: z.string().describe('The order number that owns the routing'),
  itemNumber: z.number().describe('The line item number that owns the routing'),
  stepNumber: z.number().describe('The routing step number to update'),
  operationCode: z.string().nullable().optional().describe('Routing operation code'),
  employeeCode: z.string().nullable().optional().describe('Employee code assigned to the routing'),
  estimatedEndDate: z.string().nullable().optional().describe('Estimated end date (ISO format)'),
  estimatedStartDate: z.string().nullable().optional().describe('Estimated start date (ISO format)'),
  workCenter: z.string().nullable().optional().describe('Work center assigned to the routing'),
}).catchall(z.any());

export const GetOrderRoutingByKeysSchema = z.object({
  orderNumber: z.string().describe('The order number'),
  itemNumber: z.number().describe('The line item number'),
  stepNumber: z.number().describe('The routing step number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

// Customer schemas
export const GetCustomersSchema = QueryParamsSchema.describe('Query parameters for getting customers');

export const GetCustomerByIdSchema = z.object({
  customerCode: z.string().describe('The customer code to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const CreateCustomerSchema = z.object({
  customerCode: z.string().describe('Customer code'),
  customerName: z.string().describe('Customer name'),
  phone: z.string().optional().describe('Phone number'),
  billingAddress1: z.string().optional().describe('Billing address'),
}).catchall(z.any());

export const UpdateCustomerSchema = z.object({
  customerCode: z.string().describe('The customer code to update'),
  customerName: z.string().optional().describe('Customer name'),
  phone: z.string().optional().describe('Phone number'),
  billingAddress1: z.string().optional().describe('Billing address'),
}).catchall(z.any());

// Quote schemas
export const GetQuotesSchema = QueryParamsSchema.describe('Query parameters for getting quotes');

export const GetQuoteByIdSchema = z.object({
  quoteNumber: z.string().describe('The quote number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const CreateQuoteSchema = z.object({
  quoteNumber: z.string().optional().describe('Quote number (optional if auto-numbering enabled)'),
  customerCode: z.string().describe('Customer code'),
  expirationDate: z.string().optional().describe('Expiration date (ISO format)'),
}).catchall(z.any());

export const UpdateQuoteSchema = z.object({
  quoteNumber: z.string().describe('The quote number to update'),
  customerCode: z.string().optional().describe('Customer code'),
  status: z.string().optional().describe('Quote status'),
  expirationDate: z.string().optional().describe('Expiration date (ISO format)'),
}).catchall(z.any());

// Material schemas
export const GetMaterialsSchema = QueryParamsSchema.describe('Query parameters for getting materials');

export const GetMaterialByPartNumberSchema = z.object({
  partNumber: z.string().describe('The part number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetBinLocationsSchema = QueryParamsSchema.describe('Query parameters for getting bin locations');

// Employee schemas
export const GetEmployeesSchema = QueryParamsSchema.describe('Query parameters for getting employees');

export const GetEmployeeByIdSchema = z.object({
  employeeID: z.string().describe('The employee ID to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

// Estimate schemas (Part Master)
export const GetEstimatesSchema = QueryParamsSchema.describe('Query parameters for getting estimates');

export const GetEstimateByPartNumberSchema = z.object({
  partNumber: z.string().describe('The part number to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const CreateEstimateSchema = z.object({
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

export const UpdateEstimateSchema = z.object({
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
export const StringIdSchema = z.preprocess(
  (value) => {
    if (typeof value === 'number') {
      return value.toString();
    }
    return value;
  },
  z.string()
);

export const GetJobMaterialByIdSchema = z.object({
  uniqueID: StringIdSchema.describe('Unique ID of the job material'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetJobRequirementByIdSchema = z.object({
  uniqueID: StringIdSchema.describe('Unique ID of the job requirement'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetProductCodeSchema = z.object({
  productCode: z.string().describe('Product code to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetPurchaseOrderLineItemSchema = z.object({
  purchaseOrderNumber: z.string().describe('Purchase order number'),
  partNumber: z.string().describe('Part number on the PO'),
  itemNumber: StringIdSchema.describe('Line item number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetPurchaseOrderByNumberSchema = z.object({
  poNumber: z.string().describe('Purchase order number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetQuoteLineItemsSchema = QueryParamsSchema.describe('Query parameters for getting quote line items');

export const GetQuoteLineItemByIdSchema = z.object({
  quoteNumber: z.string().describe('Quote number'),
  itemNumber: StringIdSchema.describe('Quote line item number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const CreateQuoteLineItemSchema = z
  .object({
    quoteNumber: z.string().describe('Quote number to attach the line item to'),
  })
  .catchall(z.any());

export const UpdateQuoteLineItemSchema = z
  .object({
    quoteNumber: z.string().describe('Quote number that owns the line item'),
    itemNumber: StringIdSchema.describe('Item number to update'),
  })
  .catchall(z.any());

export const RunReportSchema = z.object({
  body: z
    .record(z.any())
    .describe('Request payload to POST to /api/v1/reports (e.g., { reportName, parameters })'),
});

export const GetReportStatusSchema = z.object({
  requestId: z.string().describe('Report request ID returned from /api/v1/reports'),
});

export const GetRoutingByPartSchema = z.object({
  partNumber: z.string().describe('Estimate part number'),
  stepNumber: StringIdSchema.describe('Routing step number'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetTimeTicketDetailByIdSchema = z.object({
  timeTicketGUID: z.string().describe('Time ticket detail GUID'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetTimeTicketByIdSchema = z.object({
  ticketDate: z.string().describe('Ticket date (yyyy-MM-dd)'),
  employeeCode: StringIdSchema.describe('Employee code'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetVendorByCodeSchema = z.object({
  vendorCode: z.string().describe('Vendor code to retrieve'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const GetWorkCenterByCodeSchema = z.object({
  workCenter: z.string().describe('Work center identifier'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

// Attendance Ticket schemas
export const GetAttendanceTicketsSchema = QueryParamsSchema.describe('Query parameters for getting attendance tickets');

export const GetAttendanceTicketByIdSchema = z.object({
  ticketDate: z.string().describe('The ticket date (ISO format: yyyy-MM-dd)'),
  employeeCode: z.number().describe('The employee code'),
  fields: z.string().optional().describe('Comma-separated list of fields to return'),
});

export const CreateAttendanceTicketSchema = z.object({
  employeeCode: z.number().describe('Employee code'),
  ticketDate: z.string().describe('Ticket date (ISO format: yyyy-MM-dd)'),
}).catchall(z.any());

// Attendance Ticket Detail schemas
export const GetAttendanceTicketDetailsSchema = QueryParamsSchema.describe('Query parameters for getting attendance ticket details');

export const CreateAttendanceTicketDetailSchema = z.object({
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

export const UpdateAttendanceTicketDetailSchema = z.object({
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
export const GetAttendanceReportSchema = z.object({
  startDate: z.string().describe('Start date for the report (ISO format: yyyy-MM-dd)'),
  endDate: z.string().describe('End date for the report (ISO format: yyyy-MM-dd)'),
  employeeCodes: z.array(z.number()).optional().describe('Optional array of employee codes to filter by'),
});

export const CustomApiCallSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).describe('HTTP method'),
  endpoint: z.string().describe('API endpoint path (e.g., orders/12345 or /api/v1/orders/12345)'),
  data: z.any().optional().describe('Request body data (for POST/PUT/PATCH)'),
  params: z.any().optional().describe('Query parameters'),
});
