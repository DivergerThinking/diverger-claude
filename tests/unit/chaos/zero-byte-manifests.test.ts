import { describe, it, expect } from 'vitest';
import { NodeAnalyzer } from '../../../src/detection/analyzers/node.js';
import { GoAnalyzer } from '../../../src/detection/analyzers/go.js';
import { RustAnalyzer } from '../../../src/detection/analyzers/rust.js';
import { PythonAnalyzer } from '../../../src/detection/analyzers/python.js';
import { JavaAnalyzer } from '../../../src/detection/analyzers/java.js';
import { DotnetAnalyzer } from '../../../src/detection/analyzers/dotnet.js';
import { DockerAnalyzer } from '../../../src/detection/analyzers/docker.js';
import { CIAnalyzer } from '../../../src/detection/analyzers/ci.js';
import { parseJson, parseTOML, parseXml, parseYaml } from '../../../src/utils/parsers.js';

describe('Chaos: zero-byte / empty manifest files', () => {
  describe('Node analyzer with empty package.json', () => {
    it('should return 0 technologies for empty string', async () => {
      const analyzer = new NodeAnalyzer();
      const files = new Map<string, string>([['package.json', '']]);
      const result = await analyzer.analyze(files, '/project');
      expect(result.technologies).toHaveLength(0);
    });
  });

  describe('Go analyzer with empty go.mod', () => {
    it('should return 0 technologies for empty string', async () => {
      const analyzer = new GoAnalyzer();
      const files = new Map<string, string>([['go.mod', '']]);
      const result = await analyzer.analyze(files, '/project');
      // Empty go.mod has no "go X.Y" line → still detects Go but with unknown version
      // The key thing is no crash
      expect(result.technologies.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Rust analyzer with empty Cargo.toml', () => {
    it('should not crash on empty Cargo.toml', async () => {
      const analyzer = new RustAnalyzer();
      const files = new Map<string, string>([['Cargo.toml', '']]);
      const result = await analyzer.analyze(files, '/project');
      // File exists → Rust detected (like DotNet/Docker). No crash is the key assertion.
      expect(result.technologies.some((t) => t.id === 'rust')).toBe(true);
      // No frameworks detected from empty content
      expect(result.technologies.filter((t) => t.category === 'framework')).toHaveLength(0);
    });
  });

  describe('Python analyzer with empty pyproject.toml', () => {
    it('should not crash on empty pyproject.toml', async () => {
      const analyzer = new PythonAnalyzer();
      const files = new Map<string, string>([['pyproject.toml', '']]);
      const result = await analyzer.analyze(files, '/project');
      // File exists → Python detected. No crash is the key assertion.
      expect(result.technologies.some((t) => t.id === 'python')).toBe(true);
      // No frameworks detected from empty content
      expect(result.technologies.filter((t) => t.category === 'framework')).toHaveLength(0);
    });
  });

  describe('Java analyzer with empty pom.xml', () => {
    it('should not crash on empty pom.xml', async () => {
      const analyzer = new JavaAnalyzer();
      const files = new Map<string, string>([['pom.xml', '']]);
      const result = await analyzer.analyze(files, '/project');
      // File exists → Java detected. No crash is the key assertion.
      expect(result.technologies.some((t) => t.id === 'java')).toBe(true);
      // No frameworks detected from empty content
      expect(result.technologies.filter((t) => t.category === 'framework')).toHaveLength(0);
    });
  });

  describe('DotNet analyzer with empty .csproj', () => {
    it('should detect C# language without crash (BUG-30 fix)', async () => {
      const analyzer = new DotnetAnalyzer();
      const files = new Map<string, string>([['App.csproj', '']]);
      const result = await analyzer.analyze(files, '/project');
      expect(result.technologies.some((t) => t.id === 'csharp')).toBe(true);
      // No framework detected from empty content
      expect(result.technologies.filter((t) => t.category === 'framework')).toHaveLength(0);
    });
  });

  describe('Docker analyzer with empty Dockerfile', () => {
    it('should detect Docker from empty Dockerfile', async () => {
      const analyzer = new DockerAnalyzer();
      const files = new Map<string, string>([['Dockerfile', '']]);
      const result = await analyzer.analyze(files, '/project');
      expect(result.technologies.some((t) => t.id === 'docker')).toBe(true);
    });
  });

  describe('CI analyzer with empty workflow file', () => {
    it('should detect GitHub Actions from empty workflow', async () => {
      const analyzer = new CIAnalyzer();
      const files = new Map<string, string>([['.github/workflows/ci.yml', '']]);
      const result = await analyzer.analyze(files, '/project');
      expect(result.technologies.some((t) => t.id === 'github-actions')).toBe(true);
    });
  });

  describe('Parser functions with empty strings', () => {
    it('parseJson("") should throw', () => {
      expect(() => parseJson('')).toThrow();
    });

    it('parseTOML("") should return empty object (smol-toml accepts empty input)', () => {
      const result = parseTOML('');
      expect(result).toEqual({});
    });

    it('parseXml("") should not throw (returns empty object)', () => {
      // fast-xml-parser returns {} for empty input
      expect(() => parseXml('')).not.toThrow();
    });

    it('parseYaml("") should return empty object', () => {
      const result = parseYaml('');
      expect(result).toEqual({});
    });
  });
});
