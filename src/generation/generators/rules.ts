import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, RULES_DIR } from '../../core/constants.js';
import path from 'path';

/** Generate all .claude/rules/*.md files from composed config */
export function generateRules(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile[] {
  return config.rules.map((rule) => ({
    path: path.join(projectRoot, CLAUDE_DIR, RULES_DIR, rule.path),
    content: rule.content,
    governance: rule.governance,
  }));
}
