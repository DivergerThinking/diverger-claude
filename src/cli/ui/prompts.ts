import { confirm, checkbox, select } from '@inquirer/prompts';
import type { DetectedTechnology } from '../../core/types.js';
import { confidenceColor } from './logger.js';

/** Ask user to confirm detected technologies */
export async function confirmTechnologies(
  technologies: DetectedTechnology[],
): Promise<DetectedTechnology[]> {
  const choices = technologies.map((t) => ({
    name: `${t.name} ${confidenceColor(t.confidence)}${t.version ? ` (v${t.version})` : ''}`,
    value: t.id,
    checked: t.confidence >= 90,
  }));

  const selected = await checkbox({
    message: 'Tecnologías detectadas. Selecciona las que quieres incluir:',
    choices,
  });

  return technologies.filter((t) => selected.includes(t.id));
}

/** Ask user to confirm an action */
export async function confirmAction(message: string): Promise<boolean> {
  return confirm({ message, default: true });
}

/** Ask user whether to fetch knowledge for a technology */
export async function askKnowledgePermission(techName: string): Promise<boolean> {
  return confirm({
    message: `¿Buscar las últimas best practices de ${techName} via Claude API?`,
    default: true,
  });
}

/** Ask user to choose from options */
export async function chooseOption<T extends string>(
  message: string,
  options: Array<{ name: string; value: T }>,
): Promise<T> {
  return select({ message, choices: options });
}

/** Ask user to resolve a merge conflict */
export async function resolveConflict(
  filePath: string,
): Promise<'ours' | 'theirs' | 'manual'> {
  return select({
    message: `Conflicto en ${filePath}. ¿Cómo resolver?`,
    choices: [
      { name: 'Usar versión nueva (diverger-claude)', value: 'ours' as const },
      { name: 'Mantener versión actual (equipo)', value: 'theirs' as const },
      { name: 'Resolver manualmente', value: 'manual' as const },
    ],
  });
}
