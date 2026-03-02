import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';
import { parseTOML } from '../../utils/parsers.js';
import { findFileEntry } from '../file-utils.js';

interface CargoToml {
  package?: { name?: string; version?: string; edition?: string | { workspace: boolean }; 'rust-version'?: string };
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

    const cargoEntry = findFileEntry(files, 'Cargo.toml');
    if (!cargoEntry) return { technologies, analyzedFiles };

    analyzedFiles.push(cargoEntry.path);

    let cargo: CargoToml = {};
    try {
      cargo = parseTOML<CargoToml>(cargoEntry.content, cargoEntry.path);
    } catch {
      // Continue with basic detection
    }

    // Use rust-version (MSRV) or edition as the display version, NOT the crate version
    // edition can be { workspace: true } in workspace-inherited configs — only use string values
    const rawEdition = cargo.package?.edition;
    const edition = typeof rawEdition === 'string' ? rawEdition : undefined;
    const rustVersion = cargo.package?.['rust-version'] ?? edition;
    // Only derive majorVersion from MSRV (e.g. "1.75" → 1), not from edition (e.g. "2021" → 2021)
    const rustMsrv = cargo.package?.['rust-version'];
    const rustMajor = rustMsrv ? parseInt(rustMsrv, 10) : undefined;

    technologies.push({
      id: 'rust',
      name: 'Rust',
      category: 'language',
      version: rustVersion,
      majorVersion: Number.isFinite(rustMajor) ? rustMajor : undefined,
      confidence: 95,
      evidence: [{ source: cargoEntry.path, type: 'manifest', description: 'Cargo.toml found', weight: 95 }],
      profileIds: ['languages/rust'],
    });

    const allDeps = { ...cargo.dependencies, ...cargo['dev-dependencies'] };
    const depNames = Object.keys(allDeps);

    const patterns: Array<{ dep: string; id: string; name: string; profileIds: string[] }> = [
      { dep: 'actix-web', id: 'actix-web', name: 'Actix Web', profileIds: ['frameworks/actix-web'] },
      { dep: 'axum', id: 'axum', name: 'Axum', profileIds: ['frameworks/axum'] },
      { dep: 'rocket', id: 'rocket', name: 'Rocket', profileIds: ['frameworks/rocket'] },
      { dep: 'tokio', id: 'tokio', name: 'Tokio', profileIds: [] },
      { dep: 'serde', id: 'serde', name: 'Serde', profileIds: [] },
    ];

    for (const p of patterns) {
      if (depNames.includes(p.dep)) {
        technologies.push({
          id: p.id,
          name: p.name,
          category: 'framework',
          confidence: 85,
          evidence: [{ source: cargoEntry.path, type: 'manifest', description: `Found "${p.dep}" in dependencies`, weight: 85 }],
          parentId: 'rust',
          profileIds: p.profileIds,
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
