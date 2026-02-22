import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
import {
  READ_ONLY_MODE_ENV_VAR,
  isMutationToolName,
  isMutatingHttpMethod,
  isReadOnlyModeEnabled,
} from "./mutationPolicy.js";

export const toolSchemaMap: Record<string, any> = {
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
  get_order_releases: schemas.GetOrderReleasesSchema,
  create_order_release: schemas.CreateOrderReleaseSchema,
  get_order_release_by_id: schemas.GetOrderReleaseByIdSchema,
  get_order_bundle: schemas.GetOrderBundleSchema,
  create_order_from_quote: schemas.CreateOrderFromQuoteSchema,

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
  get_po_bundle: schemas.GetPOBundleSchema,

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
  get_estimate_material_by_sub_part: schemas.GetEstimateMaterialBySubPartSchema,

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

export const allHandlers = {
  ...orderHandlers,
  ...customerHandlers,
  ...quoteHandlers,
  ...inventoryHandlers,
  ...productionHandlers,
  ...employeeHandlers,
  ...generalHandlers,
};

export const MAX_RESPONSE_CHARS = 800_000;

export function registerTools(server: McpServer, client: JobBOSS2Client) {
  const registeredToolNames = new Set<string>();
  const readOnlyModeEnabled = isReadOnlyModeEnabled(process.env);
  const formatResultText = (result: unknown): string => {
    if (typeof result === "string") {
      return result.length > MAX_RESPONSE_CHARS
        ? result.slice(0, MAX_RESPONSE_CHARS) + `\n...[truncated – response exceeded ${MAX_RESPONSE_CHARS} characters. Use 'fields', 'take', or filters to narrow results.]`
        : result;
    }
    if (result === undefined) {
      return "null";
    }
    const json = JSON.stringify(result);
    if (json.length > MAX_RESPONSE_CHARS) {
      if (Array.isArray(result) && result.length > 1) {
        const totalCount = result.length;
        const avgItemSize = json.length / totalCount;
        const estimatedFit = Math.max(1, Math.floor(MAX_RESPONSE_CHARS / avgItemSize));
        const items = result.slice(0, estimatedFit);
        const serialized = JSON.stringify(items);
        return serialized + `\n...[${items.length} of ${totalCount} records shown. Use 'take', 'skip', 'fields', or filters to narrow results.]`;
      }
      return json.slice(0, MAX_RESPONSE_CHARS) + `\n...[truncated – response exceeded ${MAX_RESPONSE_CHARS} characters. Use 'fields' or filters to narrow results.]`;
    }
    return json;
  };
  const getReadOnlyBlockReason = (toolName: string, args: unknown): string | null => {
    if (!readOnlyModeEnabled) {
      return null;
    }

    if (toolName === "custom_api_call") {
      const method = typeof args === "object" && args && "method" in args
        ? String((args as Record<string, unknown>).method ?? "")
        : "";

      if (isMutatingHttpMethod(method)) {
        return `Write operations are disabled by ${READ_ONLY_MODE_ENV_VAR} (blocked method: ${method.toUpperCase()})`;
      }

      return null;
    }

    if (isMutationToolName(toolName)) {
      return `Write operations are disabled by ${READ_ONLY_MODE_ENV_VAR} (blocked tool: ${toolName})`;
    }

    return null;
  };

  const registerTool = (
    name: string,
    description: string,
    schema: any,
    handler: (args: any) => Promise<any>,
    successMessage?: (args: any) => string
  ) => {
    if (registeredToolNames.has(name)) {
      throw new Error(`Duplicate tool registration detected: ${name}`);
    }
    registeredToolNames.add(name);

    server.registerTool(
      name,
      {
        description,
        inputSchema: schema,
      },
      async (args: any) => {
        const readOnlyBlockReason = getReadOnlyBlockReason(name, args);
        if (readOnlyBlockReason) {
          return {
            content: [{ type: "text" as const, text: `Error: ${readOnlyBlockReason}` }],
            isError: true,
          };
        }

        try {
          const result = await handler(args);
          const text = successMessage ? successMessage(args) : formatResultText(result);
          return {
            content: [{ type: "text" as const, text }],
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : undefined;
          console.error("[mcp-jobboss2] tool execution failed", {
            tool: name,
            args,
            message,
            stack,
          });
          return {
            content: [{ type: "text" as const, text: `Error: ${message}` }],
            isError: true,
          };
        }
      }
    );
  };

  // Register manual tools
  for (const tool of allTools) {
    const handler = allHandlers[tool.name];
    const schema = toolSchemaMap[tool.name];
    if (typeof handler !== "function") {
      throw new Error(`Missing handler mapping for manual tool: ${tool.name}`);
    }
    if (!schema) {
      throw new Error(`Missing schema mapping for manual tool: ${tool.name}`);
    }

    registerTool(tool.name, tool.description || "", schema, (args) => handler(args, client));
  }

  // Register generated tools
  for (const config of generatedToolConfigs) {
    registerTool(
      config.name,
      config.description,
      config.schema,
      (args) => config.handler(args, client),
      config.successMessage
    );
  }
}
