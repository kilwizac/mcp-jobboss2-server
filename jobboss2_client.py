"""
Compatibility entrypoint for FastMCP Cloud.

FastMCP Cloud is currently configured to use `jobboss2_client.py` as the entrypoint.
This module therefore exposes a top-level `mcp` server instance for FastMCP CLI
inspection/loading, while still re-exporting the JobBOSS2 API client types.
"""

from jobboss2_api_client import JobBOSS2Client, JobBOSS2Config
from jobboss2_server import create_server, mcp

__all__ = ["JobBOSS2Client", "JobBOSS2Config", "create_server", "mcp"]

