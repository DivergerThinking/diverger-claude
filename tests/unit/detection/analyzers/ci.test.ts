import { describe, it, expect } from 'vitest';
import { CIAnalyzer } from '../../../../src/detection/analyzers/ci.js';

describe('CIAnalyzer', () => {
  const analyzer = new CIAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('ci');
    expect(analyzer.name).toBe('CI/CD');
    expect(analyzer.filePatterns).toContain('.github/workflows/*.yml');
    expect(analyzer.filePatterns).toContain('.circleci/config.yml');
    expect(analyzer.filePatterns).toContain('azure-pipelines.yml');
  });

  it('should return empty result when no CI files found', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect GitHub Actions from workflow files', async () => {
    const files = new Map<string, string>();
    files.set('.github/workflows/ci.yml', 'name: CI\non: push');
    const result = await analyzer.analyze(files, '/project');

    const gha = result.technologies.find((t) => t.id === 'github-actions');
    expect(gha).toBeDefined();
    expect(gha!.confidence).toBe(95);
    expect(gha!.profileIds).toContain('infra/github-actions');
    expect(result.analyzedFiles).toContain('.github/workflows/ci.yml');
  });

  it('should detect GitHub Actions only once from multiple workflow files', async () => {
    const files = new Map<string, string>();
    files.set('.github/workflows/ci.yml', 'name: CI');
    files.set('.github/workflows/deploy.yml', 'name: Deploy');
    const result = await analyzer.analyze(files, '/project');

    const ghaCount = result.technologies.filter((t) => t.id === 'github-actions').length;
    expect(ghaCount).toBe(1);
    expect(result.analyzedFiles).toHaveLength(2);
  });

  it('should detect GitLab CI', async () => {
    const files = new Map<string, string>();
    files.set('.gitlab-ci.yml', 'stages:\n  - test');
    const result = await analyzer.analyze(files, '/project');

    const gitlab = result.technologies.find((t) => t.id === 'gitlab-ci');
    expect(gitlab).toBeDefined();
    expect(gitlab!.name).toBe('GitLab CI');
    expect(result.analyzedFiles).toContain('.gitlab-ci.yml');
  });

  it('should detect Jenkins', async () => {
    const files = new Map<string, string>();
    files.set('Jenkinsfile', 'pipeline { }');
    const result = await analyzer.analyze(files, '/project');

    const jenkins = result.technologies.find((t) => t.id === 'jenkins');
    expect(jenkins).toBeDefined();
    expect(jenkins!.name).toBe('Jenkins');
    expect(result.analyzedFiles).toContain('Jenkinsfile');
  });

  it('should detect CircleCI', async () => {
    const files = new Map<string, string>();
    files.set('.circleci/config.yml', 'version: 2.1');
    const result = await analyzer.analyze(files, '/project');

    const circle = result.technologies.find((t) => t.id === 'circleci');
    expect(circle).toBeDefined();
    expect(circle!.name).toBe('CircleCI');
    expect(circle!.confidence).toBe(95);
    expect(result.analyzedFiles).toContain('.circleci/config.yml');
  });

  it('should detect Azure Pipelines', async () => {
    const files = new Map<string, string>();
    files.set('azure-pipelines.yml', 'trigger:\n  - main');
    const result = await analyzer.analyze(files, '/project');

    const azure = result.technologies.find((t) => t.id === 'azure-pipelines');
    expect(azure).toBeDefined();
    expect(azure!.name).toBe('Azure Pipelines');
    expect(azure!.confidence).toBe(95);
    expect(result.analyzedFiles).toContain('azure-pipelines.yml');
  });

  it('should only include relevant files in analyzedFiles', async () => {
    const files = new Map<string, string>();
    files.set('.github/workflows/ci.yml', 'name: CI');
    files.set('package.json', '{}'); // Not a CI file
    const result = await analyzer.analyze(files, '/project');

    expect(result.analyzedFiles).toContain('.github/workflows/ci.yml');
    expect(result.analyzedFiles).not.toContain('package.json');
  });
});
