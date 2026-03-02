import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileAtomic } from '../../../src/utils/fs.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Chaos: writeFileAtomic resilience', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-chaos-atomic-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should leave no orphaned temp files after successful write', async () => {
    const filePath = path.join(tempDir, 'output.txt');
    await writeFileAtomic(filePath, 'hello');

    const entries = await fs.readdir(tempDir);
    expect(entries).toEqual(['output.txt']);
    expect(entries.filter((e) => e.includes('.tmp.'))).toHaveLength(0);
  });

  it('should handle concurrent writes to different files without corruption', async () => {
    // Concurrent writes to SAME file cause EPERM on Windows (file locking).
    // Instead, test concurrent writes to different files — verifies no temp file collisions.
    const contents = Array.from({ length: 10 }, (_, i) => ({
      path: path.join(tempDir, `file-${i}.txt`),
      content: `content-${i}`,
    }));

    await Promise.all(contents.map((c) => writeFileAtomic(c.path, c.content)));

    for (const c of contents) {
      const result = await fs.readFile(c.path, 'utf-8');
      expect(result).toBe(c.content);
    }

    // No orphaned temp files
    const entries = await fs.readdir(tempDir);
    expect(entries.filter((e) => e.includes('.tmp.'))).toHaveLength(0);
  });

  it('should handle large content (1MB+)', async () => {
    const filePath = path.join(tempDir, 'large.txt');
    const largeContent = 'x'.repeat(1_100_000);
    await writeFileAtomic(filePath, largeContent);

    const result = await fs.readFile(filePath, 'utf-8');
    expect(result.length).toBe(1_100_000);
    expect(result).toBe(largeContent);
  });

  it('should create deeply nested directories', async () => {
    const filePath = path.join(tempDir, 'a', 'b', 'c', 'd', 'deep.txt');
    await writeFileAtomic(filePath, 'deep');

    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('deep');
  });

  it('should preserve unicode content (emoji, CJK, accented)', async () => {
    const filePath = path.join(tempDir, 'unicode.txt');
    const unicodeContent = '🚀 Configuración 日本語 naïve café résumé';
    await writeFileAtomic(filePath, unicodeContent);

    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe(unicodeContent);
  });

  it('should leave no temp files after multiple sequential writes', async () => {
    const filePath = path.join(tempDir, 'sequential.txt');
    for (let i = 0; i < 5; i++) {
      await writeFileAtomic(filePath, `iteration-${i}`);
    }

    const entries = await fs.readdir(tempDir);
    expect(entries.filter((e) => e.includes('.tmp.'))).toHaveLength(0);
    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('iteration-4');
  });
});
