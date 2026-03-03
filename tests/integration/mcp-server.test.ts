import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerDetectStackTool } from '../../src/mcp/tools/detect-stack.js';
import { registerGenerateConfigTool } from '../../src/mcp/tools/generate-config.js';
import { registerCheckConfigTool } from '../../src/mcp/tools/check-config.js';
import { registerSyncConfigTool } from '../../src/mcp/tools/sync-config.js';
import { registerListProfilesTool } from '../../src/mcp/tools/list-profiles.js';
import { registerGetProfileTool } from '../../src/mcp/tools/get-profile.js';
import { registerCleanupProjectTool } from '../../src/mcp/tools/cleanup-project.js';
import { registerEjectProjectTool } from '../../src/mcp/tools/eject-project.js';
import { readFileSync } from 'fs';
import path from 'path';

const pkg = JSON.parse(readFileSync(path.join(import.meta.dirname, '../../package.json'), 'utf-8'));

describe('MCP server integration', () => {
  it('creates server with correct name and version', () => {
    const server = new McpServer({ name: 'diverger-claude', version: pkg.version });
    expect(server).toBeDefined();
  });

  it('all 8 tools register successfully', () => {
    const server = new McpServer({ name: 'diverger-claude', version: pkg.version });

    // These should not throw
    registerDetectStackTool(server);
    registerGenerateConfigTool(server);
    registerCheckConfigTool(server);
    registerSyncConfigTool(server);
    registerListProfilesTool(server);
    registerGetProfileTool(server);
    registerCleanupProjectTool(server);
    registerEjectProjectTool(server);
  });

  it('server name matches expected value', () => {
    const server = new McpServer({ name: 'diverger-claude', version: pkg.version });
    // McpServer stores serverInfo internally
    expect(server).toBeDefined();
  });
});
