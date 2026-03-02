import { describe, it, expect } from 'vitest';
import { RustAnalyzer } from '../../../../src/detection/analyzers/rust.js';

const CARGO_BASIC = `[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4"
serde = { version = "1", features = ["derive"] }
`;

const CARGO_MULTI = `[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }

[dev-dependencies]
rocket = "0.5"
`;

const CARGO_BARE = `[package]
name = "my-lib"
version = "0.1.0"
edition = "2021"
`;

const CARGO_MSRV = `[package]
name = "my-lib"
version = "0.1.0"
edition = "2021"
rust-version = "1.75"
`;

describe('RustAnalyzer', () => {
  const analyzer = new RustAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('rust');
    expect(analyzer.name).toBe('Rust');
    expect(analyzer.filePatterns).toContain('Cargo.toml');
  });

  it('should return empty result when Cargo.toml is missing', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect Rust from bare Cargo.toml (edition-only, no majorVersion)', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_BARE);
    const result = await analyzer.analyze(files, '/project');

    const rust = result.technologies.find((t) => t.id === 'rust');
    expect(rust).toBeDefined();
    expect(rust!.name).toBe('Rust');
    expect(rust!.category).toBe('language');
    expect(rust!.confidence).toBe(95);
    // version should be the Rust edition as display version
    expect(rust!.version).toBe('2021');
    // majorVersion should NOT be derived from edition (2021 is not a useful major version)
    expect(rust!.majorVersion).toBeUndefined();
    expect(rust!.profileIds).toContain('languages/rust');
    expect(result.analyzedFiles).toContain('Cargo.toml');
  });

  it('should detect Actix Web from dependencies', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const actix = result.technologies.find((t) => t.id === 'actix-web');
    expect(actix).toBeDefined();
    expect(actix!.name).toBe('Actix Web');
    expect(actix!.category).toBe('framework');
    expect(actix!.confidence).toBe(85);
    expect(actix!.parentId).toBe('rust');
    expect(actix!.profileIds).toContain('frameworks/actix-web');
  });

  it('should detect Serde from dependencies', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const serde = result.technologies.find((t) => t.id === 'serde');
    expect(serde).toBeDefined();
    expect(serde!.name).toBe('Serde');
    expect(serde!.profileIds).toEqual([]);
  });

  it('should detect multiple frameworks including dev-dependencies', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_MULTI);
    const result = await analyzer.analyze(files, '/project');

    const ids = result.technologies.map((t) => t.id);
    expect(ids).toContain('rust');
    expect(ids).toContain('axum');
    expect(ids).toContain('tokio');
    expect(ids).toContain('serde');
    expect(ids).toContain('rocket');

    const axum = result.technologies.find((t) => t.id === 'axum');
    expect(axum!.profileIds).toContain('frameworks/axum');
    const rocket = result.technologies.find((t) => t.id === 'rocket');
    expect(rocket!.profileIds).toContain('frameworks/rocket');
  });

  it('should not detect frameworks from bare Cargo.toml', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_BARE);
    const result = await analyzer.analyze(files, '/project');

    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0]!.id).toBe('rust');
  });

  it('should handle malformed Cargo.toml gracefully', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', 'this is not valid toml {{{');
    const result = await analyzer.analyze(files, '/project');

    // Should still detect Rust (basic detection) but no frameworks
    const rust = result.technologies.find((t) => t.id === 'rust');
    expect(rust).toBeDefined();
    expect(rust!.version).toBeUndefined();
  });

  it('should prefer rust-version (MSRV) over edition for language version', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_MSRV);
    const result = await analyzer.analyze(files, '/project');

    const rust = result.technologies.find((t) => t.id === 'rust');
    expect(rust).toBeDefined();
    // rust-version (MSRV) takes priority over edition
    expect(rust!.version).toBe('1.75');
    expect(rust!.majorVersion).toBe(1);
  });

  it('should handle edition.workspace = true without [object Object]', async () => {
    const cargoWorkspace = `[package]
name = "my-crate"
version = "0.1.0"

[package.edition]
workspace = true

[dependencies]
actix-web = "4"
serde = { version = "1", features = ["derive"] }
`;
    const files = new Map<string, string>();
    files.set('Cargo.toml', cargoWorkspace);
    const result = await analyzer.analyze(files, '/project');

    const rust = result.technologies.find((t) => t.id === 'rust');
    expect(rust).toBeDefined();
    // version should NOT be '[object Object]' — should be undefined when edition is workspace-inherited
    expect(rust!.version).toBeUndefined();
    expect(rust!.majorVersion).toBeUndefined();
    // Frameworks should still be detected
    const actix = result.technologies.find((t) => t.id === 'actix-web');
    expect(actix).toBeDefined();
  });

  it('should return false from hasRelevantFiles when only irrelevant files present', () => {
    const files = new Map<string, string>();
    files.set('package.json', '{}');
    files.set('tsconfig.json', '{}');
    expect(analyzer.hasRelevantFiles(files)).toBe(false);
  });

  it('should return true from hasRelevantFiles when Cargo.toml is present', () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', '');
    expect(analyzer.hasRelevantFiles(files)).toBe(true);
  });

  it('should include proper evidence', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_BASIC);
    const result = await analyzer.analyze(files, '/project');

    const actix = result.technologies.find((t) => t.id === 'actix-web');
    expect(actix!.evidence).toHaveLength(1);
    expect(actix!.evidence[0]!.source).toBe('Cargo.toml');
    expect(actix!.evidence[0]!.type).toBe('manifest');
    expect(actix!.evidence[0]!.description).toContain('actix-web');
  });
});
