import { describe, it, expect } from 'vitest';
import { generateSecurityConfig } from '../../../src/generation/generators/security.js';
import { SENSITIVE_PATTERNS } from '../../../src/core/constants.js';
import type { ComposedConfig } from '../../../src/core/types.js';

function makeConfig(): ComposedConfig {
  return {
    claudeMdSections: [],
    settings: { permissions: {} },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
    mcp: [],
    externalTools: [],
    appliedProfiles: [],
  };
}

describe('generateSecurityConfig', () => {
  const projectRoot = '/project';

  it('should generate deny patterns for all sensitive file patterns', () => {
    const { settingsOverlay } = generateSecurityConfig(makeConfig(), projectRoot);

    expect(settingsOverlay.permissions?.deny).toBeDefined();
    const denyList = settingsOverlay.permissions!.deny!;

    // Each sensitive pattern should have Read, Edit, Write deny entries
    for (const pattern of SENSITIVE_PATTERNS) {
      expect(denyList).toContain(`Read(${pattern})`);
      expect(denyList).toContain(`Edit(${pattern})`);
      expect(denyList).toContain(`Write(${pattern})`);
    }

    expect(denyList).toHaveLength(SENSITIVE_PATTERNS.length * 3);
  });

  it('should generate sandbox filesystem deny rules', () => {
    const { settingsOverlay } = generateSecurityConfig(makeConfig(), projectRoot);

    expect(settingsOverlay.sandbox?.filesystem?.denyRead).toBeDefined();
    const denyRead = settingsOverlay.sandbox!.filesystem!.denyRead!;

    expect(denyRead).toContain('~/.aws/credentials');
    expect(denyRead).toContain('~/.ssh/**');
    expect(denyRead).toContain('~/.gnupg/**');
    expect(denyRead).toContain('~/.config/gh/hosts.yml');
  });

  it('should generate sensitive-data rule file', () => {
    const { rules } = generateSecurityConfig(makeConfig(), projectRoot);

    expect(rules).toHaveLength(1);
    expect(rules[0]!.path.replace(/\\/g, '/')).toContain('security/sensitive-data.md');
    expect(rules[0]!.governance).toBe('mandatory');
  });

  it('should include all sensitive patterns in rule content', () => {
    const { rules } = generateSecurityConfig(makeConfig(), projectRoot);
    const content = rules[0]!.content;

    for (const pattern of SENSITIVE_PATTERNS) {
      expect(content).toContain(pattern);
    }
  });

  it('should include security guidelines in rule content', () => {
    const { rules } = generateSecurityConfig(makeConfig(), projectRoot);
    const content = rules[0]!.content;

    expect(content).toContain('NEVER read .env files');
    expect(content).toContain('NEVER output API keys');
    expect(content).toContain('environment variables for secrets');
  });
});
