# Quick Setup Guide

## Step 1: Get JobBOSS2 API Credentials

Contact ECI Solutions to:
1. Enable API access for your JobBOSS2 Cloud account
2. Obtain your API credentials:
   - API URL
   - API Key
   - API Secret

## Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   JOBBOSS2_API_URL=https://your-instance.ecisolutions.com/api
   JOBBOSS2_API_KEY=your_actual_api_key
   JOBBOSS2_API_SECRET=your_actual_api_secret
   ```

## Step 3: Install and Build

```bash
npm install
npm run build
```

## Step 4: Verify It Works

Once your MCP client is configured to use this server, try asking:

> "Can you list the available tools from the JobBOSS2 server?"

You should see tools like `get_orders`, `create_order`, `get_customers`, etc.

## Testing API Connection

To test the connection, ask your assistant:

> "Can you get a list of orders from JobBOSS2?"

If everything is configured correctly, the assistant will use the MCP server to query JobBOSS2.

## Troubleshooting

### "Server not found" or connection errors
- Verify the path to `dist/index.js` is correct
- Check that you've run `npm run build`
- Restart your MCP client after configuration changes

### Authentication errors
- Double-check your API credentials in the environment configuration
- Ensure API access is enabled for your account
- Verify the API URL is correct

### No response from API
- Check that your JobBOSS2 instance is running
- Verify network connectivity
- Review the actual API documentation for correct endpoint paths

## Next Steps

Once configured, you can:
- Ask your assistant to retrieve order information
- Create and update orders, customers, and employees
- Query specific records by ID
- Make custom API calls for advanced operations

See [README.md](README.md) for full documentation.
