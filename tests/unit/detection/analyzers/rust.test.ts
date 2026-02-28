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

  it('should detect Rust from bare Cargo.toml', async () => {
    const files = new Map<string, string>();
    files.set('Cargo.toml', CARGO_BARE);
    const result = await analyzer.analyze(files, '/project');

    const rust = result.technologies.find((t) => t.id === 'rust');
    expect(rust).toBeDefined();
    expect(rust!.name).toBe('Rust');
    expect(rust!.category).toBe('language');
    expect(rust!.confidence).toBe(95);
    expect(rust!.version).toBe('2021');
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
