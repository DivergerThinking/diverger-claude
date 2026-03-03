import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DivergerEngine } from '../../core/engine.js';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists, writeFileAtomic } from '../../utils/fs.js';
import { saveMeta, finalizeMetaAfterWrite } from '../../governance/history.js';

export function registerSyncConfigTool(server: McpServer): void {
  server.tool(
    'sync_config',
    'Re-analyze project and update .claude/ configuration with three-way merge',
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
        const { results: mergeResults, pendingMeta, oldMeta } = await engine.sync({
          projectRoot: projectDir,
          options: { output: 'quiet', force: true, dryRun: false, targetDir: projectDir },
        });

        // Write auto-apply and merged files
        const writtenFiles: Array<{ path: string; content: string }> = [];
        for (const result of mergeResults) {
          if ((result.outcome === 'auto-apply' || result.outcome === 'merged') && result.content) {
            await writeFileAtomic(result.path, result.content);
            writtenFiles.push({ path: result.path, content: result.content });
          }
        }

        // Force-resolve conflicts (write "ours" version)
        const conflicts = mergeResults.filter((r) => r.outcome === 'conflict');
        for (const conflict of conflicts) {
          if (conflict.content) {
            await writeFileAtomic(conflict.path, conflict.content);
            writtenFiles.push({ path: conflict.path, content: conflict.content });
          }
        }

        // Finalize meta and save
        const finalMeta = finalizeMetaAfterWrite(pendingMeta, writtenFiles, oldMeta, projectDir);
        await saveMeta(projectDir, finalMeta);

        // Build summary
        const summary = {
          skip: mergeResults.filter((r) => r.outcome === 'skip').length,
          autoApply: mergeResults.filter((r) => r.outcome === 'auto-apply').length,
          keep: mergeResults.filter((r) => r.outcome === 'keep').length,
          merged: mergeResults.filter((r) => r.outcome === 'merged').length,
          conflict: mergeResults.filter((r) => r.outcome === 'conflict').length,
          error: mergeResults.filter((r) => r.outcome === 'error').length,
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              updated: mergeResults
                .filter((r) => r.outcome === 'auto-apply' || r.outcome === 'merged')
                .map((r) => r.path),
              conflicts: conflicts.map((r) => ({
                path: r.path,
                resolution: 'auto-resolved (ours)',
              })),
              skipped: mergeResults
                .filter((r) => r.outcome === 'skip' || r.outcome === 'keep')
                .map((r) => r.path),
              summary,
            }),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'SYNC_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
