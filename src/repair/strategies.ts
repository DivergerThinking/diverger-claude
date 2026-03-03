import path from 'path';
import type { DivergentMeta } from '../core/types.js';
import { CLAUDE_DIR } from '../core/constants.js';
import { resolveMetaKey } from '../utils/paths.js';
import { writeFileAtomic, readFileOrNull } from '../utils/fs.js';
import type { Diagnosis, RepairAction } from './types.js';

/**
 * Create a repair action for a given diagnosis.
 * Returns null if no automated repair is available.
 */
export function createRepairAction(
  diagnosis: Diagnosis,
  projectRoot: string,
  meta: DivergentMeta | null,
): RepairAction | null {
  switch (diagnosis.id) {
    case 'D1':
      return repairMissingClaudeMd(diagnosis, projectRoot, meta);
    case 'D2':
      return repairInvalidSettingsJson(diagnosis, projectRoot, meta);
    case 'D3':
      return repairDeletedMandatoryRule(diagnosis, projectRoot, meta);
    case 'D4':
      return repairModifiedMandatoryRule(diagnosis, projectRoot, meta);
    case 'D8':
      return repairObsoleteSettingsKeys(diagnosis, projectRoot);
    case 'D9':
      return repairInvalidRulePaths(diagnosis, projectRoot);
    default:
      return null;
  }
}

function repairMissingClaudeMd(
  _diagnosis: Diagnosis,
  projectRoot: string,
  meta: DivergentMeta | null,
): RepairAction | null {
  // We can only repair if meta has the original content
  const metaKey = Object.keys(meta?.fileContents ?? {}).find(
    (k) => k.endsWith('CLAUDE.md') || k === 'CLAUDE.md',
  );
  if (!meta?.fileContents || !metaKey) return null;

  return {
    diagnosisId: 'D1',
    description: 'Regenerar CLAUDE.md desde meta',
    execute: async () => {
      const content = meta.fileContents[metaKey];
      if (!content) return false;
      await writeFileAtomic(path.join(projectRoot, 'CLAUDE.md'), content);
      return true;
    },
  };
}

function repairInvalidSettingsJson(
  _diagnosis: Diagnosis,
  projectRoot: string,
  meta: DivergentMeta | null,
): RepairAction | null {
  const metaKey = Object.keys(meta?.fileContents ?? {}).find(
    (k) => k.includes('settings.json'),
  );
  if (!meta?.fileContents || !metaKey) return null;

  return {
    diagnosisId: 'D2',
    description: 'Restaurar settings.json desde meta',
    execute: async () => {
      const content = meta.fileContents[metaKey];
      if (!content) return false;
      await writeFileAtomic(
        path.join(projectRoot, CLAUDE_DIR, 'settings.json'),
        content,
      );
      return true;
    },
  };
}

function repairDeletedMandatoryRule(
  diagnosis: Diagnosis,
  projectRoot: string,
  meta: DivergentMeta | null,
): RepairAction | null {
  if (!meta?.fileContents) return null;
  const content = meta.fileContents[diagnosis.file];
  if (!content) return null;

  return {
    diagnosisId: 'D3',
    description: `Restaurar regla obligatoria: ${diagnosis.file}`,
    execute: async () => {
      const absolutePath = resolveMetaKey(diagnosis.file, projectRoot);
      await writeFileAtomic(absolutePath, content);
      return true;
    },
  };
}

function repairModifiedMandatoryRule(
  diagnosis: Diagnosis,
  projectRoot: string,
  meta: DivergentMeta | null,
): RepairAction | null {
  if (!meta?.fileContents) return null;
  const content = meta.fileContents[diagnosis.file];
  if (!content) return null;

  return {
    diagnosisId: 'D4',
    description: `Restaurar versión original de regla obligatoria: ${diagnosis.file}`,
    execute: async () => {
      const absolutePath = resolveMetaKey(diagnosis.file, projectRoot);
      await writeFileAtomic(absolutePath, content);
      return true;
    },
  };
}

function repairObsoleteSettingsKeys(
  _diagnosis: Diagnosis,
  projectRoot: string,
): RepairAction {
  return {
    diagnosisId: 'D8',
    description: 'Eliminar keys obsoletas de settings.json',
    execute: async () => {
      const settingsPath = path.join(projectRoot, CLAUDE_DIR, 'settings.json');
      const content = await readFileOrNull(settingsPath);
      if (!content) return false;
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        const obsoleteKeys = ['env', 'model', 'maxTokens'];
        let changed = false;
        for (const key of obsoleteKeys) {
          if (key in parsed) {
            delete parsed[key];
            changed = true;
          }
        }
        if (changed) {
          await writeFileAtomic(settingsPath, JSON.stringify(parsed, null, 2) + '\n');
        }
        return true;
      } catch {
        return false;
      }
    },
  };
}

function repairInvalidRulePaths(
  diagnosis: Diagnosis,
  projectRoot: string,
): RepairAction {
  return {
    diagnosisId: 'D9',
    description: `Corregir paths en frontmatter de ${diagnosis.file}`,
    execute: async () => {
      const filePath = path.join(projectRoot, diagnosis.file);
      const content = await readFileOrNull(filePath);
      if (!content) return false;

      // Replace backslashes with forward slashes and remove leading /
      const fixed = content.replace(
        /(^paths:\s*\n(?:\s+-\s+.+\n?)*)/m,
        (block) => block.replace(/\\/g, '/').replace(/-\s+\//g, '- '),
      );

      if (fixed !== content) {
        await writeFileAtomic(filePath, fixed);
      }
      return true;
    },
  };
}
