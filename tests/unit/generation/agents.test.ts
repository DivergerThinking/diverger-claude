import { describe, it, expect } from 'vitest';
import { generateAgents } from '../../../src/generation/generators/agents.js';
import type { AgentDefinition, ComposedConfig } from '../../../src/core/types.js';

function makeConfig(agents: AgentDefinition[] = []): ComposedConfig {
  return {
    claudeMdSections: [],
    settings: { permissions: {} },
    rules: [],
    agents,
    skills: [],
    hooks: [],
    mcp: [],
    externalTools: [],
    appliedProfiles: [],
  };
}

describe('generateAgents', () => {
  const projectRoot = '/project';

  it('should return empty array when there are no agents', () => {
    const config = makeConfig([]);
    const result = generateAgents(config, projectRoot);
    expect(result).toHaveLength(0);
  });

  it('should generate one file per agent', () => {
    const agents: AgentDefinition[] = [
      { name: 'code-reviewer', prompt: 'Review code.', skills: [], description: 'Code Reviewer' },
      { name: 'test-writer', prompt: 'Write tests.', skills: [], description: 'Test Writer' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result).toHaveLength(2);
  });

  it('should generate files at the correct path', () => {
    const agents: AgentDefinition[] = [
      { name: 'code-reviewer', prompt: 'Review code.', skills: [], description: 'Code Reviewer' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    // Path should be <projectRoot>/.claude/agents/<name>.md
    expect(result[0]!.path).toContain('.claude');
    expect(result[0]!.path).toContain('agents');
    expect(result[0]!.path).toContain('code-reviewer.md');
  });

  it('should include the description in YAML frontmatter', () => {
    const agents: AgentDefinition[] = [
      { name: 'code-reviewer', prompt: 'Review code.', skills: [], description: 'Code Reviewer Agent' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('description: Code Reviewer Agent');
  });

  it('should fall back to agent name when description is empty', () => {
    const agents: AgentDefinition[] = [
      { name: 'code-reviewer', prompt: 'Review code.', skills: [], description: '' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('description: code-reviewer');
  });

  it('should include model in frontmatter when specified', () => {
    const agents: AgentDefinition[] = [
      {
        name: 'reviewer',
        prompt: 'Review.',
        skills: [],
        model: 'claude-sonnet',
        description: 'Reviewer',
      },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('model: claude-sonnet');
  });

  it('should not include model in frontmatter when model is undefined', () => {
    const agents: AgentDefinition[] = [
      { name: 'reviewer', prompt: 'Review.', skills: [], description: 'Reviewer' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).not.toContain('model:');
  });

  it('should include default tools in frontmatter', () => {
    const agents: AgentDefinition[] = [
      {
        name: 'reviewer',
        prompt: 'Review.',
        skills: ['commit', 'review', 'test-gen'],
        description: 'Reviewer',
      },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('tools:');
    expect(result[0]!.content).toContain('  - Read');
    expect(result[0]!.content).toContain('  - Grep');
    expect(result[0]!.content).toContain('  - Glob');
    expect(result[0]!.content).toContain('  - Bash');
  });

  it('should always include default tools even when skills array is empty', () => {
    const agents: AgentDefinition[] = [
      { name: 'reviewer', prompt: 'Review.', skills: [], description: 'Reviewer' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('tools:');
    expect(result[0]!.content).toContain('  - Read');
  });

  it('should include prompt after the closing frontmatter', () => {
    const agents: AgentDefinition[] = [
      {
        name: 'reviewer',
        prompt: 'Review code carefully.\nCheck for bugs.',
        skills: [],
        description: 'Reviewer',
      },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    // Prompt should come after the closing ---
    const closingIdx = result[0]!.content.lastIndexOf('---');
    const promptIdx = result[0]!.content.indexOf('Review code carefully.');
    expect(closingIdx).toBeLessThan(promptIdx);
    expect(result[0]!.content).toContain('Review code carefully.');
    expect(result[0]!.content).toContain('Check for bugs.');
  });

  it('should produce correct YAML frontmatter format with all fields', () => {
    const agents: AgentDefinition[] = [
      {
        name: 'code-reviewer',
        prompt: 'Review all code changes.',
        skills: ['commit', 'review'],
        model: 'claude-opus',
        description: 'Expert Code Reviewer',
      },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);
    const content = result[0]!.content;

    // Verify YAML frontmatter structure
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: code-reviewer');
    expect(content).toContain('description: Expert Code Reviewer');
    expect(content).toContain('model: claude-opus');
    expect(content).toContain('tools:');

    // Verify ordering: frontmatter fields → closing --- → prompt
    const nameIdx = content.indexOf('name: code-reviewer');
    const modelIdx = content.indexOf('model: claude-opus');
    const toolsIdx = content.indexOf('tools:');
    const closingIdx = content.lastIndexOf('---');
    const promptIdx = content.indexOf('Review all code changes.');

    expect(nameIdx).toBeLessThan(modelIdx);
    expect(modelIdx).toBeLessThan(toolsIdx);
    expect(toolsIdx).toBeLessThan(closingIdx);
    expect(closingIdx).toBeLessThan(promptIdx);
  });

  it('should reject agent names with path traversal', () => {
    const agents: AgentDefinition[] = [
      { name: '../../etc/passwd', prompt: 'malicious', skills: [], description: 'hack' },
    ];
    const config = makeConfig(agents);
    expect(() => generateAgents(config, '/project')).toThrow('Nombre de agente inválido');
  });

  it('should reject agent names with special characters', () => {
    const agents: AgentDefinition[] = [
      { name: 'agent name with spaces', prompt: 'test', skills: [], description: 'test' },
    ];
    const config = makeConfig(agents);
    expect(() => generateAgents(config, '/project')).toThrow('Nombre de agente inválido');
  });

  it('should escape YAML-unsafe characters in description', () => {
    const agents: AgentDefinition[] = [
      { name: 'reviewer', prompt: 'Test.', skills: [], description: 'Has: colons and "quotes"' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, '/project');
    // Description with colons should be quoted in YAML
    expect(result[0]!.content).toContain('description: "Has: colons and');
  });

  it('should include skills in frontmatter when agent has skills', () => {
    const agents: AgentDefinition[] = [
      {
        name: 'reviewer',
        prompt: 'Review code.',
        skills: ['commit', 'review', 'test-gen'],
        description: 'Reviewer',
      },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('skills:');
    expect(result[0]!.content).toContain('  - commit');
    expect(result[0]!.content).toContain('  - review');
    expect(result[0]!.content).toContain('  - test-gen');
  });

  it('should not include skills section when agent has no skills', () => {
    const agents: AgentDefinition[] = [
      { name: 'reviewer', prompt: 'Review.', skills: [], description: 'Reviewer' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).not.toContain('skills:');
  });

  it('should escape \\r in YAML description', () => {
    const agents: AgentDefinition[] = [
      { name: 'reviewer', prompt: 'Test.', skills: [], description: 'Has\r\nCRLF' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, '/project');

    // Should escape both \r and \n
    expect(result[0]!.content).toContain('\\r');
    expect(result[0]!.content).toContain('\\n');
    // Should not contain raw \r
    expect(result[0]!.content).not.toMatch(/\r[^"]/);
  });

  it('should generate multiple agent files with correct content', () => {
    const agents: AgentDefinition[] = [
      {
        name: 'reviewer',
        prompt: 'Review code.',
        skills: ['review'],
        description: 'Reviewer',
      },
      {
        name: 'test-writer',
        prompt: 'Write tests.',
        skills: ['test-gen'],
        model: 'claude-sonnet',
        description: 'Test Writer',
      },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.path).toContain('reviewer.md');
    expect(result[0]!.content).toContain('Review code.');

    expect(result[1]!.path).toContain('test-writer.md');
    expect(result[1]!.content).toContain('Write tests.');
    expect(result[1]!.content).toContain('model: claude-sonnet');
  });
});
