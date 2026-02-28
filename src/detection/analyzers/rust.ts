import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseTOML } from '../../utils/parsers.js';

interface CargoToml {
  package?: { name?: string; version?: string; edition?: string };
  dependencies?: Record<string, unknown>;
  'dev-dependencies'?: Record<string, unknown>;
}

export class RustAnalyzer extends BaseAnalyzer {
  readonly id = 'rust';
  readonly name = 'Rust';
  readonly filePatterns = ['Cargo.toml'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    const cargoContent = files.get('Cargo.toml');
    if (!cargoContent) return { technologies, analyzedFiles };

    analyzedFiles.push('Cargo.toml');

    let cargo: CargoToml = {};
    try {
      cargo = parseTOML<CargoToml>(cargoContent, 'Cargo.toml');
    } catch {
      // Continue with basic detection
    }

    technologies.push({
      id: 'rust',
      name: 'Rust',
      category: 'language',
      version: cargo.package?.edition,
      confidence: 95,
      evidence: [{ source: 'Cargo.toml', type: 'manifest', description: 'Cargo.toml found', weight: 95 }],
      profileIds: ['languages/rust'],
    });

    const allDeps = { ...cargo.dependencies, ...cargo['dev-dependencies'] };
    const depNames = Object.keys(allDeps);

    const patterns: Array<{ dep: string; id: string; name: string }> = [
      { dep: 'actix-web', id: 'actix-web', name: 'Actix Web' },
      { dep: 'axum', id: 'axum', name: 'Axum' },
      { dep: 'rocket', id: 'rocket', name: 'Rocket' },
      { dep: 'tokio', id: 'tokio', name: 'Tokio' },
      { dep: 'serde', id: 'serde', name: 'Serde' },
    ];

    for (const p of patterns) {
      if (depNames.includes(p.dep)) {
        technologies.push({
          id: p.id,
          name: p.name,
          category: 'framework',
          confidence: 85,
          evidence: [{ source: 'Cargo.toml', type: 'manifest', description: `Found "${p.dep}" in dependencies`, weight: 85 }],
          parentId: 'rust',
          profileIds: [],
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
