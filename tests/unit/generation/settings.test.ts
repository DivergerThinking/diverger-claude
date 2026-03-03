import { describe, it, expect } from 'vitest';
import { generateSettings } from '../../../src/generation/generators/settings.js';
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

describe('generateSettings', () => {
  it('should generate settings.json at correct path', () => {
    const config = makeConfig();
    const result = generateSettings(config, '/project');
    expect(result.path).toContain('.claude');
    expect(result.path).toContain('settings.json');
  });

  it('should include permissions with sorted allow/deny arrays', () => {
    const config = makeConfig({
      settings: {
        permissions: {
          allow: ['Bash(npm test:*)', 'Bash(git:*)'],
          deny: ['Bash(rm:*)'],
        },
      },
    });
    const result = generateSettings(config, '/project');
    const parsed = JSON.parse(result.content);

    expect(parsed.permissions.allow).toEqual(['Bash(git:*)', 'Bash(npm test:*)']);
    expect(parsed.permissions.deny).toEqual(['Bash(rm:*)']);
  });

  it('should deduplicate permission entries', () => {
    const config = makeConfig({
      settings: {
        permissions: {
          allow: ['Bash(npm:*)', 'Bash(npm:*)', 'Bash(node:*)'],
        },
      },
    });
    const result = generateSettings(config, '/project');
    const parsed = JSON.parse(result.content);

    expect(parsed.permissions.allow).toEqual(['Bash(node:*)', 'Bash(npm:*)']);
  });

  it('should include sandbox config when present', () => {
    const config = makeConfig({
      settings: {
        permissions: {},
        sandbox: {
          filesystem: {
            denyRead: ['/etc/shadow'],
            denyWrite: ['/usr'],
          },
        },
      },
    });
    const result = generateSettings(config, '/project');
    const parsed = JSON.parse(result.content);

    expect(parsed.sandbox).toBeDefined();
    expect(parsed.sandbox.filesystem.denyRead).toContain('/etc/shadow');
  });

  it('should include env config when present', () => {
    const config = makeConfig({
      settings: {
        permissions: {},
        env: { NODE_ENV: 'development' },
      },
    });
    const result = generateSettings(config, '/project');
    const parsed = JSON.parse(result.content);

    expect(parsed.env).toEqual({ NODE_ENV: 'development' });
  });

  it('should include hooks when present', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          matcher: 'Write',
          hooks: [{ type: 'command', command: 'echo check', timeout: 10 }],
        },
      ],
    });
    const result = generateSettings(config, '/project');
    const parsed = JSON.parse(result.content);

    expect(parsed.hooks).toBeDefined();
    expect(parsed.hooks.PostToolUse).toBeDefined();
    expect(parsed.hooks.PostToolUse[0].matcher).toBe('Write');
  });

  it('should not include hooks when none defined', () => {
    const config = makeConfig();
    const result = generateSettings(config, '/project');
    const parsed = JSON.parse(result.content);

    expect(parsed.hooks).toBeUndefined();
  });

  it('should produce valid JSON with trailing newline', () => {
    const config = makeConfig();
    const result = generateSettings(config, '/project');

    expect(result.content.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(result.content)).not.toThrow();
  });

  it('should include $schema as first key', () => {
    const config = makeConfig();
    const result = generateSettings(config, '/project');
    const parsed = JSON.parse(result.content);

    expect(parsed.$schema).toBe('https://json.schemastore.org/claude-code-settings.json');
    // Verify it's the first key
    const keys = Object.keys(parsed);
    expect(keys[0]).toBe('$schema');
  });
});
