import { describe, it, expect } from 'vitest';
import { generateRules } from '../../../src/generation/generators/rules.js';
import type { ComposedConfig } from '../../../src/core/types.js';

function makeConfig(overrides: Partial<ComposedConfig> = {}): ComposedConfig {
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
    ...overrides,
  };
}

describe('generateRules', () => {
  it('should return empty array when no rules defined', () => {
    const config = makeConfig();
    const result = generateRules(config, '/project');
    expect(result).toHaveLength(0);
  });

  it('should generate files for each rule definition', () => {
    const config = makeConfig({
      rules: [
        { path: 'express/patterns.md', content: '# Patterns', governance: 'mandatory', description: 'test' },
        { path: 'express/routes.md', content: '# Routes', governance: 'recommended', description: 'test' },
      ],
    });
    const result = generateRules(config, '/project');

    expect(result).toHaveLength(2);
    expect(result[0]!.path).toContain('rules');
    expect(result[0]!.path).toContain('express');
    expect(result[0]!.path).toContain('patterns.md');
    expect(result[0]!.content).toBe('# Patterns');
  });

  it('should preserve governance level on generated files', () => {
    const config = makeConfig({
      rules: [
        { path: 'test/rule.md', content: '# Rule', governance: 'mandatory', description: 'test' },
      ],
    });
    const result = generateRules(config, '/project');

    expect(result[0]!.governance).toBe('mandatory');
  });

  it('should place files under .claude/rules/', () => {
    const config = makeConfig({
      rules: [
        { path: 'my-rule.md', content: '# Test', governance: 'recommended', description: 'test' },
      ],
    });
    const result = generateRules(config, '/project');

    expect(result[0]!.path).toContain('.claude');
    expect(result[0]!.path).toContain('rules');
    expect(result[0]!.path).toContain('my-rule.md');
  });
});
