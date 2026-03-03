import { describe, it, expect } from 'vitest';
import { generateHooks } from '../../../src/generation/generators/hooks.js';
import type { ComposedConfig } from '../../../src/core/types.js';

function makeConfig(overrides: Partial<ComposedConfig> = {}): ComposedConfig {
  return {
    claudeMdSections: [],
    settings: { permissions: {} },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
    hookScripts: [],
    mcp: [],
    externalTools: [],
    appliedProfiles: [],
    ...overrides,
  };
}

describe('generateHooks', () => {
  it('should return null when no hooks defined', () => {
    const config = makeConfig();
    const result = generateHooks(config);
    expect(result).toBeNull();
  });

  it('should group hooks by event type', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          matcher: 'Write',
          hooks: [{ type: 'command', command: 'echo write-check' }],
        },
        {
          event: 'PostToolUse',
          matcher: 'Bash',
          hooks: [{ type: 'command', command: 'echo bash-check' }],
        },
        {
          event: 'PreToolUse',
          hooks: [{ type: 'command', command: 'echo pre-check' }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result).not.toBeNull();
    expect(result!.PostToolUse).toHaveLength(2);
    expect(result!.PreToolUse).toHaveLength(1);
  });

  it('should include matcher when defined', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          matcher: 'Write',
          hooks: [{ type: 'command', command: 'echo test' }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result!.PostToolUse![0]!.matcher).toBe('Write');
  });

  it('should omit matcher when not defined', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          hooks: [{ type: 'command', command: 'echo test' }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result!.PostToolUse![0]!.matcher).toBeUndefined();
  });

  it('should include timeout when specified', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          hooks: [{ type: 'command', command: 'echo test', timeout: 30 }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result!.PostToolUse![0]!.hooks[0]!.timeout).toBe(30);
  });

  it('should omit timeout when not specified', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          hooks: [{ type: 'command', command: 'echo test' }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result!.PostToolUse![0]!.hooks[0]!.timeout).toBeUndefined();
  });

  it('should include statusMessage when specified', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          hooks: [{ type: 'command', command: 'echo test', statusMessage: 'Checking...' }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result!.PostToolUse![0]!.hooks[0]!.statusMessage).toBe('Checking...');
  });

  it('should omit statusMessage when not specified', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          hooks: [{ type: 'command', command: 'echo test' }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result!.PostToolUse![0]!.hooks[0]!.statusMessage).toBeUndefined();
  });

  it('should set type to command for all hook entries', () => {
    const config = makeConfig({
      hooks: [
        {
          event: 'PostToolUse',
          hooks: [{ type: 'command', command: 'echo test' }],
        },
      ],
    });
    const result = generateHooks(config);

    expect(result!.PostToolUse![0]!.hooks[0]!.type).toBe('command');
  });
});
