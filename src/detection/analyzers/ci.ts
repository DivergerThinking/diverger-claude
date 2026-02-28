import type { AnalyzerResult, DetectedTechnology } from '../../core/types.js';
import { BaseAnalyzer } from './base.js';

export class CIAnalyzer extends BaseAnalyzer {
  readonly id = 'ci';
  readonly name = 'CI/CD';
  readonly filePatterns = [
    '.github/workflows/*.yml',
    '.github/workflows/*.yaml',
    '.gitlab-ci.yml',
    'Jenkinsfile',
    '.circleci/config.yml',
    'azure-pipelines.yml',
  ];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    for (const [filePath] of files) {
      analyzedFiles.push(filePath);

      if (filePath.startsWith('.github/workflows/')) {
        if (!technologies.some((t) => t.id === 'github-actions')) {
          technologies.push({
            id: 'github-actions',
            name: 'GitHub Actions',
            category: 'infra',
            confidence: 95,
            evidence: [{
              source: filePath,
              type: 'config-file',
              description: `GitHub Actions workflow found: ${filePath}`,
              weight: 95,
            }],
            profileIds: ['infra/github-actions'],
          });
        }
      }

      if (filePath === '.gitlab-ci.yml') {
        technologies.push({
          id: 'gitlab-ci',
          name: 'GitLab CI',
          category: 'infra',
          confidence: 95,
          evidence: [{
            source: filePath,
            type: 'config-file',
            description: 'GitLab CI config found',
            weight: 95,
          }],
          profileIds: [],
        });
      }

      if (filePath === 'Jenkinsfile') {
        technologies.push({
          id: 'jenkins',
          name: 'Jenkins',
          category: 'infra',
          confidence: 95,
          evidence: [{
            source: filePath,
            type: 'config-file',
            description: 'Jenkinsfile found',
            weight: 95,
          }],
          profileIds: [],
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
