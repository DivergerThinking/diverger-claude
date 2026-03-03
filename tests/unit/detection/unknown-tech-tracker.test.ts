import { describe, it, expect } from 'vitest';
import { findUnknownTechnologies } from '../../../src/detection/unknown-tech-tracker.js';

describe('findUnknownTechnologies', () => {
  it('should identify dependencies not in DEPENDENCY_MAP that look like frameworks', () => {
    const deps = ['@nestjs/core', '@myorg/core', 'lodash', 'react'];
    // @nestjs/core is IN the dependency map → filtered out
    // @myorg/core is NOT in the map but looks like a framework → included
    // lodash is excluded by utility filter
    // react is IN the dependency map → filtered out
    const result = findUnknownTechnologies(deps, 'package.json', 'npm', '/test');
    expect(result).toHaveLength(1);
    expect(result[0]!.dependency).toBe('@myorg/core');
    expect(result[0]!.source).toBe('package.json');
    expect(result[0]!.category).toBe('npm');
  });

  it('should return empty for all-known dependencies', () => {
    const deps = ['react', 'next', 'typescript', 'vitest'];
    const result = findUnknownTechnologies(deps, 'package.json', 'npm', '/test');
    expect(result).toHaveLength(0);
  });

  it('should return empty for all-utility dependencies', () => {
    const deps = ['lodash', 'axios', 'dotenv', 'chalk'];
    const result = findUnknownTechnologies(deps, 'package.json', 'npm', '/test');
    expect(result).toHaveLength(0);
  });

  it('should detect create-* packages as unknown frameworks', () => {
    const deps = ['create-svelte-app'];
    const result = findUnknownTechnologies(deps, 'package.json', 'npm', '/test');
    expect(result).toHaveLength(1);
    expect(result[0]!.dependency).toBe('create-svelte-app');
  });

  it('should handle empty input', () => {
    const result = findUnknownTechnologies([], 'package.json', 'npm', '/test');
    expect(result).toHaveLength(0);
  });

  it('should include timestamp in results', () => {
    const deps = ['@unknown/core'];
    const result = findUnknownTechnologies(deps, 'package.json', 'npm', '/test');
    expect(result[0]!.detectedAt).toBeDefined();
    // Should be a valid ISO timestamp
    expect(() => new Date(result[0]!.detectedAt)).not.toThrow();
  });
});
