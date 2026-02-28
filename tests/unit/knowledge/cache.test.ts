import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeCache } from '../../../src/knowledge/cache.js';
import type { KnowledgeResult } from '../../../src/core/types.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('KnowledgeCache', () => {
  let tempDir: string;
  let cache: KnowledgeCache;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-cache-test-'));
    cache = new KnowledgeCache(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const makeResult = (overrides: Partial<KnowledgeResult> = {}): KnowledgeResult => ({
    technology: 'React',
    content: 'Use hooks for state management',
    sources: ['https://react.dev'],
    fetchedAt: new Date().toISOString(),
    ttlDays: 30,
    ...overrides,
  });

  it('should return null when cache is empty', async () => {
    const result = await cache.get('React', 'best-practices');
    expect(result).toBeNull();
  });

  it('should store and retrieve a result', async () => {
    const original = makeResult();
    await cache.set(original, 'best-practices');

    const retrieved = await cache.get('React', 'best-practices');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.technology).toBe('React');
    expect(retrieved!.content).toBe('Use hooks for state management');
  });

  it('should return null for expired entries', async () => {
    const expired = makeResult({
      fetchedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
      ttlDays: 30,
    });
    await cache.set(expired, 'best-practices');

    const result = await cache.get('React', 'best-practices');
    expect(result).toBeNull();
  });

  it('should return valid entries within TTL', async () => {
    const recent = makeResult({
      fetchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      ttlDays: 30,
    });
    await cache.set(recent, 'best-practices');

    const result = await cache.get('React', 'best-practices');
    expect(result).not.toBeNull();
  });

  it('should return null for invalid fetchedAt date (A9 fix)', async () => {
    const invalid = makeResult({ fetchedAt: 'not-a-date' });
    await cache.set(invalid, 'best-practices');

    const result = await cache.get('React', 'best-practices');
    expect(result).toBeNull();
  });

  it('should return null for future fetchedAt date (A9 fix)', async () => {
    const future = makeResult({
      fetchedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    await cache.set(future, 'best-practices');

    const result = await cache.get('React', 'best-practices');
    expect(result).toBeNull();
  });

  it('should use different keys for different technologies', async () => {
    const reactResult = makeResult({ technology: 'React', content: 'React tips' });
    const vueResult = makeResult({ technology: 'Vue', content: 'Vue tips' });

    await cache.set(reactResult, 'best-practices');
    await cache.set(vueResult, 'best-practices');

    const react = await cache.get('React', 'best-practices');
    const vue = await cache.get('Vue', 'best-practices');

    expect(react!.content).toBe('React tips');
    expect(vue!.content).toBe('Vue tips');
  });

  it('should use different keys for different aspects', async () => {
    const bp = makeResult({ content: 'best practices' });
    const sec = makeResult({ content: 'security tips' });

    await cache.set(bp, 'best-practices');
    await cache.set(sec, 'security');

    const bpResult = await cache.get('React', 'best-practices');
    const secResult = await cache.get('React', 'security');

    expect(bpResult!.content).toBe('best practices');
    expect(secResult!.content).toBe('security tips');
  });
});
