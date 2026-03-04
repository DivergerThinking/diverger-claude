import type { ComposedConfig, GeneratedFile, ProjectMetadata, RuleDefinition } from '../../core/types.js';
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

/** Interpolate {{PLACEHOLDER}} tokens in dynamic rule content with real project data */
export function interpolateDynamicRule(content: string, metadata: ProjectMetadata): string {
  const pm = metadata.packageManager ?? 'npm';

  // Build command lists from metadata
  const buildCommands: string[] = [];

  if (metadata.scripts) {
    if (metadata.scripts.build) buildCommands.push(`1. Build: \`${pm} run build\` — ${metadata.scripts.build}`);
    if (metadata.scripts.typecheck) buildCommands.push(`2. Type check: \`${pm} run typecheck\` — ${metadata.scripts.typecheck}`);
    else if (metadata.scripts.check) buildCommands.push(`2. Type/lint check: \`${pm} run check\` — ${metadata.scripts.check}`);
    if (metadata.scripts.test) buildCommands.push(`${buildCommands.length + 1}. Tests: \`${pm} run test\` — ${metadata.scripts.test}`);
    if (metadata.scripts.lint) buildCommands.push(`${buildCommands.length + 1}. Lint: \`${pm} run lint\` — ${metadata.scripts.lint}`);
  }

  if (metadata.makeTargets) {
    if (metadata.makeTargets.includes('build') && !metadata.scripts?.build) {
      buildCommands.push(`${buildCommands.length + 1}. Build: \`make build\``);
    }
    if (metadata.makeTargets.includes('test') && !metadata.scripts?.test) {
      buildCommands.push(`${buildCommands.length + 1}. Tests: \`make test\``);
    }
    if (metadata.makeTargets.includes('lint') && !metadata.scripts?.lint) {
      buildCommands.push(`${buildCommands.length + 1}. Lint: \`make lint\``);
    }
  }

  // Fallback if no commands found
  const buildCommandsText = buildCommands.length > 0
    ? buildCommands.join('\n')
    : '1. The project builds without errors\n2. Type checking passes (if applicable)\n3. Tests pass\n4. Linting passes (if configured)';

  return content.replace('{{BUILD_COMMANDS}}', buildCommandsText);
}

/** Generate all .claude/rules/*.md files from composed config */
export function generateRules(
  config: ComposedConfig,
  projectRoot: string,
  metadata?: ProjectMetadata,
): GeneratedFile[] {
  const rulesBase = path.join(projectRoot, CLAUDE_DIR, RULES_DIR);
  return config.rules.map((rule) => {
    const fullPath = path.join(rulesBase, rule.path);
    assertPathWithin(fullPath, rulesBase);

    // Interpolate dynamic rules with project metadata
    let content = rule.content;
    if (rule.isDynamic && metadata) {
      content = interpolateDynamicRule(content, metadata);
    }

    return {
      path: fullPath,
      content: formatRuleFile({ ...rule, content }),
      governance: rule.governance,
    };
  });
}
