from typing import Any, Dict, List, Optional, Union
from fastmcp import FastMCP
from jobboss2_api_client import JobBOSS2Client

def register_employee_tools(mcp: FastMCP, client: JobBOSS2Client):
    @mcp.tool()
    async def get_employees(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of employees from JobBOSS2. Supports filtering, sorting, pagination, and field selection."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "employees", params=params)

    @mcp.tool()
    async def get_employee_by_id(employeeID: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific employee by their employee ID."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"employees/{employeeID}", params=params)

    @mcp.tool()
    async def get_attendance_tickets(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of attendance tickets from JobBOSS2."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "attendance-tickets", params=params)

    @mcp.tool()
    async def get_attendance_ticket_by_id(ticketDate: str, employeeCode: int, fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific attendance ticket by ticket date and employee code."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"attendance-tickets/{ticketDate}/employees/{employeeCode}", params=params)

    @mcp.tool()
    async def create_attendance_ticket(
        employeeCode: int, ticketDate: str, data: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        """Create a new attendance ticket in JobBOSS2."""
        payload: Dict[str, Any] = {"employeeCode": employeeCode, "ticketDate": ticketDate}
        if data:
            payload.update(data)
        return await client.api_call("POST", "attendance-tickets", data=payload)

    @mcp.tool()
    async def get_attendance_ticket_details(
        fields: str = None,
        sort: str = None,
        skip: int = None,
        take: int = 200,
        filters: Dict[str, Any] | None = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a list of attendance ticket details (clock in/out times) from JobBOSS2."""
        params: Dict[str, Any] = {"fields": fields, "sort": sort, "skip": skip, "take": take}
        if filters:
            params.update(filters)
        params = {k: v for k, v in params.items() if v is not None}
        return await client.api_call("GET", "attendance-ticket-details", params=params)

    @mcp.tool()
    async def create_attendance_ticket_detail(
        ticketDate: str,
        employeeCode: int,
        actualClockInDate: str = None,
        actualClockInTime: str = None,
        actualClockOutDate: str = None,
        actualClockOutTime: str = None,
        data: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Create a new attendance ticket detail (clock in/out entry) for a specific ticket."""
        payload: Dict[str, Any] = {
            "actualClockInDate": actualClockInDate,
            "actualClockInTime": actualClockInTime,
            "actualClockOutDate": actualClockOutDate,
            "actualClockOutTime": actualClockOutTime,
        }
        if data:
            payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return await client.api_call(
            "POST",
            f"attendance-tickets/{ticketDate}/employees/{employeeCode}/attendance-ticket-details",
            data=payload,
        )

    @mcp.tool()
    async def update_attendance_ticket_detail(id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing attendance ticket detail (clock in/out times)."""
        await client.api_call("PATCH", f"attendance-ticket-details/{id}", data=data)
        return {"success": True}

    @mcp.tool()
    async def get_attendance_report(startDate: str, endDate: str, employeeCodes: List[int] = None) -> List[Dict[str, Any]]:
        """
        Generate a comprehensive attendance report for a date range. 
        This report includes ALL attendance types: regular work time, sick time, vacation, and other leave.
        """
        return await client.get_attendance_report(startDate, endDate, employeeCodes)

    @mcp.tool()
    async def get_salespersons(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve salesperson master records."""
        return await client.api_call("GET", "salespersons", params=params)

    @mcp.tool()
    async def get_time_ticket_details(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve shop floor time ticket detail entries."""
        return await client.api_call("GET", "time-ticket-details", params=params)

    @mcp.tool()
    async def get_time_ticket_detail_by_id(timeTicketGUID: str, fields: str = None) -> Dict[str, Any]:
        """Retrieve a single time ticket detail by its GUID."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"time-ticket-details/{timeTicketGUID}", params=params)

    @mcp.tool()
    async def get_time_tickets(params: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        """Retrieve time ticket headers."""
        return await client.api_call("GET", "time-tickets", params=params)

    @mcp.tool()
    async def get_time_ticket_by_id(ticketDate: str, employeeCode: Union[str, int], fields: str = None) -> Dict[str, Any]:
        """Retrieve a specific time ticket header by ticket date and employee code."""
        params = {"fields": fields} if fields else None
        return await client.api_call("GET", f"time-tickets/{ticketDate}/employees/{employeeCode}", params=params)

