import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiffEngine } from '../../../src/generation/diff-engine.js';
import type { GeneratedFile } from '../../../src/core/types.js';

vi.mock('../../../src/utils/fs.js', () => ({
  readFileOrNull: vi.fn(),
}));

import { readFileOrNull } from '../../../src/utils/fs.js';
const mockReadFileOrNull = vi.mocked(readFileOrNull);

describe('DiffEngine', () => {
  const engine = new DiffEngine();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return create diff when file does not exist on disk', async () => {
    mockReadFileOrNull.mockResolvedValue(null);

    const file: GeneratedFile = { path: '/project/.claude/CLAUDE.md', content: '# Hello' };
    const diffs = await engine.computeDiffs([file]);

    expect(diffs).toHaveLength(1);
    expect(diffs[0]!.type).toBe('create');
    expect(diffs[0]!.path).toBe('/project/.claude/CLAUDE.md');
    expect(diffs[0]!.diff).toContain('# Hello');
  });

  it('should return null (no diff) when file content matches disk', async () => {
    mockReadFileOrNull.mockResolvedValue('# Same content');

    const file: GeneratedFile = { path: '/project/.claude/CLAUDE.md', content: '# Same content' };
    const diffs = await engine.computeDiffs([file]);

    expect(diffs).toHaveLength(0);
  });

  it('should normalize CRLF when comparing content', async () => {
    mockReadFileOrNull.mockResolvedValue('# Hello\r\nWorld');

    const file: GeneratedFile = { path: '/project/file.md', content: '# Hello\nWorld' };
    const diffs = await engine.computeDiffs([file]);

    expect(diffs).toHaveLength(0);
  });

  it('should return modify diff when content differs', async () => {
    mockReadFileOrNull.mockResolvedValue('# Old content');

    const file: GeneratedFile = { path: '/project/.claude/CLAUDE.md', content: '# New content' };
    const diffs = await engine.computeDiffs([file]);

    expect(diffs).toHaveLength(1);
    expect(diffs[0]!.type).toBe('modify');
    expect(diffs[0]!.diff).toContain('Old content');
    expect(diffs[0]!.diff).toContain('New content');
  });

  it('should handle multiple files with mixed results', async () => {
    mockReadFileOrNull
      .mockResolvedValueOnce(null)           // file1: new
      .mockResolvedValueOnce('# Same')       // file2: same
      .mockResolvedValueOnce('# Different'); // file3: modified

    const files: GeneratedFile[] = [
      { path: '/p/a.md', content: '# New file' },
      { path: '/p/b.md', content: '# Same' },
      { path: '/p/c.md', content: '# Changed' },
    ];

    const diffs = await engine.computeDiffs(files);

    expect(diffs).toHaveLength(2);
    expect(diffs[0]!.type).toBe('create');
    expect(diffs[1]!.type).toBe('modify');
  });

  it('should return empty array for empty file list', async () => {
    const diffs = await engine.computeDiffs([]);
    expect(diffs).toHaveLength(0);
  });
});
