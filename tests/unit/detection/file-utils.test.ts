import { describe, it, expect } from 'vitest';
import { findFile, findFileEntry, findAllFileEntries, hasFile } from '../../../src/detection/file-utils.js';

describe('file-utils', () => {
  // ── findFile ───────────────────────────────────────────────────────────

  describe('findFile', () => {
    it('should find a root-level file by basename', () => {
      const files = new Map([['package.json', '{"root":true}']]);
      expect(findFile(files, 'package.json')).toBe('{"root":true}');
    });

    it('should find a file in a subdirectory by basename', () => {
      const files = new Map([['app/package.json', '{"sub":true}']]);
      expect(findFile(files, 'package.json')).toBe('{"sub":true}');
    });

    it('should prefer root-level file over subdirectory', () => {
      const files = new Map([
        ['frontend/package.json', '{"frontend":true}'],
        ['package.json', '{"root":true}'],
      ]);
      expect(findFile(files, 'package.json')).toBe('{"root":true}');
    });

    it('should prefer shallower subdirectory over deeper', () => {
      const files = new Map([
        ['apps/web/package.json', '{"deep":true}'],
        ['app/package.json', '{"shallow":true}'],
      ]);
      expect(findFile(files, 'package.json')).toBe('{"shallow":true}');
    });

    it('should return undefined when no match found', () => {
      const files = new Map([['go.mod', 'module test']]);
      expect(findFile(files, 'package.json')).toBeUndefined();
    });

    it('should return undefined for empty map', () => {
      expect(findFile(new Map(), 'package.json')).toBeUndefined();
    });
  });

  // ── findFileEntry ──────────────────────────────────────────────────────

  describe('findFileEntry', () => {
    it('should return path and content for root-level match', () => {
      const files = new Map([['Cargo.toml', '[package]']]);
      const entry = findFileEntry(files, 'Cargo.toml');
      expect(entry).toEqual({ path: 'Cargo.toml', content: '[package]' });
    });

    it('should return path and content for subdirectory match', () => {
      const files = new Map([['backend/go.mod', 'module api']]);
      const entry = findFileEntry(files, 'go.mod');
      expect(entry).toEqual({ path: 'backend/go.mod', content: 'module api' });
    });

    it('should return the shallowest match', () => {
      const files = new Map([
        ['apps/web/go.mod', 'deep'],
        ['app/go.mod', 'shallow'],
      ]);
      const entry = findFileEntry(files, 'go.mod');
      expect(entry!.path).toBe('app/go.mod');
    });

    it('should return undefined when no match found', () => {
      const files = new Map([['README.md', '# Hello']]);
      expect(findFileEntry(files, 'go.mod')).toBeUndefined();
    });
  });

  // ── findAllFileEntries ─────────────────────────────────────────────────

  describe('findAllFileEntries', () => {
    it('should find all matching files sorted by depth', () => {
      const files = new Map([
        ['apps/web/package.json', '{"web":true}'],
        ['package.json', '{"root":true}'],
        ['frontend/package.json', '{"frontend":true}'],
      ]);
      const entries = findAllFileEntries(files, 'package.json');
      expect(entries).toHaveLength(3);
      expect(entries[0]!.path).toBe('package.json');
      expect(entries[1]!.path).toBe('frontend/package.json');
      expect(entries[2]!.path).toBe('apps/web/package.json');
    });

    it('should return empty array when no match found', () => {
      const files = new Map([['go.mod', 'module test']]);
      expect(findAllFileEntries(files, 'package.json')).toEqual([]);
    });

    it('should handle single match', () => {
      const files = new Map([['app/pyproject.toml', '[project]']]);
      const entries = findAllFileEntries(files, 'pyproject.toml');
      expect(entries).toHaveLength(1);
      expect(entries[0]!.path).toBe('app/pyproject.toml');
    });

    it('should not match partial basenames', () => {
      const files = new Map([['my-package.json', '{}']]);
      expect(findAllFileEntries(files, 'package.json')).toEqual([]);
    });
  });

  // ── hasFile ────────────────────────────────────────────────────────────

  describe('hasFile', () => {
    it('should return true for root-level file', () => {
      const files = new Map([['Dockerfile', 'FROM node']]);
      expect(hasFile(files, 'Dockerfile')).toBe(true);
    });

    it('should return true for subdirectory file', () => {
      const files = new Map([['app/Dockerfile', 'FROM node']]);
      expect(hasFile(files, 'Dockerfile')).toBe(true);
    });

    it('should return false when not found', () => {
      const files = new Map([['README.md', '# Hello']]);
      expect(hasFile(files, 'Dockerfile')).toBe(false);
    });

    it('should return false for empty map', () => {
      expect(hasFile(new Map(), 'package.json')).toBe(false);
    });

    it('should not match partial basenames', () => {
      const files = new Map([['not-Dockerfile', 'contents']]);
      expect(hasFile(files, 'Dockerfile')).toBe(false);
    });
  });
});
