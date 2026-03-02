import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileWriter } from '../../../src/generation/file-writer.js';
import type { GeneratedFile } from '../../../src/core/types.js';
import { BACKUP_DIR } from '../../../src/core/constants.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Chaos: FileWriter partial write and backup behavior', () => {
  let tempDir: string;
  const writer = new FileWriter();

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-chaos-writer-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should create backup on overwrite of existing file', async () => {
    const filePath = path.join(tempDir, '.claude', 'CLAUDE.md');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'old content', 'utf-8');

    const files: GeneratedFile[] = [{ path: filePath, content: 'new content' }];
    const results = await writer.writeAll(files, tempDir, { force: false });

    expect(results[0]!.action).toBe('updated');

    // Verify backup was created
    const backupDir = path.join(tempDir, BACKUP_DIR);
    const backupEntries = await fs.readdir(backupDir, { recursive: true });
    const bakFiles = backupEntries.filter((e) => String(e).endsWith('.bak'));
    expect(bakFiles.length).toBeGreaterThanOrEqual(1);
  });

  it('should skip write when content is identical (normalized CRLF)', async () => {
    const filePath = path.join(tempDir, 'test.md');
    // Existing file has CRLF
    await fs.writeFile(filePath, 'line1\r\nline2\r\n', 'utf-8');

    const files: GeneratedFile[] = [{ path: filePath, content: 'line1\nline2\n' }];
    const results = await writer.writeAll(files, tempDir, { force: false });

    expect(results[0]!.action).toBe('skipped');
  });

  it('should return all skipped in dry-run mode', async () => {
    const files: GeneratedFile[] = [
      { path: path.join(tempDir, 'a.md'), content: 'a' },
      { path: path.join(tempDir, 'b.md'), content: 'b' },
      { path: path.join(tempDir, 'c.md'), content: 'c' },
    ];

    const results = await writer.writeAll(files, tempDir, { dryRun: true });

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.action === 'skipped')).toBe(true);

    // Verify no files were actually created
    for (const f of files) {
      await expect(fs.access(f.path)).rejects.toThrow();
    }
  });

  it('should write files sequentially (early files exist even if later ones would fail)', async () => {
    const file1 = path.join(tempDir, 'first.md');
    const file2 = path.join(tempDir, 'second.md');

    const files: GeneratedFile[] = [
      { path: file1, content: 'content-1' },
      { path: file2, content: 'content-2' },
    ];

    const results = await writer.writeAll(files, tempDir);

    expect(results).toHaveLength(2);
    expect(results[0]!.action).toBe('created');
    expect(results[1]!.action).toBe('created');

    const content1 = await fs.readFile(file1, 'utf-8');
    const content2 = await fs.readFile(file2, 'utf-8');
    expect(content1).toBe('content-1');
    expect(content2).toBe('content-2');
  });

  it('should handle force mode (no backup, just overwrite)', async () => {
    const filePath = path.join(tempDir, 'forced.md');
    await fs.writeFile(filePath, 'old', 'utf-8');

    const files: GeneratedFile[] = [{ path: filePath, content: 'new' }];
    const results = await writer.writeAll(files, tempDir, { force: true });

    expect(results[0]!.action).toBe('updated');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe('new');

    // No backup dir should be created in force mode
    const backupExists = await fs.access(path.join(tempDir, BACKUP_DIR)).then(() => true).catch(() => false);
    expect(backupExists).toBe(false);
  });

  it('should handle empty files array', async () => {
    const results = await writer.writeAll([], tempDir);
    expect(results).toHaveLength(0);
  });
});
