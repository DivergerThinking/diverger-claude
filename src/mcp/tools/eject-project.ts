import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { performEject } from '../../cli/commands/eject.js';

export function registerEjectProjectTool(server: McpServer): void {
  server.tool(
    'eject_project',
    'Disconnect diverger-claude from a project while preserving the .claude/ configuration',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
    },
    async ({ projectDir }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const result = await performEject({ targetDir: projectDir });

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              ejected: result.ejected,
              removed: result.removed,
            }),
          }],
        };
      } catch (err: unknown) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'EJECT_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
