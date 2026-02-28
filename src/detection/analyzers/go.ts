import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';

export class GoAnalyzer extends BaseAnalyzer {
  readonly id = 'go';
  readonly name = 'Go';
  readonly filePatterns = ['go.mod', 'go.sum'];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    const goMod = files.get('go.mod');
    if (!goMod) return { technologies, analyzedFiles };

    analyzedFiles.push('go.mod');

    // Extract Go version
    const versionMatch = goMod.match(/^go\s+(\d+\.\d+)/m);
    const goVersion = versionMatch?.[1];

    technologies.push({
      id: 'go',
      name: 'Go',
      category: 'language',
      version: goVersion,
      majorVersion: goVersion ? parseInt(goVersion.split('.')[0]!, 10) : undefined,
      confidence: 95,
      evidence: [{ source: 'go.mod', type: 'manifest', description: `go.mod found (Go ${goVersion ?? 'unknown'})`, weight: 95 }],
      profileIds: ['languages/go'],
    });

    // Detect common Go frameworks
    const frameworkPatterns: Array<{ pattern: string; id: string; name: string; profiles: string[] }> = [
      { pattern: 'github.com/gin-gonic/gin', id: 'gin', name: 'Gin', profiles: ['frameworks/gin'] },
      { pattern: 'github.com/labstack/echo', id: 'echo', name: 'Echo', profiles: ['frameworks/echo'] },
      { pattern: 'github.com/gofiber/fiber', id: 'fiber', name: 'Fiber', profiles: ['frameworks/fiber'] },
      { pattern: 'github.com/gorilla/mux', id: 'gorilla-mux', name: 'Gorilla Mux', profiles: [] },
    ];

    for (const fw of frameworkPatterns) {
      if (goMod.includes(fw.pattern)) {
        technologies.push({
          id: fw.id,
          name: fw.name,
          category: 'framework',
          confidence: 90,
          evidence: [{ source: 'go.mod', type: 'manifest', description: `Found "${fw.pattern}" in dependencies`, weight: 90 }],
          parentId: 'go',
          profileIds: fw.profiles,
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
