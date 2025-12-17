from typing import Any, Dict, List, Optional, Union, Callable
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_generated_tools(mcp: FastMCP, client: JobBOSS2Client):
    configs = [
        {"name": "get_ar_invoice_details", "description": "Retrieve AR invoice detail rows.", "path": "ar-invoice-details"},
        {"name": "get_ar_invoices", "description": "Retrieve AR invoices.", "path": "ar-invoices"},
        {"name": "get_company_calendars", "description": "Retrieve company calendar definitions.", "path": "company-calendars"},
        {"name": "get_corrective_preventive_actions", "description": "Retrieve corrective and preventive action records.", "path": "corrective-preventive-actions"},
        {"name": "get_currency_codes", "description": "Retrieve supported currency codes.", "path": "currency-codes"},
        {"name": "get_customer_returns", "description": "Retrieve customer return headers.", "path": "customer-returns"},
        {"name": "get_customer_return_releases", "description": "Retrieve customer return releases.", "path": "customer-return-releases"},
        {"name": "get_customer_return_line_items", "description": "Retrieve customer return line items.", "path": "customer-return-line-items"},
        {"name": "get_departments", "description": "Retrieve department master records.", "path": "departments"},
        {"name": "get_employee_trainings", "description": "Retrieve employee training records.", "path": "employee-trainings"},
        {"name": "get_feedback", "description": "Retrieve feedback records.", "path": "feedback"},
        {"name": "get_gl_codes", "description": "Retrieve GL codes.", "path": "gl-codes"},
        {"name": "get_non_conformances", "description": "Retrieve non-conformance records.", "path": "non-conformances"},
        {"name": "get_operation_codes", "description": "Retrieve operation codes.", "path": "operation-codes"},
        {"name": "get_all_order_line_items", "description": "Retrieve order line items across all orders.", "path": "order-line-items"},
        {"name": "get_reason_codes", "description": "Retrieve reason codes.", "path": "reason-codes"},
        {"name": "get_releases", "description": "Retrieve release schedules across orders.", "path": "releases"},
        {"name": "get_shipping_addresses", "description": "Retrieve shipping addresses for customers.", "path": "shipping-addresses"},
        {"name": "get_tax_codes", "description": "Retrieve tax codes.", "path": "tax-codes"},
        {"name": "get_terms", "description": "Retrieve payment terms codes.", "path": "terms"},
        {"name": "get_tooling_maintenance", "description": "Retrieve tooling maintenance records.", "path": "tooling-maintenance"},
        {"name": "get_user_labels", "description": "Retrieve user labels.", "path": "user-labels"},
        {"name": "get_user_transactions", "description": "Retrieve user transactions.", "path": "user-transactions"},
        {"name": "get_vendor_returns", "description": "Retrieve vendor return headers.", "path": "vendor-returns"},
        {"name": "get_vendor_return_line_items", "description": "Retrieve vendor return line items.", "path": "vendor-returns-line-items"},
        {"name": "get_vendor_return_releases", "description": "Retrieve vendor return releases.", "path": "vendor-returns-releases"},
        {"name": "get_work_center_maintenance", "description": "Retrieve work center maintenance records.", "path": "work-center-maintenance"},
        {"name": "shopview_get_filters", "description": "Retrieve ShopView filter definitions.", "path": "shopview/filters"},
        {"name": "shopview_get_jobs", "description": "Retrieve ShopView job data for dashboards.", "path": "shopview/get-jobs"},
        {"name": "shopview_get_grid_options", "description": "Retrieve saved ShopView grid options.", "path": "shopview/grid-options"},
        {"name": "shopview_kpi_jobs_closed", "description": "Retrieve ShopView KPI data for jobs closed.", "path": "shopview/kpi/jobs-closed"},
        {"name": "shopview_kpi_jobs_in_progress", "description": "Retrieve ShopView KPI data for jobs in progress.", "path": "shopview/kpi/jobs-in-progress"},
        {"name": "shopview_kpi_jobs_on_hold", "description": "Retrieve ShopView KPI data for jobs on hold.", "path": "shopview/kpi/jobs-on-hold"},
        {"name": "shopview_kpi_jobs_past_due", "description": "Retrieve ShopView KPI data for jobs past due.", "path": "shopview/kpi/jobs-past-due"},
        {"name": "shopview_kpi_definitions", "description": "Retrieve KPI definitions for ShopView dashboards.", "path": "shopview/kpi-definitions"},
    ]

    for cfg in configs:
        def make_tool(name: str, description: str, path: str):
            @mcp.tool(name=name)
            async def list_tool(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
                return await client.api_call("GET", path, params=params)

            list_tool.__doc__ = description
            return list_tool

        make_tool(cfg["name"], cfg["description"], cfg["path"])

    # More specific tools from generated.ts
    @mcp.tool()
    async def get_corrective_preventive_action_by_number(correctiveActionNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific corrective/preventive action by its number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"corrective-preventive-actions/{correctiveActionNumber}", params=params)

    @mcp.tool()
    async def get_gl_code_by_account(GLAccountNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a GL code by account number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"gl-codes/{GLAccountNumber}", params=params)

    @mcp.tool()
    async def get_non_conformance_by_number(ncNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific non-conformance by number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"non-conformances/{ncNumber}", params=params)

    @mcp.tool()
    async def get_operation_code_by_code(operationCode: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve an operation code by its identifier."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"operation-codes/{operationCode}", params=params)

    @mcp.tool()
    async def get_reason_code_by_id(uniqueID: Union[str, int], fields: str = None) -> Dict[str, Any]:
        """Retrieve a reason code by unique ID."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"reason-codes/{uniqueID}", params=params)

    @mcp.tool()
    async def get_tax_code_by_code(taxCode: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a tax code by identifier."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"tax-codes/{taxCode}", params=params)

    @mcp.tool()
    async def get_terms_by_code(termsCode: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a terms record by code."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"terms/{termsCode}", params=params)

    @mcp.tool()
    async def get_company() -> Dict[str, Any]:
        """Retrieve the company profile record."""
        return await client.api_call("GET", "company")

    @mcp.tool()
    async def get_contacts(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve contacts tied to customers, vendors, or prospects."""
        return await client.api_call("GET", "contacts", params=params)

    @mcp.tool()
    async def create_contact(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new contact record."""
        return await client.api_call("POST", "contacts", data=data)

    @mcp.tool()
    async def create_shipping_address(
        customerCode: str, location: str, data: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        """Create a shipping address for a customer."""
        payload: Dict[str, Any] = {"customerCode": customerCode, "location": location}
        if data:
            payload.update(data)
        return await client.api_call("POST", "shipping-addresses", data=payload)

    @mcp.tool()
    async def get_shipping_address_by_id(customerCode: str, location: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a shipping address by customer code and location."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"shipping-addresses/{customerCode}/{location}", params=params)

    @mcp.tool()
    async def update_shipping_address(customerCode: str, location: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a shipping address specified by customer code and location."""
        return await client.api_call("PATCH", f"shipping-addresses/{customerCode}/{location}", data=data)

    @mcp.tool()
    async def get_contact_by_id(object: str, contactCode: str, contact: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a contact using its object, contact code, and contact ID."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"contacts/{object}/{contactCode}/{contact}", params=params)

    @mcp.tool()
    async def create_vendor(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a vendor record."""
        return await client.api_call("POST", "vendors", data=data)

    @mcp.tool()
    async def update_vendor(vendorCode: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a vendor by vendor code."""
        return await client.api_call("PATCH", f"vendors/{vendorCode}", data=data)

    @mcp.tool()
    async def create_work_center(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a work center definition."""
        return await client.api_call("POST", "work-centers", data=data)

    @mcp.tool()
    async def update_work_center(workCenter: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a work center by code."""
        return await client.api_call("PATCH", f"work-centers/{workCenter}", data=data)

    @mcp.tool()
    async def update_employee(employeeCode: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an employee record in JobBOSS2."""
        return await client.api_call("PATCH", f"employees/{employeeCode}", data=data)

    @mcp.tool()
    async def update_salesperson(salesID: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a salesperson record."""
        return await client.api_call("PATCH", f"salespersons/{salesID}", data=data)

    @mcp.tool()
    async def update_purchase_order(poNumber: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Patch an existing purchase order by PO number."""
        return await client.api_call("PATCH", f"purchase-orders/{poNumber}", data=data)

    @mcp.tool()
    async def update_purchase_order_line_item(
        purchaseOrderNumber: str, partNumber: str, itemNumber: Union[str, int], data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Patch a purchase order line item."""
        return await client.api_call(
            "PATCH", f"purchase-order-line-items/{purchaseOrderNumber}/{partNumber}/{itemNumber}", data=data
        )

    @mcp.tool()
    async def create_time_ticket(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a time ticket header."""
        return await client.api_call("POST", "time-tickets", data=data)

    @mcp.tool()
    async def update_time_ticket(ticketDate: str, employeeCode: Union[str, int], data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a time ticket."""
        return await client.api_call("PATCH", f"time-tickets/{ticketDate}/employees/{employeeCode}", data=data)

    @mcp.tool()
    async def create_time_ticket_detail(data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a time ticket detail entry."""
        return await client.api_call("POST", "time-ticket-details", data=data)

    @mcp.tool()
    async def update_time_ticket_detail(timeTicketGUID: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a time ticket detail entry by GUID."""
        return await client.api_call("PATCH", f"time-ticket-details/{timeTicketGUID}", data=data)

    @mcp.tool()
    async def eci_aps_authenticate_user(data: Dict[str, Any]) -> Dict[str, Any]:
        """Authenticate against the ECI APS endpoints."""
        return await client.api_call("POST", "eci-aps/authenticate-user", data=data)

    @mcp.tool()
    async def eci_aps_get_schedule(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve the APS schedule feed."""
        return await client.api_call("GET", "eci-aps/get-schedule", params=params)

    @mcp.tool()
    async def shopview_authenticate_user(data: Dict[str, Any]) -> Dict[str, Any]:
        """Authenticate a ShopView user."""
        return await client.api_call("POST", "shopview/authenticate-user", data=data)

    @mcp.tool()
    async def shopview_set_grid_option(data: Dict[str, Any]) -> Dict[str, Any]:
        """Persist ShopView grid option preferences."""
        return await client.api_call("POST", "shopview/grid-option", data=data)

    @mcp.tool()
    async def shopview_reset_grid_options(data: Dict[str, Any] | None = None) -> Dict[str, Any]:
        """Reset ShopView grid options to defaults."""
        return await client.api_call("POST", "shopview/reset-grid-options", data=data or {})

    @mcp.tool()
    async def update_contact(object: str, contactCode: str, contact: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a contact record."""
        return await client.api_call("PATCH", f"contacts/{object}/{contactCode}/{contact}", data=data)

