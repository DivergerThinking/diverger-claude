import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getProfileById } from '../../profiles/index.js';

export function registerGetProfileTool(server: McpServer): void {
  server.tool(
    'get_profile',
    'Get full details of a specific diverger-claude profile by ID',
    { profileId: z.string().describe('Profile ID (e.g. "languages/typescript", "base/universal")') },
    async ({ profileId }) => {
      const profile = getProfileById(profileId);

      if (!profile) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'PROFILE_NOT_FOUND', message: `Profile not found: ${profileId}` }) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(profile) }],
      };
    },
  );
}
