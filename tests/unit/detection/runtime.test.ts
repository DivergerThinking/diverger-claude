import { describe, it, expect } from 'vitest';
import { RuntimeAnalyzer } from '../../../src/detection/analyzers/runtime.js';

describe('RuntimeAnalyzer', () => {
  const analyzer = new RuntimeAnalyzer();

  it('detects Bun from bun.lockb', async () => {
    const files = new Map([['bun.lockb', '']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].id).toBe('bun');
    expect(result.technologies[0].profileIds).toEqual(['infra/bun']);
  });

  it('detects Bun from bunfig.toml', async () => {
    const files = new Map([['bunfig.toml', '[install]\noptional = true']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].id).toBe('bun');
  });

  it('detects Deno from deno.json', async () => {
    const files = new Map([['deno.json', '{"tasks": {"dev": "deno run --watch main.ts"}}']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].id).toBe('deno');
    expect(result.technologies[0].profileIds).toEqual(['infra/deno']);
  });

  it('detects Deno from deno.jsonc', async () => {
    const files = new Map([['deno.jsonc', '// Deno config\n{"tasks": {}}']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].id).toBe('deno');
  });

  it('detects both Bun and Deno when both present', async () => {
    const files = new Map([['bun.lockb', ''], ['deno.json', '{}']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies).toHaveLength(2);
    expect(result.technologies.map(t => t.id).sort()).toEqual(['bun', 'deno']);
  });

  it('deduplicates Bun when multiple files found', async () => {
    const files = new Map([['bun.lockb', ''], ['bunfig.toml', '']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies).toHaveLength(1);
    expect(result.technologies[0].id).toBe('bun');
  });

  it('returns empty for unrelated files', async () => {
    const files = new Map([['package.json', '{}']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies).toHaveLength(0);
  });

  it('has correct id and name', () => {
    expect(analyzer.id).toBe('runtime');
    expect(analyzer.name).toBe('JS Runtimes');
  });

  it('has correct file patterns', () => {
    expect(analyzer.filePatterns).toEqual(['bun.lockb', 'bunfig.toml', 'deno.json', 'deno.jsonc']);
  });

  it('reports correct confidence and evidence', async () => {
    const files = new Map([['bun.lockb', '']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.technologies[0].confidence).toBe(95);
    expect(result.technologies[0].evidence).toHaveLength(1);
    expect(result.technologies[0].evidence[0].type).toBe('config-file');
    expect(result.technologies[0].evidence[0].weight).toBe(95);
  });

  it('tracks analyzed files correctly', async () => {
    const files = new Map([['bun.lockb', ''], ['deno.json', '{}']]);
    const result = await analyzer.analyze(files, '/test');
    expect(result.analyzedFiles).toContain('bun.lockb');
    expect(result.analyzedFiles).toContain('deno.json');
    expect(result.analyzedFiles).toHaveLength(2);
  });

  it('sets category to infra for all detected technologies', async () => {
    const files = new Map([['bun.lockb', ''], ['deno.json', '{}']]);
    const result = await analyzer.analyze(files, '/test');
    for (const tech of result.technologies) {
      expect(tech.category).toBe('infra');
    }
  });
});
