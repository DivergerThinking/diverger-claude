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

  /** CI configs are always at the project root — never expand to subdirectories */
  override readonly rootOnlyPatterns = [
    '.gitlab-ci.yml',
    'Jenkinsfile',
    'azure-pipelines.yml',
  ];

  async analyze(files: Map<string, string>, _projectRoot: string): Promise<AnalyzerResult> {
    const technologies: DetectedTechnology[] = [];
    const analyzedFiles: string[] = [];

    for (const [filePath] of files) {
      if (filePath.startsWith('.github/workflows/')) {
        analyzedFiles.push(filePath);
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
      } else if (filePath === '.gitlab-ci.yml') {
        analyzedFiles.push(filePath);
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
          profileIds: ['infra/gitlab-ci'],
        });
      } else if (filePath === 'Jenkinsfile') {
        analyzedFiles.push(filePath);
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
          profileIds: ['infra/jenkins'],
        });
      } else if (filePath === '.circleci/config.yml') {
        analyzedFiles.push(filePath);
        technologies.push({
          id: 'circleci',
          name: 'CircleCI',
          category: 'infra',
          confidence: 95,
          evidence: [{
            source: filePath,
            type: 'config-file',
            description: 'CircleCI config found',
            weight: 95,
          }],
          profileIds: ['infra/circleci'],
        });
      } else if (filePath === 'azure-pipelines.yml') {
        analyzedFiles.push(filePath);
        technologies.push({
          id: 'azure-pipelines',
          name: 'Azure Pipelines',
          category: 'infra',
          confidence: 95,
          evidence: [{
            source: filePath,
            type: 'config-file',
            description: 'Azure Pipelines config found',
            weight: 95,
          }],
          profileIds: ['infra/azure-pipelines'],
        });
      }
    }

    return { technologies, analyzedFiles };
  }
}
