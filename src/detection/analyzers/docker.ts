import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';

export class DockerAnalyzer extends BaseAnalyzer {
  readonly id = 'docker';
  readonly name = 'Docker';
  readonly filePatterns = [
    'Dockerfile',
    'Dockerfile.*',
    'docker-compose.yml',
    'docker-compose.yaml',
    'compose.yml',
    'compose.yaml',
  ];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    let hasDockerfile = false;
    let hasCompose = false;

    for (const [filePath, content] of files) {
      analyzedFiles.push(filePath);

      if (filePath.startsWith('Dockerfile')) {
        hasDockerfile = true;

        // Detect multi-stage builds
        const stageCount = (content.match(/^FROM\s+/gm) ?? []).length;
        if (stageCount > 1) {
          const existing = technologies.find((t) => t.id === 'docker');
          if (existing) {
            existing.evidence.push({
              source: filePath,
              type: 'content',
              description: `Multi-stage build detected (${stageCount} stages)`,
              weight: 5,
            });
          }
        }
      }

      if (filePath.includes('compose')) {
        hasCompose = true;
        // Count services to hint at microservices
        const serviceCount = (content.match(/^\s{2}\w+:/gm) ?? []).length;
        if (serviceCount > 3) {
          technologies.push({
            id: 'microservices-hint',
            name: 'Microservices (hint)',
            category: 'infra',
            confidence: 60,
            evidence: [{
              source: filePath,
              type: 'content',
              description: `${serviceCount} services in docker-compose suggest microservices`,
              weight: 60,
            }],
            profileIds: [],
          });
        }
      }
    }

    if (hasDockerfile || hasCompose) {
      technologies.unshift({
        id: 'docker',
        name: 'Docker',
        category: 'infra',
        confidence: 95,
        evidence: [{
          source: analyzedFiles[0]!,
          type: 'config-file',
          description: `Docker files found: ${analyzedFiles.join(', ')}`,
          weight: 95,
        }],
        profileIds: ['infra/docker'],
      });
    }

    return { technologies, analyzedFiles };
  }
}
