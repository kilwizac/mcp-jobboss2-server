import asyncio
import httpx
import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

# Maximum safety buffer for token expiry (5 minutes)
MAX_TOKEN_BUFFER_SECONDS = 300


class JobBOSS2Config(BaseModel):
    api_url: str
    api_key: str
    api_secret: str
    token_url: str
    timeout: int = 30


class JobBOSS2Client:
    def __init__(self, config: JobBOSS2Config):
        self.config = config
        self.access_token: Optional[str] = None
        self.token_expiry: float = 0
        self.client = httpx.AsyncClient(
            base_url=config.api_url,
            timeout=config.timeout,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        self.auth_client = httpx.AsyncClient(timeout=config.timeout)
        self._refresh_lock = asyncio.Lock()
        self._refresh_task: Optional[asyncio.Task] = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        try:
            await self.client.aclose()
        finally:
            await self.auth_client.aclose()

    async def fetch_access_token(self) -> None:
        response = await self.auth_client.post(
            self.config.token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self.config.api_key,
                "client_secret": self.config.api_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code != 200:
            raise Exception(
                f"OAuth2 Token Error: {response.status_code} - {response.text}"
            )

        data = response.json()
        self.access_token = data["access_token"]
        # Set expiry with safety buffer, clamped to avoid negative expiry for short-lived tokens
        # Strategy: Use half the token lifetime as buffer (max 5 min). Subtracting 1 before dividing
        # ensures we never make the buffer >= expires_in, keeping the token valid. Examples:
        # - 3600s token: buffer = min(300, (3599)//2) = 300, valid for 3300s
        # - 600s token: buffer = min(300, (599)//2) = 299, valid for 301s
        # - 2s token: buffer = min(300, (1)//2) = 0, valid for 2s
        expires_in = data["expires_in"]
        buffer = min(MAX_TOKEN_BUFFER_SECONDS, max(0, (expires_in - 1) // 2))
        self.token_expiry = time.time() + (expires_in - buffer)

    def is_token_expired(self) -> bool:
        return not self.access_token or time.time() >= self.token_expiry

    async def ensure_valid_token(self) -> None:
        if not self.is_token_expired():
            return

        refresh_task: Optional[asyncio.Task] = None
        async with self._refresh_lock:
            if not self.is_token_expired():
                return
            if self._refresh_task is None or self._refresh_task.done():
                self._refresh_task = asyncio.create_task(self.fetch_access_token())
            refresh_task = self._refresh_task

        if refresh_task is None:
            return

        try:
            await refresh_task
        finally:
            async with self._refresh_lock:
                if self._refresh_task is refresh_task and refresh_task.done():
                    self._refresh_task = None

    async def api_call(
        self,
        method: str,
        endpoint: str,
        data: Any = None,
        params: Dict[str, Any] | None = None,
    ) -> Any:
        await self.ensure_valid_token()

        normalized_method = method.upper()
        if normalized_method not in {"GET", "POST", "PUT", "DELETE", "PATCH"}:
            raise ValueError(f"Invalid HTTP method: {method}")

        normalized_endpoint = endpoint.strip()
        if not normalized_endpoint:
            raise ValueError("Endpoint is required")
        if "://" in normalized_endpoint:
            raise ValueError("Endpoint must be a relative path")
        if ".." in normalized_endpoint or "\\" in normalized_endpoint:
            raise ValueError("Invalid endpoint path")

        # Ensure endpoint starts with /api/v1/ if not already present
        url = (
            normalized_endpoint
            if normalized_endpoint.startswith("/api/v1/")
            else f"/api/v1/{normalized_endpoint.lstrip('/')}"
        )

        headers = {"Authorization": f"Bearer {self.access_token}"}

        response = await self.client.request(
            method=normalized_method,
            url=url,
            json=data,
            params=params,
            headers=headers,
        )

        if response.status_code >= 400:
            raise Exception(f"JobBOSS2 API Error: {response.status_code}")

        if response.status_code == 204:
            return None

        result = response.json()
        # JobBOSS2 API wraps responses in a "Data" property
        return result.get("Data", result)

    # Convenience methods for common resources
    async def get_orders(self, params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        return await self.api_call("GET", "orders", params=params)

    async def get_order_by_id(
        self, order_number: str, params: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        return await self.api_call("GET", f"orders/{order_number}", params=params)

    async def get_customers(self, params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        return await self.api_call("GET", "customers", params=params)

    async def get_customer_by_code(
        self, customer_code: str, params: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        return await self.api_call("GET", f"customers/{customer_code}", params=params)

    async def get_attendance_report(
        self,
        start_date: str,
        end_date: str,
        employee_codes: List[int] | None = None,
    ) -> List[Dict[str, Any]]:
        params: Dict[str, Any] = {
            "ticketDate[gte]": start_date,
            "ticketDate[lte]": end_date,
            "sort": "employeeCode,ticketDate,attendanceCode",
        }
        if employee_codes:
            params["employeeCode[in]"] = "|".join(map(str, employee_codes))

        return await self.api_call("GET", "attendance-ticket-details", params=params)

