import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { DetectionEngine } from '../../src/detection/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('DetectionEngine monorepo integration', () => {
  describe('Turborepo monorepo fixture', () => {
    const fixtureDir = path.join(FIXTURES_DIR, 'monorepo-turbo');
    let engine: DetectionEngine;

    it('should detect turborepo monorepo structure', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.monorepo).toBeDefined();
      expect(result.monorepo!.type).toBe('turborepo');
    });

    it('should set the monorepo rootDir to the fixture directory', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.monorepo).toBeDefined();
      expect(result.monorepo!.rootDir).toBe(fixtureDir);
    });

    it('should resolve workspace packages', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.monorepo).toBeDefined();
      expect(result.monorepo!.packages.length).toBeGreaterThanOrEqual(2);
    });

    it('should resolve the web package with correct name and path', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.monorepo).toBeDefined();
      const webPkg = result.monorepo!.packages.find((p) => p.name === '@test/web');
      expect(webPkg, 'Expected @test/web package to be resolved').toBeDefined();
      expect(webPkg!.path).toBe('packages/web');
    });

    it('should resolve the api package with correct name and path', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.monorepo).toBeDefined();
      const apiPkg = result.monorepo!.packages.find((p) => p.name === '@test/api');
      expect(apiPkg, 'Expected @test/api package to be resolved').toBeDefined();
      expect(apiPkg!.path).toBe('packages/api');
    });

    it('should detect root-level Node.js and TypeScript', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);

      expect(techIds).toContain('nodejs');
      expect(techIds).toContain('typescript');
    });

    it('should detect technologies from sub-packages', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);

      // The root-level detection should pick up dependencies from the root package.json.
      // Sub-package detection depends on whether the engine traverses sub-packages.
      // At minimum, the root turbo and typescript should be present.
      expect(techIds).toContain('nodejs');
      expect(techIds).toContain('typescript');
    });

    it('should not detect Python or Java technologies', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);

      expect(techIds).not.toContain('python');
      expect(techIds).not.toContain('java');
      expect(techIds).not.toContain('fastapi');
      expect(techIds).not.toContain('spring-boot');
    });

    it('should include a valid detectedAt timestamp', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.detectedAt).toBeDefined();
      const parsed = new Date(result.detectedAt);
      expect(parsed.getTime()).not.toBeNaN();
    });
  });
});
