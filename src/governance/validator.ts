import type { DivergentMeta } from '../core/types.js';
import { readFileOrNull } from '../utils/fs.js';
import { hashMatches } from '../utils/hash.js';
import { CLAUDE_DIR, CLAUDE_MD, RULES_DIR } from '../core/constants.js';
import path from 'path';
import fg from 'fast-glob';

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  file: string;
  message: string;
}

/** Validate the current .claude/ configuration against governance rules */
export async function validateConfig(
  projectRoot: string,
  meta: DivergentMeta | null,
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  // Check .claude directory exists
  const claudeDir = path.join(projectRoot, CLAUDE_DIR);
  const claudeMd = await readFileOrNull(path.join(projectRoot, CLAUDE_MD));
  if (!claudeMd) {
    issues.push({
      severity: 'error',
      file: 'CLAUDE.md',
      message: 'CLAUDE.md no encontrado. Ejecuta `diverger init` para generarlo.',
    });
  }

  const settings = await readFileOrNull(path.join(claudeDir, 'settings.json'));
  if (!settings) {
    issues.push({
      severity: 'warning',
      file: '.claude/settings.json',
      message: 'settings.json no encontrado.',
    });
  }

  // Validate mandatory rules haven't been modified
  if (meta) {
    for (const [rulePath, governance] of Object.entries(meta.ruleGovernance)) {
      if (governance !== 'mandatory') continue;

      const storedHash = meta.fileHashes[rulePath];
      if (!storedHash) continue;

      // Resolve relative paths against projectRoot for cross-system compatibility
      const absoluteRulePath = path.isAbsolute(rulePath) ? rulePath : path.join(projectRoot, rulePath);
      const currentContent = await readFileOrNull(absoluteRulePath);
      if (currentContent === null) {
        issues.push({
          severity: 'error',
          file: rulePath,
          message: `Regla obligatoria eliminada: ${rulePath}`,
        });
      } else if (!hashMatches(currentContent, storedHash)) {
        issues.push({
          severity: 'error',
          file: rulePath,
          message: `Regla obligatoria modificada: ${rulePath}. Las reglas mandatory no deben ser alteradas.`,
        });
      }
    }
  }

  // Check for rules files
  const rulesDir = path.join(projectRoot, CLAUDE_DIR, RULES_DIR);
  const ruleFiles = await fg('**/*.md', { cwd: rulesDir, onlyFiles: true }).catch(() => []);
  if (ruleFiles.length === 0) {
    issues.push({
      severity: 'warning',
      file: '.claude/rules/',
      message: 'No se encontraron archivos de reglas.',
    });
  }

  return {
    valid: issues.every((i) => i.severity !== 'error'),
    issues,
  };
}
