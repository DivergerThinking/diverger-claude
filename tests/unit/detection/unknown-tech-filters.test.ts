import { describe, it, expect } from 'vitest';
import { isLikelyFramework, shouldReport } from '../../../src/detection/unknown-tech-filters.js';

describe('isLikelyFramework', () => {
  it('should exclude common utility packages', () => {
    expect(isLikelyFramework('lodash')).toBe(false);
    expect(isLikelyFramework('axios')).toBe(false);
    expect(isLikelyFramework('moment')).toBe(false);
    expect(isLikelyFramework('uuid')).toBe(false);
    expect(isLikelyFramework('chalk')).toBe(false);
    expect(isLikelyFramework('debug')).toBe(false);
    expect(isLikelyFramework('dotenv')).toBe(false);
    expect(isLikelyFramework('zod')).toBe(false);
  });

  it('should detect scoped core packages as frameworks', () => {
    expect(isLikelyFramework('@nestjs/core')).toBe(true);
    expect(isLikelyFramework('@angular/core')).toBe(true);
    expect(isLikelyFramework('@vue/core')).toBe(true);
  });

  it('should detect CLI packages as potential frameworks', () => {
    expect(isLikelyFramework('@angular/cli')).toBe(true);
    expect(isLikelyFramework('ember-cli')).toBe(true);
  });

  it('should detect build tool plugins', () => {
    expect(isLikelyFramework('vite-plugin-react')).toBe(true);
    expect(isLikelyFramework('rollup-plugin-dts')).toBe(true);
    expect(isLikelyFramework('webpack-plugin-html')).toBe(true);
  });

  it('should detect cloud SDKs', () => {
    expect(isLikelyFramework('@aws-sdk/client-dynamodb')).toBe(true);
    expect(isLikelyFramework('@google-cloud/storage')).toBe(true);
    expect(isLikelyFramework('@azure/storage-blob')).toBe(true);
  });

  it('should detect create-* packages', () => {
    expect(isLikelyFramework('create-react-app')).toBe(true);
    expect(isLikelyFramework('create-next-app')).toBe(true);
  });
});

describe('shouldReport', () => {
  it('should return false for empty or short strings', () => {
    expect(shouldReport('')).toBe(false);
    expect(shouldReport('a')).toBe(false);
  });

  it('should return false for relative paths', () => {
    expect(shouldReport('./local-module')).toBe(false);
    expect(shouldReport('/absolute/path')).toBe(false);
  });

  it('should return false for utility packages', () => {
    expect(shouldReport('lodash')).toBe(false);
    expect(shouldReport('axios')).toBe(false);
  });

  it('should return true for framework-like packages', () => {
    expect(shouldReport('@nestjs/core')).toBe(true);
    expect(shouldReport('create-next-app')).toBe(true);
  });
});
