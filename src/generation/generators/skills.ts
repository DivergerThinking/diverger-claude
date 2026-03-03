import type { ComposedConfig, GeneratedFile, SkillDefinition } from '../../core/types.js';
import { CLAUDE_DIR, SKILLS_DIR } from '../../core/constants.js';
import { assertPathWithin } from '../../utils/fs.js';
import { yamlEscape } from './yaml-utils.js';
import path from 'path';

/** Validate a skill name is safe for use as a directory name */
function validateSkillName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Nombre de skill inválido "${name}": solo se permiten alfanuméricos, guiones y guiones bajos`);
  }
}

/** Format a skill file with YAML frontmatter (name + description + optional fields) before content */
export function formatSkillFile(skill: SkillDefinition): string {
  const parts: string[] = [];
  parts.push('---');
  parts.push(`name: ${yamlEscape(skill.name)}`);
  parts.push(`description: ${yamlEscape(skill.description)}`);
  if (skill.disableModelInvocation) {
    parts.push('disable-model-invocation: true');
  }
  if (skill.allowedTools && skill.allowedTools.length > 0) {
    parts.push('allowed-tools:');
    for (const tool of skill.allowedTools) {
      parts.push(`  - ${tool}`);
    }
  }
  if (skill.userInvocable) {
    parts.push('user-invocable: true');
  }
  if (skill.argumentHint) {
    parts.push(`argument-hint: ${yamlEscape(skill.argumentHint)}`);
  }
  if (skill.context) {
    parts.push(`context: ${skill.context}`);
  }
  parts.push('---');
  parts.push('');
  parts.push(skill.content);
  return parts.join('\n');
}

/** Generate all .claude/skills/{name}/SKILL.md files from composed config */
export function generateSkills(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile[] {
  const skillsBase = path.join(projectRoot, CLAUDE_DIR, SKILLS_DIR);
  return config.skills.map((skill) => {
    validateSkillName(skill.name);
    const fullPath = path.join(skillsBase, skill.name, 'SKILL.md');
    assertPathWithin(fullPath, skillsBase);
    return {
      path: fullPath,
      content: formatSkillFile(skill),
    };
  });
}
