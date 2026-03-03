import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerGetProfileTool } from '../../../src/mcp/tools/get-profile.js';

vi.mock('../../../src/profiles/index.js', () => ({
  getProfileById: vi.fn(),
}));

import { getProfileById } from '../../../src/profiles/index.js';

type ToolHandler = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>;

function createMockServer() {
  const tools: Map<string, ToolHandler> = new Map();
  return {
    tool: vi.fn((name: string, _desc: string, _schema: unknown, handler: ToolHandler) => {
      tools.set(name, handler);
    }),
    getHandler: (name: string) => tools.get(name),
  };
}

const mockProfile = {
  id: 'languages/typescript',
  name: 'TypeScript',
  layer: 10,
  technologyIds: ['typescript'],
  contributions: {
    claudeMd: [{ heading: 'TypeScript', content: '# TypeScript', order: 10 }],
    settings: { permissions: { allow: ['Bash(npx tsc*)'] } },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
  },
};

describe('get_profile MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    registerGetProfileTool(mockServer as never);
  });

  it('returns full profile for valid ID', async () => {
    vi.mocked(getProfileById).mockReturnValue(mockProfile as never);
    const handler = mockServer.getHandler('get_profile')!;
    const result = await handler({ profileId: 'languages/typescript' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBe('languages/typescript');
    expect(parsed.contributions).toBeDefined();
    expect(parsed.contributions.claudeMd).toHaveLength(1);
  });

  it('returns error for unknown profile ID', async () => {
    vi.mocked(getProfileById).mockReturnValue(undefined);
    const handler = mockServer.getHandler('get_profile')!;
    const result = await handler({ profileId: 'nonexistent/profile' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('PROFILE_NOT_FOUND');
    expect(parsed.message).toContain('nonexistent/profile');
  });
});
