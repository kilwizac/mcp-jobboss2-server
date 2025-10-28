# JobBOSS2 MCP Server

A Model Context Protocol (MCP) server for integrating with the JobBOSS2 ERP API. This server enables AI assistants like Claude to interact with JobBOSS2 for manufacturing operations, including orders, customers, quotes, materials, and employees.

## Features

This MCP server provides comprehensive access to JobBOSS2 APIs:

- **Order Management**: Create, retrieve, update, and list orders with full filtering and pagination
- **Order Line Items**: Manage individual line items within orders
- **Customer Management**: Create, retrieve, update, and list customers
- **Quote Management**: Handle quotes and quote line items
- **Material Management**: Access and manage material/part inventory
- **Employee Management**: Retrieve employee data
- **Estimate Management (Part Master)**: Create, retrieve, update, and list estimates (part numbers) with pricing and bill of materials
- **Attendance Tracking**: Create, retrieve, and update attendance tickets and time clock entries with overtime and holiday tracking
- **Attendance Reports**: Generate comprehensive attendance reports that include regular work time, sick time, vacation, and all other absence types in a single query
- **Advanced Query Support**:
  - Filter expressions (e.g., `status[in]=Open|InProgress`, `orderTotal[gte]=1000`)
  - Sorting (e.g., `-dateEntered`, `+customerCode`)
  - Pagination (`skip`, `take`)
  - Field selection (only return specific fields)
- **OAuth2 Authentication**: Secure token-based authentication
- **Custom API Calls**: Access any JobBOSS2 API endpoint not covered by dedicated tools

## Prerequisites

- Node.js 18 or higher
- JobBOSS2 Cloud account with API access enabled
- JobBOSS2 API credentials (API Key and API Secret)
- OAuth2 Token URL access

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit `.env` and add your JobBOSS2 API credentials:
```env
JOBBOSS2_API_URL=https://api-jb2.integrations.ecimanufacturing.com:443
JOBBOSS2_OAUTH_TOKEN_URL=https://api-user.integrations.ecimanufacturing.com:443/oauth2/api-user/token
JOBBOSS2_API_KEY=your-api-key-here
JOBBOSS2_API_SECRET=your-api-secret-here
API_TIMEOUT=30000
```

5. Build the server:
```bash
npm run build
```

## Usage

### Running Standalone

To run the server directly:
```bash
npm start
```

### Configuring with Claude Desktop

Add this server to your Claude Desktop configuration file:

**On macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jobboss2": {
      "command": "node",
      "args": [
        "C:\\absolute\\path\\to\\mcp-jobboss2-server\\dist\\index.js"
      ],
      "env": {
        "JOBBOSS2_API_URL": "https://api-jb2.integrations.ecimanufacturing.com:443",
        "JOBBOSS2_OAUTH_TOKEN_URL": "https://api-user.integrations.ecimanufacturing.com:443/oauth2/api-user/token",
        "JOBBOSS2_API_KEY": "your-api-key-here",
        "JOBBOSS2_API_SECRET": "your-api-secret-here"
      }
    }
  }
}
```

After adding the configuration, restart Claude Desktop.

## Available Tools

The server provides 35 tools organized into these categories: Orders, Order Line Items, Customers, Quotes, Materials, Employees, Estimates (Part Master), Attendance Tickets, Attendance Ticket Details, Attendance Reports, and Custom API calls.

### Order Operations

#### `get_orders`
Retrieve a list of orders from JobBOSS2.

**Parameters:**
- `fields` (optional): Comma-separated list of fields (e.g., `orderNumber,customerCode,orderTotal`)
- `sort` (optional): Sort expression (e.g., `-dateEntered` for descending)
- `skip` (optional): Number of records to skip (pagination)
- `take` (optional): Number of records to retrieve (default 200)
- Plus any filter parameters (e.g., `customerCode`, `status[in]`, `orderTotal[gte]`)

**Example filters:**
- `customerCode=ACME` - Orders for customer ACME
- `status[in]=Open|InProgress` - Orders with status Open or InProgress
- `orderTotal[gte]=1000` - Orders with total >= 1000
- `dateEntered[gte]=2025-01-01` - Orders entered after Jan 1, 2025

#### `get_order_by_id`
Retrieve a specific order by its order number.

**Parameters:**
- `orderNumber` (required): The order number to retrieve
- `fields` (optional): Comma-separated list of fields to return

#### `create_order`
Create a new order in JobBOSS2.

**Parameters:**
- `customerCode` (required): Customer code
- `orderNumber` (optional): Order number (optional if auto-numbering enabled)
- `PONumber` (optional): Purchase order number
- `status` (optional): Order status
- `dueDate` (optional): Due date (ISO format: yyyy-MM-dd)
- Plus any additional order fields

#### `update_order`
Update an existing order in JobBOSS2.

**Parameters:**
- `orderNumber` (required): The order number to update
- `customerCode` (optional): Customer code
- `PONumber` (optional): Purchase order number
- `status` (optional): Order status
- `dueDate` (optional): Due date (ISO format: yyyy-MM-dd)
- Plus any additional order fields to update

### Order Line Item Operations

#### `get_order_line_items`
Retrieve line items for a specific order.

**Parameters:**
- `orderNumber` (required): The order number
- `fields` (optional): Comma-separated list of fields to return

#### `get_order_line_item_by_id`
Retrieve a specific order line item.

**Parameters:**
- `orderNumber` (required): The order number
- `itemNumber` (required): The line item number
- `fields` (optional): Comma-separated list of fields to return

#### `create_order_line_item`
Create a new line item for an order.

**Parameters:**
- `orderNumber` (required): The order number
- `partNumber` (optional): Part number
- `description` (optional): Item description
- `quantity` (optional): Quantity
- `price` (optional): Price per unit
- Plus any additional line item fields

#### `update_order_line_item`
Update an existing order line item.

**Parameters:**
- `orderNumber` (required): The order number
- `itemNumber` (required): The line item number
- Plus any fields to update (partNumber, description, quantity, price, etc.)

### Customer Operations

#### `get_customers`
Retrieve a list of customers from JobBOSS2. Supports filtering, sorting, pagination, and field selection.

**Parameters:**
- `fields` (optional): Comma-separated list of fields
- `sort` (optional): Sort expression
- `skip` (optional): Skip N records
- `take` (optional): Take N records
- Plus filter parameters (e.g., `customerName`, `salesID`, `active`)

#### `get_customer_by_code`
Retrieve a specific customer by their customer code.

**Parameters:**
- `customerCode` (required): The customer code to retrieve
- `fields` (optional): Comma-separated list of fields to return

#### `create_customer`
Create a new customer in JobBOSS2.

**Parameters:**
- `customerCode` (required): Customer code
- `customerName` (required): Customer name
- `phone` (optional): Phone number
- `billingAddress1` (optional): Billing address
- Plus any additional customer fields

#### `update_customer`
Update an existing customer in JobBOSS2.

**Parameters:**
- `customerCode` (required): The customer code to update
- Plus any fields to update (customerName, phone, billingAddress1, etc.)

### Quote Operations

#### `get_quotes`
Retrieve a list of quotes. Supports filtering, sorting, pagination, and field selection.

#### `get_quote_by_id`
Retrieve a specific quote by its quote number.

#### `create_quote`
Create a new quote in JobBOSS2.

**Parameters:**
- `customerCode` (required): Customer code
- `quoteNumber` (optional): Quote number (optional if auto-numbering enabled)
- `expirationDate` (optional): Expiration date (ISO format: yyyy-MM-dd)

#### `update_quote`
Update an existing quote in JobBOSS2.

### Material Operations

#### `get_materials`
Retrieve a list of materials/parts. Supports filtering, sorting, pagination, and field selection.

**Example filters:**
- `partNumber=ABC123`
- `productCode=STEEL`
- `quantityOnHand[gte]=10`

#### `get_material_by_part_number`
Retrieve a specific material by its part number.

### Employee Operations

#### `get_employees`
Retrieve a list of employees. Supports filtering, sorting, pagination, and field selection.

#### `get_employee_by_id`
Retrieve a specific employee by their employee ID.

### Estimate Operations (Part Master)

#### `get_estimates`
Retrieve a list of estimates (part master records). Supports filtering, sorting, pagination, and field selection.

**Example filters:**
- `partNumber=ABC123` - Get a specific part
- `productCode=STEEL` - Parts with product code STEEL
- `active=true` - Only active parts

#### `get_estimate_by_part_number`
Retrieve a specific estimate by its part number.

**Parameters:**
- `partNumber` (required): The part number to retrieve
- `fields` (optional): Comma-separated list of fields to return

#### `create_estimate`
Create a new estimate (part master record) in JobBOSS2. This creates a new part number with pricing, costing, and bill of materials information.

**Parameters:**
- `partNumber` (required): Part number
- `description` (optional): Part description
- `active` (optional): Whether the part is active (boolean)
- `alternatePartNumber` (optional): Alternate part number
- `calculationMethod` (optional): Calculation method
- `customerCode` (optional): Customer code
- `GLCode` (optional): GL account code
- `leadTime` (optional): Lead time in days
- `productCode` (optional): Product code
- `purchaseFactor` (optional): Purchase factor
- `purchasingGLCode` (optional): Purchasing GL code
- `purchasingUnit` (optional): Purchasing unit of measure
- `pricingUnit` (optional): Pricing unit of measure
- `revision` (optional): Revision
- `partWeight` (optional): Part weight
- `useDefaultQuantities` (optional): Use default quantity breaks from company settings
- Plus any additional estimate fields

#### `update_estimate`
Update an existing estimate (part master record) in JobBOSS2.

**Parameters:**
- `partNumber` (required): The part number to update
- `description` (optional): Part description
- `revision` (optional): Revision
- `revisionDate` (optional): Revision date (ISO format: yyyy-MM-dd)
- Plus any additional estimate fields to update

### Attendance Ticket Operations

Attendance tickets track employee time and attendance, including clock in/out times, overtime, and holiday tracking.

#### `get_attendance_tickets`
Retrieve a list of attendance tickets from JobBOSS2. Supports filtering, sorting, pagination, and field selection.

**Example filters:**
- `employeeCode=101` - Tickets for a specific employee
- `ticketDate[gte]=2025-01-01` - Tickets after a specific date
- `isExported=false` - Tickets not yet exported to payroll

#### `get_attendance_ticket_by_id`
Retrieve a specific attendance ticket by ticket date and employee code.

**Parameters:**
- `ticketDate` (required): The ticket date (ISO format: yyyy-MM-dd)
- `employeeCode` (required): The employee code
- `fields` (optional): Comma-separated list of fields to return

#### `create_attendance_ticket`
Create a new attendance ticket in JobBOSS2.

**Parameters:**
- `employeeCode` (required): Employee code
- `ticketDate` (required): Ticket date (ISO format: yyyy-MM-dd)

### Attendance Ticket Detail Operations

Attendance ticket details contain the actual clock in/out times, total hours worked, overtime flags, and pay information.

#### `get_attendance_ticket_details`
Retrieve a list of attendance ticket details (clock in/out records). Supports filtering, sorting, pagination, and field selection.

**Example filters:**
- `employeeCode=101` - Details for a specific employee
- `ticketDate=2025-01-15` - Details for a specific date
- `isOvertime=true` - Only overtime entries
- `isHoliday=true` - Only holiday entries

#### `create_attendance_ticket_detail`
Create a new attendance ticket detail (clock in/out entry) for a specific ticket.

**Parameters:**
- `ticketDate` (required): The ticket date (ISO format: yyyy-MM-dd)
- `employeeCode` (required): The employee code
- `actualClockInDate` (optional): Actual clock in date
- `actualClockInTime` (optional): Actual clock in time
- `actualClockOutDate` (optional): Actual clock out date
- `actualClockOutTime` (optional): Actual clock out time
- `adjustedClockInDate` (optional): Adjusted clock in date (for corrections)
- `adjustedClockInTime` (optional): Adjusted clock in time
- `adjustedClockOutDate` (optional): Adjusted clock out date
- `adjustedClockOutTime` (optional): Adjusted clock out time
- `attendanceCode` (optional): Attendance code
- `comments` (optional): Comments
- `shift` (optional): Shift number

#### `update_attendance_ticket_detail`
Update an existing attendance ticket detail (e.g., to correct clock times).

**Parameters:**
- `id` (required): The attendance ticket detail ID
- `actualClockInDate` (optional): Actual clock in date
- `actualClockInTime` (optional): Actual clock in time
- `actualClockOutDate` (optional): Actual clock out date
- `actualClockOutTime` (optional): Actual clock out time
- `adjustedClockInDate` (optional): Adjusted clock in date
- `adjustedClockInTime` (optional): Adjusted clock in time
- `adjustedClockOutDate` (optional): Adjusted clock out date
- `adjustedClockOutTime` (optional): Adjusted clock out time
- `attendanceCode` (optional): Attendance code
- `comments` (optional): Comments
- Plus any additional fields to update

### Attendance Report Operations

#### `get_attendance_report`
Generate a comprehensive attendance report for a date range. **This is the recommended tool for daily/weekly attendance reports** as it automatically includes ALL attendance types in a single query: regular work time, sick time, vacation, and other leave types.

**Key Features:**
- Returns all attendance entries for the date range (work, sick, vacation, etc.)
- Pre-sorted by employee, date, and attendance code for easy reading
- Includes total hours, overtime flags, and holiday flags
- Optional filtering by specific employees

**Parameters:**
- `startDate` (required): Start date for the report (ISO format: yyyy-MM-dd)
- `endDate` (required): End date for the report (ISO format: yyyy-MM-dd)
- `employeeCodes` (optional): Array of employee codes to filter (e.g., [101, 102, 103])

**Example Usage:**
```javascript
// Get attendance for all employees for a week
{
  "startDate": "2025-10-20",
  "endDate": "2025-10-24"
}

// Get attendance for specific employees
{
  "startDate": "2025-10-20",
  "endDate": "2025-10-24",
  "employeeCodes": [101, 205, 310]
}
```

**Report Fields Included:**
- Employee code and name
- Ticket date
- Attendance code (1=work, varies by company setup for sick/vacation/etc.)
- Clock in/out times (actual and adjusted)
- Total hours (actual and adjusted)
- Overtime flag (isOvertime)
- Holiday flag (isHoliday)
- Pay rate information
- Comments

**Note on Attendance Codes:** The `attendanceCode` field distinguishes between different types of time. Common codes (varies by company):
- Code 1 or 10: Regular work time
- Code 5 or 20: Sick time
- Code 6 or 30: Vacation/PTO
- Code 7 or 40: Holiday time
- Check your JobBOSS2 company settings for your specific code definitions

### Custom Operations

#### `custom_api_call`
Make a custom API call to any JobBOSS2 API endpoint. Endpoint paths will automatically be prefixed with `/api/v1/` if not already present.

**Parameters:**
- `method` (required): HTTP method (GET, POST, PUT, DELETE, PATCH)
- `endpoint` (required): API endpoint path (e.g., `orders/12345` or `/api/v1/orders/12345`)
- `data` (optional): Request body data for POST/PUT/PATCH
- `params` (optional): Query parameters (for filtering, sorting, pagination, field selection)

## Example Usage with Claude

Once configured, you can ask Claude to interact with JobBOSS2:

> "Can you get me a list of all open orders?"

> "Show me orders for customer ACME with total over $5000"

> "Create a new order for customer XYZ123"

> "What are the line items for order SO-12345?"

> "Get a list of all materials with quantity on hand greater than 50"

> "Show me employee information for employee ID EMP001"

> "Get the 10 most recent quotes, sorted by date"

> "Create a new part number ABC-123 with description 'Widget Assembly'"

> "Get estimate information for part number ABC-123"

> "Update part number ABC-123 to revision B"

> "Get attendance records for employee 101 for the last week"

> "Show me all overtime entries from last month"

> "Create an attendance ticket for employee 202 for today"

> "Get all attendance details with clock in/out times for January 15, 2025"

> "Provide me an attendance report for 10/20/25 through 10/24/25" *(includes sick time!)*

> "Generate a weekly attendance report for last week including all absences"

## Advanced Query Examples

### Filtering
```javascript
// Orders with status Open or InProgress
{ status: { "[in]": "Open|InProgress" } }

// Orders over $1000
{ orderTotal: { "[gte]": 1000 } }

// Customers in a specific state
{ billingState: "CA" }
```

### Sorting
```javascript
// Sort by date descending (newest first)
{ sort: "-dateEntered" }

// Sort by customer, then order number
{ sort: "+customerCode,+orderNumber" }
```

### Pagination
```javascript
// Get records 100-199
{ skip: 100, take: 100 }
```

### Field Selection
```javascript
// Only return specific fields
{ fields: "orderNumber,customerCode,orderTotal,status" }
```

## Authentication

This server uses OAuth2 client credentials flow for authentication:
1. On startup (or when token expires), the server fetches an access token from the OAuth2 token URL
2. The access token is automatically included in all API requests as a Bearer token
3. Tokens are cached and automatically refreshed 5 minutes before expiry

## Development

### Building
```bash
npm run build
```

### Watch Mode
For development with automatic rebuilding:
```bash
npm run watch
```

### Project Structure
```
mcp-jobboss2-server/
├── src/
│   ├── index.ts              # Main MCP server implementation
│   └── jobboss2-client.ts    # JobBOSS2 API client with OAuth2 support
├── dist/                     # Compiled JavaScript (generated)
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment variables template
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Important Notes

1. **API Access**: The JobBOSS2 API is only available for cloud-hosted customers. Contact ECI Solutions to enable API access.

2. **Authentication**: This server uses OAuth2 with client credentials grant type. Access tokens are automatically managed.

3. **API Endpoints**: All endpoints use the `/api/v1/` prefix. The actual API structure is based on the official JobBOSS2 OpenAPI specification.

4. **Response Format**: The JobBOSS2 API wraps responses in a `Data` property. This is automatically handled by the client.

5. **Date Format**: Dates should be in ISO format (`yyyy-MM-dd` or `yyyy-MM-ddTHH:mm:ssZ`). All dates are in UTC.

6. **Filter Operators**: Supported operators include `[eq]`, `[ne]`, `[gte]`, `[lte]`, `[gt]`, `[lt]`, `[in]`, `[notin]`, `[null]`

## Getting JobBOSS2 API Credentials

To obtain API credentials:

1. Contact your ECI Account Manager or support team
2. Request API access for your JobBOSS2 Cloud instance
3. They will provide you with:
   - API URL (base endpoint)
   - OAuth2 Token URL
   - API Key (Client ID)
   - API Secret (Client Secret)
   - Access to the API documentation portal at https://integrations.ecimanufacturing.com/

## Troubleshooting

### Server won't start
- Ensure all environment variables are set correctly in `.env`
- Check that you've run `npm install` and `npm run build`
- Verify Node.js version is 18 or higher

### Authentication errors
- Verify your API credentials are correct
- Check that both API URL and OAuth Token URL are set
- Ensure your JobBOSS2 account has API access enabled
- Check server logs for OAuth2 token errors

### API errors
- Consult the JobBOSS2 API documentation for endpoint details
- Check the server logs for detailed error messages
- Verify the endpoint paths are correct (all start with `/api/v1/`)
- Ensure request data matches the expected schema

### Token issues
- Tokens automatically refresh, but check logs if you see 401 errors
- Verify your API Key and Secret are correct
- Ensure the OAuth Token URL is accessible from your network

## API Documentation

Official JobBOSS2 API documentation is available at:
https://integrations.ecimanufacturing.com/

The documentation includes:
- Complete endpoint reference
- Request/response schemas
- Filter expression syntax
- Authentication details

## License

MIT

## Support

For issues related to:
- **This MCP server**: Open an issue in this repository
- **JobBOSS2 API**: Contact ECI Solutions support or visit https://integrations.ecimanufacturing.com/
- **MCP Protocol**: Visit https://modelcontextprotocol.io/

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Version History

### v2.0.0
- Complete rewrite to match actual JobBOSS2 API structure
- Changed from "jobs/work orders" to "orders/order line items"
- Added OAuth2 authentication support
- Added support for advanced filtering, sorting, pagination, and field selection
- Added Quote, Material, and Employee resources
- Updated all endpoints to use `/api/v1/` prefix
- Updated identifiers: `orderNumber` (not jobNumber), `customerCode` (not customerId)
- Improved error handling and response parsing

### v1.0.0
- Initial release with basic job, customer, and work order operations
