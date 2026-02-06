import asyncio
import time
import unittest
from unittest.mock import AsyncMock, patch

from jobboss2_api_client import JobBOSS2Client, JobBOSS2Config


class DummyResponse:
    def __init__(self, status_code: int, payload=None, text: str = ""):
        self.status_code = status_code
        self._payload = payload if payload is not None else {}
        self.text = text

    def json(self):
        return self._payload


class JobBOSS2ClientTokenTests(unittest.IsolatedAsyncioTestCase):
    def make_config(self) -> JobBOSS2Config:
        return JobBOSS2Config(
            api_url="https://api.example.com",
            api_key="key",
            api_secret="secret",
            token_url="https://auth.example.com/token",
            timeout=5,
        )

    async def make_client(self) -> JobBOSS2Client:
        client = JobBOSS2Client(self.make_config())
        self.addAsyncCleanup(client.client.aclose)
        self.addAsyncCleanup(client.auth_client.aclose)
        return client

    async def test_concurrent_ensure_valid_token_only_one_refresh_call(self):
        client = await self.make_client()
        client.access_token = None
        client.token_expiry = 0

        async def fake_fetch():
            await asyncio.sleep(0.05)
            client.access_token = "token-1"
            client.token_expiry = time.time() + 3600

        client.fetch_access_token = AsyncMock(side_effect=fake_fetch)  # type: ignore[method-assign]

        await asyncio.gather(*(client.ensure_valid_token() for _ in range(20)))

        self.assertEqual(client.fetch_access_token.await_count, 1)  # type: ignore[attr-defined]

    async def test_concurrent_api_call_only_one_token_request(self):
        client = await self.make_client()

        client.auth_client.post = AsyncMock(  # type: ignore[method-assign]
            return_value=DummyResponse(
                200, {"access_token": "token-2", "expires_in": 3600}
            )
        )
        client.client.request = AsyncMock(  # type: ignore[method-assign]
            return_value=DummyResponse(200, {"Data": {"ok": True}})
        )

        results = await asyncio.gather(*(client.api_call("GET", "orders") for _ in range(20)))

        self.assertEqual(client.auth_client.post.await_count, 1)  # type: ignore[attr-defined]
        self.assertEqual(client.client.request.await_count, 20)  # type: ignore[attr-defined]
        self.assertTrue(all(result == {"ok": True} for result in results))

    async def test_refresh_failure_propagates_to_all_waiters(self):
        client = await self.make_client()
        client.access_token = None
        client.token_expiry = 0

        client.fetch_access_token = AsyncMock(  # type: ignore[method-assign]
            side_effect=RuntimeError("refresh failed")
        )

        results = await asyncio.gather(
            *(client.ensure_valid_token() for _ in range(10)),
            return_exceptions=True,
        )

        self.assertEqual(client.fetch_access_token.await_count, 1)  # type: ignore[attr-defined]
        self.assertTrue(all(isinstance(result, RuntimeError) for result in results))
        self.assertTrue(all(str(result) == "refresh failed" for result in results))
        self.assertIsNone(client._refresh_task)

        async def successful_refresh():
            client.access_token = "token-3"
            client.token_expiry = time.time() + 3600

        client.fetch_access_token = AsyncMock(side_effect=successful_refresh)  # type: ignore[method-assign]
        await client.ensure_valid_token()
        self.assertEqual(client.fetch_access_token.await_count, 1)  # type: ignore[attr-defined]
        self.assertEqual(client.access_token, "token-3")

    async def test_fetch_access_token_reuses_existing_auth_client(self):
        client = await self.make_client()
        client.auth_client.post = AsyncMock(  # type: ignore[method-assign]
            return_value=DummyResponse(
                200, {"access_token": "token-4", "expires_in": 3600}
            )
        )

        with patch(
            "jobboss2_api_client.httpx.AsyncClient",
            side_effect=AssertionError(
                "fetch_access_token should not instantiate a new AsyncClient"
            ),
        ):
            await client.fetch_access_token()

        self.assertEqual(client.auth_client.post.await_count, 1)  # type: ignore[attr-defined]
        self.assertEqual(client.access_token, "token-4")

    async def test_aexit_closes_data_and_auth_clients(self):
        client = await self.make_client()

        await client.client.aclose()
        await client.auth_client.aclose()

        client.client = type("StubClient", (), {"aclose": AsyncMock()})()
        client.auth_client = type("StubAuthClient", (), {"aclose": AsyncMock()})()

        await client.__aexit__(None, None, None)

        client.client.aclose.assert_awaited_once()
        client.auth_client.aclose.assert_awaited_once()

