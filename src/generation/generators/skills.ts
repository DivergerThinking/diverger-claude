import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, SKILLS_DIR } from '../../core/constants.js';
import { assertPathWithin } from '../../utils/fs.js';
import path from 'path';

/** Validate a skill name is safe for use as a directory name */
function validateSkillName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Nombre de skill inválido "${name}": solo se permiten alfanuméricos, guiones y guiones bajos`);
  }
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
      content: skill.content,
    };
  });
}
