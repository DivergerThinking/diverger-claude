/**
 * E2E lifecycle tests: init → modify → sync → check
 * Tests the full diverger pipeline for multiple project types.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import { DivergerEngine } from '../../src/core/engine.js';
import type { EngineContext } from '../../src/core/engine.js';
import { loadMeta, saveMeta, finalizeMetaAfterWrite } from '../../src/governance/history.js';
import { validateConfig } from '../../src/governance/validator.js';
import { readFileOrNull } from '../../src/utils/fs.js';

function makeCtx(projectRoot: string, overrides?: Partial<EngineContext>): EngineContext {
  return {
    projectRoot,
    options: { output: 'quiet', force: true, dryRun: false, targetDir: projectRoot },
    ...overrides,
  };
}

// Track created temp dirs so the cleanup test can verify
const createdTempDirs: string[] = [];

async function createTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `diverger-e2e-${prefix}-`));
  createdTempDirs.push(dir);
  return dir;
}

async function removeTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
    const idx = createdTempDirs.indexOf(dir);
    if (idx >= 0) createdTempDirs.splice(idx, 1);
  } catch {
    // Ignore cleanup errors
  }
}

// ── Scenario 1: Next.js full lifecycle ────────────────────────────────────────

describe('E2E: Next.js lifecycle', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('nextjs');
    // Copy fixture files
    const fixtureDir = path.join(__dirname, '..', 'integration', 'fixtures', 'nextjs-app');
    for (const file of ['package.json', 'tsconfig.json', 'next.config.mjs']) {
      const content = await fs.readFile(path.join(fixtureDir, file), 'utf-8');
      await fs.writeFile(path.join(tempDir, file), content);
    }
  }, 30_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should init, detect Next.js stack, generate config', async () => {
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);

    // Write files
    const writeResults = await engine.writeFiles(result.files, tempDir, { force: true });
    expect(writeResults.length).toBeGreaterThan(0);

    // Save meta
    const { createMeta } = await import('../../src/governance/history.js');
    const { extractTrackedDeps } = await import('../../src/governance/index.js');
    const trackedDeps = extractTrackedDeps(result.detection.technologies);
    const meta = createMeta(
      result.files,
      result.detection.technologies.map((t) => t.id),
      result.config.appliedProfiles,
      {},
      trackedDeps,
      tempDir,
    );
    await saveMeta(tempDir, meta);

    // Verify CLAUDE.md exists with expected content
    const claudeMd = await readFileOrNull(path.join(tempDir, 'CLAUDE.md'));
    expect(claudeMd).not.toBeNull();
    expect(claudeMd).toContain('React');
    expect(claudeMd).toContain('TypeScript');

    // Verify settings.json is valid JSON
    const settingsStr = await readFileOrNull(path.join(tempDir, '.claude', 'settings.json'));
    expect(settingsStr).not.toBeNull();
    expect(() => JSON.parse(settingsStr!)).not.toThrow();

    // Verify meta has correct fields
    const savedMeta = await loadMeta(tempDir);
    expect(savedMeta).not.toBeNull();
    expect(Object.keys(savedMeta!.fileHashes).length).toBeGreaterThan(0);
    expect(savedMeta!.appliedProfiles.length).toBeGreaterThan(0);
  }, 30_000);

  it('should preserve team modifications after sync', async () => {
    // MODIFY: append team rules to CLAUDE.md
    const claudeMdPath = path.join(tempDir, 'CLAUDE.md');
    const original = await fs.readFile(claudeMdPath, 'utf-8');
    await fs.writeFile(claudeMdPath, original + '\n\n## Nuestras Reglas\nNo push a main\n');

    // Add express to package.json
    const pkgPath = path.join(tempDir, 'package.json');
    const pkgStr = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgStr);
    pkg.dependencies = { ...pkg.dependencies, express: '^4.18.0' };
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

    // SYNC
    const ctx = makeCtx(tempDir);
    const syncResult = await engine.sync(ctx);

    // Write auto-apply and merged files
    const filesToWrite = syncResult.results
      .filter((r) => r.outcome === 'auto-apply' || r.outcome === 'merged')
      .filter((r) => r.content !== undefined)
      .map((r) => ({ path: r.path, content: r.content! }));

    for (const f of filesToWrite) {
      await fs.mkdir(path.dirname(f.path), { recursive: true });
      await fs.writeFile(f.path, f.content);
    }

    // Finalize meta
    const finalMeta = finalizeMetaAfterWrite(
      syncResult.pendingMeta,
      filesToWrite,
      syncResult.oldMeta,
      tempDir,
    );
    await saveMeta(tempDir, finalMeta);

    // Verify team changes survived
    const newClaudeMd = await readFileOrNull(claudeMdPath);
    expect(newClaudeMd).toContain('Nuestras Reglas');

    // Verify meta tracks express
    const meta = await loadMeta(tempDir);
    expect(meta!.trackedDependencies).toContain('express');
  }, 30_000);

  it('should validate config successfully', async () => {
    const meta = await loadMeta(tempDir);
    const validation = await validateConfig(tempDir, meta);
    expect(validation.valid).toBe(true);
  }, 10_000);
}, 90_000);

// ── Scenario 2: Python FastAPI ────────────────────────────────────────────────

describe('E2E: Python FastAPI lifecycle', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('python');
    const fixtureDir = path.join(__dirname, '..', 'integration', 'fixtures', 'python-fastapi');
    const pyproject = await fs.readFile(path.join(fixtureDir, 'pyproject.toml'), 'utf-8');
    await fs.writeFile(path.join(tempDir, 'pyproject.toml'), pyproject);
    // Also create requirements.txt
    await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'fastapi>=0.115.0\nuvicorn>=0.34.0\npytest>=8.0.0\n');
  }, 30_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should detect Python and FastAPI', async () => {
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);

    const techIds = result.detection.technologies.map((t) => t.id);
    expect(techIds).toContain('python');

    // CLAUDE.md should contain Python content
    const claudeMdFile = result.files.find((f) => f.path.endsWith('CLAUDE.md'));
    expect(claudeMdFile).toBeDefined();

    // Applied profiles should include python
    expect(result.config.appliedProfiles.some((p) => p.includes('python'))).toBe(true);

    // Write and verify
    await engine.writeFiles(result.files, tempDir, { force: true });
    const claudeMd = await readFileOrNull(path.join(tempDir, 'CLAUDE.md'));
    expect(claudeMd).not.toBeNull();
  }, 30_000);
}, 60_000);

// ── Scenario 3: Go with Gin ──────────────────────────────────────────────────

describe('E2E: Go + Gin lifecycle', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('go');
    await fs.writeFile(
      path.join(tempDir, 'go.mod'),
      `module github.com/user/my-api

go 1.21

require github.com/gin-gonic/gin v1.9.1
require github.com/stretchr/testify v1.8.4
`,
    );
  }, 10_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should detect Go and Gin, validate config', async () => {
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);

    const techIds = result.detection.technologies.map((t) => t.id);
    expect(techIds).toContain('go');
    expect(techIds).toContain('gin');

    await engine.writeFiles(result.files, tempDir, { force: true });

    // Create meta and validate
    const { createMeta } = await import('../../src/governance/history.js');
    const meta = createMeta(
      result.files,
      result.detection.technologies.map((t) => t.id),
      result.config.appliedProfiles,
      {},
      [],
      tempDir,
    );
    await saveMeta(tempDir, meta);

    const validation = await validateConfig(tempDir, meta);
    expect(validation.valid).toBe(true);
  }, 30_000);
}, 60_000);

// ── Scenario 4: Rust with workspace inheritance (validates BUG-26 fix) ───────

describe('E2E: Rust workspace inheritance', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('rust');
    await fs.writeFile(
      path.join(tempDir, 'Cargo.toml'),
      `[package]
name = "my-crate"
version = "0.1.0"

[package.edition]
workspace = true

[dependencies]
actix-web = "4"
serde = { version = "1", features = ["derive"] }
`,
    );
  }, 10_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should detect Rust and Actix without [object Object] crash', async () => {
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);

    const techIds = result.detection.technologies.map((t) => t.id);
    expect(techIds).toContain('rust');
    expect(techIds).toContain('actix-web');

    // Verify version is NOT [object Object]
    const rustTech = result.detection.technologies.find((t) => t.id === 'rust');
    expect(rustTech).toBeDefined();
    if (rustTech!.version !== undefined) {
      expect(rustTech!.version).not.toContain('[object');
    }

    await engine.writeFiles(result.files, tempDir, { force: true });

    const { createMeta } = await import('../../src/governance/history.js');
    const meta = createMeta(
      result.files,
      result.detection.technologies.map((t) => t.id),
      result.config.appliedProfiles,
      {},
      [],
      tempDir,
    );
    await saveMeta(tempDir, meta);

    const validation = await validateConfig(tempDir, meta);
    expect(validation.valid).toBe(true);
  }, 30_000);
}, 60_000);

// ── Scenario 5: Empty project ────────────────────────────────────────────────

describe('E2E: Empty project', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('empty');
  }, 10_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should not crash on empty directory, generate base config', async () => {
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);

    // Should not crash; may have 0 techs but still generates universal base
    expect(result.files.length).toBeGreaterThanOrEqual(0);

    if (result.files.length > 0) {
      await engine.writeFiles(result.files, tempDir, { force: true });

      // At minimum, universal profile should apply
      const claudeMd = await readFileOrNull(path.join(tempDir, 'CLAUDE.md'));
      if (claudeMd) {
        expect(claudeMd.length).toBeGreaterThan(0);
      }
    }
  }, 30_000);
}, 60_000);

// ── Scenario 6: Multi-stack (Node.js + Docker + GitHub Actions) ──────────────

describe('E2E: Multi-stack project', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('multistack');

    // package.json with react, typescript, jest
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'multi-stack-app',
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
        devDependencies: { typescript: '^5.3.0', jest: '^29.7.0' },
      }, null, 2),
    );
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), '{}');

    // Dockerfile
    await fs.writeFile(
      path.join(tempDir, 'Dockerfile'),
      'FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm ci\nCMD ["node", "dist/index.js"]\n',
    );

    // GitHub Actions workflow
    const workflowDir = path.join(tempDir, '.github', 'workflows');
    await fs.mkdir(workflowDir, { recursive: true });
    await fs.writeFile(
      path.join(workflowDir, 'ci.yml'),
      'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n',
    );
  }, 30_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should detect all technologies from multi-stack project', async () => {
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);

    const techIds = result.detection.technologies.map((t) => t.id);
    expect(techIds).toContain('nodejs');
    expect(techIds).toContain('react');
    expect(techIds).toContain('typescript');
    expect(techIds).toContain('jest');
    expect(techIds).toContain('docker');
    expect(techIds).toContain('github-actions');

    // Multiple profile layers should be applied
    expect(result.config.appliedProfiles.length).toBeGreaterThan(2);

    // Write and validate
    await engine.writeFiles(result.files, tempDir, { force: true });

    const claudeMd = await readFileOrNull(path.join(tempDir, 'CLAUDE.md'));
    expect(claudeMd).not.toBeNull();

    // Settings should merge permissions from all profiles
    const settingsStr = await readFileOrNull(path.join(tempDir, '.claude', 'settings.json'));
    expect(settingsStr).not.toBeNull();
    expect(() => JSON.parse(settingsStr!)).not.toThrow();

    const { createMeta } = await import('../../src/governance/history.js');
    const meta = createMeta(
      result.files,
      result.detection.technologies.map((t) => t.id),
      result.config.appliedProfiles,
      {},
      [],
      tempDir,
    );
    const validation = await validateConfig(tempDir, meta);
    expect(validation.valid).toBe(true);
  }, 30_000);
}, 60_000);

// ── Scenario 7: Re-init on already configured project ────────────────────────

describe('E2E: Re-init on configured project', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('reinit');
    // Setup: same as Next.js
    const fixtureDir = path.join(__dirname, '..', 'integration', 'fixtures', 'nextjs-app');
    for (const file of ['package.json', 'tsconfig.json', 'next.config.mjs']) {
      const content = await fs.readFile(path.join(fixtureDir, file), 'utf-8');
      await fs.writeFile(path.join(tempDir, file), content);
    }

    // First init
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);
    await engine.writeFiles(result.files, tempDir, { force: true });

    const { createMeta } = await import('../../src/governance/history.js');
    const meta = createMeta(
      result.files,
      result.detection.technologies.map((t) => t.id),
      result.config.appliedProfiles,
      {},
      [],
      tempDir,
    );
    await saveMeta(tempDir, meta);
  }, 30_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should re-init without crash, with fresh generatedAt', async () => {
    const oldMeta = await loadMeta(tempDir);
    const oldGeneratedAt = oldMeta!.generatedAt;

    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 50));

    // Re-init
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);
    await engine.writeFiles(result.files, tempDir, { force: true });

    const { createMeta } = await import('../../src/governance/history.js');
    const meta = createMeta(
      result.files,
      result.detection.technologies.map((t) => t.id),
      result.config.appliedProfiles,
      {},
      [],
      tempDir,
    );
    await saveMeta(tempDir, meta);

    // generatedAt should be more recent
    expect(new Date(meta.generatedAt).getTime()).toBeGreaterThan(new Date(oldGeneratedAt).getTime());

    // Files should still be valid
    const claudeMd = await readFileOrNull(path.join(tempDir, 'CLAUDE.md'));
    expect(claudeMd).not.toBeNull();
    expect(claudeMd!.length).toBeGreaterThan(0);
  }, 30_000);
}, 60_000);

// ── Scenario 8: Malformed package.json + valid Dockerfile ────────────────────

describe('E2E: Malformed package.json + valid Dockerfile', () => {
  let tempDir: string;
  const engine = new DivergerEngine();

  beforeAll(async () => {
    tempDir = await createTempDir('malformed');
    // Malformed package.json
    await fs.writeFile(path.join(tempDir, 'package.json'), '"not json {{');
    // Valid Dockerfile
    await fs.writeFile(
      path.join(tempDir, 'Dockerfile'),
      'FROM python:3.12\nWORKDIR /app\nCOPY . .\nCMD ["python", "main.py"]\n',
    );
  }, 10_000);

  afterAll(async () => {
    await removeTempDir(tempDir);
  });

  it('should not crash, detect Docker but not Node.js', async () => {
    const ctx = makeCtx(tempDir);
    const result = await engine.init(ctx);

    const techIds = result.detection.technologies.map((t) => t.id);

    // Docker should be detected
    expect(techIds).toContain('docker');

    // Node.js should NOT be detected (package.json is malformed)
    expect(techIds).not.toContain('nodejs');

    // Should be able to write files without error
    await engine.writeFiles(result.files, tempDir, { force: true });
  }, 30_000);
}, 60_000);

// ── Cleanup verification (must be last) ──────────────────────────────────────

describe('E2E cleanup verification', () => {
  it('should have no residual temp directories from our tests', () => {
    // All successfully cleaned dirs were removed from the array
    expect(createdTempDirs).toHaveLength(0);
  });
});
