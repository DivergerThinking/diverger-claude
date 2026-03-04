import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { GovernanceLevel } from '../../core/types.js';
import { DivergerEngine } from '../../core/engine.js';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { createMeta, saveMeta } from '../../governance/history.js';
import { extractTrackedDeps } from '../../governance/index.js';
import { toRelativeMetaKey } from '../../utils/paths.js';

export function registerGenerateConfigTool(server: McpServer): void {
  server.tool(
    'generate_config',
    'Generate .claude/ configuration for a project based on its detected stack',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
      pluginMode: z.boolean().optional().default(true).describe('Exclude universal components provided by plugin (default: true)'),
      dryRun: z.boolean().optional().default(false).describe('Show what would be generated without writing (default: false)'),
      fetchKnowledge: z.boolean().optional().default(false).describe('Fetch best practices from Claude API (requires ANTHROPIC_API_KEY, default: false — profiles include embedded best practices)'),
    },
    async ({ projectDir, pluginMode, dryRun, fetchKnowledge }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        const engine = new DivergerEngine();
        const ctx = {
          projectRoot: projectDir,
          options: {
            output: 'quiet' as const,
            force: true,
            dryRun,
            targetDir: projectDir,
            pluginMode,
          },
          // C1: Knowledge is opt-in. When enabled, grant blanket permission for all techs.
          ...(fetchKnowledge ? { onKnowledgePermission: async () => true } : {}),
        };

        const result = await engine.init(ctx);

        if (dryRun) {
          const diffs = await engine.computeDiff(result, projectDir);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                dryRun: true,
                diffs: diffs.map((d) => ({ path: d.path, type: d.type })),
                appliedProfiles: result.config.appliedProfiles,
                detectedStack: result.detection.technologies.map((t) => t.name),
              }),
            }],
          };
        }

        // Write files
        const writeResults = await engine.writeFiles(result.files, projectDir, { force: true });

        // Save meta
        const ruleGovernance: Record<string, GovernanceLevel> = {};
        for (const file of result.files) {
          if (file.governance) {
            ruleGovernance[toRelativeMetaKey(file.path, projectDir)] = file.governance;
          }
        }
        const trackedDeps = extractTrackedDeps(result.detection.technologies);
        const meta = createMeta(
          result.files,
          result.detection.technologies.map((t) => t.id),
          result.config.appliedProfiles,
          ruleGovernance,
          trackedDeps,
          projectDir,
        );
        await saveMeta(projectDir, meta);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              filesGenerated: writeResults.map((wr) => ({ path: wr.path, action: wr.action })),
              summary: `Generated ${writeResults.length} files for ${result.detection.technologies.length} technologies`,
              appliedProfiles: result.config.appliedProfiles,
              detectedStack: result.detection.technologies.map((t) => t.name),
            }),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'GENERATION_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
