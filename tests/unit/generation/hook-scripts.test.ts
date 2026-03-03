import { describe, it, expect } from 'vitest';
import { generateHookScripts } from '../../../src/generation/generators/hook-scripts.js';
import type { ComposedConfig } from '../../../src/core/types.js';
import path from 'path';

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

describe('generateHookScripts', () => {
  const projectRoot = '/test/project';

  it('should return empty array when no hook scripts defined', () => {
    const config = makeConfig();
    const result = generateHookScripts(config, projectRoot);
    expect(result).toEqual([]);
  });

  it('should generate files in .claude/hooks/ directory', () => {
    const config = makeConfig({
      hookScripts: [
        {
          filename: 'secret-scanner.sh',
          content: '#!/bin/bash\necho "scanning"',
          isPreToolUse: true,
        },
      ],
    });
    const result = generateHookScripts(config, projectRoot);

    expect(result).toHaveLength(1);
    expect(result[0]!.path).toBe(path.join(projectRoot, '.claude', 'hooks', 'secret-scanner.sh'));
    expect(result[0]!.content).toBe('#!/bin/bash\necho "scanning"');
  });

  it('should generate multiple hook script files', () => {
    const config = makeConfig({
      hookScripts: [
        { filename: 'check-a.sh', content: '#!/bin/bash\nexit 0', isPreToolUse: false },
        { filename: 'check-b.sh', content: '#!/bin/bash\nexit 1', isPreToolUse: true },
      ],
    });
    const result = generateHookScripts(config, projectRoot);

    expect(result).toHaveLength(2);
    expect(result[0]!.path).toContain('check-a.sh');
    expect(result[1]!.path).toContain('check-b.sh');
  });

  it('should reject invalid filenames', () => {
    const config = makeConfig({
      hookScripts: [
        { filename: '../escape.sh', content: '#!/bin/bash', isPreToolUse: false },
      ],
    });

    expect(() => generateHookScripts(config, projectRoot)).toThrow(/inválido/);
  });

  it('should reject filenames without .sh extension', () => {
    const config = makeConfig({
      hookScripts: [
        { filename: 'script.txt', content: '#!/bin/bash', isPreToolUse: false },
      ],
    });

    expect(() => generateHookScripts(config, projectRoot)).toThrow(/inválido/);
  });

  it('should accept filenames with hyphens and underscores', () => {
    const config = makeConfig({
      hookScripts: [
        { filename: 'my_check-script.sh', content: '#!/bin/bash', isPreToolUse: false },
      ],
    });
    const result = generateHookScripts(config, projectRoot);

    expect(result).toHaveLength(1);
  });
});
