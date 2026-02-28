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

  it('should include the description as the h1 heading', () => {
    const agents: AgentDefinition[] = [
      { name: 'code-reviewer', prompt: 'Review code.', skills: [], description: 'Code Reviewer Agent' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('# Code Reviewer Agent');
  });

  it('should fall back to agent name when description is empty', () => {
    const agents: AgentDefinition[] = [
      { name: 'code-reviewer', prompt: 'Review code.', skills: [], description: '' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).toContain('# code-reviewer');
  });

  it('should include model when specified', () => {
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

    expect(result[0]!.content).toContain('Model: claude-sonnet');
  });

  it('should not include model section when model is undefined', () => {
    const agents: AgentDefinition[] = [
      { name: 'reviewer', prompt: 'Review.', skills: [], description: 'Reviewer' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).not.toContain('Model:');
  });

  it('should include skills section with each skill listed', () => {
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

    expect(result[0]!.content).toContain('## Skills');
    expect(result[0]!.content).toContain('- commit');
    expect(result[0]!.content).toContain('- review');
    expect(result[0]!.content).toContain('- test-gen');
  });

  it('should not include skills section when skills array is empty', () => {
    const agents: AgentDefinition[] = [
      { name: 'reviewer', prompt: 'Review.', skills: [], description: 'Reviewer' },
    ];
    const config = makeConfig(agents);
    const result = generateAgents(config, projectRoot);

    expect(result[0]!.content).not.toContain('## Skills');
  });

  it('should include instructions section with the prompt', () => {
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

    expect(result[0]!.content).toContain('## Instructions');
    expect(result[0]!.content).toContain('Review code carefully.');
    expect(result[0]!.content).toContain('Check for bugs.');
  });

  it('should produce correct full format with all fields', () => {
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

    // Verify section ordering: heading → model → skills → instructions → prompt
    const headingIdx = content.indexOf('# Expert Code Reviewer');
    const modelIdx = content.indexOf('Model: claude-opus');
    const skillsIdx = content.indexOf('## Skills');
    const instructionsIdx = content.indexOf('## Instructions');
    const promptIdx = content.indexOf('Review all code changes.');

    expect(headingIdx).toBeLessThan(modelIdx);
    expect(modelIdx).toBeLessThan(skillsIdx);
    expect(skillsIdx).toBeLessThan(instructionsIdx);
    expect(instructionsIdx).toBeLessThan(promptIdx);
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
    expect(result[1]!.content).toContain('Model: claude-sonnet');
  });
});
