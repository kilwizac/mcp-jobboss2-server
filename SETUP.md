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

## Step 4: Configure Claude Desktop

1. Open Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add this configuration (replace the path with your actual path):

   ```json
   {
     "mcpServers": {
       "jobboss2": {
         "command": "node",
         "args": [
           "C:\\Users\\zacha\\mcp-jobboss2-server\\dist\\index.js"
         ],
         "env": {
           "JOBBOSS2_API_URL": "https://your-instance.ecisolutions.com/api",
           "JOBBOSS2_API_KEY": "your_actual_api_key",
           "JOBBOSS2_API_SECRET": "your_actual_api_secret"
         }
       }
     }
   }
   ```

   **Important**: Use double backslashes (`\\`) in Windows paths!

3. Restart Claude Desktop

## Step 5: Verify It Works

In Claude Desktop, try asking:

> "Can you list the available tools from the JobBOSS2 server?"

You should see tools like `get_jobs`, `create_job`, `get_customers`, etc.

## Testing API Connection

To test the connection, ask Claude:

> "Can you get a list of jobs from JobBOSS2?"

If everything is configured correctly, Claude will use the MCP server to query JobBOSS2.

## Troubleshooting

### "Server not found" or connection errors
- Verify the path to `dist/index.js` is correct
- Check that you've run `npm run build`
- Restart Claude Desktop after config changes

### Authentication errors
- Double-check your API credentials in the config
- Ensure API access is enabled for your account
- Verify the API URL is correct

### No response from API
- Check that your JobBOSS2 instance is running
- Verify network connectivity
- Review the actual API documentation for correct endpoint paths

## Next Steps

Once configured, you can:
- Ask Claude to retrieve job information
- Create and update jobs, customers, and work orders
- Query specific records by ID
- Make custom API calls for advanced operations

See [README.md](README.md) for full documentation.
