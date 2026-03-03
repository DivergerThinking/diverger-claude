import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerSyncConfigTool } from '../../../src/mcp/tools/sync-config.js';

vi.mock('../../../src/core/engine.js', () => ({
  DivergerEngine: vi.fn().mockImplementation(() => ({
    sync: vi.fn(),
  })),
}));

vi.mock('../../../src/utils/fs.js', () => ({
  fileExists: vi.fn(),
  writeFileAtomic: vi.fn(),
}));

vi.mock('../../../src/governance/history.js', () => ({
  saveMeta: vi.fn(),
  finalizeMetaAfterWrite: vi.fn().mockReturnValue({ version: '0.5.0', fileHashes: {} }),
}));

import { DivergerEngine } from '../../../src/core/engine.js';
import { fileExists, writeFileAtomic } from '../../../src/utils/fs.js';
import { saveMeta, finalizeMetaAfterWrite } from '../../../src/governance/history.js';

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

describe('sync_config MCP tool', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = createMockServer();
    registerSyncConfigTool(mockServer as never);
  });

  it('returns error for non-existent directory', async () => {
    vi.mocked(fileExists).mockResolvedValue(false);
    const handler = mockServer.getHandler('sync_config')!;
    const result = await handler({ projectDir: '/nonexistent' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('DIRECTORY_NOT_FOUND');
  });

  it('returns no-changes for up-to-date config', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockSync = vi.fn().mockResolvedValue({
      results: [{ path: '/project/CLAUDE.md', outcome: 'skip' }],
      pendingMeta: { version: '0.5.0', fileHashes: {} },
      oldMeta: null,
    });
    vi.mocked(DivergerEngine).mockImplementation(() => ({ sync: mockSync }) as never);

    const handler = mockServer.getHandler('sync_config')!;
    const result = await handler({ projectDir: '/project' });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.updated).toHaveLength(0);
    expect(parsed.conflicts).toHaveLength(0);
    expect(parsed.summary.skip).toBe(1);
  });

  it('writes auto-apply files and force-resolves conflicts', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const mockSync = vi.fn().mockResolvedValue({
      results: [
        { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# updated' },
        { path: '/project/.claude/rules/security.md', outcome: 'conflict', content: '# ours' },
      ],
      pendingMeta: { version: '0.5.0', fileHashes: {} },
      oldMeta: { version: '0.4.0', fileHashes: {} },
    });
    vi.mocked(DivergerEngine).mockImplementation(() => ({ sync: mockSync }) as never);

    const handler = mockServer.getHandler('sync_config')!;
    const result = await handler({ projectDir: '/project' });
    const parsed = JSON.parse(result.content[0].text);

    // Auto-apply file + conflict file both written
    expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledTimes(2);
    expect(parsed.updated).toContain('/project/CLAUDE.md');
    expect(parsed.conflicts).toHaveLength(1);
    expect(parsed.conflicts[0].resolution).toBe('auto-resolved (ours)');
    expect(parsed.summary.autoApply).toBe(1);
    expect(parsed.summary.conflict).toBe(1);
  });

  it('calls finalizeMetaAfterWrite and saveMeta', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    const pendingMeta = { version: '0.5.0', fileHashes: {} };
    const oldMeta = { version: '0.4.0', fileHashes: {} };
    vi.mocked(DivergerEngine).mockImplementation(() => ({
      sync: vi.fn().mockResolvedValue({
        results: [{ path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# test' }],
        pendingMeta,
        oldMeta,
      }),
    }) as never);

    const handler = mockServer.getHandler('sync_config')!;
    await handler({ projectDir: '/project' });

    expect(vi.mocked(finalizeMetaAfterWrite)).toHaveBeenCalledWith(
      pendingMeta,
      expect.arrayContaining([expect.objectContaining({ path: '/project/CLAUDE.md' })]),
      oldMeta,
      '/project',
    );
    expect(vi.mocked(saveMeta)).toHaveBeenCalled();
  });

  it('catches errors and returns structured error', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    vi.mocked(DivergerEngine).mockImplementation(() => ({
      sync: vi.fn().mockRejectedValue(new Error('Sync failed')),
    }) as never);

    const handler = mockServer.getHandler('sync_config')!;
    const result = await handler({ projectDir: '/project' });
    expect(result.isError).toBe(true);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe('SYNC_ERROR');
  });
});
