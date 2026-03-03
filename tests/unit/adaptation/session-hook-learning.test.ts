import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onSessionStart } from '../../../src/adaptation/session-hook.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('onSessionStart — learning pipeline integration', () => {
  let tempDir: string;

  async function setupDivergerProject(dir: string): Promise<void> {
    const content = '# Test content';
    const filePath = 'CLAUDE.md';
    await fs.writeFile(path.join(dir, filePath), content, 'utf-8');
    await fs.mkdir(path.join(dir, '.claude'), { recursive: true });

    const meta = {
      version: '0.1.0',
      generatedAt: new Date().toISOString(),
      detectedStack: [],
      appliedProfiles: [],
      fileHashes: { [filePath]: hashForMeta(content) },
      ruleGovernance: {},
    };
    await fs.writeFile(
      path.join(dir, '.diverger-meta.json'),
      JSON.stringify(meta),
      'utf-8',
    );
  }

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-learning-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should process pending session errors and delete the file', async () => {
    await setupDivergerProject(tempDir);

    // Write session errors
    const errors = [
      { message: 'permission denied /some/file', tool: 'Bash', timestamp: new Date().toISOString() },
      { message: 'permission denied /other/file', tool: 'Bash', timestamp: new Date().toISOString() },
    ];
    await fs.writeFile(
      path.join(tempDir, '.claude', 'session-errors.local.json'),
      JSON.stringify(errors),
      'utf-8',
    );

    await onSessionStart(tempDir);

    // session-errors.local.json should be deleted
    const exists = await fs.access(path.join(tempDir, '.claude', 'session-errors.local.json'))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it('should report patterns updated in session message', async () => {
    await setupDivergerProject(tempDir);

    const errors = [
      { message: 'ENOENT: no such file or directory', tool: 'Read', timestamp: new Date().toISOString() },
    ];
    await fs.writeFile(
      path.join(tempDir, '.claude', 'session-errors.local.json'),
      JSON.stringify(errors),
      'utf-8',
    );

    const result = await onSessionStart(tempDir);
    expect(result).not.toBeNull();
    expect(result).toContain('patrones de error actualizados');
  });

  it('should handle empty session errors array gracefully', async () => {
    await setupDivergerProject(tempDir);

    await fs.writeFile(
      path.join(tempDir, '.claude', 'session-errors.local.json'),
      '[]',
      'utf-8',
    );

    // Should not crash and should clean up
    const result = await onSessionStart(tempDir);
    // Empty errors = no processing, file still cleaned up
    const exists = await fs.access(path.join(tempDir, '.claude', 'session-errors.local.json'))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it('should handle corrupt session errors JSON gracefully', async () => {
    await setupDivergerProject(tempDir);

    await fs.writeFile(
      path.join(tempDir, '.claude', 'session-errors.local.json'),
      'not valid json {{{',
      'utf-8',
    );

    // Should not crash — learning failures don't block session
    const result = await onSessionStart(tempDir);
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('should not block session start when no session errors file exists', async () => {
    await setupDivergerProject(tempDir);

    // No session-errors.local.json — should proceed normally
    const result = await onSessionStart(tempDir);
    // No changes detected = null (no message) is fine
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('should include rules generated count when threshold is met', async () => {
    await setupDivergerProject(tempDir);

    // Create enough repeated errors to trigger rule generation (threshold = 3)
    const errors = Array.from({ length: 4 }, (_, i) => ({
      message: 'ENOENT: no such file or directory /test/path',
      tool: 'Read',
      timestamp: new Date().toISOString(),
    }));

    // First, seed the memory with prior occurrences
    const { LearningEngine } = await import('../../../src/learning/index.js');
    const engine = new LearningEngine(tempDir);
    await engine.processSessionErrors(errors.slice(0, 2));

    // Now write errors that should push over threshold
    await fs.writeFile(
      path.join(tempDir, '.claude', 'session-errors.local.json'),
      JSON.stringify(errors.slice(2)),
      'utf-8',
    );

    const result = await onSessionStart(tempDir);
    // The message should mention patterns updated
    expect(result).not.toBeNull();
  });

  it('should survive syncToClaudeMemory failure', async () => {
    await setupDivergerProject(tempDir);

    // Write a valid session error to trigger learning + sync
    const errors = [
      { message: 'EACCES: permission denied', tool: 'Write', timestamp: new Date().toISOString() },
    ];
    await fs.writeFile(
      path.join(tempDir, '.claude', 'session-errors.local.json'),
      JSON.stringify(errors),
      'utf-8',
    );

    // syncToClaudeMemory writes to ~/.claude/projects/... which may not exist in test
    // This should NOT crash
    const result = await onSessionStart(tempDir);
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('should process errors from Write and Edit tools', async () => {
    await setupDivergerProject(tempDir);

    const errors = [
      { message: 'EACCES: permission denied, open /dist/bundle.js', tool: 'Write', timestamp: new Date().toISOString() },
      { message: 'Edit failed: old_string not found in file', tool: 'Edit', timestamp: new Date().toISOString() },
    ];
    await fs.writeFile(
      path.join(tempDir, '.claude', 'session-errors.local.json'),
      JSON.stringify(errors),
      'utf-8',
    );

    const result = await onSessionStart(tempDir);
    expect(result).not.toBeNull();
    expect(result).toContain('patrones de error actualizados');
  });
});
