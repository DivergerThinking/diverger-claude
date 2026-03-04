import { describe, it, expect } from 'vitest';
import { buildTemplateContext } from '../../../src/profiles/template-context.js';
import type { DetectionResult, DetectedTechnology } from '../../../src/core/types.js';

function makeTech(
  id: string,
  category: 'language' | 'framework' | 'testing' | 'infra' = 'language',
  confidence = 90,
  evidence: Array<{ source: string }> = [],
): DetectedTechnology {
  return {
    id,
    name: id,
    category,
    confidence,
    evidence: evidence.map((e) => ({
      source: e.source,
      type: 'manifest' as const,
      description: '',
      weight: confidence,
    })),
    profileIds: [],
  };
}

function makeDetection(technologies: DetectedTechnology[]): DetectionResult {
  return {
    technologies,
    rootDir: '/project',
    detectedAt: new Date().toISOString(),
  };
}

describe('buildTemplateContext', () => {
  it('should use TypeScript defaults when no language detected', () => {
    const ctx = buildTemplateContext(makeDetection([]));
    expect(ctx.lang.id).toBe('typescript');
    expect(ctx.lang.installCmd).toBe('npm ci');
    expect(ctx.ci.setupAction).toBe('actions/setup-node');
    expect(ctx.docker.buildImage).toBe('node:20-alpine');
  });

  it('should pick highest-confidence language', () => {
    const detection = makeDetection([
      makeTech('typescript', 'language', 80),
      makeTech('python', 'language', 95),
    ]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('python');
    expect(ctx.lang.installCmd).toBe('pip install -r requirements.txt');
  });

  it('should ignore non-language technologies for primary language', () => {
    const detection = makeDetection([
      makeTech('docker', 'infra', 100),
      makeTech('jest', 'testing', 95),
      makeTech('go', 'language', 85),
    ]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('go');
    expect(ctx.lang.testCmd).toBe('go test ./...');
  });

  it('should return Python context for Python projects', () => {
    const detection = makeDetection([makeTech('python', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('python');
    expect(ctx.lang.packageManager).toBe('pip');
    expect(ctx.ci.setupAction).toBe('actions/setup-python');
    expect(ctx.docker.buildImage).toBe('python:3.12-slim');
  });

  it('should return Go context for Go projects', () => {
    const detection = makeDetection([makeTech('go', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('go');
    expect(ctx.lang.installCmd).toBe('go mod download');
    expect(ctx.ci.setupAction).toBe('actions/setup-go');
    expect(ctx.docker.runtimeImage).toBe('gcr.io/distroless/static-debian12');
  });

  it('should return Rust context for Rust projects', () => {
    const detection = makeDetection([makeTech('rust', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('rust');
    expect(ctx.lang.testCmd).toBe('cargo test');
    expect(ctx.ci.setupAction).toBe('dtolnay/rust-toolchain');
  });

  it('should return Java context for Java projects', () => {
    const detection = makeDetection([makeTech('java', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('java');
    expect(ctx.lang.packageManager).toBe('maven');
    expect(ctx.ci.cacheInput).toBe('maven');
  });

  it('should return Dart context for Dart projects', () => {
    const detection = makeDetection([makeTech('dart', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('dart');
    expect(ctx.lang.installCmd).toBe('dart pub get');
    expect(ctx.ci.setupAction).toBe('dart-lang/setup-dart');
    expect(ctx.docker.buildImage).toBe('dart:stable');
  });

  it('should return C# context for C# projects', () => {
    const detection = makeDetection([makeTech('csharp', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('csharp');
    expect(ctx.lang.installCmd).toBe('dotnet restore');
    expect(ctx.ci.setupAction).toBe('actions/setup-dotnet');
  });

  it('should return Ruby context for Ruby projects', () => {
    const detection = makeDetection([makeTech('ruby', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('ruby');
    expect(ctx.lang.installCmd).toBe('bundle install');
    expect(ctx.ci.setupAction).toBe('ruby/setup-ruby');
  });

  it('should override package manager for pnpm', () => {
    const detection = makeDetection([
      {
        ...makeTech('typescript', 'language', 90),
        evidence: [
          { source: 'pnpm-lock.yaml', type: 'manifest' as const, description: '', weight: 90 },
        ],
      },
    ]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.packageManager).toBe('pnpm');
    expect(ctx.lang.installCmd).toBe('pnpm install --frozen-lockfile');
    expect(ctx.lang.lockFile).toBe('pnpm-lock.yaml');
  });

  it('should override package manager for yarn', () => {
    const detection = makeDetection([
      {
        ...makeTech('typescript', 'language', 90),
        evidence: [
          { source: 'yarn.lock', type: 'manifest' as const, description: '', weight: 90 },
        ],
      },
    ]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.packageManager).toBe('yarn');
    expect(ctx.lang.installCmd).toBe('yarn install --frozen-lockfile');
  });

  it('should override for bun runtime', () => {
    const detection = makeDetection([
      makeTech('typescript', 'language', 90),
      makeTech('bun', 'infra', 95),
    ]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.packageManager).toBe('bun');
    expect(ctx.lang.installCmd).toBe('bun install --frozen-lockfile');
    expect(ctx.ci.setupAction).toBe('oven-sh/setup-bun');
  });

  it('should override for deno runtime', () => {
    const detection = makeDetection([
      makeTech('typescript', 'language', 90),
      makeTech('deno', 'infra', 95),
    ]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.packageManager).toBe('deno');
    expect(ctx.lang.testCmd).toBe('deno test');
    expect(ctx.ci.setupAction).toBe('denoland/setup-deno');
  });

  it('should NOT override package manager for non-JS languages', () => {
    const detection = makeDetection([
      {
        ...makeTech('python', 'language', 90),
        evidence: [
          { source: 'pnpm-lock.yaml', type: 'manifest' as const, description: '', weight: 10 },
        ],
      },
    ]);
    const ctx = buildTemplateContext(detection);
    // Python should not be overridden even if pnpm evidence exists
    expect(ctx.lang.packageManager).toBe('pip');
  });

  it('should fall back to TypeScript for unknown language IDs', () => {
    const detection = makeDetection([makeTech('unknown-lang', 'language', 90)]);
    const ctx = buildTemplateContext(detection);
    expect(ctx.lang.id).toBe('typescript');
  });
});
