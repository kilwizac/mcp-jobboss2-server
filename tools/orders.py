from typing import Any, Dict, List, Optional, Union
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_order_tools(mcp: FastMCP, client: JobBOSS2Client):
    @mcp.tool()
    async def get_orders(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve a list of orders from JobBOSS2.
        Example filters: customerCode=ACME, status[in]=Open|InProgress, orderTotal[gte]=1000
        """
        params = {
            "fields": fields,
            "sort": sort,
            "skip": skip,
            "take": take,
        }
        if filters:
            params.update(filters)
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}
        return await client.get_orders(params)

    @mcp.tool()
    async def get_order_by_id(orderNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific order by its order number."""
        params = {"fields": fields} if fields else None
        return await client.get_order_by_id(orderNumber, params)

    @mcp.tool()
    async def create_order(
        customerCode: str,
        orderNumber: str = None,
        PONumber: str = None,
        status: str = None,
        dueDate: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Create a new order in JobBOSS2."""
        payload: Dict[str, Any] = {
            "customerCode": customerCode,
            "orderNumber": orderNumber,
            "PONumber": PONumber,
            "status": status,
            "dueDate": dueDate,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("POST", "orders", data=payload)

    @mcp.tool()
    async def update_order(
        orderNumber: str,
        customerCode: str = None,
        PONumber: str = None,
        status: str = None,
        dueDate: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Update an existing order in JobBOSS2."""
        payload: Dict[str, Any] = {
            "customerCode": customerCode,
            "PONumber": PONumber,
            "status": status,
            "dueDate": dueDate,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("PATCH", f"orders/{orderNumber}", data=payload)

    @mcp.tool()
    async def get_order_line_items(orderNumber: str, fields: str = None) -> List[Dict[str, Any]]:
        """Retrieve line items for a specific order."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"orders/{orderNumber}/order-line-items", params=params)

    @mcp.tool()
    async def get_order_line_item_by_id(orderNumber: str, itemNumber: int, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific order line item."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"orders/{orderNumber}/order-line-items/{itemNumber}", params=params)

    @mcp.tool()
    async def create_order_line_item(
        orderNumber: str,
        partNumber: str = None,
        description: str = None,
        quantity: float = None,
        price: float = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Create a new line item for an order."""
        payload: Dict[str, Any] = {
            "partNumber": partNumber,
            "description": description,
            "quantity": quantity,
            "price": price,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("POST", f"orders/{orderNumber}/order-line-items", data=payload)

    @mcp.tool()
    async def update_order_line_item(
        orderNumber: str,
        itemNumber: int,
        partNumber: str = None,
        description: str = None,
        quantity: float = None,
        price: float = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Update an existing order line item."""
        payload: Dict[str, Any] = {
            "partNumber": partNumber,
            "description": description,
            "quantity": quantity,
            "price": price,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("PATCH", f"orders/{orderNumber}/order-line-items/{itemNumber}", data=payload)

