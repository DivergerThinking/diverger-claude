import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateConfig } from '../../../src/governance/validator.js';
import { extractTrackedDeps } from '../../../src/governance/index.js';
import { hashForMeta } from '../../../src/utils/hash.js';
import type { DivergentMeta } from '../../../src/core/types.js';

// Mock the fs utility — include assertPathWithin so resolveMetaKey can use it
vi.mock('../../../src/utils/fs.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/fs.js')>();
  return {
    ...actual,
    readFileOrNull: vi.fn(),
  };
});

// Mock fast-glob
vi.mock('fast-glob', () => ({
  default: vi.fn(),
}));

import { readFileOrNull } from '../../../src/utils/fs.js';
import fg from 'fast-glob';
const mockReadFileOrNull = vi.mocked(readFileOrNull);
const mockFg = vi.mocked(fg);

function makeMeta(overrides: Partial<DivergentMeta> = {}): DivergentMeta {
  return {
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    detectedStack: [],
    appliedProfiles: [],
    fileHashes: {},
    ruleGovernance: {},
    fileContents: {},
    trackedDependencies: [],
    ...overrides,
  };
}

describe('validateConfig', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should report error when CLAUDE.md is missing', async () => {
    mockReadFileOrNull.mockResolvedValue(null); // CLAUDE.md missing
    mockFg.mockResolvedValue([]);

    const result = await validateConfig('/project', null);

    expect(result.valid).toBe(false);
    const claudeIssue = result.issues.find((i) => i.file === 'CLAUDE.md');
    expect(claudeIssue).toBeDefined();
    expect(claudeIssue!.severity).toBe('error');
  });

  it('should report warning when settings.json is missing', async () => {
    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md content') // CLAUDE.md exists
      .mockResolvedValueOnce(null); // settings.json missing
    mockFg.mockResolvedValue([]);

    const result = await validateConfig('/project', null);

    const settingsIssue = result.issues.find((i) => i.file === '.claude/settings.json');
    expect(settingsIssue).toBeDefined();
    expect(settingsIssue!.severity).toBe('warning');
  });

  it('should report warning when no rule files exist', async () => {
    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md') // CLAUDE.md
      .mockResolvedValueOnce('{}'); // settings.json
    mockFg.mockResolvedValue([]); // No rule files

    const result = await validateConfig('/project', null);

    const rulesIssue = result.issues.find((i) => i.file === '.claude/rules/');
    expect(rulesIssue).toBeDefined();
    expect(rulesIssue!.severity).toBe('warning');
  });

  it('should be valid when all files exist and no meta', async () => {
    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md') // CLAUDE.md
      .mockResolvedValueOnce('{}'); // settings.json
    mockFg.mockResolvedValue(['rule1.md']); // Rule files exist

    const result = await validateConfig('/project', null);

    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('should report error when mandatory rule is deleted', async () => {
    const ruleContent = '# Security Rule';
    const ruleHash = hashForMeta(ruleContent);
    const meta = makeMeta({
      fileHashes: { '.claude/rules/security.md': ruleHash },
      ruleGovernance: { '.claude/rules/security.md': 'mandatory' },
    });

    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md') // CLAUDE.md
      .mockResolvedValueOnce('{}') // settings.json
      .mockResolvedValueOnce(null); // mandatory rule file deleted
    mockFg.mockResolvedValue([]);

    const result = await validateConfig('/project', meta);

    expect(result.valid).toBe(false);
    const ruleIssue = result.issues.find((i) => i.message.includes('eliminada'));
    expect(ruleIssue).toBeDefined();
    expect(ruleIssue!.severity).toBe('error');
  });

  it('should report error when mandatory rule is modified', async () => {
    const originalContent = '# Security Rule';
    const ruleHash = hashForMeta(originalContent);
    const meta = makeMeta({
      fileHashes: { '.claude/rules/security.md': ruleHash },
      ruleGovernance: { '.claude/rules/security.md': 'mandatory' },
    });

    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md') // CLAUDE.md
      .mockResolvedValueOnce('{}') // settings.json
      .mockResolvedValueOnce('# Modified Security Rule'); // mandatory rule modified
    mockFg.mockResolvedValue([]);

    const result = await validateConfig('/project', meta);

    expect(result.valid).toBe(false);
    const ruleIssue = result.issues.find((i) => i.message.includes('modificada'));
    expect(ruleIssue).toBeDefined();
    expect(ruleIssue!.severity).toBe('error');
  });

  it('should not report error when mandatory rule is unmodified', async () => {
    const originalContent = '# Security Rule';
    const ruleHash = hashForMeta(originalContent);
    const meta = makeMeta({
      fileHashes: { '.claude/rules/security.md': ruleHash },
      ruleGovernance: { '.claude/rules/security.md': 'mandatory' },
    });

    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md') // CLAUDE.md
      .mockResolvedValueOnce('{}') // settings.json
      .mockResolvedValueOnce(originalContent); // mandatory rule unmodified
    mockFg.mockResolvedValue(['security.md']);

    const result = await validateConfig('/project', meta);

    expect(result.valid).toBe(true);
  });

  it('should report error when settings.json contains invalid JSON', async () => {
    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md') // CLAUDE.md
      .mockResolvedValueOnce('this is not valid json {{{'); // settings.json corrupted
    mockFg.mockResolvedValue(['rule1.md']);

    const result = await validateConfig('/project', null);

    expect(result.valid).toBe(false);
    const jsonIssue = result.issues.find((i) => i.message.includes('JSON inválido'));
    expect(jsonIssue).toBeDefined();
    expect(jsonIssue!.severity).toBe('error');
  });

  it('should skip validation for recommended rules', async () => {
    const meta = makeMeta({
      fileHashes: { '.claude/rules/style.md': 'somehash' },
      ruleGovernance: { '.claude/rules/style.md': 'recommended' },
    });

    mockReadFileOrNull
      .mockResolvedValueOnce('# CLAUDE.md') // CLAUDE.md
      .mockResolvedValueOnce('{}'); // settings.json
    // Note: no call for the recommended rule (it's skipped)
    mockFg.mockResolvedValue(['style.md']);

    const result = await validateConfig('/project', meta);

    // Should not report errors for recommended rule modifications
    const ruleErrors = result.issues.filter((i) => i.message.includes('obligatoria'));
    expect(ruleErrors).toHaveLength(0);
    // Should only read CLAUDE.md + settings.json, NOT the recommended rule file
    expect(mockReadFileOrNull).toHaveBeenCalledTimes(2);
  });
});

describe('extractTrackedDeps', () => {
  it('should extract deps from trackedPackage field', () => {
    const techs = [{
      evidence: [{ description: 'some description', trackedPackage: 'express' }],
    }];
    const deps = extractTrackedDeps(techs);
    expect(deps).toEqual(['express']);
  });

  it('should fall back to regex on description when trackedPackage is missing', () => {
    const techs = [{
      evidence: [{ description: 'Found "lodash" in dependencies' }],
    }];
    const deps = extractTrackedDeps(techs);
    expect(deps).toEqual(['lodash']);
  });

  it('should prefer trackedPackage over description regex', () => {
    const techs = [{
      evidence: [{ description: 'Found "old-name" in dependencies', trackedPackage: 'new-name' }],
    }];
    const deps = extractTrackedDeps(techs);
    expect(deps).toEqual(['new-name']);
    expect(deps).not.toContain('old-name');
  });

  it('should deduplicate across technologies', () => {
    const techs = [
      { evidence: [{ description: 'Found "react" in dependencies', trackedPackage: 'react' }] },
      { evidence: [{ description: 'Found "react" in dependencies', trackedPackage: 'react' }] },
    ];
    const deps = extractTrackedDeps(techs);
    expect(deps).toEqual(['react']);
  });

  it('should return empty array when no deps found', () => {
    const techs = [{ evidence: [{ description: 'No dependency info here' }] }];
    const deps = extractTrackedDeps(techs);
    expect(deps).toEqual([]);
  });
});
