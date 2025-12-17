from typing import Any, Dict, List, Optional, Union
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_customer_tools(mcp: FastMCP, client: JobBOSS2Client):
    @mcp.tool()
    async def get_customers(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of customers from JobBOSS2. Supports filtering, sorting, pagination, and field selection."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.get_customers(params)

    @mcp.tool()
    async def get_customer_by_code(customerCode: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific customer by their customer code."""
        params = {"fields": fields} if fields else None
        return await client.get_customer_by_code(customerCode, params)

    @mcp.tool()
    async def create_customer(
        customerCode: str,
        customerName: str,
        phone: str = None,
        billingAddress1: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Create a new customer in JobBOSS2."""
        payload: Dict[str, Any] = {
            "customerCode": customerCode,
            "customerName": customerName,
            "phone": phone,
            "billingAddress1": billingAddress1,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("POST", "customers", data=payload)

    @mcp.tool()
    async def update_customer(
        customerCode: str,
        customerName: str = None,
        phone: str = None,
        billingAddress1: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Update an existing customer in JobBOSS2."""
        payload: Dict[str, Any] = {
            "customerName": customerName,
            "phone": phone,
            "billingAddress1": billingAddress1,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("PATCH", f"customers/{customerCode}", data=payload)

