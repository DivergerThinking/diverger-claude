import { describe, it, expect } from 'vitest';
import { applyAutoUpdates } from '../../../src/adaptation/auto-updater.js';
import type { ChangeDetectionResult } from '../../../src/adaptation/change-detector.js';

function makeChanges(overrides: Partial<ChangeDetectionResult> = {}): ChangeDetectionResult {
  return {
    hasChanges: false,
    changedFiles: [],
    newDependencies: [],
    removedDependencies: [],
    ...overrides,
  };
}

describe('applyAutoUpdates', () => {
  it('should return empty array when no changes', async () => {
    const changes = makeChanges();
    const results = await applyAutoUpdates(changes, '/project');
    expect(results).toHaveLength(0);
  });

  it('should report new dependencies', async () => {
    const changes = makeChanges({
      hasChanges: true,
      newDependencies: ['lodash', 'axios'],
    });
    const results = await applyAutoUpdates(changes, '/project');

    expect(results).toHaveLength(1);
    expect(results[0]!.applied).toBe(false);
    expect(results[0]!.description).toContain('lodash');
    expect(results[0]!.description).toContain('axios');
    expect(results[0]!.description).toContain('diverger sync');
  });

  it('should report changed files', async () => {
    const changes = makeChanges({
      hasChanges: true,
      changedFiles: ['CLAUDE.md'],
    });
    const results = await applyAutoUpdates(changes, '/project');

    expect(results).toHaveLength(1);
    expect(results[0]!.applied).toBe(false);
    expect(results[0]!.description).toContain('CLAUDE.md');
  });

  it('should report both new deps and changed files', async () => {
    const changes = makeChanges({
      hasChanges: true,
      newDependencies: ['new-pkg'],
      changedFiles: ['settings.json'],
    });
    const results = await applyAutoUpdates(changes, '/project');

    expect(results).toHaveLength(2);
  });

  it('should not report when only removedDependencies exist', async () => {
    const changes = makeChanges({
      hasChanges: true,
      removedDependencies: ['old-pkg'],
    });
    const results = await applyAutoUpdates(changes, '/project');

    // Current implementation only tracks new deps and changed files
    expect(results).toHaveLength(0);
  });
});
