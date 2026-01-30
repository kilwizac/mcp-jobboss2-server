import { FastMCP } from "fastmcp";
import { JobBOSS2Client } from "../jobboss2-client.js";
import * as schemas from "../schemas.js";

// Import all tools and handlers
import { orderTools, orderHandlers } from "../tools/orders.js";
import { customerTools, customerHandlers } from "../tools/customers.js";
import { quoteTools, quoteHandlers } from "../tools/quotes.js";
import { inventoryTools, inventoryHandlers } from "../tools/inventory.js";
import { productionTools, productionHandlers } from "../tools/production.js";
import { employeeTools, employeeHandlers } from "../tools/employees.js";
import { generalTools, generalHandlers } from "../tools/general.js";
import { generatedToolConfigs } from "../tools/generated.js";

const toolSchemaMap: Record<string, any> = {
  // Orders
  get_orders: schemas.GetOrdersSchema,
  get_order_by_id: schemas.GetOrderByIdSchema,
  create_order: schemas.CreateOrderSchema,
  update_order: schemas.UpdateOrderSchema,
  get_order_line_items: schemas.GetOrderLineItemsSchema,
  get_order_line_item_by_id: schemas.GetOrderLineItemByIdSchema,
  create_order_line_item: schemas.CreateOrderLineItemSchema,
  update_order_line_item: schemas.UpdateOrderLineItemSchema,
  get_order_routings: schemas.GetOrderRoutingsSchema,
  get_order_routing: schemas.GetOrderRoutingByKeysSchema,
  create_order_routing: schemas.CreateOrderRoutingSchema,
  update_order_routing: schemas.UpdateOrderRoutingSchema,
  create_order_release: schemas.AnyObjectSchema,
  get_order_release_by_id: schemas.AnyObjectSchema,

  // Customers
  get_customers: schemas.GetCustomersSchema,
  get_customer_by_code: schemas.GetCustomerByIdSchema,
  create_customer: schemas.CreateCustomerSchema,
  update_customer: schemas.UpdateCustomerSchema,

  // Quotes
  get_quotes: schemas.GetQuotesSchema,
  get_quote_by_id: schemas.GetQuoteByIdSchema,
  create_quote: schemas.CreateQuoteSchema,
  update_quote: schemas.UpdateQuoteSchema,
  get_quote_line_items: schemas.GetQuoteLineItemsSchema,
  get_quote_line_item_by_id: schemas.GetQuoteLineItemByIdSchema,
  create_quote_line_item: schemas.CreateQuoteLineItemSchema,
  update_quote_line_item: schemas.UpdateQuoteLineItemSchema,

  // Inventory
  get_materials: schemas.GetMaterialsSchema,
  get_material_by_part_number: schemas.GetMaterialByPartNumberSchema,
  get_bin_locations: schemas.GetBinLocationsSchema,
  get_job_materials: schemas.QueryParamsSchema,
  get_job_material_by_id: schemas.GetJobMaterialByIdSchema,
  get_job_requirements: schemas.QueryParamsSchema,
  get_job_requirement_by_id: schemas.GetJobRequirementByIdSchema,
  get_packing_list_line_items: schemas.QueryParamsSchema,
  get_packing_lists: schemas.QueryParamsSchema,
  get_product_codes: schemas.QueryParamsSchema,
  get_product_code: schemas.GetProductCodeSchema,
  get_purchase_order_line_items: schemas.QueryParamsSchema,
  get_purchase_order_line_item: schemas.GetPurchaseOrderLineItemSchema,
  get_purchase_order_releases: schemas.QueryParamsSchema,
  get_purchase_orders: schemas.QueryParamsSchema,
  get_purchase_order_by_number: schemas.GetPurchaseOrderByNumberSchema,
  get_vendors: schemas.QueryParamsSchema,
  get_vendor_by_code: schemas.GetVendorByCodeSchema,

  // Employees
  get_employees: schemas.GetEmployeesSchema,
  get_employee_by_id: schemas.GetEmployeeByIdSchema,
  get_attendance_tickets: schemas.GetAttendanceTicketsSchema,
  get_attendance_ticket_by_id: schemas.GetAttendanceTicketByIdSchema,
  create_attendance_ticket: schemas.CreateAttendanceTicketSchema,
  get_attendance_ticket_details: schemas.GetAttendanceTicketDetailsSchema,
  create_attendance_ticket_detail: schemas.CreateAttendanceTicketDetailSchema,
  update_attendance_ticket_detail: schemas.UpdateAttendanceTicketDetailSchema,
  get_attendance_report: schemas.GetAttendanceReportSchema,
  get_salespersons: schemas.QueryParamsSchema,
  get_time_ticket_details: schemas.QueryParamsSchema,
  get_time_ticket_detail_by_id: schemas.GetTimeTicketDetailByIdSchema,
  get_time_tickets: schemas.QueryParamsSchema,
  get_time_ticket_by_id: schemas.GetTimeTicketByIdSchema,

  // Production
  get_estimates: schemas.GetEstimatesSchema,
  get_estimate_by_part_number: schemas.GetEstimateByPartNumberSchema,
  create_estimate: schemas.CreateEstimateSchema,
  update_estimate: schemas.UpdateEstimateSchema,
  get_routings: schemas.QueryParamsSchema,
  get_routing_by_part_number: schemas.GetRoutingByPartSchema,
  get_work_centers: schemas.QueryParamsSchema,
  get_work_center_by_code: schemas.GetWorkCenterByCodeSchema,

  // General
  custom_api_call: schemas.CustomApiCallSchema,
  run_report: schemas.RunReportSchema,
  get_report_status: schemas.GetReportStatusSchema,
  get_document_controls: schemas.QueryParamsSchema,
  get_document_histories: schemas.QueryParamsSchema,
  get_document_reviews: schemas.QueryParamsSchema,
};

const allTools = [
  ...orderTools,
  ...customerTools,
  ...quoteTools,
  ...inventoryTools,
  ...productionTools,
  ...employeeTools,
  ...generalTools,
];

const allHandlers = {
  ...orderHandlers,
  ...customerHandlers,
  ...quoteHandlers,
  ...inventoryHandlers,
  ...productionHandlers,
  ...employeeHandlers,
  ...generalHandlers,
};

export function registerTools(server: FastMCP, client: JobBOSS2Client) {
  // Register manual tools
  for (const tool of allTools) {
    const handler = allHandlers[tool.name];
    const schema = toolSchemaMap[tool.name] || schemas.AnyObjectSchema;

    server.addTool({
      name: tool.name,
      description: tool.description || "",
      parameters: schema,
      execute: async (args) => {
        try {
          const result = await handler(args, client);
          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: "text", text: `Error: ${error.message || String(error)}` }],
            isError: true,
          };
        }
      },
    });
  }

  // Register generated tools
  for (const config of generatedToolConfigs) {
    server.addTool({
      name: config.name,
      description: config.description,
      parameters: config.schema,
      execute: async (args) => {
        try {
          const result = await config.handler(args, client);
          
          if (config.successMessage) {
            return {
              content: [{ type: "text", text: config.successMessage(args) }],
            };
          }

          return {
            content: [{ type: "text", text: JSON.stringify(result) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: "text", text: `Error: ${error.message || String(error)}` }],
            isError: true,
          };
        }
      },
    });
  }
}
