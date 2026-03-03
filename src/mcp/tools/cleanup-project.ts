import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { performCleanup } from '../../cli/commands/cleanup.js';

export function registerCleanupProjectTool(server: McpServer): void {
  server.tool(
    'cleanup_project',
    'Remove universal components from .claude/ that the plugin now provides',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
      force: z.boolean().optional().default(false)
        .describe('Remove even modified files (not just identical ones)'),
      dryRun: z.boolean().optional().default(false)
        .describe('Preview what would be removed without deleting anything'),
    },
    async ({ projectDir, force, dryRun }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const result = await performCleanup({ targetDir: projectDir, force, dryRun });

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              dryRun,
              cleaned: result.cleaned,
              removed: result.removed,
              skipped: result.skipped,
              settingsClean: result.settingsClean,
            }),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'CLEANUP_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
