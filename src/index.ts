#!/usr/bin/env bun
import { FastMCP } from 'fastmcp';
import dotenv from 'dotenv';
import { JobBOSS2Client } from './jobboss2-client.js';
import { registerTools } from './fastmcp/registerTools.js';

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

const server = new FastMCP({
  name: 'mcp-jobboss2-server',
  version: '3.0.0',
});

// Register all tools using the FastMCP adapter
registerTools(server, jobboss2Client);

async function runServer() {
  const transport = process.env.MCP_TRANSPORT || "stdio";
  const portRaw = parseInt(process.env.MCP_PORT || process.env.PORT || "8000", 10);
  const port = isNaN(portRaw) ? 8000 : portRaw;

  if (transport === "http" || transport === "httpStream" || transport === "sse") {
    await server.start({ transportType: "httpStream", httpStream: { port } });
    console.error(`JobBOSS2 FastMCP Server running on HTTP (Streamable HTTP) at port ${port}`);
  } else {
    await server.start({ transportType: "stdio" });
    console.error('JobBOSS2 FastMCP Server running on stdio');
  }
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
