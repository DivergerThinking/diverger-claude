import { describe, it, expect } from 'vitest';
import { detectArchitecture } from '../../../../src/detection/patterns/architecture.js';
import type { DetectedTechnology, MonorepoInfo } from '../../../../src/core/types.js';

function makeTech(id: string, category: string = 'framework'): DetectedTechnology {
  return {
    id,
    name: id,
    category: category as DetectedTechnology['category'],
    confidence: 90,
    evidence: [],
    profileIds: [],
  };
}

function makeMonorepo(packageCount: number): MonorepoInfo {
  return {
    type: 'npm-workspaces',
    rootDir: '/project',
    packages: Array.from({ length: packageCount }, (_, i) => ({
      name: `pkg-${i}`,
      path: `packages/pkg-${i}`,
      technologies: [],
    })),
  };
}

describe('detectArchitecture', () => {
  it('should return monolith as default', () => {
    const result = detectArchitecture([makeTech('react')]);
    expect(result).toBe('monolith');
  });

  it('should detect serverless from serverless.yml', () => {
    const files = new Map([['serverless.yml', 'service: my-service']]);
    const result = detectArchitecture([makeTech('nodejs', 'language')], undefined, files);
    expect(result).toBe('serverless');
  });

  it('should detect serverless from cdk.json', () => {
    const files = new Map([['cdk.json', '{}']]);
    const result = detectArchitecture([], undefined, files);
    expect(result).toBe('serverless');
  });

  it('should detect serverless from SAM template.yaml', () => {
    const files = new Map([['template.yaml', 'AWSTemplateFormatVersion: 2010']]);
    const result = detectArchitecture([], undefined, files);
    expect(result).toBe('serverless');
  });

  it('should NOT detect serverless from generic template.yaml without SAM markers', () => {
    const files = new Map([['template.yaml', 'some other template']]);
    const result = detectArchitecture([makeTech('react')], undefined, files);
    expect(result).not.toBe('serverless');
  });

  it('should detect jamstack from Next.js + vercel.json without backend', () => {
    const files = new Map([['vercel.json', '{}']]);
    const result = detectArchitecture([makeTech('nextjs')], undefined, files);
    expect(result).toBe('jamstack');
  });

  it('should detect jamstack from Nuxt + netlify.toml', () => {
    const files = new Map([['netlify.toml', '[build]']]);
    const result = detectArchitecture([makeTech('nuxt')], undefined, files);
    expect(result).toBe('jamstack');
  });

  it('should NOT detect jamstack when backend framework present', () => {
    const files = new Map([['vercel.json', '{}']]);
    const techs = [makeTech('nextjs'), makeTech('express')];
    const result = detectArchitecture(techs, undefined, files);
    expect(result).not.toBe('jamstack');
  });

  it('should detect microservices from monorepo with many packages and docker', () => {
    const monorepo = makeMonorepo(5);
    const techs = [makeTech('docker', 'infra')];
    const result = detectArchitecture(techs, monorepo);
    expect(result).toBe('microservices');
  });

  it('should detect microservices from kubernetes', () => {
    const techs = [makeTech('kubernetes', 'infra')];
    const result = detectArchitecture(techs);
    expect(result).toBe('microservices');
  });

  it('should detect microservices from microservices-hint', () => {
    const techs = [makeTech('microservices-hint', 'infra')];
    const result = detectArchitecture(techs);
    expect(result).toBe('microservices');
  });

  it('should detect modular-monolith from monorepo with 3+ packages but no docker', () => {
    const monorepo = makeMonorepo(4);
    const techs = [makeTech('react')];
    const result = detectArchitecture(techs, monorepo);
    expect(result).toBe('modular-monolith');
  });

  it('should prioritize serverless over other patterns', () => {
    const files = new Map([['serverless.yml', 'service: x'], ['vercel.json', '{}']]);
    const techs = [makeTech('nextjs'), makeTech('docker', 'infra')];
    const monorepo = makeMonorepo(5);
    const result = detectArchitecture(techs, monorepo, files);
    expect(result).toBe('serverless');
  });

  it('should handle empty technologies list', () => {
    const result = detectArchitecture([]);
    expect(result).toBe('monolith');
  });

  it('should handle undefined files map', () => {
    const result = detectArchitecture([makeTech('nextjs')]);
    expect(result).toBe('monolith');
  });
});
