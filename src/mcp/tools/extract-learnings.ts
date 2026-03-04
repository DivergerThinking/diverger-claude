import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { LearningEngine } from '../../learning/index.js';

export function registerExtractLearningsTool(server: McpServer): void {
  server.tool(
    'extract_learnings',
    'Process session errors and extract error patterns, generating preventive rules when thresholds are met',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
      errors: z.array(z.object({
        message: z.string().describe('Error message'),
        tool: z.string().optional().describe('Tool that produced the error'),
        timestamp: z.string().optional().describe('ISO timestamp'),
      })).describe('Array of error objects from the session'),
    },
    async ({ projectDir, errors }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const engine = new LearningEngine(projectDir);
        const result = await engine.processSessionErrors(errors);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (err: unknown) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'LEARNING_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
