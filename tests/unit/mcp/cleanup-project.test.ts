import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCleanupProjectTool } from '../../../src/mcp/tools/cleanup-project.js';

vi.mock('../../../src/utils/fs.js', () => ({
  fileExists: vi.fn(),
}));

vi.mock('../../../src/cli/commands/cleanup.js', () => ({
  performCleanup: vi.fn(),
}));

import { fileExists } from '../../../src/utils/fs.js';
import { performCleanup } from '../../../src/cli/commands/cleanup.js';

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

describe('cleanup_project MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    registerCleanupProjectTool(mockServer as never);
  });

  it('registers the tool with correct name', () => {
    expect(mockServer.tool).toHaveBeenCalledWith(
      'cleanup_project',
      expect.any(String),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it('returns error for non-existent directory', async () => {
    vi.mocked(fileExists).mockResolvedValue(false);
    const handler = mockServer.getHandler('cleanup_project')!;
    const result = await handler({ projectDir: '/nonexistent', force: false, dryRun: false });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('DIRECTORY_NOT_FOUND');
  });

  it('returns cleanup result when plugin detected', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performCleanup).mockResolvedValue({
      cleaned: true,
      removed: ['.claude/agents/code-review.md', '.claude/agents/testing.md'],
      skipped: [],
      settingsClean: true,
    });

    const handler = mockServer.getHandler('cleanup_project')!;
    const result = await handler({ projectDir: '/project', force: false, dryRun: false });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.cleaned).toBe(true);
    expect(parsed.removed).toHaveLength(2);
    expect(parsed.settingsClean).toBe(true);
  });

  it('passes force parameter to performCleanup', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performCleanup).mockResolvedValue({
      cleaned: true,
      removed: ['agent.md'],
      skipped: [],
      settingsClean: false,
    });

    const handler = mockServer.getHandler('cleanup_project')!;
    await handler({ projectDir: '/project', force: true, dryRun: false });
    expect(vi.mocked(performCleanup)).toHaveBeenCalledWith({
      targetDir: '/project',
      force: true,
      dryRun: false,
    });
  });

  it('passes dryRun parameter to performCleanup', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performCleanup).mockResolvedValue({
      cleaned: true,
      removed: ['agent.md'],
      skipped: [],
      settingsClean: false,
    });

    const handler = mockServer.getHandler('cleanup_project')!;
    const result = await handler({ projectDir: '/project', force: false, dryRun: true });
    expect(vi.mocked(performCleanup)).toHaveBeenCalledWith({
      targetDir: '/project',
      force: false,
      dryRun: true,
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dryRun).toBe(true);
  });

  it('returns nothing cleaned when no plugin and no force', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performCleanup).mockResolvedValue({
      cleaned: false,
      removed: [],
      skipped: [],
      settingsClean: false,
    });

    const handler = mockServer.getHandler('cleanup_project')!;
    const result = await handler({ projectDir: '/project', force: false, dryRun: false });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.cleaned).toBe(false);
    expect(parsed.removed).toHaveLength(0);
  });

  it('catches errors and returns structured error', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(performCleanup).mockRejectedValue(new Error('Cleanup crashed'));

    const handler = mockServer.getHandler('cleanup_project')!;
    const result = await handler({ projectDir: '/project', force: false, dryRun: false });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('CLEANUP_ERROR');
    expect(parsed.message).toBe('Cleanup crashed');
  });
});
