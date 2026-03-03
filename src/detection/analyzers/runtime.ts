import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';

export class RuntimeAnalyzer extends BaseAnalyzer {
  readonly id = 'runtime';
  readonly name = 'JS Runtimes';
  readonly filePatterns = ['bun.lockb', 'bunfig.toml', 'deno.json', 'deno.jsonc'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    for (const [filePath] of files) {
      // Detect Bun
      if ((filePath === 'bun.lockb' || filePath === 'bunfig.toml') && !technologies.some(t => t.id === 'bun')) {
        analyzedFiles.push(filePath);
        technologies.push({
          id: 'bun',
          name: 'Bun',
          category: 'infra',
          confidence: 95,
          evidence: [{ source: filePath, type: 'config-file', description: `Bun config found: ${filePath}`, weight: 95 }],
          profileIds: ['infra/bun'],
        });
      }
      // Detect Deno
      if ((filePath === 'deno.json' || filePath === 'deno.jsonc') && !technologies.some(t => t.id === 'deno')) {
        analyzedFiles.push(filePath);
        technologies.push({
          id: 'deno',
          name: 'Deno',
          category: 'infra',
          confidence: 95,
          evidence: [{ source: filePath, type: 'config-file', description: `Deno config found: ${filePath}`, weight: 95 }],
          profileIds: ['infra/deno'],
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
