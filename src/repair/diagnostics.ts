import path from 'path';
import type { DivergentMeta } from '../core/types.js';
import { CLAUDE_DIR, CLAUDE_MD, RULES_DIR } from '../core/constants.js';
import { readFileOrNull, readJsonOrNull, fileExists } from '../utils/fs.js';
import { hashMatches } from '../utils/hash.js';
import { resolveMetaKey } from '../utils/paths.js';
import type { Diagnosis } from './types.js';

/**
 * Run all diagnostics against a project's .claude/ directory.
 * Returns diagnoses sorted by confidence descending.
 */
export async function diagnose(
  projectRoot: string,
  meta: DivergentMeta | null,
): Promise<Diagnosis[]> {
  const diagnoses: Diagnosis[] = [];

  // D1: CLAUDE.md missing
  const claudeMdPath = path.join(projectRoot, CLAUDE_MD);
  if (!(await fileExists(claudeMdPath))) {
    diagnoses.push({
      id: 'D1',
      description: 'CLAUDE.md faltante — se puede regenerar desde meta',
      file: CLAUDE_MD,
      confidence: 95,
      severity: 'critical',
      autoRepairable: true,
    });
  }

  // D2: settings.json with invalid JSON
  const settingsPath = path.join(projectRoot, CLAUDE_DIR, 'settings.json');
  const settingsContent = await readFileOrNull(settingsPath);
  if (settingsContent !== null) {
    try {
      JSON.parse(settingsContent);
    } catch {
      diagnoses.push({
        id: 'D2',
        description: 'settings.json contiene JSON inválido',
        file: '.claude/settings.json',
        confidence: 90,
        severity: 'critical',
        autoRepairable: true,
      });
    }
  }

  // D3 & D4: Mandatory rules integrity
  if (meta) {
    for (const [rulePath, governance] of Object.entries(meta.ruleGovernance)) {
      if (governance !== 'mandatory') continue;
      const storedHash = meta.fileHashes[rulePath];
      if (!storedHash) continue;

      const absoluteRulePath = resolveMetaKey(rulePath, projectRoot);
      const currentContent = await readFileOrNull(absoluteRulePath);

      if (currentContent === null) {
        // D3: mandatory rule deleted
        diagnoses.push({
          id: 'D3',
          description: `Regla obligatoria eliminada: ${rulePath}`,
          file: rulePath,
          confidence: 95,
          severity: 'critical',
          autoRepairable: true,
        });
      } else if (!hashMatches(currentContent, storedHash)) {
        // D4: mandatory rule modified
        diagnoses.push({
          id: 'D4',
          description: `Regla obligatoria modificada: ${rulePath}`,
          file: rulePath,
          confidence: 80,
          severity: 'warning',
          autoRepairable: true,
        });
      }
    }

    // D5: Stack possibly outdated (if meta is old)
    const generatedAt = new Date(meta.generatedAt);
    const daysSinceGeneration = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceGeneration > 30) {
      diagnoses.push({
        id: 'D5',
        description: `Configuración generada hace ${Math.floor(daysSinceGeneration)} días — puede estar desactualizada`,
        file: '.diverger-meta.json',
        confidence: 60,
        severity: 'info',
        autoRepairable: false,
      });
    }
  }

  // D8: settings.json with obsolete keys
  if (settingsContent !== null) {
    const settings = await readJsonOrNull<Record<string, unknown>>(settingsPath);
    if (settings) {
      const obsoleteKeys = ['env', 'model', 'maxTokens'];
      const found = obsoleteKeys.filter((k) => k in settings);
      if (found.length > 0) {
        diagnoses.push({
          id: 'D8',
          description: `settings.json contiene keys obsoletas: ${found.join(', ')}`,
          file: '.claude/settings.json',
          confidence: 75,
          severity: 'warning',
          autoRepairable: true,
        });
      }
    }
  }

  // D9: rules with invalid frontmatter paths
  const rulesDir = path.join(projectRoot, CLAUDE_DIR, RULES_DIR);
  if (await fileExists(rulesDir)) {
    const fg = await import('fast-glob');
    const ruleFiles = await fg.default('**/*.md', { cwd: rulesDir, onlyFiles: true });
    for (const ruleFile of ruleFiles) {
      const ruleContent = await readFileOrNull(path.join(rulesDir, ruleFile));
      if (ruleContent?.startsWith('---')) {
        const endIdx = ruleContent.indexOf('---', 3);
        if (endIdx !== -1) {
          const frontmatter = ruleContent.slice(3, endIdx);
          // Check for paths: entries with clearly invalid patterns
          const pathsMatch = frontmatter.match(/^paths:\s*\n((?:\s+-\s+.+\n?)*)/m);
          if (pathsMatch?.[1]) {
            const paths = pathsMatch[1].match(/-\s+(.+)/g)?.map((p) => p.replace(/^-\s+/, '').trim()) ?? [];
            const invalid = paths.filter((p) => p.includes('\\') || p.startsWith('/'));
            if (invalid.length > 0) {
              diagnoses.push({
                id: 'D9',
                description: `Regla ${ruleFile} tiene paths frontmatter inválidos: ${invalid.join(', ')}`,
                file: `.claude/rules/${ruleFile}`,
                confidence: 70,
                severity: 'warning',
                autoRepairable: true,
              });
            }
          }
        }
      }
    }
  }

  // Sort by confidence descending
  diagnoses.sort((a, b) => b.confidence - a.confidence);
  return diagnoses;
}
