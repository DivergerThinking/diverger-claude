import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { extractErrorMessage } from '../../core/errors.js';
import { fileExists } from '../../utils/fs.js';
import { LearningEngine } from '../../learning/index.js';
import {
  parseGitHubActionsLog,
  parseGitLabCILog,
  ciErrorsToSessionErrors,
} from '../../learning/ci-error-parser.js';

export function registerIngestCIErrorsTool(server: McpServer): void {
  server.tool(
    'ingest_ci_errors',
    'Ingest errors from CI pipeline (GitHub Actions or GitLab CI) into the learning system',
    {
      projectDir: z.string().describe('Absolute path to the project root directory'),
      source: z.enum(['github-actions', 'gitlab-ci']).describe('CI provider type'),
      logContent: z.string().describe('Raw CI log content (from gh run view --log-failed or GitLab CI job log)'),
    },
    async ({ projectDir, source, logContent }) => {
      if (!(await fileExists(projectDir))) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'DIRECTORY_NOT_FOUND', message: `Directory not found: ${projectDir}` }) }],
          isError: true,
        };
      }

      try {
        // Parse CI logs
        const parseResult = source === 'github-actions'
          ? parseGitHubActionsLog(logContent)
          : parseGitLabCILog(logContent);

        if (parseResult.errors.length === 0) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({
              errorsFound: 0,
              patternsUpdated: 0,
              rulesGenerated: 0,
              message: 'No errors found in CI log',
            }) }],
          };
        }

        // Convert to session errors and process through LearningEngine
        const sessionErrors = ciErrorsToSessionErrors(parseResult.errors);
        const engine = new LearningEngine(projectDir);
        const result = await engine.processSessionErrors(sessionErrors);

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            errorsFound: parseResult.errors.length,
            errorsProcessed: result.errorsProcessed,
            patternsUpdated: result.patternsUpdated,
            rulesGenerated: result.rulesGenerated,
            generatedRulePaths: result.generatedRulePaths,
            source,
            conclusion: parseResult.conclusion,
          }) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'CI_INGESTION_ERROR', message: extractErrorMessage(err) }) }],
          isError: true,
        };
      }
    },
  );
}
