import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileWriter } from '../../../src/generation/file-writer.js';
import type { GeneratedFile } from '../../../src/core/types.js';

vi.mock('../../../src/utils/fs.js', () => ({
  readFileOrNull: vi.fn(),
  writeFileAtomic: vi.fn(),
  ensureDir: vi.fn(),
  assertPathWithin: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  default: {
    copyFile: vi.fn(),
  },
}));

import { readFileOrNull, writeFileAtomic } from '../../../src/utils/fs.js';

const mockReadFileOrNull = vi.mocked(readFileOrNull);
const mockWriteFileAtomic = vi.mocked(writeFileAtomic);

describe('FileWriter', () => {
  const writer = new FileWriter();
  const projectRoot = '/project';

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteFileAtomic.mockResolvedValue(undefined);
  });

  describe('writeAll', () => {
    it('should skip all files in dryRun mode', async () => {
      const files: GeneratedFile[] = [
        { path: '/project/.claude/CLAUDE.md', content: '# Hello' },
        { path: '/project/.claude/settings.json', content: '{}' },
      ];

      const results = await writer.writeAll(files, projectRoot, { dryRun: true });

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.action === 'skipped')).toBe(true);
      expect(mockWriteFileAtomic).not.toHaveBeenCalled();
    });

    it('should create new files when they do not exist', async () => {
      mockReadFileOrNull.mockResolvedValue(null);

      const files: GeneratedFile[] = [
        { path: '/project/.claude/CLAUDE.md', content: '# Hello' },
      ];

      const results = await writer.writeAll(files, projectRoot);

      expect(results).toHaveLength(1);
      expect(results[0]!.action).toBe('created');
      expect(mockWriteFileAtomic).toHaveBeenCalledWith('/project/.claude/CLAUDE.md', '# Hello');
    });

    it('should skip files with identical content', async () => {
      mockReadFileOrNull.mockResolvedValue('# Hello');

      const files: GeneratedFile[] = [
        { path: '/project/.claude/CLAUDE.md', content: '# Hello' },
      ];

      const results = await writer.writeAll(files, projectRoot);

      expect(results).toHaveLength(1);
      expect(results[0]!.action).toBe('skipped');
      expect(mockWriteFileAtomic).not.toHaveBeenCalled();
    });

    it('should normalize CRLF when comparing content', async () => {
      mockReadFileOrNull.mockResolvedValue('# Hello\r\nWorld');

      const files: GeneratedFile[] = [
        { path: '/project/file.md', content: '# Hello\nWorld' },
      ];

      const results = await writer.writeAll(files, projectRoot);

      expect(results[0]!.action).toBe('skipped');
    });

    it('should update files with different content (with force)', async () => {
      mockReadFileOrNull.mockResolvedValue('# Old');

      const files: GeneratedFile[] = [
        { path: '/project/.claude/CLAUDE.md', content: '# New' },
      ];

      const results = await writer.writeAll(files, projectRoot, { force: true });

      expect(results[0]!.action).toBe('updated');
      expect(mockWriteFileAtomic).toHaveBeenCalledWith('/project/.claude/CLAUDE.md', '# New');
    });

    it('should handle empty file list', async () => {
      const results = await writer.writeAll([], projectRoot);
      expect(results).toHaveLength(0);
    });

    it('should process multiple files sequentially', async () => {
      mockReadFileOrNull
        .mockResolvedValueOnce(null)        // file1: new
        .mockResolvedValueOnce('# Same');   // file2: same content

      const files: GeneratedFile[] = [
        { path: '/project/a.md', content: '# New' },
        { path: '/project/b.md', content: '# Same' },
      ];

      const results = await writer.writeAll(files, projectRoot);

      expect(results[0]!.action).toBe('created');
      expect(results[1]!.action).toBe('skipped');
    });
  });
});
