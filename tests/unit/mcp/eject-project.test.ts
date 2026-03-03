import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerEjectProjectTool } from '../../../src/mcp/tools/eject-project.js';

vi.mock('../../../src/utils/fs.js', () => ({
  fileExists: vi.fn(),
}));

vi.mock('../../../src/cli/commands/eject.js', () => ({
  performEject: vi.fn(),
}));

import { fileExists } from '../../../src/utils/fs.js';
import { performEject } from '../../../src/cli/commands/eject.js';

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

describe('eject_project MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    registerEjectProjectTool(mockServer as never);
  });

  it('registers the tool with correct name', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'eject_project',
      expect.any(String),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it('returns error for non-existent directory', async () => {
    vi.mocked(fileExists).mockResolvedValue(false);
    const handler = mockServer.getHandler('eject_project')!;
    const result = await handler({ projectDir: '/nonexistent' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('DIRECTORY_NOT_FOUND');
  });

  it('returns ejected=true with removed files', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performEject).mockResolvedValue({
      ejected: true,
      removed: ['.diverger-meta.json', '.diverger-backup/', '.diverger-cache/'],
    });

    const handler = mockServer.getHandler('eject_project')!;
    const result = await handler({ projectDir: '/project' });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.ejected).toBe(true);
    expect(parsed.removed).toHaveLength(3);
    expect(parsed.removed).toContain('.diverger-meta.json');
  });

  it('returns ejected=false when nothing to remove', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performEject).mockResolvedValue({
      ejected: false,
      removed: [],
    });

    const handler = mockServer.getHandler('eject_project')!;
    const result = await handler({ projectDir: '/project' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.ejected).toBe(false);
    expect(parsed.removed).toHaveLength(0);
  });

  it('passes projectDir as targetDir to performEject', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performEject).mockResolvedValue({ ejected: false, removed: [] });

    const handler = mockServer.getHandler('eject_project')!;
    await handler({ projectDir: '/my/project' });
    expect(vi.mocked(performEject)).toHaveBeenCalledWith({ targetDir: '/my/project' });
  });

  it('catches errors and returns structured error', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performEject).mockRejectedValue(new Error('Eject failed'));

    const handler = mockServer.getHandler('eject_project')!;
    const result = await handler({ projectDir: '/project' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('EJECT_ERROR');
    expect(parsed.message).toBe('Eject failed');
  });
});
