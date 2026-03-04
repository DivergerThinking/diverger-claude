import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { RepairEngine } from '../../repair/index.js';

export function registerRepairConfigTool(server: McpServer): void {
  server.tool(
    'repair_config',
    'Diagnose and auto-repair .claude/ configuration issues',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
      mode: z.enum(['auto', 'report-only']).default('auto').describe('Repair mode: auto applies fixes, report-only just diagnoses'),
      dryRun: z.boolean().default(false).describe('If true, diagnoses but does not apply repairs'),
    },
    async ({ projectDir, mode, dryRun }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const engine = new RepairEngine(projectDir);
        const report = await engine.run(mode, dryRun);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(report) }],
        };
      } catch (err: unknown) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'REPAIR_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
