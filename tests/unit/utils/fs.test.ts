import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileOrNull, writeFileAtomic } from '../../../src/utils/fs.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('readFileOrNull', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-fs-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return null for non-existent file', async () => {
    const result = await readFileOrNull(path.join(tempDir, 'nonexistent.txt'));
    expect(result).toBeNull();
  });

  it('should return file content for existing file', async () => {
    const filePath = path.join(tempDir, 'test.txt');
    await fs.writeFile(filePath, 'hello world', 'utf-8');
    const result = await readFileOrNull(filePath);
    expect(result).toBe('hello world');
  });

  it('should strip UTF-8 BOM from file content', async () => {
    const filePath = path.join(tempDir, 'bom.txt');
    // Write a file with UTF-8 BOM (U+FEFF = EF BB BF in UTF-8)
    const bom = '\uFEFF';
    await fs.writeFile(filePath, bom + '{"key": "value"}', 'utf-8');
    const result = await readFileOrNull(filePath);
    expect(result).toBe('{"key": "value"}');
    // Verify the BOM was stripped (first char should not be U+FEFF)
    expect(result!.charCodeAt(0)).not.toBe(0xFEFF);
  });

  it('should not alter content without BOM', async () => {
    const filePath = path.join(tempDir, 'nobom.txt');
    const content = '# Markdown without BOM';
    await fs.writeFile(filePath, content, 'utf-8');
    const result = await readFileOrNull(filePath);
    expect(result).toBe(content);
  });

  it('should handle empty file', async () => {
    const filePath = path.join(tempDir, 'empty.txt');
    await fs.writeFile(filePath, '', 'utf-8');
    const result = await readFileOrNull(filePath);
    expect(result).toBe('');
  });

  it('should handle file with only BOM', async () => {
    const filePath = path.join(tempDir, 'bomonly.txt');
    await fs.writeFile(filePath, '\uFEFF', 'utf-8');
    const result = await readFileOrNull(filePath);
    expect(result).toBe('');
  });

  it('should handle BOM + CRLF content correctly', async () => {
    const filePath = path.join(tempDir, 'bomcrlf.txt');
    await fs.writeFile(filePath, '\uFEFFline1\r\nline2\r\n', 'utf-8');
    const result = await readFileOrNull(filePath);
    expect(result).toBe('line1\r\nline2\r\n');
    expect(result!.startsWith('line1')).toBe(true);
  });
});

describe('writeFileAtomic', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-fs-write-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should write content to file', async () => {
    const filePath = path.join(tempDir, 'output.txt');
    await writeFileAtomic(filePath, 'test content');
    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('test content');
  });

  it('should create parent directories if needed', async () => {
    const filePath = path.join(tempDir, 'sub', 'dir', 'output.txt');
    await writeFileAtomic(filePath, 'nested content');
    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('nested content');
  });

  it('should overwrite existing file', async () => {
    const filePath = path.join(tempDir, 'existing.txt');
    await fs.writeFile(filePath, 'old content', 'utf-8');
    await writeFileAtomic(filePath, 'new content');
    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('new content');
  });
});
