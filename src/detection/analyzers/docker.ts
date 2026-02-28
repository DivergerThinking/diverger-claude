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

    // Track multi-stage build evidence separately
    let multiStageFile: string | undefined;
    let multiStageCount = 0;

    for (const [filePath, content] of files) {
      analyzedFiles.push(filePath);

      if (filePath.startsWith('Dockerfile')) {
        hasDockerfile = true;

        // Detect multi-stage builds
        const stageCount = (content.match(/^FROM\s+/gm) ?? []).length;
        if (stageCount > 1) {
          multiStageFile = filePath;
          multiStageCount = stageCount;
        }
      }

      if (filePath.includes('compose')) {
        hasCompose = true;
        // Count services under the "services:" key
        const servicesMatch = content.match(/^services:\s*\n((?:\s{2}\w[^\n]*\n?)*)/m);
        let serviceCount = 0;
        if (servicesMatch?.[1]) {
          // Count top-level keys under services (exactly 2-space indented, not deeper)
          serviceCount = (servicesMatch[1].match(/^\s{2}[a-zA-Z_][\w-]*:/gm) ?? []).length;
        }
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
      const dockerTech: DetectedTechnology = {
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
      };

      // Attach multi-stage build evidence after creating the docker technology
      if (multiStageFile && multiStageCount > 1) {
        dockerTech.evidence.push({
          source: multiStageFile,
          type: 'content',
          description: `Multi-stage build detected (${multiStageCount} stages)`,
          weight: 5,
        });
      }

      technologies.unshift(dockerTech);
    }

    return { technologies, analyzedFiles };
  }
}
