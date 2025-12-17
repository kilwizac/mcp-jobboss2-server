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

    @mcp.tool()
    async def get_order_releases(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of order releases with optional filtering, sorting, and pagination."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "releases", params=params)

    @mcp.tool()
    async def create_order_release(
        orderNumber: str,
        itemNumber: Union[str, int],
        dueDate: str = None,
        jobNumber: str = None,
        priority: int = None,
        quantityOrdered: float = None,
        status: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Create a release for a specific order line item. Releases define delivery schedules with due dates and quantities."""
        payload: Dict[str, Any] = {
            "dueDate": dueDate,
            "jobNumber": jobNumber,
            "priority": priority,
            "quantityOrdered": quantityOrdered,
            "status": status,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call("POST", f"orders/{orderNumber}/order-line-items/{itemNumber}/releases", data=payload)

    @mcp.tool()
    async def get_order_release_by_id(
        orderNumber: str,
        itemNumber: Union[str, int],
        uniqueID: Union[str, int],
        fields: str = None
    ) -> Dict[str, Any]:
        """Retrieve a specific release for an order line item by unique ID."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"orders/{orderNumber}/order-line-items/{itemNumber}/releases/{uniqueID}", params=params)

    @mcp.tool()
    async def get_order_bundle(
        orderNumber: str,
        fields: str = None,
        lineItemFields: str = None,
        routingFields: str = None,
        includeRoutings: bool = True,
    ) -> Dict[str, Any]:
        """Retrieve an order with its line items and optionally routings in a single call. Returns a complete bundle for the order."""
        # Fetch order header
        order_params = {"fields": fields} if fields else None
        order = await client.api_call("GET", f"orders/{orderNumber}", params=order_params)
        
        # Fetch line items
        li_params = {"fields": lineItemFields} if lineItemFields else None
        line_items = await client.api_call("GET", f"orders/{orderNumber}/order-line-items", params=li_params)
        
        # Optionally fetch routings
        routings = []
        if includeRoutings:
            routing_params: Dict[str, Any] = {"orderNumber": orderNumber}
            if routingFields:
                routing_params["fields"] = routingFields
            routings = await client.api_call("GET", "order-routings", params=routing_params)
        
        return {
            "order": order,
            "lineItems": line_items,
            "routings": routings if includeRoutings else None,
        }

    @mcp.tool()
    async def create_order_from_quote(
        quoteNumber: str,
        customerCode: str = None,
        orderNumber: str = None,
        copyAllLineItems: bool = True,
        lineItemNumbers: List[int] = None,
        overrides: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Create a new order from an existing quote, copying customer info and line items. Streamlines quote-to-order conversion."""
        # Fetch the quote
        quote = await client.api_call("GET", f"quotes/{quoteNumber}")
        
        # Fetch quote line items
        all_quote_line_items = await client.api_call("GET", "quote-line-items", params={"quoteNumber": quoteNumber})
        
        # Filter line items if specific ones requested
        line_items_to_copy = all_quote_line_items
        if not copyAllLineItems and lineItemNumbers:
            line_items_to_copy = [item for item in all_quote_line_items if item.get("itemNumber") in lineItemNumbers]
        
        # Build order payload
        order_payload: Dict[str, Any] = {
            "customerCode": customerCode or quote.get("customerCode"),
            "quoteNumber": quoteNumber,
        }
        if orderNumber:
            order_payload["orderNumber"] = orderNumber
        if overrides:
            order_payload.update(overrides)
        
        # Map quote line items to order line items
        # QuoteLineItem uses price breaks (price1-8, quantity1-8, unit1-8) - use first break as default
        if line_items_to_copy:
            order_payload["orderLineItems"] = [
                {
                    "partNumber": qli.get("partNumber"),
                    "partDescription": qli.get("description"),
                    "quantityOrdered": qli.get("quantity1"),
                    "unitPrice": qli.get("price1"),
                    "quoteNumber": quoteNumber,
                    "quoteItemNumber": qli.get("itemNumber"),
                    "pricingUnit": qli.get("unit1"),
                    "revision": qli.get("revision"),
                }
                for qli in line_items_to_copy
            ]
        
        # Create the order
        new_order = await client.api_call("POST", "orders", data=order_payload)
        
        return {
            "success": True,
            "order": new_order,
            "lineItemsCopied": len(line_items_to_copy) if line_items_to_copy else 0,
            "sourceQuote": quoteNumber,
        }

