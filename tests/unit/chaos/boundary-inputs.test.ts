import { describe, it, expect } from 'vitest';
import { NodeAnalyzer } from '../../../src/detection/analyzers/node.js';
import { GoAnalyzer } from '../../../src/detection/analyzers/go.js';
import { RustAnalyzer } from '../../../src/detection/analyzers/rust.js';
import { PythonAnalyzer } from '../../../src/detection/analyzers/python.js';
import { DockerAnalyzer } from '../../../src/detection/analyzers/docker.js';

describe('Chaos: boundary inputs (large data, performance)', () => {
  describe('Node analyzer with 1000 dependencies', () => {
    it('should handle 1000 deps in < 1 second', async () => {
      const deps: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        deps[`package-${i}`] = `^${i}.0.0`;
      }

      const pkgJson = JSON.stringify({
        name: 'big-project',
        dependencies: deps,
      });

      const files = new Map<string, string>([['package.json', pkgJson]]);
      const analyzer = new NodeAnalyzer();

      const start = Date.now();
      const result = await analyzer.analyze(files, '/project');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
      expect(result.technologies.some((t) => t.id === 'nodejs')).toBe(true);
    });
  });

  describe('Go analyzer with 500 require lines', () => {
    it('should handle 500 deps in < 1 second', async () => {
      const requires = Array.from(
        { length: 500 },
        (_, i) => `\tgithub.com/org/package-${i} v1.0.${i}`,
      ).join('\n');

      const goMod = `module example.com/big\n\ngo 1.21\n\nrequire (\n${requires}\n)\n`;

      const files = new Map<string, string>([['go.mod', goMod]]);
      const analyzer = new GoAnalyzer();

      const start = Date.now();
      const result = await analyzer.analyze(files, '/project');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
      expect(result.technologies.some((t) => t.id === 'go')).toBe(true);
      expect(result.technologies.find((t) => t.id === 'go')!.version).toBe('1.21');
    });
  });

  describe('Rust analyzer with 500 dependencies', () => {
    it('should handle 500 deps in < 1 second', async () => {
      const deps = Array.from(
        { length: 500 },
        (_, i) => `crate-${i} = "${i}.0.0"`,
      ).join('\n');

      const cargoToml = `[package]\nname = "big"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n${deps}\n`;

      const files = new Map<string, string>([['Cargo.toml', cargoToml]]);
      const analyzer = new RustAnalyzer();

      const start = Date.now();
      const result = await analyzer.analyze(files, '/project');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
      expect(result.technologies.some((t) => t.id === 'rust')).toBe(true);
    });
  });

  describe('Python analyzer with 1000 requirements', () => {
    it('should handle 1000 requirements.txt lines in < 1 second', async () => {
      const lines = Array.from(
        { length: 1000 },
        (_, i) => `package-${i}==${i}.0.0`,
      ).join('\n');

      const files = new Map<string, string>([['requirements.txt', lines]]);
      const analyzer = new PythonAnalyzer();

      const start = Date.now();
      const result = await analyzer.analyze(files, '/project');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
      expect(result.technologies.some((t) => t.id === 'python')).toBe(true);
    });
  });

  describe('Docker analyzer with only infra files (no language)', () => {
    it('should detect Docker without language files present', async () => {
      const files = new Map<string, string>([
        ['Dockerfile', 'FROM alpine:3.18\nRUN echo hello'],
      ]);
      const analyzer = new DockerAnalyzer();
      const result = await analyzer.analyze(files, '/project');

      expect(result.technologies.some((t) => t.id === 'docker')).toBe(true);
    });

    it('should detect multi-stage build in large Dockerfile', async () => {
      const stages = Array.from(
        { length: 5 },
        (_, i) => `FROM node:20 AS stage${i}\nRUN echo "stage ${i}"`,
      ).join('\n\n');

      const files = new Map<string, string>([['Dockerfile', stages]]);
      const analyzer = new DockerAnalyzer();
      const result = await analyzer.analyze(files, '/project');

      const docker = result.technologies.find((t) => t.id === 'docker');
      expect(docker).toBeDefined();
      // Should have multi-stage evidence
      const multiStageEvidence = docker!.evidence.find((e) =>
        e.description.includes('Multi-stage'),
      );
      expect(multiStageEvidence).toBeDefined();
    });
  });

  describe('Docker analyzer with compose having many services', () => {
    it('should detect microservices hint with >3 services', async () => {
      const compose = `services:
  api:
    image: node:20
  web:
    image: nginx
  db:
    image: postgres
  cache:
    image: redis
  worker:
    image: node:20
`;
      const files = new Map<string, string>([['docker-compose.yml', compose]]);
      const analyzer = new DockerAnalyzer();
      const result = await analyzer.analyze(files, '/project');

      expect(result.technologies.some((t) => t.id === 'docker')).toBe(true);
      expect(result.technologies.some((t) => t.id === 'microservices-hint')).toBe(true);
    });
  });
});
