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

/** Helper to create standard sync mock with configurable merge results */
function setupSyncMock(results: Array<{ path: string; outcome: string; content?: string }>) {
  const mockSync = vi.fn().mockResolvedValue({
    results,
    pendingMeta: { version: '0.5.0', fileHashes: {} },
    oldMeta: { version: '0.4.0', fileHashes: {} },
  });
  vi.mocked(DivergerEngine).mockImplementation(() => ({ sync: mockSync }) as never);
  return mockSync;
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

  it('writes auto-apply files and force-resolves conflicts with ours (default)', async () => {
    vi.mocked(fileExists).mockResolvedValue(true);
    setupSyncMock([
      { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# updated' },
      { path: '/project/.claude/rules/security.md', outcome: 'conflict', content: '# ours' },
    ]);

    const handler = mockServer.getHandler('sync_config')!;
    // Pass explicit defaults since Zod parsing is bypassed in unit tests
    const result = await handler({ projectDir: '/project', resolveConflicts: 'ours', dryRun: false });
    const parsed = JSON.parse(result.content[0].text);

    // Auto-apply file + conflict file both written
    expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledTimes(2);
    expect(parsed.updated).toContain('/project/CLAUDE.md');
    expect(parsed.conflicts).toHaveLength(1);
    expect(parsed.conflicts[0].resolution).toBe('auto-resolved (ours)');
    expect(parsed.summary.autoApply).toBe(1);
    expect(parsed.summary.conflict).toBe(1);
    expect(parsed.resolveConflicts).toBe('ours');
    expect(parsed.dryRun).toBe(false);
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

  // --- New tests for resolveConflicts parameter ---

  describe('resolveConflicts: theirs', () => {
    it('skips writing conflict files and marks as kept-theirs', async () => {
      vi.mocked(fileExists).mockResolvedValue(true);
      setupSyncMock([
        { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# updated' },
        { path: '/project/.claude/rules/security.md', outcome: 'conflict', content: '# ours' },
      ]);

      const handler = mockServer.getHandler('sync_config')!;
      const result = await handler({ projectDir: '/project', resolveConflicts: 'theirs' });
      const parsed = JSON.parse(result.content[0].text);

      // Only auto-apply written, conflict NOT written
      expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledWith('/project/CLAUDE.md', '# updated');
      expect(parsed.conflicts).toHaveLength(1);
      expect(parsed.conflicts[0].resolution).toBe('kept-theirs');
      expect(parsed.resolveConflicts).toBe('theirs');
    });
  });

  describe('resolveConflicts: report', () => {
    it('does not write conflict files but returns conflict content', async () => {
      vi.mocked(fileExists).mockResolvedValue(true);
      setupSyncMock([
        { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# updated' },
        { path: '/project/.claude/rules/security.md', outcome: 'conflict', content: '# ours version' },
      ]);

      const handler = mockServer.getHandler('sync_config')!;
      const result = await handler({ projectDir: '/project', resolveConflicts: 'report' });
      const parsed = JSON.parse(result.content[0].text);

      // Only auto-apply written, conflict NOT written
      expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledTimes(1);
      expect(parsed.conflicts).toHaveLength(1);
      expect(parsed.conflicts[0].resolution).toBe('unresolved');
      expect(parsed.conflicts[0].content).toBe('# ours version');
      expect(parsed.resolveConflicts).toBe('report');
    });

    it('still writes auto-apply and merged files', async () => {
      vi.mocked(fileExists).mockResolvedValue(true);
      setupSyncMock([
        { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# auto' },
        { path: '/project/.claude/rules/merged.md', outcome: 'merged', content: '# merged' },
        { path: '/project/.claude/rules/conflict.md', outcome: 'conflict', content: '# conflict' },
      ]);

      const handler = mockServer.getHandler('sync_config')!;
      await handler({ projectDir: '/project', resolveConflicts: 'report' });

      expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledWith('/project/CLAUDE.md', '# auto');
      expect(vi.mocked(writeFileAtomic)).toHaveBeenCalledWith('/project/.claude/rules/merged.md', '# merged');
    });
  });

  // --- New tests for dryRun parameter ---

  describe('dryRun: true', () => {
    it('does not write any files', async () => {
      vi.mocked(fileExists).mockResolvedValue(true);
      setupSyncMock([
        { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# updated' },
        { path: '/project/.claude/rules/security.md', outcome: 'conflict', content: '# ours' },
      ]);

      const handler = mockServer.getHandler('sync_config')!;
      const result = await handler({ projectDir: '/project', dryRun: true });
      const parsed = JSON.parse(result.content[0].text);

      expect(vi.mocked(writeFileAtomic)).not.toHaveBeenCalled();
      expect(parsed.dryRun).toBe(true);
      expect(parsed.updated).toHaveLength(1);
      expect(parsed.conflicts).toHaveLength(1);
    });

    it('does not save meta', async () => {
      vi.mocked(fileExists).mockResolvedValue(true);
      setupSyncMock([
        { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# updated' },
      ]);

      const handler = mockServer.getHandler('sync_config')!;
      await handler({ projectDir: '/project', dryRun: true });

      expect(vi.mocked(finalizeMetaAfterWrite)).not.toHaveBeenCalled();
      expect(vi.mocked(saveMeta)).not.toHaveBeenCalled();
    });

    it('returns conflict details with preview resolution', async () => {
      vi.mocked(fileExists).mockResolvedValue(true);
      setupSyncMock([
        { path: '/project/.claude/rules/security.md', outcome: 'conflict', content: '# conflict content' },
      ]);

      const handler = mockServer.getHandler('sync_config')!;
      const result = await handler({ projectDir: '/project', dryRun: true });
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed.conflicts[0].resolution).toBe('preview');
      expect(parsed.conflicts[0].content).toBe('# conflict content');
    });

    it('takes precedence over resolveConflicts', async () => {
      vi.mocked(fileExists).mockResolvedValue(true);
      setupSyncMock([
        { path: '/project/CLAUDE.md', outcome: 'auto-apply', content: '# auto' },
        { path: '/project/.claude/rules/security.md', outcome: 'conflict', content: '# ours' },
      ]);

      const handler = mockServer.getHandler('sync_config')!;
      const result = await handler({ projectDir: '/project', dryRun: true, resolveConflicts: 'ours' });
      const parsed = JSON.parse(result.content[0].text);

      // Nothing written even though resolveConflicts is 'ours'
      expect(vi.mocked(writeFileAtomic)).not.toHaveBeenCalled();
      expect(parsed.dryRun).toBe(true);
      expect(parsed.conflicts[0].resolution).toBe('preview');
    });
  });
});
