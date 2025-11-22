import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerProfileTools } from './tools/profileTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadProfile() {
  const profilePath = path.resolve(__dirname, 'data', 'profile.json');
  const content = readFileSync(profilePath, 'utf-8');
  return JSON.parse(content);
}

const server = new McpServer({ name: 'profile-mcp-server', version: '2.0.0' });
const profile = loadProfile();

registerProfileTools(server, profile);

const transport = new StdioServerTransport();
server.connect(transport);
console.log('[MCP] Profile server started via stdio.');
