"""
Legacy local runner.

For FastMCP Cloud deployments, use `jobboss2_client.py` (configured entrypoint).
For local development, you can run:
  - `fastmcp run jobboss2_server.py`
  - or `python server.py`
"""

from jobboss2_server import mcp

if __name__ == "__main__":
    mcp.run()

