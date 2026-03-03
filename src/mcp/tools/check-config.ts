import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DivergerEngine } from '../../core/engine.js';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';

export function registerCheckConfigTool(server: McpServer): void {
  server.tool(
    'check_config',
    'Validate the existing .claude/ configuration against governance rules',
    { projectDir: z.string().describe('Absolute path to the project root directory') },
    async ({ projectDir }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const engine = new DivergerEngine();
        const result = await engine.check({
          projectRoot: projectDir,
          options: { output: 'quiet', force: true, dryRun: false, targetDir: projectDir },
        });

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'VALIDATION_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
