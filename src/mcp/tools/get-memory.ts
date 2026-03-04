import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { MemoryEngine } from '../../memory/index.js';

export function registerGetMemoryTool(server: McpServer): void {
  server.tool(
    'get_memory',
    'Read sections of the project behavioral memory (errors, repairs, antiPatterns, bestPractices, stats, all)',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
      section: z.enum(['errors', 'repairs', 'antiPatterns', 'bestPractices', 'stats', 'all'])
        .default('all')
        .describe('Which section of memory to retrieve'),
    },
    async ({ projectDir, section }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const engine = new MemoryEngine(projectDir);
        const store = await engine.getStore();

        let result: unknown;
        switch (section) {
          case 'errors':
            result = { errorPatterns: store.errorPatterns };
            break;
          case 'repairs':
            result = { repairLog: store.repairLog };
            break;
          case 'antiPatterns':
            result = { antiPatterns: store.antiPatterns };
            break;
          case 'bestPractices':
            result = { bestPractices: store.bestPractices };
            break;
          case 'stats':
            result = { stats: store.stats };
            break;
          case 'all':
          default:
            result = store;
            break;
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err: unknown) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'MEMORY_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
