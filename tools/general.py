from typing import Any, Dict, List, Optional, Union
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_general_tools(mcp: FastMCP, client: JobBOSS2Client):
    @mcp.tool()
    async def custom_api_call(
        method: str,
        endpoint: str,
        data: Any = None,
        params: Dict[str, Any] = None
    ) -> Any:
        """Make a custom API call to any JobBOSS2 API endpoint."""
        return await client.api_call(method, endpoint, data, params)

    @mcp.tool()
    async def run_report(body: Dict[str, Any]) -> Dict[str, Any]:
        """Submit a JobBOSS2 report request."""
        return await client.api_call("POST", "reports", data=body)

    @mcp.tool()
    async def get_report_status(requestId: str) -> Dict[str, Any]:
        """Fetch the status/result of a previously submitted report."""
        return await client.api_call("GET", f"reports/{requestId}")

    @mcp.tool()
    async def get_document_controls(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve document control headers."""
        return await client.api_call("GET", "document-controls", params=params)

    @mcp.tool()
    async def get_document_histories(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve document history entries."""
        return await client.api_call("GET", "document-histories", params=params)

    @mcp.tool()
    async def get_document_reviews(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve document review assignments."""
        return await client.api_call("GET", "document-review", params=params)

