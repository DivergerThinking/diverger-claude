import { describe, it, expect } from 'vitest';
import { generateSkills } from '../../../src/generation/generators/skills.js';
import { formatSkillFile } from '../../../src/generation/generators/skills.js';
import type { ComposedConfig, SkillDefinition } from '../../../src/core/types.js';

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

describe('formatSkillFile', () => {
  it('should prepend YAML frontmatter with name and description', () => {
    const skill: SkillDefinition = {
      name: 'test-skill',
      description: 'A test skill',
      content: '# Skill Content\n\nDo something.',
    };
    const result = formatSkillFile(skill);
    expect(result).toContain('---\nname: test-skill\ndescription: A test skill\n---');
    expect(result).toContain('# Skill Content');
  });

  it('should place content after the closing frontmatter delimiter', () => {
    const skill: SkillDefinition = {
      name: 'my-skill',
      description: 'desc',
      content: 'Body text here',
    };
    const result = formatSkillFile(skill);
    const parts = result.split('---');
    // parts[0] = '' (before first ---), parts[1] = frontmatter, parts[2] = rest
    expect(parts.length).toBeGreaterThanOrEqual(3);
    expect(parts[2]!.trim()).toBe('Body text here');
  });

  it('should escape YAML-unsafe characters in name', () => {
    const skill: SkillDefinition = {
      name: 'skill-with-colon:test',
      description: 'Safe description',
      content: 'Body',
    };
    const result = formatSkillFile(skill);
    expect(result).toContain('"skill-with-colon:test"');
  });

  it('should escape YAML-unsafe characters in description', () => {
    const skill: SkillDefinition = {
      name: 'safe-name',
      description: 'Description with "quotes" and #hash',
      content: 'Body',
    };
    const result = formatSkillFile(skill);
    expect(result).toContain('description: "Description with');
  });

  it('should handle multiline content correctly', () => {
    const skill: SkillDefinition = {
      name: 'multi',
      description: 'Multi-line content skill',
      content: '# Title\n\nParagraph 1\n\nParagraph 2',
    };
    const result = formatSkillFile(skill);
    expect(result).toContain('# Title\n\nParagraph 1\n\nParagraph 2');
  });
});

describe('generateSkills', () => {
  it('should return empty array when no skills defined', () => {
    const config = makeConfig();
    const result = generateSkills(config, '/project');
    expect(result).toHaveLength(0);
  });

  it('should generate files with frontmatter for each skill', () => {
    const config = makeConfig({
      skills: [
        { name: 'scaffold', description: 'Scaffold modules', content: '# Scaffold' },
        { name: 'migrate', description: 'Migration helper', content: '# Migrate' },
      ],
    });
    const result = generateSkills(config, '/project');

    expect(result).toHaveLength(2);
    expect(result[0]!.content).toContain('---\nname: scaffold');
    expect(result[0]!.content).toContain('description: Scaffold modules');
    expect(result[0]!.content).toContain('# Scaffold');
    expect(result[1]!.content).toContain('---\nname: migrate');
  });

  it('should reject skills with invalid names', () => {
    const config = makeConfig({
      skills: [{ name: '../hack', description: 'bad', content: 'x' }],
    });
    expect(() => generateSkills(config, '/project')).toThrow('Nombre de skill inválido');
  });

  it('should place files under .claude/skills/{name}/SKILL.md', () => {
    const config = makeConfig({
      skills: [{ name: 'my-skill', description: 'test', content: '# Test' }],
    });
    const result = generateSkills(config, '/project');
    expect(result[0]!.path).toContain('.claude');
    expect(result[0]!.path).toContain('skills');
    expect(result[0]!.path).toContain('my-skill');
    expect(result[0]!.path).toContain('SKILL.md');
  });
});
