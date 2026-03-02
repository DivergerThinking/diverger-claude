import { describe, it, expect } from 'vitest';
import { NodeAnalyzer } from '../../../../src/detection/analyzers/node.js';

function makePkgJson(overrides: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
} = {}): string {
  return JSON.stringify({
    name: 'test-project',
    ...overrides,
  });
}

describe('NodeAnalyzer', () => {
  const analyzer = new NodeAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('node');
    expect(analyzer.name).toBe('Node.js / npm');
    expect(analyzer.filePatterns).toContain('package.json');
    expect(analyzer.filePatterns).toContain('tsconfig.json');
  });

  it('should return empty result when package.json is missing', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');

    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect Node.js from bare package.json', async () => {
    const files = new Map<string, string>();
    files.set('package.json', makePkgJson());
    const result = await analyzer.analyze(files, '/project');

    const nodejs = result.technologies.find((t) => t.id === 'nodejs');
    expect(nodejs).toBeDefined();
    expect(nodejs!.name).toBe('Node.js');
    expect(nodejs!.category).toBe('language');
    expect(nodejs!.confidence).toBe(95);
    expect(result.analyzedFiles).toContain('package.json');
  });

  // ── Detection from dependencies ───────────────────────────────────────

  it('should detect React from dependencies', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const react = result.technologies.find((t) => t.id === 'react');
    expect(react).toBeDefined();
    expect(react!.name).toBe('React');
    expect(react!.category).toBe('framework');
    expect(react!.confidence).toBe(90);
    expect(react!.profileIds).toContain('frameworks/react');
  });

  it('should detect Next.js from dependencies with parentId "react"', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { next: '^14.1.0', react: '^18.2.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    expect(nextjs).toBeDefined();
    expect(nextjs!.name).toBe('Next.js');
    expect(nextjs!.parentId).toBe('react');
    expect(nextjs!.profileIds).toContain('frameworks/nextjs');
  });

  it('should detect TypeScript from devDependencies', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ devDependencies: { typescript: '^5.3.3' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const ts = result.technologies.find((t) => t.id === 'typescript');
    expect(ts).toBeDefined();
    expect(ts!.name).toBe('TypeScript');
    expect(ts!.category).toBe('language');
    expect(ts!.confidence).toBe(85);
    expect(ts!.profileIds).toContain('languages/typescript');
  });

  it('should detect Jest from devDependencies', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ devDependencies: { jest: '^29.7.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const jest = result.technologies.find((t) => t.id === 'jest');
    expect(jest).toBeDefined();
    expect(jest!.name).toBe('Jest');
    expect(jest!.category).toBe('testing');
    expect(jest!.profileIds).toContain('testing/jest');
  });

  it('should detect Vitest from devDependencies', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ devDependencies: { vitest: '^1.2.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const vitest = result.technologies.find((t) => t.id === 'vitest');
    expect(vitest).toBeDefined();
    expect(vitest!.name).toBe('Vitest');
    expect(vitest!.category).toBe('testing');
  });

  it('should detect multiple technologies from a full dependency set', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({
        dependencies: { react: '^18.2.0', next: '^14.0.0' },
        devDependencies: { typescript: '^5.3.0', jest: '^29.7.0', vitest: '^1.0.0' },
      }),
    );
    const result = await analyzer.analyze(files, '/project');

    const ids = result.technologies.map((t) => t.id);
    expect(ids).toContain('nodejs');
    expect(ids).toContain('react');
    expect(ids).toContain('nextjs');
    expect(ids).toContain('typescript');
    expect(ids).toContain('jest');
    expect(ids).toContain('vitest');
  });

  it('should detect packages from peerDependencies', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ peerDependencies: { react: '>=17.0.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const react = result.technologies.find((t) => t.id === 'react');
    expect(react).toBeDefined();
  });

  // ── Version extraction ────────────────────────────────────────────────

  it('should extract version stripping caret prefix', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { react: '^18.2.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const react = result.technologies.find((t) => t.id === 'react');
    expect(react!.version).toBe('18.2.0');
    expect(react!.majorVersion).toBe(18);
  });

  it('should extract version stripping tilde prefix', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { express: '~4.18.2' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const express = result.technologies.find((t) => t.id === 'express');
    expect(express!.version).toBe('4.18.2');
    expect(express!.majorVersion).toBe(4);
  });

  it('should extract version stripping >=< prefixes', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ peerDependencies: { react: '>=17.0.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const react = result.technologies.find((t) => t.id === 'react');
    expect(react!.version).toBe('17.0.0');
    expect(react!.majorVersion).toBe(17);
  });

  it('should handle exact version without prefix', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { vue: '3.4.15' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const vue = result.technologies.find((t) => t.id === 'vue');
    expect(vue!.version).toBe('3.4.15');
    expect(vue!.majorVersion).toBe(3);
  });

  // ── Git URL version handling ─────────────────────────────────────────

  it('should not store git URLs as version strings', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { react: 'github:facebook/react' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const react = result.technologies.find((t) => t.id === 'react');
    expect(react).toBeDefined();
    // Tech still detected
    expect(react!.confidence).toBe(90);
    // But version should be undefined, not the git URL
    expect(react!.version).toBeUndefined();
    expect(react!.majorVersion).toBeUndefined();
    // Evidence description should not include the git URL
    expect(react!.evidence[0]!.description).not.toContain('github:');
  });

  it('should not store https git URLs as version strings', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { express: 'https://github.com/expressjs/express.git' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const express = result.technologies.find((t) => t.id === 'express');
    expect(express).toBeDefined();
    expect(express!.version).toBeUndefined();
    expect(express!.majorVersion).toBeUndefined();
  });

  // ── Config file boosting ──────────────────────────────────────────────

  it('should boost TypeScript confidence when tsconfig.json is present', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ devDependencies: { typescript: '^5.3.0' } }),
    );
    files.set('tsconfig.json', '{}');
    const result = await analyzer.analyze(files, '/project');

    const ts = result.technologies.find((t) => t.id === 'typescript');
    expect(ts).toBeDefined();
    // Base 85 + 10 from tsconfig.json
    expect(ts!.confidence).toBe(95);
    expect(ts!.evidence.length).toBeGreaterThan(1);
    expect(ts!.evidence.some((e) => e.type === 'config-file')).toBe(true);
    expect(result.analyzedFiles).toContain('tsconfig.json');
  });

  it('should detect TypeScript from tsconfig.json even without dep', async () => {
    const files = new Map<string, string>();
    files.set('package.json', makePkgJson());
    files.set('tsconfig.json', '{}');
    const result = await analyzer.analyze(files, '/project');

    const ts = result.technologies.find((t) => t.id === 'typescript');
    expect(ts).toBeDefined();
    expect(ts!.confidence).toBe(80);
    expect(ts!.evidence[0]!.description).toContain('without direct dependency');
  });

  it('should boost TypeScript from tsconfig.*.json variants', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ devDependencies: { typescript: '^5.3.0' } }),
    );
    files.set('tsconfig.json', '{}');
    files.set('tsconfig.build.json', '{}');
    const result = await analyzer.analyze(files, '/project');

    const ts = result.technologies.find((t) => t.id === 'typescript');
    // Base 85 + 10 (tsconfig.json) + 10 (tsconfig.build.json) = 105 → capped at 100
    expect(ts!.confidence).toBe(100);
    expect(result.analyzedFiles).toContain('tsconfig.build.json');
  });

  it('should boost Next.js confidence from next.config.js', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { next: '^14.0.0' } }),
    );
    files.set('next.config.js', 'module.exports = {}');
    const result = await analyzer.analyze(files, '/project');

    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    expect(nextjs).toBeDefined();
    // Base 90 + 9 from next.config.js
    expect(nextjs!.confidence).toBe(99);
    expect(nextjs!.evidence.some((e) => e.source === 'next.config.js')).toBe(true);
    expect(result.analyzedFiles).toContain('next.config.js');
  });

  it('should boost Next.js confidence from next.config.mjs', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { next: '^14.0.0' } }),
    );
    files.set('next.config.mjs', 'export default {}');
    const result = await analyzer.analyze(files, '/project');

    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    expect(nextjs!.confidence).toBe(99);
  });

  it('should boost Jest confidence from jest.config.js', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ devDependencies: { jest: '^29.7.0' } }),
    );
    files.set('jest.config.js', 'module.exports = {}');
    const result = await analyzer.analyze(files, '/project');

    const jest = result.technologies.find((t) => t.id === 'jest');
    expect(jest!.confidence).toBe(95); // 90 + 5
  });

  it('should boost Vitest confidence from vitest.config.ts', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ devDependencies: { vitest: '^1.0.0' } }),
    );
    files.set('vitest.config.ts', 'export default {}');
    const result = await analyzer.analyze(files, '/project');

    const vitest = result.technologies.find((t) => t.id === 'vitest');
    expect(vitest!.confidence).toBe(95); // 90 + 5
  });

  it('should not boost config file if the technology dep is absent', async () => {
    const files = new Map<string, string>();
    files.set('package.json', makePkgJson());
    files.set('next.config.js', 'module.exports = {}');
    const result = await analyzer.analyze(files, '/project');

    // nextjs should not appear since dep is absent (boost only applies to existing tech)
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    expect(nextjs).toBeUndefined();
    // But the config file should still be tracked in analyzedFiles
    expect(result.analyzedFiles).toContain('next.config.js');
  });

  // ── Malformed input ──────────────────────────────────────────────────

  it('should handle malformed package.json gracefully', async () => {
    const files = new Map<string, string>();
    files.set('package.json', 'this is not valid json {{{');
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toContain('package.json');
  });

  // ── Evidence structure ────────────────────────────────────────────────

  it('should include proper evidence in detection', async () => {
    const files = new Map<string, string>();
    files.set(
      'package.json',
      makePkgJson({ dependencies: { react: '^18.2.0' } }),
    );
    const result = await analyzer.analyze(files, '/project');

    const react = result.technologies.find((t) => t.id === 'react');
    expect(react!.evidence).toHaveLength(1);
    const ev = react!.evidence[0]!;
    expect(ev.source).toBe('package.json');
    expect(ev.type).toBe('manifest');
    expect(ev.description).toContain('react');
    expect(ev.description).toContain('^18.2.0');
    expect(ev.weight).toBe(90);
  });

  // ── Subdirectory detection ──────────────────────────────────────────

  describe('subdirectory detection', () => {
    it('should detect Node.js from package.json in a subdirectory', async () => {
      const files = new Map<string, string>();
      files.set('app/package.json', makePkgJson({ dependencies: { express: '^4.18.0' } }));
      const result = await analyzer.analyze(files, '/project');

      const nodejs = result.technologies.find((t) => t.id === 'nodejs');
      expect(nodejs).toBeDefined();
      expect(nodejs!.evidence[0]!.source).toBe('app/package.json');
      expect(result.analyzedFiles).toContain('app/package.json');
    });

    it('should detect frameworks from subdirectory package.json', async () => {
      const files = new Map<string, string>();
      files.set('frontend/package.json', makePkgJson({ dependencies: { react: '^18.2.0', next: '^14.0.0' } }));
      const result = await analyzer.analyze(files, '/project');

      const react = result.technologies.find((t) => t.id === 'react');
      expect(react).toBeDefined();
      expect(react!.evidence[0]!.source).toBe('frontend/package.json');

      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      expect(nextjs).toBeDefined();
    });

    it('should process multiple package.json files (frontend + backend)', async () => {
      const files = new Map<string, string>();
      files.set('frontend/package.json', makePkgJson({ dependencies: { react: '^18.2.0' } }));
      files.set('backend/package.json', makePkgJson({ dependencies: { express: '^4.18.0' } }));
      const result = await analyzer.analyze(files, '/project');

      const react = result.technologies.find((t) => t.id === 'react');
      expect(react).toBeDefined();
      const express = result.technologies.find((t) => t.id === 'express');
      expect(express).toBeDefined();

      expect(result.analyzedFiles).toContain('frontend/package.json');
      expect(result.analyzedFiles).toContain('backend/package.json');
    });

    it('should detect Node.js only once from multiple package.json files', async () => {
      const files = new Map<string, string>();
      files.set('frontend/package.json', makePkgJson({ dependencies: { react: '^18.2.0' } }));
      files.set('backend/package.json', makePkgJson({ dependencies: { express: '^4.18.0' } }));
      const result = await analyzer.analyze(files, '/project');

      const nodejsEntries = result.technologies.filter((t) => t.id === 'nodejs');
      expect(nodejsEntries).toHaveLength(1);
      // Should have evidence from both files
      expect(nodejsEntries[0]!.evidence.length).toBeGreaterThanOrEqual(2);
    });

    it('should boost TypeScript from tsconfig.json in subdirectory', async () => {
      const files = new Map<string, string>();
      files.set('app/package.json', makePkgJson({ devDependencies: { typescript: '^5.3.0' } }));
      files.set('app/tsconfig.json', '{}');
      const result = await analyzer.analyze(files, '/project');

      const ts = result.technologies.find((t) => t.id === 'typescript');
      expect(ts).toBeDefined();
      // Base 85 + 10 from tsconfig
      expect(ts!.confidence).toBe(95);
    });

    it('should boost Next.js from next.config.mjs in subdirectory', async () => {
      const files = new Map<string, string>();
      files.set('app/package.json', makePkgJson({ dependencies: { next: '^14.0.0' } }));
      files.set('app/next.config.mjs', 'export default {}');
      const result = await analyzer.analyze(files, '/project');

      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      expect(nextjs).toBeDefined();
      expect(nextjs!.confidence).toBe(99); // 90 + 9
    });
  });
});
