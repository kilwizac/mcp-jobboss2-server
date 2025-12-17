from typing import Any, Dict, List, Optional, Union
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_production_tools(mcp: FastMCP, client: JobBOSS2Client):
    @mcp.tool()
    async def get_estimates(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of estimates (part master records) from JobBOSS2."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "estimates", params=params)

    @mcp.tool()
    async def get_estimate_by_part_number(partNumber: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific estimate (part master record) by its part number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"estimates/{partNumber}", params=params)

    @mcp.tool()
    async def create_estimate(partNumber: str, data: Dict[str, Any] | None = None) -> Dict[str, Any]:
        """Create a new estimate (part master record) in JobBOSS2."""
        payload: Dict[str, Any] = {"partNumber": partNumber}
        if data:
            payload.update(data)
        return await client.api_call("POST", "estimates", data=payload)

    @mcp.tool()
    async def update_estimate(partNumber: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing estimate (part master record) in JobBOSS2."""
        await client.api_call("PUT", f"estimates/{partNumber}", data=data)
        return {"success": True}

    @mcp.tool()
    async def get_routings(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve routings (work center steps) independent of orders."""
        return await client.api_call("GET", "routings", params=params)

    @mcp.tool()
    async def get_routing_by_part_number(partNumber: str, stepNumber: Union[str, int], fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific routing tied to an estimate part number and step number."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"estimates/{partNumber}/routings/{stepNumber}", params=params)

    @mcp.tool()
    async def get_work_centers(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve work center definitions."""
        return await client.api_call("GET", "work-centers", params=params)

    @mcp.tool()
    async def get_work_center_by_code(workCenter: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific work center by its code."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"work-centers/{workCenter}", params=params)

