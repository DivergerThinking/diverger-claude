import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { MemoryEngine } from '../../memory/index.js';

export function registerRecordLearningTool(server: McpServer): void {
  server.tool(
    'record_learning',
    'Write a learning to the project behavioral memory (anti-pattern, best-practice, or error-pattern)',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
      type: z.enum(['anti-pattern', 'best-practice', 'error-pattern'])
        .describe('Type of learning to record'),
      // Anti-pattern / best-practice fields
      pattern: z.string().optional().describe('What to avoid (anti-pattern) or the practice itself (best-practice)'),
      reason: z.string().optional().describe('Why this is bad/good'),
      alternative: z.string().optional().describe('What to do instead (anti-pattern only)'),
      confidence: z.number().min(0).max(100).default(70).describe('Confidence 0-100'),
      // Error-pattern fields
      category: z.enum(['tool-error', 'config-issue', 'code-pattern', 'hook-failure']).optional()
        .describe('Error category (error-pattern only)'),
      tool: z.string().optional().describe('Tool that triggered the error (error-pattern only)'),
      matchPattern: z.string().optional().describe('Regex for matching (error-pattern only)'),
      description: z.string().optional().describe('Human-readable description (error-pattern only)'),
      resolution: z.string().optional().describe('Known resolution (error-pattern only)'),
    },
    async ({ projectDir, type, pattern, reason, alternative, confidence, category, tool, matchPattern, description, resolution }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const engine = new MemoryEngine(projectDir);

        switch (type) {
          case 'anti-pattern': {
            if (!pattern || !reason || !alternative) {
              return {
                content: [{ type: 'text' as const, text: JSON.stringify({ error: 'MISSING_FIELDS', message: 'anti-pattern requires: pattern, reason, alternative' }) }],
                isError: true,
              };
            }
            await engine.recordAntiPattern({
              pattern,
              reason,
              alternative,
              source: 'manual',
              confidence,
            });
            return {
              content: [{ type: 'text' as const, text: JSON.stringify({ success: true, type: 'anti-pattern', pattern }) }],
            };
          }

          case 'best-practice': {
            if (!pattern || !reason) {
              return {
                content: [{ type: 'text' as const, text: JSON.stringify({ error: 'MISSING_FIELDS', message: 'best-practice requires: pattern (as practice), reason' }) }],
                isError: true,
              };
            }
            await engine.recordBestPractice({
              practice: pattern,
              reason,
              source: 'manual',
              confidence,
            });
            return {
              content: [{ type: 'text' as const, text: JSON.stringify({ success: true, type: 'best-practice', practice: pattern }) }],
            };
          }

          case 'error-pattern': {
            if (!category || !matchPattern || !description) {
              return {
                content: [{ type: 'text' as const, text: JSON.stringify({ error: 'MISSING_FIELDS', message: 'error-pattern requires: category, matchPattern, description' }) }],
                isError: true,
              };
            }
            await engine.recordError({
              category,
              tool,
              matchPattern,
              description,
              resolution,
            });
            return {
              content: [{ type: 'text' as const, text: JSON.stringify({ success: true, type: 'error-pattern', description }) }],
            };
          }
        }
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'MEMORY_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
