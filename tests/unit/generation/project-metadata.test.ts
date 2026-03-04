import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { extractProjectMetadata } from '../../../src/generation/project-metadata.js';

describe('extractProjectMetadata', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'meta-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('extracts name and description from package.json', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: '@myorg/my-app',
      description: 'A test application',
    }));

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.name).toBe('@myorg/my-app');
    expect(meta.description).toBe('A test application');
  });

  it('extracts filtered scripts from package.json', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'my-app',
      scripts: {
        build: 'tsup',
        test: 'vitest run',
        lint: 'eslint src/',
        dev: 'tsx watch src/index.ts',
        'prepare': 'husky install',  // should be filtered out
        'postinstall': 'patch-package', // should be filtered out
      },
    }));

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.scripts).toEqual({
      build: 'tsup',
      test: 'vitest run',
      lint: 'eslint src/',
      dev: 'tsx watch src/index.ts',
    });
  });

  it('extracts entry points from package.json', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'my-cli',
      main: './dist/index.js',
      bin: { 'my-cli': './dist/cli.js' },
    }));

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.entryPoints).toEqual({
      main: './dist/index.js',
      'my-cli': './dist/cli.js',
    });
  });

  it('extracts string bin entry from package.json', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'my-tool',
      bin: './dist/index.js',
    }));

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.entryPoints).toEqual({
      'my-tool': './dist/index.js',
    });
  });

  it('detects package manager from lock files', () => {
    writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    const meta = extractProjectMetadata(tmpDir);
    expect(meta.packageManager).toBe('pnpm');
  });

  it('detects package manager from packageManager field', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'my-app',
      packageManager: 'yarn@4.0.0',
    }));

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.packageManager).toBe('yarn');
  });

  it('extracts name and description from pyproject.toml', () => {
    writeFileSync(path.join(tmpDir, 'pyproject.toml'), `
[project]
name = "my-python-app"
description = "A Python application"

[project.scripts]
serve = "uvicorn main:app"
migrate = "alembic upgrade head"
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.name).toBe('my-python-app');
    expect(meta.description).toBe('A Python application');
    expect(meta.pythonScripts).toEqual({
      serve: 'uvicorn main:app',
      migrate: 'alembic upgrade head',
    });
  });

  it('extracts name and description from pubspec.yaml', () => {
    writeFileSync(path.join(tmpDir, 'pubspec.yaml'), `
name: imbx_front
description: A Flutter application for iMBx
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"
  flutter: ">=3.10.0"

dependencies:
  flutter:
    sdk: flutter
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.name).toBe('imbx_front');
    expect(meta.description).toBe('A Flutter application for iMBx');
  });

  it('package.json takes precedence over pubspec.yaml for name/description', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'js-name',
      description: 'JS description',
    }));
    writeFileSync(path.join(tmpDir, 'pubspec.yaml'), `
name: dart_name
description: Dart description
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.name).toBe('js-name');
    expect(meta.description).toBe('JS description');
  });

  it('extracts name and description from Cargo.toml', () => {
    writeFileSync(path.join(tmpDir, 'Cargo.toml'), `
[package]
name = "my-rust-app"
description = "A Rust application"
version = "0.1.0"
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.name).toBe('my-rust-app');
    expect(meta.description).toBe('A Rust application');
  });

  it('extracts Makefile targets', () => {
    writeFileSync(path.join(tmpDir, 'Makefile'), `
build:
\tgo build ./...

test:
\tgo test ./...

lint:
\tgolangci-lint run

_internal:
\techo internal

all: build test
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.makeTargets).toEqual(['build', 'test', 'lint']);
  });

  it('excludes Makefile variable assignments and ALL_CAPS names', () => {
    writeFileSync(path.join(tmpDir, 'Makefile'), `
PYTHONPATH := .
SHELL := /bin/bash
DOCKER_IMAGE = myapp

build:
\tpython -m build

test:
\tpytest

deploy:
\tdocker push
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.makeTargets).toEqual(['build', 'test', 'deploy']);
  });

  it('detects key directories', () => {
    mkdirSync(path.join(tmpDir, 'src'));
    mkdirSync(path.join(tmpDir, 'tests'));
    mkdirSync(path.join(tmpDir, 'docs'));

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.keyDirectories).toContain('src');
    expect(meta.keyDirectories).toContain('tests');
    expect(meta.keyDirectories).toContain('docs');
  });

  it('extracts README summary', () => {
    writeFileSync(path.join(tmpDir, 'README.md'), `# My Project

This is the first paragraph of the README that describes the project.

## Installation

Install it with npm.
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.readmeSummary).toBe('This is the first paragraph of the README that describes the project.');
  });

  it('includes architecture from detection result', () => {
    const meta = extractProjectMetadata(tmpDir, {
      technologies: [],
      architecture: 'monolith',
      rootDir: tmpDir,
      detectedAt: new Date().toISOString(),
    });

    expect(meta.architecture).toBe('monolith');
  });

  it('returns empty metadata when no manifests exist', () => {
    const meta = extractProjectMetadata(tmpDir);
    expect(meta.name).toBeUndefined();
    expect(meta.description).toBeUndefined();
    expect(meta.scripts).toBeUndefined();
    expect(meta.keyDirectories).toEqual([]);
  });

  it('package.json takes precedence over pyproject.toml for name/description', () => {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'js-name',
      description: 'JS description',
    }));
    writeFileSync(path.join(tmpDir, 'pyproject.toml'), `
[project]
name = "py-name"
description = "Python description"
`);

    const meta = extractProjectMetadata(tmpDir);
    expect(meta.name).toBe('js-name');
    expect(meta.description).toBe('JS description');
  });
});
