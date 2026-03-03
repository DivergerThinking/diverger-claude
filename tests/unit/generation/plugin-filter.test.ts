import { describe, it, expect } from 'vitest';
import { filterUniversalComponents, isUniversalHookCommand } from '../../../src/generation/plugin-filter.js';
import type { ComposedConfig, AgentDefinition, SkillDefinition, HookDefinition, HookScriptDefinition } from '../../../src/core/types.js';
import {
  UNIVERSAL_AGENT_NAMES,
  UNIVERSAL_SKILL_NAMES,
  UNIVERSAL_HOOK_SCRIPT_FILENAMES,
} from '../../../src/core/constants.js';

function makeBaseConfig(overrides: Partial<ComposedConfig> = {}): ComposedConfig {
  return {
    claudeMdSections: [{ heading: 'Test', content: '## Test', order: 0 }],
    settings: { permissions: { allow: ['Bash(npm test)'], deny: ['Read(.env*)'] } },
    rules: [{ path: 'test-rule.md', content: '# Rule', governance: 'mandatory', description: 'test' }],
    agents: [],
    skills: [],
    hooks: [],
    hookScripts: [],
    mcp: [],
    externalTools: [],
    appliedProfiles: ['base/universal'],
    ...overrides,
  };
}

function makeAgent(name: string): AgentDefinition {
  return { name, prompt: `Prompt for ${name}`, skills: [], description: `Desc ${name}` };
}

function makeSkill(name: string): SkillDefinition {
  return { name, content: `Content for ${name}`, description: `Desc ${name}` };
}

function makeHookScript(filename: string): HookScriptDefinition {
  return { filename, content: `#!/bin/bash\n# ${filename}`, isPreToolUse: true };
}

function makeHook(event: 'PreToolUse' | 'PostToolUse', scriptFilename: string): HookDefinition {
  return {
    event,
    matcher: 'Write',
    hooks: [{ type: 'command', command: `bash .claude/hooks/${scriptFilename}`, timeout: 10 }],
  };
}

describe('filterUniversalComponents', () => {
  it('should remove universal agents and keep tech-specific', () => {
    const config = makeBaseConfig({
      agents: [
        makeAgent('code-reviewer'),
        makeAgent('my-custom-agent'),
        makeAgent('test-writer'),
      ],
    });

    const result = filterUniversalComponents(config);

    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].name).toBe('my-custom-agent');
  });

  it('should remove all 6 universal agents by name', () => {
    const agents = [...UNIVERSAL_AGENT_NAMES].map(makeAgent);
    const config = makeBaseConfig({ agents });

    const result = filterUniversalComponents(config);

    expect(result.agents).toHaveLength(0);
  });

  it('should remove universal skills and keep tech-specific', () => {
    const config = makeBaseConfig({
      skills: [
        makeSkill('architecture-style-guide'),
        makeSkill('my-custom-skill'),
        makeSkill('security-guide'),
      ],
    });

    const result = filterUniversalComponents(config);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('my-custom-skill');
  });

  it('should remove all 3 universal skills by name', () => {
    const skills = [...UNIVERSAL_SKILL_NAMES].map(makeSkill);
    const config = makeBaseConfig({ skills });

    const result = filterUniversalComponents(config);

    expect(result.skills).toHaveLength(0);
  });

  it('should remove universal hook scripts and keep tech-specific', () => {
    const config = makeBaseConfig({
      hookScripts: [
        makeHookScript('secret-scanner.sh'),
        makeHookScript('my-custom-hook.sh'),
        makeHookScript('check-long-lines.sh'),
      ],
    });

    const result = filterUniversalComponents(config);

    expect(result.hookScripts).toHaveLength(1);
    expect(result.hookScripts[0].filename).toBe('my-custom-hook.sh');
  });

  it('should remove all 4 universal hook scripts by filename', () => {
    const hookScripts = [...UNIVERSAL_HOOK_SCRIPT_FILENAMES].map(makeHookScript);
    const config = makeBaseConfig({ hookScripts });

    const result = filterUniversalComponents(config);

    expect(result.hookScripts).toHaveLength(0);
  });

  it('should remove hook entries referencing universal scripts', () => {
    const config = makeBaseConfig({
      hooks: [
        makeHook('PreToolUse', 'secret-scanner.sh'),
        makeHook('PostToolUse', 'my-custom-lint.sh'),
        makeHook('PreToolUse', 'destructive-cmd-blocker.sh'),
      ],
    });

    const result = filterUniversalComponents(config);

    expect(result.hooks).toHaveLength(1);
    expect(result.hooks[0].hooks[0].command).toContain('my-custom-lint.sh');
  });

  it('should handle mixed hooks (universal + tech-specific commands in same entry)', () => {
    const config = makeBaseConfig({
      hooks: [
        {
          event: 'PreToolUse' as const,
          matcher: 'Write',
          hooks: [
            { type: 'command' as const, command: 'bash .claude/hooks/secret-scanner.sh', timeout: 10 },
            { type: 'command' as const, command: 'bash .claude/hooks/my-custom-lint.sh', timeout: 5 },
          ],
        },
      ],
    });

    const result = filterUniversalComponents(config);

    expect(result.hooks).toHaveLength(1);
    expect(result.hooks[0].hooks).toHaveLength(1);
    expect(result.hooks[0].hooks[0].command).toContain('my-custom-lint.sh');
  });

  it('should NOT filter rules', () => {
    const config = makeBaseConfig({
      rules: [
        { path: 'security.md', content: '# Security', governance: 'mandatory', description: 'security' },
        { path: 'custom.md', content: '# Custom', governance: 'recommended', description: 'custom' },
      ],
    });

    const result = filterUniversalComponents(config);

    expect(result.rules).toHaveLength(2);
  });

  it('should NOT filter settings', () => {
    const config = makeBaseConfig({
      settings: { permissions: { allow: ['Bash(npm test)'], deny: ['Read(.env*)'] } },
    });

    const result = filterUniversalComponents(config);

    expect(result.settings).toEqual(config.settings);
  });

  it('should NOT filter claudeMdSections', () => {
    const config = makeBaseConfig({
      claudeMdSections: [
        { heading: 'Project Conventions', content: '## Project Conventions', order: 0 },
        { heading: 'Custom', content: '## Custom', order: 10 },
      ],
    });

    const result = filterUniversalComponents(config);

    expect(result.claudeMdSections).toHaveLength(2);
  });

  it('should return a new object (immutability)', () => {
    const config = makeBaseConfig({
      agents: [makeAgent('code-reviewer'), makeAgent('custom')],
      skills: [makeSkill('security-guide')],
    });

    const result = filterUniversalComponents(config);

    expect(result).not.toBe(config);
    expect(result.agents).not.toBe(config.agents);
    expect(result.skills).not.toBe(config.skills);
    // Original unmodified
    expect(config.agents).toHaveLength(2);
    expect(config.skills).toHaveLength(1);
  });

  it('should handle empty config', () => {
    const config = makeBaseConfig();

    const result = filterUniversalComponents(config);

    expect(result.agents).toHaveLength(0);
    expect(result.skills).toHaveLength(0);
    expect(result.hookScripts).toHaveLength(0);
    expect(result.hooks).toHaveLength(0);
  });
});

describe('isUniversalHookCommand', () => {
  it('should return true for commands containing universal script filenames', () => {
    expect(isUniversalHookCommand('bash .claude/hooks/secret-scanner.sh')).toBe(true);
    expect(isUniversalHookCommand('bash .claude/hooks/destructive-cmd-blocker.sh')).toBe(true);
    expect(isUniversalHookCommand('bash .claude/hooks/check-long-lines.sh')).toBe(true);
    expect(isUniversalHookCommand('bash .claude/hooks/check-trailing-newline.sh')).toBe(true);
  });

  it('should return false for commands with non-universal scripts', () => {
    expect(isUniversalHookCommand('bash .claude/hooks/my-custom-lint.sh')).toBe(false);
    expect(isUniversalHookCommand('npm test')).toBe(false);
  });
});
