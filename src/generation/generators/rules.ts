import type { ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, RULES_DIR } from '../../core/constants.js';
import { assertPathWithin } from '../../utils/fs.js';
import path from 'path';

/** Generate all .claude/rules/*.md files from composed config */
export function generateRules(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile[] {
  const rulesBase = path.join(projectRoot, CLAUDE_DIR, RULES_DIR);
  return config.rules.map((rule) => {
    const fullPath = path.join(rulesBase, rule.path);
    assertPathWithin(fullPath, rulesBase);
    return {
      path: fullPath,
      content: rule.content,
      governance: rule.governance,
    };
  });
}
