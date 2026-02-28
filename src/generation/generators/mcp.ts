import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { MCP_FILE } from '../../core/constants.js';
import path from 'path';

interface McpJson {
  mcpServers: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

/** Generate .mcp.json file from composed config */
export function generateMcp(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile | null {
  if (config.mcp.length === 0) return null;

  const mcpJson: McpJson = { mcpServers: {} };

  for (const server of config.mcp) {
    mcpJson.mcpServers[server.name] = {
      command: server.command,
      ...(server.args ? { args: server.args } : {}),
      ...(server.env ? { env: server.env } : {}),
    };
  }

  return {
    path: path.join(projectRoot, MCP_FILE),
    content: JSON.stringify(mcpJson, null, 2) + '\n',
  };
}
