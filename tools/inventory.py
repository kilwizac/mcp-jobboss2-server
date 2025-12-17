from typing import Any, Dict, List, Optional, Union
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_inventory_tools(mcp: FastMCP, client: JobBOSS2Client):
    @mcp.tool()
    async def get_materials(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of materials from JobBOSS2. Supports filtering, sorting, pagination, and field selection."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "materials", params=params)

    @mcp.tool()
    async def get_material_by_part_number(partNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific material by its part number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"materials/{partNumber}", params=params)

    @mcp.tool()
    async def get_bin_locations(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of bin locations from JobBOSS2."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "bin-locations", params=params)

    @mcp.tool()
    async def get_job_materials(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve job material postings (issues/receipts) with bin locations, costs, and related job/order information."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "job-materials", params=params)

    @mcp.tool()
    async def get_job_material_by_id(uniqueID: Union[str, int], fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific job material record by its unique ID."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"job-materials/{uniqueID}", params=params)

    @mcp.tool()
    async def get_job_requirements(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve job requirement/purchase suggestions including vendor codes, lead times, and required quantities."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "job-requirements", params=params)

    @mcp.tool()
    async def get_job_requirement_by_id(uniqueID: Union[str, int], fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific job requirement by unique ID."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"job-requirements/{uniqueID}", params=params)

    @mcp.tool()
    async def get_packing_list_line_items(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve packing list line items showing what was shipped, quantities, and job references."""
        return await client.api_call("GET", "packing-list-line-items", params=params)

    @mcp.tool()
    async def get_packing_lists(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve packing list headers including ship-to, freight, and container information."""
        return await client.api_call("GET", "packing-lists", params=params)

    @mcp.tool()
    async def get_product_codes(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve product codes with related GL accounts and cash discount settings."""
        return await client.api_call("GET", "product-codes", params=params)

    @mcp.tool()
    async def get_product_code(productCode: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific product code by its identifier."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"product-codes/{productCode}", params=params)

    @mcp.tool()
    async def get_purchase_order_line_items(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve purchase order line items with quantities, costs, and routing information."""
        return await client.api_call("GET", "purchase-order-line-items", params=params)

    @mcp.tool()
    async def get_purchase_order_line_item(
        purchaseOrderNumber: str,
        partNumber: str,
        itemNumber: Union[str, int],
        fields: str = None
    ) -> Dict[str, Any]:
        """Retrieve a specific purchase order line item by PO number, part number, and line item number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"purchase-order-line-items/{purchaseOrderNumber}/{partNumber}/{itemNumber}", params=params)

    @mcp.tool()
    async def get_purchase_order_releases(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve purchase order release schedules showing quantities and due dates."""
        return await client.api_call("GET", "purchase-order-releases", params=params)

    @mcp.tool()
    async def get_purchase_orders(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve purchase order headers including vendor, ship-to, and totals."""
        return await client.api_call("GET", "purchase-orders", params=params)

    @mcp.tool()
    async def get_purchase_order_by_number(poNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific purchase order by PO number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"purchase-orders/{poNumber}", params=params)

    @mcp.tool()
    async def get_vendors(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve vendor master records including payment terms and lead times."""
        return await client.api_call("GET", "vendors", params=params)

    @mcp.tool()
    async def get_vendor_by_code(vendorCode: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific vendor by vendor code."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"vendors/{vendorCode}", params=params)

