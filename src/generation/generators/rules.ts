import type { ComposedConfig, GeneratedFile, RuleDefinition } from '../../core/types.js';
import { CLAUDE_DIR, RULES_DIR } from '../../core/constants.js';
import { assertPathWithin } from '../../utils/fs.js';
import path from 'path';

/** Format a rule file, prepending paths: frontmatter when paths are defined */
export function formatRuleFile(rule: RuleDefinition): string {
  if (!rule.paths || rule.paths.length === 0) {
    return rule.content;
  }
  const parts: string[] = [];
  parts.push('---');
  parts.push('paths:');
  for (const p of rule.paths) {
    parts.push(`  - ${p}`);
  }
  parts.push('---');
  parts.push('');
  parts.push(rule.content);
  return parts.join('\n');
}

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
      content: formatRuleFile(rule),
      governance: rule.governance,
    };
  });
}
