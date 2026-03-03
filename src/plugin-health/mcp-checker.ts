import path from 'path';
import { readJsonOrNull, fileExists } from '../utils/fs.js';

export interface McpCheckResult {
  check: 'mcp-server' | 'mcp-config';
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  autoFixable: boolean;
}

interface McpJson {
  mcpServers?: Record<string, { command: string; args?: string[] }>;
}

/**
 * Validate that the MCP server binary exists.
 */
export async function checkMcpServer(pluginDir: string): Promise<McpCheckResult> {
  const serverPath = path.join(pluginDir, 'mcp', 'server.js');
  const exists = await fileExists(serverPath);

  if (!exists) {
    return {
      check: 'mcp-server',
      status: 'unhealthy',
      message: 'mcp/server.js no encontrado',
      autoFixable: true,
    };
  }

  return {
    check: 'mcp-server',
    status: 'healthy',
    message: 'MCP server encontrado',
    autoFixable: false,
  };
}

/**
 * Validate that .mcp.json exists and references the diverger-claude server.
 */
export async function checkMcpConfig(pluginDir: string): Promise<McpCheckResult> {
  const mcpJsonPath = path.join(pluginDir, '.mcp.json');
  const content = await readJsonOrNull<McpJson>(mcpJsonPath);

  if (!content) {
    const exists = await fileExists(mcpJsonPath);
    return {
      check: 'mcp-config',
      status: 'unhealthy',
      message: exists
        ? '.mcp.json contiene JSON inválido'
        : '.mcp.json no encontrado',
      autoFixable: true,
    };
  }

  if (!content.mcpServers?.['diverger-claude']) {
    return {
      check: 'mcp-config',
      status: 'unhealthy',
      message: '.mcp.json no contiene entrada diverger-claude',
      autoFixable: true,
    };
  }

  return {
    check: 'mcp-config',
    status: 'healthy',
    message: '.mcp.json válido con diverger-claude',
    autoFixable: false,
  };
}
