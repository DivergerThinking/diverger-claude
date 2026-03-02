import { describe, it, expect } from 'vitest';
import { DockerAnalyzer } from '../../../../src/detection/analyzers/docker.js';

describe('DockerAnalyzer', () => {
  const analyzer = new DockerAnalyzer();

  it('should have correct id, name, and filePatterns', () => {
    expect(analyzer.id).toBe('docker');
    expect(analyzer.name).toBe('Docker');
    expect(analyzer.filePatterns).toContain('Dockerfile');
    expect(analyzer.filePatterns).toContain('docker-compose.yml');
  });

  it('should return empty result when no Docker files found', async () => {
    const files = new Map<string, string>();
    const result = await analyzer.analyze(files, '/project');
    expect(result.technologies).toHaveLength(0);
    expect(result.analyzedFiles).toHaveLength(0);
  });

  it('should detect Docker from Dockerfile', async () => {
    const files = new Map<string, string>();
    files.set('Dockerfile', 'FROM node:20-alpine\nCOPY . .\nRUN npm ci\nCMD ["node", "dist/index.js"]');
    const result = await analyzer.analyze(files, '/project');

    const docker = result.technologies.find((t) => t.id === 'docker');
    expect(docker).toBeDefined();
    expect(docker!.confidence).toBe(95);
    expect(docker!.profileIds).toContain('infra/docker');
    expect(result.analyzedFiles).toContain('Dockerfile');
  });

  it('should detect Docker from compose file', async () => {
    const files = new Map<string, string>();
    files.set('docker-compose.yml', 'services:\n  app:\n    build: .');
    const result = await analyzer.analyze(files, '/project');

    const docker = result.technologies.find((t) => t.id === 'docker');
    expect(docker).toBeDefined();
    expect(result.analyzedFiles).toContain('docker-compose.yml');
  });

  it('should detect multi-stage builds', async () => {
    const files = new Map<string, string>();
    files.set('Dockerfile', 'FROM node:20 AS builder\nRUN npm ci\nFROM node:20-alpine\nCOPY --from=builder . .');
    const result = await analyzer.analyze(files, '/project');

    const docker = result.technologies.find((t) => t.id === 'docker');
    expect(docker).toBeDefined();
    expect(docker!.evidence.length).toBeGreaterThan(1);
    expect(docker!.evidence.some((e) => e.description.includes('Multi-stage'))).toBe(true);
  });

  it('should detect microservices hint when many services in compose', async () => {
    const files = new Map<string, string>();
    files.set('docker-compose.yml', `services:
  api:
    build: ./api
  web:
    build: ./web
  db:
    image: postgres
  redis:
    image: redis
`);
    const result = await analyzer.analyze(files, '/project');

    const hint = result.technologies.find((t) => t.id === 'microservices-hint');
    expect(hint).toBeDefined();
    expect(hint!.confidence).toBe(60);
  });

  it('should not detect microservices hint when few services', async () => {
    const files = new Map<string, string>();
    files.set('docker-compose.yml', `services:
  app:
    build: .
  db:
    image: postgres
`);
    const result = await analyzer.analyze(files, '/project');

    const hint = result.technologies.find((t) => t.id === 'microservices-hint');
    expect(hint).toBeUndefined();
  });

  it('should handle 4-space indented compose files', async () => {
    const files = new Map<string, string>();
    files.set('docker-compose.yml', `services:
    api:
        build: ./api
    web:
        build: ./web
    db:
        image: postgres
    redis:
        image: redis
`);
    const result = await analyzer.analyze(files, '/project');

    const hint = result.technologies.find((t) => t.id === 'microservices-hint');
    expect(hint).toBeDefined();
  });

  it('should emit only one microservices-hint even with multiple compose files', async () => {
    const compose = `services:
  api:
    build: ./api
  web:
    build: ./web
  db:
    image: postgres
  redis:
    image: redis
`;
    const files = new Map<string, string>();
    files.set('docker-compose.yml', compose);
    files.set('compose.yml', compose);
    const result = await analyzer.analyze(files, '/project');

    const hints = result.technologies.filter((t) => t.id === 'microservices-hint');
    expect(hints).toHaveLength(1);
  });

  it('should only include relevant files in analyzedFiles', async () => {
    const files = new Map<string, string>();
    files.set('Dockerfile', 'FROM node:20');
    files.set('package.json', '{}'); // Not a Docker file
    const result = await analyzer.analyze(files, '/project');

    expect(result.analyzedFiles).toContain('Dockerfile');
    expect(result.analyzedFiles).not.toContain('package.json');
  });
});
