import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, SKILLS_DIR } from '../../core/constants.js';
import path from 'path';

/** Generate all .claude/skills/{name}/SKILL.md files from composed config */
export function generateSkills(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile[] {
  return config.skills.map((skill) => ({
    path: path.join(projectRoot, CLAUDE_DIR, SKILLS_DIR, skill.name, 'SKILL.md'),
    content: skill.content,
  }));
}
