import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { checkPluginHealth } from '../../plugin-health/index.js';

export function registerCheckPluginHealthTool(server: McpServer): void {
  server.tool(
    'check_plugin_health',
    'Run health checks on the diverger-claude plugin (hooks, MCP, agents, skills, version)',
    {
      pluginDir: z.string().describe('Absolute path to the plugin directory'),
      cliVersion: z.string().default('0.0.0').describe('Current CLI version for consistency check'),
    },
    async ({ pluginDir, cliVersion }) => {
      if (!(await fileExists(pluginDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Plugin directory not found: ${pluginDir}` }) }],
          isError: true,
        };
      }

      try {
        const report = await checkPluginHealth(pluginDir, cliVersion);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(report) }],
        };
      } catch (err: unknown) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'HEALTH_CHECK_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
