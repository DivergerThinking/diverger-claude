import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileScanner } from '../../../src/detection/scanner.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Chaos: FileScanner edge cases', () => {
  let tempDir: string;
  const scanner = new FileScanner();

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger-chaos-scanner-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return empty Map for empty directory', async () => {
    const result = await scanner.scan(tempDir);
    expect(result.size).toBe(0);
  });

  it('should handle directory with only non-manifest files', async () => {
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Hello');
    await fs.writeFile(path.join(tempDir, 'main.ts'), 'console.log("hi")');

    const result = await scanner.scan(tempDir);
    expect(result.size).toBe(0);
  });

  it('should find tsconfig.json even without package.json', async () => {
    await fs.writeFile(path.join(tempDir, 'tsconfig.json'), '{}');

    const result = await scanner.scan(tempDir);
    expect(result.has('tsconfig.json')).toBe(true);
  });

  it('should handle path with spaces', async () => {
    const spacedDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diverger chaos spaces '));
    try {
      await fs.writeFile(path.join(spacedDir, 'package.json'), '{"name":"test"}');
      const result = await scanner.scan(spacedDir);
      expect(result.has('package.json')).toBe(true);
      expect(result.get('package.json')).toBe('{"name":"test"}');
    } finally {
      await fs.rm(spacedDir, { recursive: true, force: true });
    }
  });

  it('should handle many manifest files without issue', async () => {
    // Create 50 .csproj files to test large result sets
    for (let i = 0; i < 50; i++) {
      await fs.writeFile(
        path.join(tempDir, `Project${i}.csproj`),
        `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>`,
      );
    }
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name":"test"}');

    const result = await scanner.scan(tempDir);
    expect(result.size).toBe(51); // 50 csproj + 1 package.json
  });

  it('should handle scanPatterns with empty patterns array', async () => {
    const result = await scanner.scanPatterns(tempDir, []);
    expect(result.size).toBe(0);
  });

  it('should ignore files in node_modules', async () => {
    await fs.mkdir(path.join(tempDir, 'node_modules', 'some-pkg'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'node_modules', 'some-pkg', 'package.json'), '{}');
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name":"root"}');

    const result = await scanner.scan(tempDir);
    // Only root package.json, not the one in node_modules
    expect(result.size).toBe(1);
    expect(result.has('package.json')).toBe(true);
  });

  // ── Subdirectory scanning ───────────────────────────────────────────

  describe('subdirectory scanning', () => {
    it('should find package.json in subdirectory via scanPatterns', async () => {
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'app', 'package.json'), '{"name":"sub"}');

      const result = await scanner.scanPatterns(tempDir, ['package.json']);
      expect(result.has('app/package.json')).toBe(true);
    });

    it('should find manifests in nested subdirectory (depth 2)', async () => {
      await fs.mkdir(path.join(tempDir, 'apps', 'web'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'apps', 'web', 'package.json'), '{"name":"web"}');

      const result = await scanner.scanPatterns(tempDir, ['package.json']);
      expect(result.has('apps/web/package.json')).toBe(true);
    });

    it('should find both root and subdirectory manifests', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), '{"name":"root"}');
      await fs.mkdir(path.join(tempDir, 'frontend'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'frontend', 'package.json'), '{"name":"frontend"}');

      const result = await scanner.scanPatterns(tempDir, ['package.json']);
      expect(result.has('package.json')).toBe(true);
      expect(result.has('frontend/package.json')).toBe(true);
    });

    it('should respect rootOnly set and not expand those patterns', async () => {
      await fs.mkdir(path.join(tempDir, 'subdir'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'turbo.json'), '{}');
      await fs.writeFile(path.join(tempDir, 'subdir', 'turbo.json'), '{}');

      const rootOnly = new Set(['turbo.json']);
      const result = await scanner.scanPatterns(tempDir, ['turbo.json'], rootOnly);
      expect(result.has('turbo.json')).toBe(true);
      expect(result.has('subdir/turbo.json')).toBe(false);
    });

    it('should not expand patterns that contain path separators', async () => {
      // .github/workflows/*.yml already has a path separator, so no **/ prefix added
      await fs.mkdir(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.github', 'workflows', 'ci.yml'), 'name: CI');

      const result = await scanner.scanPatterns(tempDir, ['.github/workflows/*.yml']);
      expect(result.has('.github/workflows/ci.yml')).toBe(true);
    });

    it('should ignore subdirectory files in node_modules via scanPatterns', async () => {
      await fs.mkdir(path.join(tempDir, 'node_modules', 'pkg'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'node_modules', 'pkg', 'package.json'), '{}');
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'app', 'package.json'), '{"name":"app"}');

      const result = await scanner.scanPatterns(tempDir, ['package.json']);
      expect(result.has('app/package.json')).toBe(true);
      expect(result.has('node_modules/pkg/package.json')).toBe(false);
    });

    it('should find Dockerfile.dev in subdirectory via wildcard expansion', async () => {
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'app', 'Dockerfile.dev'), 'FROM node:20');

      const result = await scanner.scanPatterns(tempDir, ['Dockerfile.*']);
      expect(result.has('app/Dockerfile.dev')).toBe(true);
    });

    it('should find *.csproj in subdirectory via wildcard expansion', async () => {
      await fs.mkdir(path.join(tempDir, 'src', 'MyApp'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'src', 'MyApp', 'MyApp.csproj'), '<Project/>');

      const result = await scanner.scanPatterns(tempDir, ['*.csproj']);
      expect(result.has('src/MyApp/MyApp.csproj')).toBe(true);
    });
  });
});
