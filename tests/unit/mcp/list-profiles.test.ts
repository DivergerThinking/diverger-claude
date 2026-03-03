import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerListProfilesTool } from '../../../src/mcp/tools/list-profiles.js';

vi.mock('../../../src/profiles/index.js', () => ({
  getAllProfiles: vi.fn(),
}));

import { getAllProfiles } from '../../../src/profiles/index.js';

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

const mockProfiles = [
  { id: 'base/universal', name: 'Universal', layer: 0, technologyIds: [], contributions: {} },
  { id: 'languages/typescript', name: 'TypeScript', layer: 10, technologyIds: ['typescript'], contributions: {} },
  { id: 'frameworks/react', name: 'React', layer: 20, technologyIds: ['react'], dependsOn: ['languages/typescript'], contributions: {} },
  { id: 'testing/vitest', name: 'Vitest', layer: 30, technologyIds: ['vitest'], contributions: {} },
  { id: 'infra/docker', name: 'Docker', layer: 40, technologyIds: ['docker'], contributions: {} },
];

describe('list_profiles MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllProfiles).mockReturnValue(mockProfiles as never);
    mockServer = createMockServer();
    registerListProfilesTool(mockServer as never);
  });

  it('returns all profiles as summaries', async () => {
    const handler = mockServer.getHandler('list_profiles')!;
    const result = await handler({});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(5);
    expect(parsed.profiles).toHaveLength(5);
    // Verify summary format (no contributions)
    expect(parsed.profiles[0]).toEqual({
      id: 'base/universal',
      name: 'Universal',
      layer: 0,
      layerName: 'base',
      technologyIds: [],
    });
  });

  it('includes dependsOn when present', async () => {
    const handler = mockServer.getHandler('list_profiles')!;
    const result = await handler({});
    const parsed = JSON.parse(result.content[0].text);
    const react = parsed.profiles.find((p: { id: string }) => p.id === 'frameworks/react');
    expect(react.dependsOn).toEqual(['languages/typescript']);
  });

  it('filters by layer number', async () => {
    const handler = mockServer.getHandler('list_profiles')!;
    const result = await handler({ layer: 20 });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(1);
    expect(parsed.profiles[0].id).toBe('frameworks/react');
  });

  it('returns empty for non-existent layer', async () => {
    const handler = mockServer.getHandler('list_profiles')!;
    const result = await handler({ layer: 99 });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.count).toBe(0);
    expect(parsed.profiles).toHaveLength(0);
  });
});
