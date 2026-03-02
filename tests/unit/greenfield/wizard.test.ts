import { describe, it, expect } from 'vitest';
import { normalizeTechId } from '../../../src/greenfield/wizard.js';

describe('normalizeTechId', () => {
  it('should convert "spring boot" to "spring-boot"', () => {
    expect(normalizeTechId('spring boot')).toBe('spring-boot');
  });

  it('should convert "react native" to "react-native"', () => {
    expect(normalizeTechId('react native')).toBe('react-native');
  });

  it('should handle single word', () => {
    expect(normalizeTechId('react')).toBe('react');
  });

  it('should strip special characters after converting spaces', () => {
    expect(normalizeTechId('vue.js')).toBe('vuejs');
  });

  it('should handle multiple spaces', () => {
    expect(normalizeTechId('my  cool  framework')).toBe('my-cool-framework');
  });

  it('should preserve hyphens', () => {
    expect(normalizeTechId('actix-web')).toBe('actix-web');
  });
});

describe('profileId matching (BUG-19)', () => {
  // This tests the endsWith('/' + id) logic used in templateToDetection
  it('should match react to frameworks/react but NOT frameworks/react-native', () => {
    const profiles = ['frameworks/react', 'frameworks/react-native', 'testing/jest'];
    const id = 'react';
    const matched = profiles.filter((p) => p.endsWith('/' + id));
    expect(matched).toContain('frameworks/react');
    expect(matched).not.toContain('frameworks/react-native');
  });

  it('should match react-native to frameworks/react-native but NOT frameworks/react', () => {
    const profiles = ['frameworks/react', 'frameworks/react-native', 'testing/jest'];
    const id = 'react-native';
    const matched = profiles.filter((p) => p.endsWith('/' + id));
    expect(matched).toContain('frameworks/react-native');
    expect(matched).not.toContain('frameworks/react');
  });

  it('should match jest to testing/jest', () => {
    const profiles = ['testing/jest', 'testing/vitest'];
    const id = 'jest';
    const matched = profiles.filter((p) => p.endsWith('/' + id));
    expect(matched).toEqual(['testing/jest']);
  });
});
