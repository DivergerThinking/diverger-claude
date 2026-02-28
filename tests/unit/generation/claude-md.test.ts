import { describe, it, expect } from 'vitest';
import { generateClaudeMd } from '../../../src/generation/generators/claude-md.js';
import type { ComposedConfig, ClaudeMdSection } from '../../../src/core/types.js';

function makeConfig(
  sections: ClaudeMdSection[] = [],
  appliedProfiles: string[] = [],
): ComposedConfig {
  return {
    claudeMdSections: sections,
    settings: { permissions: {} },
    rules: [],
    agents: [],
    skills: [],
    hooks: [],
    mcp: [],
    externalTools: [],
    appliedProfiles,
  };
}

describe('generateClaudeMd', () => {
  const projectRoot = '/project';

  it('should generate a file at the correct path', () => {
    const config = makeConfig();
    const result = generateClaudeMd(config, projectRoot);

    // Path should be <projectRoot>/.claude/CLAUDE.md
    expect(result.path).toContain('.claude');
    expect(result.path).toContain('CLAUDE.md');
  });

  it('should include the header with project configuration title', () => {
    const config = makeConfig();
    const result = generateClaudeMd(config, projectRoot);

    expect(result.content).toContain('# Project Configuration');
  });

  it('should list applied profiles in the generated note', () => {
    const config = makeConfig([], ['base/common', 'languages/typescript', 'frameworks/react']);
    const result = generateClaudeMd(config, projectRoot);

    expect(result.content).toContain('diverger-claude');
    expect(result.content).toContain('base/common');
    expect(result.content).toContain('languages/typescript');
    expect(result.content).toContain('frameworks/react');
  });

  it('should include all sections in the output', () => {
    const sections: ClaudeMdSection[] = [
      { heading: 'Base', content: '## Base\nBase configuration rules.', order: 0 },
      { heading: 'TypeScript', content: '## TypeScript\nUse strict mode.', order: 10 },
    ];
    const config = makeConfig(sections, ['base/common', 'languages/typescript']);
    const result = generateClaudeMd(config, projectRoot);

    expect(result.content).toContain('## Base');
    expect(result.content).toContain('Base configuration rules.');
    expect(result.content).toContain('## TypeScript');
    expect(result.content).toContain('Use strict mode.');
  });

  it('should order sections by their order field (ascending)', () => {
    const sections: ClaudeMdSection[] = [
      { heading: 'Testing', content: '## Testing\nTesting section.', order: 30 },
      { heading: 'Base', content: '## Base\nBase section.', order: 0 },
      { heading: 'Framework', content: '## Framework\nFramework section.', order: 20 },
      { heading: 'Language', content: '## Language\nLanguage section.', order: 10 },
    ];
    const config = makeConfig(sections, ['test']);
    const result = generateClaudeMd(config, projectRoot);

    const baseIdx = result.content.indexOf('## Base');
    const langIdx = result.content.indexOf('## Language');
    const fwIdx = result.content.indexOf('## Framework');
    const testIdx = result.content.indexOf('## Testing');

    expect(baseIdx).toBeLessThan(langIdx);
    expect(langIdx).toBeLessThan(fwIdx);
    expect(fwIdx).toBeLessThan(testIdx);
  });

  it('should not mutate the original sections array order', () => {
    const sections: ClaudeMdSection[] = [
      { heading: 'Z', content: '## Z\nLast.', order: 99 },
      { heading: 'A', content: '## A\nFirst.', order: 1 },
    ];
    const config = makeConfig(sections, []);
    generateClaudeMd(config, projectRoot);

    // Original array should remain in its original order
    expect(config.claudeMdSections[0]!.heading).toBe('Z');
    expect(config.claudeMdSections[1]!.heading).toBe('A');
  });

  it('should handle empty sections list gracefully', () => {
    const config = makeConfig([], ['base/common']);
    const result = generateClaudeMd(config, projectRoot);

    expect(result.content).toContain('# Project Configuration');
    expect(result.content).toContain('base/common');
    // Should still be valid markdown
    expect(result.content.trim().length).toBeGreaterThan(0);
  });

  it('should separate each section with a blank line', () => {
    const sections: ClaudeMdSection[] = [
      { heading: 'A', content: '## A\nSection A content.', order: 0 },
      { heading: 'B', content: '## B\nSection B content.', order: 10 },
    ];
    const config = makeConfig(sections, []);
    const result = generateClaudeMd(config, projectRoot);

    // After each section.content push, an empty string '' is pushed, creating blank lines
    const lines = result.content.split('\n');
    const sectionAEnd = lines.findIndex((l) => l.includes('Section A content.'));
    // The line after section A content should be empty (the separator)
    expect(lines[sectionAEnd + 1]).toBe('');
  });

  it('should produce valid markdown output format', () => {
    const sections: ClaudeMdSection[] = [
      { heading: 'Rules', content: '## Rules\n- Rule 1\n- Rule 2', order: 0 },
    ];
    const config = makeConfig(sections, ['base/common']);
    const result = generateClaudeMd(config, projectRoot);

    // Should start with # heading
    expect(result.content.startsWith('# Project Configuration')).toBe(true);

    // Should contain the blockquote with profile info
    expect(result.content).toContain('> Generated by diverger-claude.');

    // Should contain the section content
    expect(result.content).toContain('- Rule 1');
    expect(result.content).toContain('- Rule 2');
  });
});
