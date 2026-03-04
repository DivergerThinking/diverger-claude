import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DivergerEngine } from '../../core/engine.js';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';

export function registerDetectStackTool(server: McpServer): void {
  server.tool(
    'detect_stack',
    'Detect the technology stack of a project directory',
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
        const detection = await engine.detect({
          projectRoot: projectDir,
          options: { output: 'quiet', force: true, dryRun: false, targetDir: projectDir },
        });

        // Strip evidence and profileIds from technologies (too verbose for MCP)
        const technologies = detection.technologies.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          version: t.version,
          confidence: t.confidence,
        }));

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              technologies,
              monorepo: detection.monorepo ?? null,
              architecture: detection.architecture ?? null,
              rootDir: detection.rootDir,
            }),
          }],
        };
      } catch (err: unknown) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DETECTION_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
