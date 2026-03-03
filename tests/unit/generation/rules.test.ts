import { describe, it, expect } from 'vitest';
import { generateRules } from '../../../src/generation/generators/rules.js';
import { formatRuleFile } from '../../../src/generation/generators/rules.js';
import type { ComposedConfig, RuleDefinition } from '../../../src/core/types.js';

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

  it('should reject rules with path traversal', () => {
    const config = makeConfig({
      rules: [
        { path: '../../etc/passwd', content: 'malicious', governance: 'mandatory', description: 'hack' },
      ],
    });
    expect(() => generateRules(config, '/project')).toThrow('Path traversal');
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

  it('should prepend paths frontmatter when rule has paths defined', () => {
    const config = makeConfig({
      rules: [
        {
          path: 'typescript/conventions.md',
          content: '# Conventions',
          governance: 'mandatory',
          description: 'test',
          paths: ['**/*.ts', '**/*.tsx'],
        },
      ],
    });
    const result = generateRules(config, '/project');

    expect(result[0]!.content).toContain('---\npaths:\n  - **/*.ts\n  - **/*.tsx\n---');
    expect(result[0]!.content).toContain('# Conventions');
  });

  it('should not add frontmatter when rule has no paths', () => {
    const config = makeConfig({
      rules: [
        { path: 'base.md', content: '# Base Rule', governance: 'mandatory', description: 'test' },
      ],
    });
    const result = generateRules(config, '/project');

    expect(result[0]!.content).toBe('# Base Rule');
    expect(result[0]!.content).not.toContain('---');
  });

  it('should not add frontmatter when paths is an empty array', () => {
    const config = makeConfig({
      rules: [
        { path: 'base.md', content: '# Rule', governance: 'mandatory', description: 'test', paths: [] },
      ],
    });
    const result = generateRules(config, '/project');

    expect(result[0]!.content).toBe('# Rule');
    expect(result[0]!.content).not.toContain('---');
  });
});

describe('formatRuleFile', () => {
  it('should return content unchanged when no paths', () => {
    const rule: RuleDefinition = {
      path: 'test.md',
      content: '# Test',
      governance: 'mandatory',
      description: 'test',
    };
    expect(formatRuleFile(rule)).toBe('# Test');
  });

  it('should build correct YAML frontmatter with multiple paths', () => {
    const rule: RuleDefinition = {
      path: 'ts/rule.md',
      content: '# Content',
      governance: 'mandatory',
      description: 'test',
      paths: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    };
    const result = formatRuleFile(rule);
    expect(result).toBe('---\npaths:\n  - **/*.ts\n  - **/*.tsx\n  - **/*.mts\n---\n\n# Content');
  });
});
