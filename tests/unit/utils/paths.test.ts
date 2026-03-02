import { describe, it, expect } from 'vitest';
import { toRelativeMetaKey, resolveMetaKey } from '../../../src/utils/paths.js';
import path from 'path';

describe('toRelativeMetaKey', () => {
  it('should convert absolute path to relative with forward slashes', () => {
    const result = toRelativeMetaKey('/project/.claude/CLAUDE.md', '/project');
    expect(result).toBe('.claude/CLAUDE.md');
  });

  it('should keep relative path and normalize slashes', () => {
    const result = toRelativeMetaKey('.claude/CLAUDE.md', '/project');
    expect(result).toBe('.claude/CLAUDE.md');
  });

  it('should handle nested paths', () => {
    const result = toRelativeMetaKey('/project/.claude/rules/security.md', '/project');
    expect(result).toBe('.claude/rules/security.md');
  });

  it('should handle path.join style paths', () => {
    const abs = path.join('/project', '.claude', 'settings.json');
    const result = toRelativeMetaKey(abs, '/project');
    expect(result).toBe('.claude/settings.json');
  });

  it('should throw when path escapes projectRoot', () => {
    expect(() => toRelativeMetaKey('/other/file.txt', '/project')).toThrow('escapes projectRoot');
  });
});

describe('resolveMetaKey', () => {
  it('should return absolute path unchanged', () => {
    const result = resolveMetaKey('/project/.claude/CLAUDE.md', '/other');
    expect(result).toBe('/project/.claude/CLAUDE.md');
  });

  it('should resolve relative path against projectRoot', () => {
    const result = resolveMetaKey('.claude/CLAUDE.md', '/project');
    expect(result).toBe(path.join('/project', '.claude/CLAUDE.md'));
  });

  it('should resolve nested relative path', () => {
    const result = resolveMetaKey('.claude/rules/security.md', '/project');
    expect(result).toBe(path.join('/project', '.claude/rules/security.md'));
  });

  it('should throw on path traversal attempt', () => {
    expect(() => resolveMetaKey('../../etc/passwd', '/project')).toThrow();
  });
});
