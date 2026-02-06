import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { JobBOSS2Client } from '../jobboss2-client.js';
import {
    GetEmployeesSchema,
    GetEmployeeByIdSchema,
    GetAttendanceTicketsSchema,
    GetAttendanceTicketByIdSchema,
    CreateAttendanceTicketSchema,
    GetAttendanceTicketDetailsSchema,
    CreateAttendanceTicketDetailSchema,
    UpdateAttendanceTicketDetailSchema,
    GetAttendanceReportSchema,
    GetTimeTicketDetailByIdSchema,
    GetTimeTicketByIdSchema,
    QueryOnlyToolInputSchema,
    QueryParamsSchema,
} from '../schemas.js';

export const employeeTools: Tool[] = [
    {
        name: 'get_employees',
        description: 'Retrieve a list of employees from JobBOSS2. Supports filtering, sorting, pagination, and field selection.',
        inputSchema: {
            type: 'object',
            properties: {
                fields: { type: 'string', description: 'Comma-separated list of fields' },
                sort: { type: 'string', description: 'Sort expression' },
                skip: { type: 'number', description: 'Skip N records' },
                take: { type: 'number', description: 'Take N records' },
            },
            additionalProperties: true,
        },
    },
    {
        name: 'get_employee_by_id',
        description: 'Retrieve a specific employee by their employee ID.',
        inputSchema: {
            type: 'object',
            properties: {
                employeeID: { type: 'string', description: 'The employee ID to retrieve' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['employeeID'],
        },
    },
    {
        name: 'get_attendance_tickets',
        description: 'Retrieve a list of attendance tickets from JobBOSS2. Supports filtering by employee, date range, and other fields.',
        inputSchema: {
            type: 'object',
            properties: {
                fields: { type: 'string', description: 'Comma-separated list of fields' },
                sort: { type: 'string', description: 'Sort expression' },
                skip: { type: 'number', description: 'Skip N records' },
                take: { type: 'number', description: 'Take N records' },
            },
            additionalProperties: true,
        },
    },
    {
        name: 'get_attendance_ticket_by_id',
        description: 'Retrieve a specific attendance ticket by ticket date and employee code.',
        inputSchema: {
            type: 'object',
            properties: {
                ticketDate: { type: 'string', description: 'The ticket date (ISO format: yyyy-MM-dd)' },
                employeeCode: { type: 'number', description: 'The employee code' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['ticketDate', 'employeeCode'],
        },
    },
    {
        name: 'create_attendance_ticket',
        description: 'Create a new attendance ticket in JobBOSS2.',
        inputSchema: {
            type: 'object',
            properties: {
                employeeCode: { type: 'number', description: 'Employee code' },
                ticketDate: { type: 'string', description: 'Ticket date (ISO format: yyyy-MM-dd)' },
            },
            required: ['employeeCode', 'ticketDate'],
            additionalProperties: true,
        },
    },
    {
        name: 'get_attendance_ticket_details',
        description: 'Retrieve a list of attendance ticket details (clock in/out times) from JobBOSS2. Supports filtering by employee, date, and other criteria.',
        inputSchema: {
            type: 'object',
            properties: {
                fields: { type: 'string', description: 'Comma-separated list of fields' },
                sort: { type: 'string', description: 'Sort expression' },
                skip: { type: 'number', description: 'Skip N records' },
                take: { type: 'number', description: 'Take N records' },
            },
            additionalProperties: true,
        },
    },
    {
        name: 'create_attendance_ticket_detail',
        description: 'Create a new attendance ticket detail (clock in/out entry) for a specific ticket.',
        inputSchema: {
            type: 'object',
            properties: {
                ticketDate: { type: 'string', description: 'The ticket date (ISO format: yyyy-MM-dd)' },
                employeeCode: { type: 'number', description: 'The employee code' },
                actualClockInDate: { type: 'string', description: 'Actual clock in date' },
                actualClockInTime: { type: 'string', description: 'Actual clock in time' },
                actualClockOutDate: { type: 'string', description: 'Actual clock out date' },
                actualClockOutTime: { type: 'string', description: 'Actual clock out time' },
                adjustedClockInDate: { type: 'string', description: 'Adjusted clock in date' },
                adjustedClockInTime: { type: 'string', description: 'Adjusted clock in time' },
                adjustedClockOutDate: { type: 'string', description: 'Adjusted clock out date' },
                adjustedClockOutTime: { type: 'string', description: 'Adjusted clock out time' },
                attendanceCode: { type: 'number', description: 'Attendance code' },
                comments: { type: 'string', description: 'Comments' },
                shift: { type: 'number', description: 'Shift number' },
            },
            required: ['ticketDate', 'employeeCode'],
            additionalProperties: true,
        },
    },
    {
        name: 'update_attendance_ticket_detail',
        description: 'Update an existing attendance ticket detail (clock in/out times).',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: 'The attendance ticket detail ID' },
                actualClockInDate: { type: 'string', description: 'Actual clock in date' },
                actualClockInTime: { type: 'string', description: 'Actual clock in time' },
                actualClockOutDate: { type: 'string', description: 'Actual clock out date' },
                actualClockOutTime: { type: 'string', description: 'Actual clock out time' },
                adjustedClockInDate: { type: 'string', description: 'Adjusted clock in date' },
                adjustedClockInTime: { type: 'string', description: 'Adjusted clock in time' },
                adjustedClockOutDate: { type: 'string', description: 'Adjusted clock out date' },
                adjustedClockOutTime: { type: 'string', description: 'Adjusted clock out time' },
                attendanceCode: { type: 'number', description: 'Attendance code' },
                comments: { type: 'string', description: 'Comments' },
            },
            required: ['id'],
            additionalProperties: true,
        },
    },
    {
        name: 'get_attendance_report',
        description: 'Generate a comprehensive attendance report for a date range. This report includes ALL attendance types: regular work time, sick time, vacation, and other leave. Perfect for weekly/daily attendance reports that need to show both worked hours and absences.',
        inputSchema: {
            type: 'object',
            properties: {
                startDate: { type: 'string', description: 'Start date for the report (ISO format: yyyy-MM-dd, e.g., 2025-10-20)' },
                endDate: { type: 'string', description: 'End date for the report (ISO format: yyyy-MM-dd, e.g., 2025-10-24)' },
                employeeCodes: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Optional: Specific employee codes to include. If omitted, includes all employees.'
                },
            },
            required: ['startDate', 'endDate'],
        },
    },
    {
        name: 'get_salespersons',
        description: 'Retrieve salesperson master records including commission settings and contact info.',
        inputSchema: QueryOnlyToolInputSchema,
    },
    {
        name: 'get_time_ticket_details',
        description: 'Retrieve shop floor time ticket detail entries (clocked labor) across jobs, work centers, or employees.',
        inputSchema: QueryOnlyToolInputSchema,
    },
    {
        name: 'get_time_ticket_detail_by_id',
        description: 'Retrieve a single time ticket detail by its GUID.',
        inputSchema: {
            type: 'object',
            properties: {
                timeTicketGUID: { type: 'string', description: 'Time ticket detail GUID' },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['timeTicketGUID'],
        },
    },
    {
        name: 'get_time_tickets',
        description: 'Retrieve time ticket headers (per employee per day).',
        inputSchema: QueryOnlyToolInputSchema,
    },
    {
        name: 'get_time_ticket_by_id',
        description: 'Retrieve a specific time ticket header by ticket date and employee code.',
        inputSchema: {
            type: 'object',
            properties: {
                ticketDate: { type: 'string', description: 'Ticket date (ISO format: yyyy-MM-dd)' },
                employeeCode: {
                    oneOf: [{ type: 'string' }, { type: 'number' }],
                    description: 'Employee code',
                },
                fields: { type: 'string', description: 'Comma-separated list of fields to return' },
            },
            required: ['ticketDate', 'employeeCode'],
        },
    },
];

export const employeeHandlers: Record<string, (args: any, client: JobBOSS2Client) => Promise<any>> = {
    get_employees: async (args, client) => {
        const params = GetEmployeesSchema.parse(args);
        return client.getEmployees(params);
    },
    get_employee_by_id: async (args, client) => {
        const { employeeID, fields } = GetEmployeeByIdSchema.parse(args);
        return client.getEmployeeById(employeeID, { fields });
    },
    get_attendance_tickets: async (args, client) => {
        const params = GetAttendanceTicketsSchema.parse(args);
        return client.getAttendanceTickets(params);
    },
    get_attendance_ticket_by_id: async (args, client) => {
        const { ticketDate, employeeCode, fields } = GetAttendanceTicketByIdSchema.parse(args);
        return client.getAttendanceTicketById(ticketDate, employeeCode, { fields });
    },
    create_attendance_ticket: async (args, client) => {
        const ticketData = CreateAttendanceTicketSchema.parse(args);
        return client.createAttendanceTicket(ticketData);
    },
    get_attendance_ticket_details: async (args, client) => {
        const params = GetAttendanceTicketDetailsSchema.parse(args);
        return client.getAttendanceTicketDetails(params);
    },
    create_attendance_ticket_detail: async (args, client) => {
        const { ticketDate, employeeCode, ...detailData } = CreateAttendanceTicketDetailSchema.parse(args);
        return client.createAttendanceTicketDetail(ticketDate, employeeCode, detailData);
    },
    update_attendance_ticket_detail: async (args, client) => {
        const { id, ...detailData } = UpdateAttendanceTicketDetailSchema.parse(args);
        await client.updateAttendanceTicketDetail(id, detailData);
        return { success: true };
    },
    get_attendance_report: async (args, client) => {
        const { startDate, endDate, employeeCodes } = GetAttendanceReportSchema.parse(args);
        return client.getAttendanceReport(startDate, endDate, employeeCodes);
    },
    get_salespersons: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getSalespersons(params);
    },
    get_time_ticket_details: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getTimeTicketDetails(params);
    },
    get_time_ticket_detail_by_id: async (args, client) => {
        const { timeTicketGUID, fields } = GetTimeTicketDetailByIdSchema.parse(args);
        return client.getTimeTicketDetailByGuid(timeTicketGUID, { fields });
    },
    get_time_tickets: async (args, client) => {
        const params = QueryParamsSchema.parse(args);
        return client.getTimeTickets(params);
    },
    get_time_ticket_by_id: async (args, client) => {
        const { ticketDate, employeeCode, fields } = GetTimeTicketByIdSchema.parse(args);
        return client.getTimeTicketById(ticketDate, employeeCode, { fields });
    },
};
