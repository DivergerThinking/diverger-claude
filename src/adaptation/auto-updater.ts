import type { ChangeDetectionResult } from './change-detector.js';

export interface AutoUpdateResult {
  applied: boolean;
  description: string;
}

/**
 * Applies minor automatic updates based on detected changes.
 * Only applies safe, non-breaking changes.
 */
export async function applyAutoUpdates(
  changes: ChangeDetectionResult,
  _projectRoot: string,
): Promise<AutoUpdateResult[]> {
  const results: AutoUpdateResult[] = [];

  if (!changes.hasChanges) {
    return results;
  }

  // For now, auto-updates are conservative:
  // - Only flag that a full sync is needed
  // - Don't auto-modify files
  if (changes.newDependencies.length > 0) {
    results.push({
      applied: false,
      description: `Nuevas dependencias detectadas: ${changes.newDependencies.join(', ')}. Ejecuta \`diverger sync\` para actualizar la configuración.`,
    });
  }

  if (changes.changedFiles.length > 0) {
    results.push({
      applied: false,
      description: `Archivos de manifiesto modificados: ${changes.changedFiles.join(', ')}. Ejecuta \`diverger sync\` para re-analizar.`,
    });
  }

  return results;
}
