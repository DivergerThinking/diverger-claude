import { describe, it, expect } from 'vitest';
import type { AnalyzerResult } from '../../../../src/core/types.js';
import { BaseAnalyzer } from '../../../../src/detection/analyzers/base.js';

/** Concrete implementation for testing the abstract base class */
class TestAnalyzer extends BaseAnalyzer {
  readonly id = 'test';
  readonly name = 'Test';
  readonly filePatterns: string[];
  readonly rootOnlyPatterns?: string[];

  constructor(patterns: string[], rootOnly?: string[]) {
    super();
    this.filePatterns = patterns;
    this.rootOnlyPatterns = rootOnly;
  }

  async analyze(): Promise<AnalyzerResult> {
    return { technologies: [], analyzedFiles: [] };
  }
}

describe('BaseAnalyzer', () => {
  describe('hasRelevantFiles', () => {
    it('should match exact filename at root', () => {
      const analyzer = new TestAnalyzer(['package.json']);
      const files = new Map([['package.json', '{}']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should match exact filename in subdirectory', () => {
      const analyzer = new TestAnalyzer(['package.json']);
      const files = new Map([['app/package.json', '{}']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should match exact filename in deep subdirectory', () => {
      const analyzer = new TestAnalyzer(['package.json']);
      const files = new Map([['apps/web/package.json', '{}']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should not match partial filename', () => {
      const analyzer = new TestAnalyzer(['package.json']);
      const files = new Map([['not-package.json', '{}']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(false);
    });

    it('should return false when no files match', () => {
      const analyzer = new TestAnalyzer(['go.mod']);
      const files = new Map([['package.json', '{}']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(false);
    });
  });

  describe('matchesPattern with wildcards', () => {
    it('should match wildcard pattern at root (e.g. *.csproj)', () => {
      const analyzer = new TestAnalyzer(['*.csproj']);
      const files = new Map([['MyApp.csproj', '<Project/>']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should match wildcard pattern in subdirectory via basename', () => {
      const analyzer = new TestAnalyzer(['*.csproj']);
      const files = new Map([['src/MyApp.csproj', '<Project/>']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should match Dockerfile.* wildcard at root', () => {
      const analyzer = new TestAnalyzer(['Dockerfile.*']);
      const files = new Map([['Dockerfile.dev', 'FROM node']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should match Dockerfile.* wildcard in subdirectory (basename matching)', () => {
      const analyzer = new TestAnalyzer(['Dockerfile.*']);
      const files = new Map([['app/Dockerfile.dev', 'FROM node']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should match tsconfig.*.json wildcard in subdirectory', () => {
      const analyzer = new TestAnalyzer(['tsconfig.*.json']);
      const files = new Map([['frontend/tsconfig.build.json', '{}']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });

    it('should match path-based wildcard pattern (.github/workflows/*.yml)', () => {
      const analyzer = new TestAnalyzer(['.github/workflows/*.yml']);
      const files = new Map([['.github/workflows/ci.yml', 'name: CI']]);
      expect(analyzer.hasRelevantFiles(files)).toBe(true);
    });
  });

  describe('rootOnlyPatterns property', () => {
    it('should expose rootOnlyPatterns when set', () => {
      const analyzer = new TestAnalyzer(['Jenkinsfile', '.gitlab-ci.yml'], ['Jenkinsfile', '.gitlab-ci.yml']);
      expect(analyzer.rootOnlyPatterns).toEqual(['Jenkinsfile', '.gitlab-ci.yml']);
    });

    it('should be undefined when not set', () => {
      const analyzer = new TestAnalyzer(['package.json']);
      expect(analyzer.rootOnlyPatterns).toBeUndefined();
    });
  });
});
