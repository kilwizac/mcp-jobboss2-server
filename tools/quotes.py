from typing import Any, Dict, List, Optional, Union
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_quote_tools(mcp: FastMCP, client: JobBOSS2Client):
    @mcp.tool()
    async def get_quotes(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of quotes from JobBOSS2. Supports filtering, sorting, pagination, and field selection."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "quotes", params=params)

    @mcp.tool()
    async def get_quote_by_id(quoteNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific quote by its quote number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"quotes/{quoteNumber}", params=params)

    @mcp.tool()
    async def create_quote(
        customerCode: str,
        quoteNumber: str = None,
        expirationDate: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Create a new quote in JobBOSS2."""
        payload: Dict[str, Any] = {
            "customerCode": customerCode,
            "quoteNumber": quoteNumber,
            "expirationDate": expirationDate,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("POST", "quotes", data=payload)

    @mcp.tool()
    async def update_quote(
        quoteNumber: str,
        customerCode: str = None,
        status: str = None,
        expirationDate: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Update an existing quote in JobBOSS2."""
        payload: Dict[str, Any] = {
            "customerCode": customerCode,
            "status": status,
            "expirationDate": expirationDate,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("PATCH", f"quotes/{quoteNumber}", data=payload)

    @mcp.tool()
    async def get_quote_line_items(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve quote line items across all quotes. Filter by quoteNumber, partNumber, status, etc."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "quote-line-items", params=params)

    @mcp.tool()
    async def get_quote_line_item_by_id(quoteNumber: str, itemNumber: Union[str, int], fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific quote line item using quote number and line item number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"quotes/{quoteNumber}/quote-line-item/{itemNumber}", params=params)

    @mcp.tool()
    async def create_quote_line_item(
        quoteNumber: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new quote line item. Provide any JobBOSS2 quote line item fields."""
        return await client.api_call("POST", f"quotes/{quoteNumber}/quote-line-items", data=data)

    @mcp.tool()
    async def update_quote_line_item(
        quoteNumber: str, itemNumber: Union[str, int], data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing quote line item by quote number and item number."""
        return await client.api_call(
            "PATCH", f"quotes/{quoteNumber}/quote-line-items/{itemNumber}", data=data
        )

