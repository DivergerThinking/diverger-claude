import { describe, it, expect } from 'vitest';
import { buildSummary } from '../../../src/cli/ui/summary.js';
import type { ComposedConfig, DetectionResult, KnowledgeResult } from '../../../src/core/types.js';
import type { WriteResult } from '../../../src/generation/file-writer.js';

function makeDetection(techs: Array<{ id: string; name: string; confidence: number }>): DetectionResult {
  return {
    technologies: techs.map((t) => ({
      ...t,
      category: 'framework' as const,
      evidence: [],
      profileIds: [],
    })),
    rootDir: '/test',
    detectedAt: new Date().toISOString(),
  };
}

function makeComposed(overrides: Partial<ComposedConfig> = {}): ComposedConfig {
  return {
    claudeMdSections: [],
    settings: { permissions: {} },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
    mcp: [],
    externalTools: [],
    appliedProfiles: [],
    ...overrides,
  };
}

function makeWriteResults(paths: string[], action: 'created' | 'updated' = 'created'): WriteResult[] {
  return paths.map((p) => ({ path: p, action }));
}

describe('buildSummary', () => {
  it('should include title line', () => {
    const summary = buildSummary(
      makeDetection([{ id: 'react', name: 'React', confidence: 95 }]),
      makeComposed({ appliedProfiles: ['frameworks/react'] }),
      makeWriteResults(['.claude/CLAUDE.md']),
    );
    expect(summary).toContain('Configuración generada exitosamente');
  });

  it('should show detected technologies with confidence', () => {
    const summary = buildSummary(
      makeDetection([
        { id: 'typescript', name: 'TypeScript', confidence: 99 },
        { id: 'react', name: 'React', confidence: 95 },
      ]),
      makeComposed({ appliedProfiles: ['languages/typescript', 'frameworks/react'] }),
      makeWriteResults(['.claude/CLAUDE.md']),
    );
    expect(summary).toContain('TypeScript');
    expect(summary).toContain('React');
    expect(summary).toContain('99%');
    expect(summary).toContain('95%');
  });

  it('should show applied profiles count and names', () => {
    const composed = makeComposed({
      appliedProfiles: ['base/universal', 'languages/typescript', 'frameworks/react'],
    });
    const summary = buildSummary(
      makeDetection([{ id: 'react', name: 'React', confidence: 95 }]),
      composed,
      makeWriteResults(['.claude/CLAUDE.md']),
    );
    expect(summary).toContain('Profiles aplicados: 3');
    expect(summary).toContain('universal');
    expect(summary).toContain('typescript');
    expect(summary).toContain('react');
  });

  it('should show file counts', () => {
    const results = [
      ...makeWriteResults(['.claude/CLAUDE.md', '.claude/rules/a.md', '.claude/rules/b.md'], 'created'),
      ...makeWriteResults(['.claude/settings.json'], 'updated'),
    ];
    const summary = buildSummary(
      makeDetection([]),
      makeComposed(),
      results,
    );
    expect(summary).toContain('Archivos generados: 4');
    expect(summary).toContain('3');
    expect(summary).toContain('creados');
    expect(summary).toContain('1');
    expect(summary).toContain('actualizados');
  });

  it('should show rule and agent counts', () => {
    const composed = makeComposed({
      rules: [
        { path: 'code-style.md', content: '', governance: 'mandatory', description: '' },
        { path: 'security.md', content: '', governance: 'mandatory', description: '' },
      ],
      agents: [
        { name: 'code-reviewer', prompt: '', skills: [], description: '' },
        { name: 'test-writer', prompt: '', skills: [], description: '' },
      ],
    });
    const summary = buildSummary(
      makeDetection([]),
      composed,
      makeWriteResults([]),
    );
    expect(summary).toContain('Reglas activas: 2');
    expect(summary).toContain('Agentes configurados: 2');
    expect(summary).toContain('code-reviewer');
    expect(summary).toContain('test-writer');
  });

  it('should show knowledge results when present', () => {
    const knowledge: KnowledgeResult[] = [
      { technology: 'React', content: '', sources: [], fetchedAt: '', ttlDays: 30, fromCache: false },
      { technology: 'Next.js', content: '', sources: [], fetchedAt: '', ttlDays: 30, fromCache: true },
    ];
    const summary = buildSummary(
      makeDetection([]),
      makeComposed(),
      makeWriteResults([]),
      knowledge,
    );
    expect(summary).toContain('Knowledge: 2');
    expect(summary).toContain('React');
    expect(summary).toContain('Next.js');
  });

  it('should show next steps', () => {
    const summary = buildSummary(
      makeDetection([]),
      makeComposed(),
      makeWriteResults([]),
    );
    expect(summary).toContain('diverger check');
    expect(summary).toContain('diverger sync');
  });

  it('should not show knowledge section when empty', () => {
    const summary = buildSummary(
      makeDetection([]),
      makeComposed(),
      makeWriteResults([]),
      [],
    );
    expect(summary).not.toContain('Knowledge:');
  });
});
