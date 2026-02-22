#!/usr/bin/env bun
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import http from 'node:http';
import dotenv from 'dotenv';
import { JobBOSS2Client } from './jobboss2-client.js';
import { registerTools } from './mcp/registerTools.js';

// Load environment variables
dotenv.config();

const API_URL = process.env.JOBBOSS2_API_URL;
const API_KEY = process.env.JOBBOSS2_API_KEY;
const API_SECRET = process.env.JOBBOSS2_API_SECRET;
const TOKEN_URL = process.env.JOBBOSS2_OAUTH_TOKEN_URL;
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '30000', 10);

if (!API_URL || !API_KEY || !API_SECRET || !TOKEN_URL) {
  console.error('Error: Missing required environment variables');
  process.exit(1);
}

const jobboss2Client = new JobBOSS2Client({
  apiUrl: API_URL,
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  tokenUrl: TOKEN_URL,
  timeout: API_TIMEOUT,
});

const server = new McpServer({
  name: 'mcp-jobboss2-server',
  version: '3.0.0',
});

// Register all tools
registerTools(server, jobboss2Client);

async function runServer() {
  const transport = process.env.MCP_TRANSPORT || "stdio";
  const portRaw = parseInt(process.env.MCP_PORT || process.env.PORT || "8000", 10);
  const port = isNaN(portRaw) ? 8000 : portRaw;

  if (transport === "http" || transport === "httpStream" || transport === "sse") {
    const httpTransport = new StreamableHTTPServerTransport({});
    await server.connect(httpTransport);
    const httpServer = http.createServer(async (req, res) => {
      await httpTransport.handleRequest(req, res);
    });
    httpServer.listen(port);
    console.error(`JobBOSS2 MCP Server running on HTTP (Streamable HTTP) at port ${port}`);
  } else {
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error('JobBOSS2 MCP Server running on stdio');
  }
}

function shutdown() {
  jobboss2Client.destroy();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  jobboss2Client.destroy();
  process.exit(1);
});
