import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { DetectionEngine } from '../../src/detection/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('Subdirectory detection integration', () => {
  describe('subdir-app (Next.js in app/ subdirectory)', () => {
    const fixtureDir = path.join(FIXTURES_DIR, 'subdir-app');

    it('should detect Node.js from app/package.json', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const nodejs = result.technologies.find((t) => t.id === 'nodejs');
      expect(nodejs).toBeDefined();
      expect(nodejs!.category).toBe('language');
    });

    it('should detect Next.js and React from subdirectory deps', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);
      expect(techIds).toContain('react');
      expect(techIds).toContain('nextjs');
    });

    it('should detect TypeScript from subdirectory', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const ts = result.technologies.find((t) => t.id === 'typescript');
      expect(ts).toBeDefined();
      expect(ts!.profileIds).toContain('languages/typescript');
    });

    it('should boost Next.js confidence from next.config.mjs in subdirectory', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      expect(nextjs).toBeDefined();
      // Base 90 + 9 from config file = 99
      expect(nextjs!.confidence).toBeGreaterThanOrEqual(99);
    });

    it('should have high confidence for all core technologies', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      for (const techId of ['nodejs', 'react', 'nextjs', 'typescript']) {
        const tech = result.technologies.find((t) => t.id === techId);
        expect(tech, `Expected "${techId}" to be detected`).toBeDefined();
        expect(
          tech!.confidence,
          `Expected "${techId}" confidence >= 85`,
        ).toBeGreaterThanOrEqual(85);
      }
    });
  });

  describe('fullstack-multi (React frontend + FastAPI backend)', () => {
    const fixtureDir = path.join(FIXTURES_DIR, 'fullstack-multi');

    it('should detect both Node.js and Python', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);
      expect(techIds).toContain('nodejs');
      expect(techIds).toContain('python');
    });

    it('should detect React from frontend/package.json', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const react = result.technologies.find((t) => t.id === 'react');
      expect(react).toBeDefined();
      expect(react!.profileIds).toContain('frameworks/react');
    });

    it('should detect FastAPI from backend/requirements.txt', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const fastapi = result.technologies.find((t) => t.id === 'fastapi');
      expect(fastapi).toBeDefined();
      expect(fastapi!.profileIds).toContain('frameworks/fastapi');
    });

    it('should detect TypeScript from frontend deps', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const ts = result.technologies.find((t) => t.id === 'typescript');
      expect(ts).toBeDefined();
    });

    it('should detect Vite as tooling', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const vite = result.technologies.find((t) => t.id === 'vite');
      expect(vite).toBeDefined();
      expect(vite!.category).toBe('tooling');
    });
  });

  describe('mixed-root-subdir (docker-compose at root + Express in app/)', () => {
    const fixtureDir = path.join(FIXTURES_DIR, 'mixed-root-subdir');

    it('should detect Docker from root-level docker-compose.yml', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const docker = result.technologies.find((t) => t.id === 'docker');
      expect(docker).toBeDefined();
      expect(docker!.profileIds).toContain('infra/docker');
    });

    it('should detect Express from app/package.json', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const express = result.technologies.find((t) => t.id === 'express');
      expect(express).toBeDefined();
      expect(express!.profileIds).toContain('frameworks/express');
    });

    it('should detect both Node.js and Docker', async () => {
      const engine = new DetectionEngine();
      const result = await engine.detect(fixtureDir);

      const techIds = result.technologies.map((t) => t.id);
      expect(techIds).toContain('nodejs');
      expect(techIds).toContain('docker');
    });
  });
});
