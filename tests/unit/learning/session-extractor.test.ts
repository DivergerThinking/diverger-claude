import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { extractSessionLearnings } from '../../../src/learning/session-extractor.js';
import { createDefaultMemoryStore } from '../../../src/memory/store.js';
import type { MemoryStore } from '../../../src/core/types.js';

describe('Session Extractor', () => {
  let store: MemoryStore;
  let tempDir: string;

  beforeEach(async () => {
    store = createDefaultMemoryStore();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-learning-'));
    await fs.mkdir(path.join(tempDir, '.claude', 'rules', 'learned'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  it('should return empty result for no errors', async () => {
    const result = await extractSessionLearnings(tempDir, store, []);
    expect(result.errorsProcessed).toBe(0);
    expect(result.patternsUpdated).toBe(0);
    expect(result.rulesGenerated).toBe(0);
  });

  it('should classify and store errors', async () => {
    const errors = [
      { message: 'EACCES: permission denied, open /dist/main.js', tool: 'Write' },
      { message: 'TS2345: Argument type mismatch' },
    ];

    const result = await extractSessionLearnings(tempDir, store, errors);
    expect(result.errorsProcessed).toBe(2);
    expect(result.patternsUpdated).toBe(2);
    expect(store.errorPatterns.length).toBeGreaterThan(0);
  });

  it('should classify unknown errors as unclassified with low confidence', async () => {
    const errors = [
      { message: 'Everything is fine actually' },
    ];

    const result = await extractSessionLearnings(tempDir, store, errors);
    expect(result.errorsProcessed).toBe(1);
    expect(result.patternsUpdated).toBe(1); // Now classified as unclassified fallback
    const unclassified = store.errorPatterns.find((p) => p.matchPattern === 'unclassified');
    expect(unclassified).toBeDefined();
  });

  it('should generate rules when threshold is met', async () => {
    // Add the same error 3 times to reach threshold
    const errors = [
      { message: 'EACCES: permission denied /file1' },
      { message: 'EACCES: permission denied /file2' },
      { message: 'EACCES: permission denied /file3' },
    ];

    const result = await extractSessionLearnings(tempDir, store, errors);
    expect(result.rulesGenerated).toBe(1);
    expect(result.generatedRulePaths.length).toBe(1);

    // Verify the rule file was created
    const ruleContent = await fs.readFile(result.generatedRulePaths[0], 'utf-8');
    expect(ruleContent).toContain('permission denied');
    expect(ruleContent).toContain('3 occurrences');
  });

  it('should not re-generate rules for already-generated patterns', async () => {
    store.errorPatterns.push({
      id: 'test-pattern',
      category: 'tool-error',
      matchPattern: 'EACCES',
      description: 'Permission denied',
      occurrences: 5,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      ruleGenerated: true, // Already generated
    });

    const errors = [{ message: 'EACCES: again' }];
    const result = await extractSessionLearnings(tempDir, store, errors);
    expect(result.rulesGenerated).toBe(0);
  });
});
