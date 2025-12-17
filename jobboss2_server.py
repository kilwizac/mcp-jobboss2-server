import os
from typing import Any

from dotenv import load_dotenv
from fastmcp import FastMCP

from jobboss2_api_client import JobBOSS2Client, JobBOSS2Config

# Import registration functions
from tools.orders import register_order_tools
from tools.customers import register_customer_tools
from tools.quotes import register_quote_tools
from tools.inventory import register_inventory_tools
from tools.employees import register_employee_tools
from tools.production import register_production_tools
from tools.general import register_general_tools
from tools.generated import register_generated_tools


def _config_from_env() -> JobBOSS2Config:
    api_url = os.getenv("JOBBOSS2_API_URL")
    api_key = os.getenv("JOBBOSS2_API_KEY")
    api_secret = os.getenv("JOBBOSS2_API_SECRET")
    token_url = os.getenv("JOBBOSS2_OAUTH_TOKEN_URL")
    timeout = int(os.getenv("API_TIMEOUT", "30"))

    missing = [
        name
        for name, value in [
            ("JOBBOSS2_API_URL", api_url),
            ("JOBBOSS2_API_KEY", api_key),
            ("JOBBOSS2_API_SECRET", api_secret),
            ("JOBBOSS2_OAUTH_TOKEN_URL", token_url),
        ]
        if not value
    ]
    if missing:
        raise RuntimeError(
            "Missing required environment variables for JobBOSS2 API access: "
            + ", ".join(missing)
            + ". Set these in your deployment environment variables (or a local .env file)."
        )

    return JobBOSS2Config(
        api_url=api_url,  # type: ignore[arg-type]
        api_key=api_key,  # type: ignore[arg-type]
        api_secret=api_secret,  # type: ignore[arg-type]
        token_url=token_url,  # type: ignore[arg-type]
        timeout=timeout,
    )


class LazyJobBOSS2Client:
    """
    Lazy wrapper around JobBOSS2Client.

    This allows the MCP server to start even if required environment variables
    are not set yet. Configuration is validated and the real client is created
    only when a tool is actually invoked.
    """

    def __init__(self):
        self._client: JobBOSS2Client | None = None

    def _ensure_client(self) -> JobBOSS2Client:
        if self._client is None:
            self._client = JobBOSS2Client(_config_from_env())
        return self._client

    def __getattr__(self, name: str) -> Any:
        # Called only when attribute isn't found on this wrapper.
        return getattr(self._ensure_client(), name)


def create_server() -> FastMCP:
    # Load environment variables from a local .env file if present.
    load_dotenv()

    mcp = FastMCP("JobBOSS2", version="3.0.0")
    client = LazyJobBOSS2Client()

    # Register all tools
    register_order_tools(mcp, client)  # type: ignore[arg-type]
    register_customer_tools(mcp, client)  # type: ignore[arg-type]
    register_quote_tools(mcp, client)  # type: ignore[arg-type]
    register_inventory_tools(mcp, client)  # type: ignore[arg-type]
    register_employee_tools(mcp, client)  # type: ignore[arg-type]
    register_production_tools(mcp, client)  # type: ignore[arg-type]
    register_general_tools(mcp, client)  # type: ignore[arg-type]
    register_generated_tools(mcp, client)  # type: ignore[arg-type]

    return mcp


# Standard FastMCP entrypoint name for CLI inference/inspection.
mcp = create_server()


