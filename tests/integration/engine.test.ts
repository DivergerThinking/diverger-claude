import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { DetectionEngine } from '../../src/detection/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('DetectionEngine integration', () => {
  describe('Next.js app fixture', () => {
    const fixtureDir = path.join(FIXTURES_DIR, 'nextjs-app');
    let engine: DetectionEngine;

    it('should detect all expected technologies', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);

      expect(techIds).toContain('typescript');
      expect(techIds).toContain('react');
      expect(techIds).toContain('nextjs');
      expect(techIds).toContain('vitest');
      expect(techIds).toContain('playwright');
    });

    it('should detect Node.js as the base runtime', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const nodejs = result.technologies.find((t) => t.id === 'nodejs');
      expect(nodejs).toBeDefined();
      expect(nodejs!.category).toBe('language');
    });

    it('should have confidence scores >= 85% for all core technologies', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const coreTechIds = ['typescript', 'react', 'nextjs', 'vitest', 'playwright'];

      for (const techId of coreTechIds) {
        const tech = result.technologies.find((t) => t.id === techId);
        expect(tech, `Expected technology "${techId}" to be detected`).toBeDefined();
        expect(
          tech!.confidence,
          `Expected "${techId}" confidence (${tech!.confidence}%) to be >= 85%`,
        ).toBeGreaterThanOrEqual(85);
      }
    });

    it('should assign correct categories to detected technologies', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techMap = new Map(result.technologies.map((t) => [t.id, t]));

      expect(techMap.get('typescript')!.category).toBe('language');
      expect(techMap.get('react')!.category).toBe('framework');
      expect(techMap.get('nextjs')!.category).toBe('framework');
      expect(techMap.get('vitest')!.category).toBe('testing');
      expect(techMap.get('playwright')!.category).toBe('testing');
    });

    it('should include evidence for each detected technology', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      for (const tech of result.technologies) {
        expect(
          tech.evidence.length,
          `Expected "${tech.id}" to have at least one piece of evidence`,
        ).toBeGreaterThanOrEqual(1);
      }
    });

    it('should set Next.js parent to React', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      expect(nextjs).toBeDefined();
      expect(nextjs!.parentId).toBe('react');
    });

    it('should associate correct profile IDs', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techMap = new Map(result.technologies.map((t) => [t.id, t]));

      expect(techMap.get('typescript')!.profileIds).toContain('languages/typescript');
      expect(techMap.get('nextjs')!.profileIds).toContain('frameworks/nextjs');
      expect(techMap.get('vitest')!.profileIds).toContain('testing/vitest');
      expect(techMap.get('playwright')!.profileIds).toContain('testing/playwright');
    });

    it('should set rootDir to the fixture directory', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.rootDir).toBe(fixtureDir);
    });

    it('should include a detectedAt timestamp', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      expect(result.detectedAt).toBeDefined();
      expect(() => new Date(result.detectedAt)).not.toThrow();
    });
  });

  describe('Python FastAPI fixture', () => {
    const fixtureDir = path.join(FIXTURES_DIR, 'python-fastapi');
    let engine: DetectionEngine;

    it('should detect Python, FastAPI, and Pytest', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);

      expect(techIds).toContain('python');
      expect(techIds).toContain('fastapi');
      expect(techIds).toContain('pytest');
    });

    it('should have confidence scores >= 85% for core Python technologies', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const coreTechIds = ['python', 'fastapi', 'pytest'];

      for (const techId of coreTechIds) {
        const tech = result.technologies.find((t) => t.id === techId);
        expect(tech, `Expected technology "${techId}" to be detected`).toBeDefined();
        expect(
          tech!.confidence,
          `Expected "${techId}" confidence (${tech!.confidence}%) to be >= 85%`,
        ).toBeGreaterThanOrEqual(85);
      }
    });

    it('should detect Pydantic as a tooling dependency', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const pydantic = result.technologies.find((t) => t.id === 'pydantic');
      expect(pydantic).toBeDefined();
      expect(pydantic!.category).toBe('tooling');
    });

    it('should assign correct categories', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techMap = new Map(result.technologies.map((t) => [t.id, t]));

      expect(techMap.get('python')!.category).toBe('language');
      expect(techMap.get('fastapi')!.category).toBe('framework');
      expect(techMap.get('pytest')!.category).toBe('testing');
    });

    it('should associate correct profile IDs for Python stack', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techMap = new Map(result.technologies.map((t) => [t.id, t]));

      expect(techMap.get('python')!.profileIds).toContain('languages/python');
      expect(techMap.get('fastapi')!.profileIds).toContain('frameworks/fastapi');
      expect(techMap.get('pytest')!.profileIds).toContain('testing/pytest');
    });

    it('should not detect any Node.js technologies', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);
      expect(techIds).not.toContain('nodejs');
      expect(techIds).not.toContain('typescript');
      expect(techIds).not.toContain('react');
    });
  });

  describe('Spring Boot API fixture', () => {
    const fixtureDir = path.join(FIXTURES_DIR, 'spring-boot-api');
    let engine: DetectionEngine;

    it('should detect Java, Spring Boot, and JUnit', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);

      expect(techIds).toContain('java');
      expect(techIds).toContain('spring-boot');
      expect(techIds).toContain('junit');
    });

    it('should assign correct categories for Java stack', async () => {
      engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techMap = new Map(result.technologies.map((t) => [t.id, t]));

      expect(techMap.get('java')!.category).toBe('language');
      expect(techMap.get('spring-boot')!.category).toBe('framework');
      expect(techMap.get('junit')!.category).toBe('testing');
    });
  });
});
