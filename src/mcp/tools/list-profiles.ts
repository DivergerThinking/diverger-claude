import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllProfiles } from '../../profiles/index.js';
import { toProfileSummary } from '../types.js';

export function registerListProfilesTool(server: McpServer): void {
  server.tool(
    'list_profiles',
    'List all available diverger-claude profiles (optionally filtered by layer)',
    {
      layer: z.number().optional().describe('Filter by layer number: 0=base, 10=language, 20=framework, 30=testing, 40=infra'),
    },
    async ({ layer }) => {
      const allProfiles = getAllProfiles();
      const filtered = layer !== undefined
        ? allProfiles.filter((p) => p.layer === layer)
        : allProfiles;

      const summaries = filtered.map(toProfileSummary);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            profiles: summaries,
            count: summaries.length,
          }),
        }],
      };
    },
  );
}
