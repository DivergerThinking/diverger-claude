import type { DivergentMeta } from '../core/types.js';
import { mapDependencies, mapDependencyToTechnology } from './dependency-mapper.js';
import { detectArchitectureChanges } from './architecture-detector.js';
import { shouldReport } from '../detection/unknown-tech-filters.js';

export interface EvolutionAdvice {
  type: 'new-profile' | 'architecture-change' | 'dependency-update' | 'unknown-technology';
  description: string;
  suggestedAction: string;
  priority: 'high' | 'medium' | 'low';
  data?: Record<string, unknown>;
}

/**
 * Analyze project changes and provide proactive evolution advice.
 */
export async function analyzeEvolution(
  projectRoot: string,
  meta: DivergentMeta,
  newDependencies: string[],
  removedDependencies: string[],
): Promise<EvolutionAdvice[]> {
  const advice: EvolutionAdvice[] = [];

  // Map new dependencies to known technologies
  const mappedNew = mapDependencies(newDependencies);
  for (const { dependency, technologyId } of mappedNew) {
    // Only suggest if the technology isn't already in the stack
    if (!meta.detectedStack.includes(technologyId)) {
      advice.push({
        type: 'new-profile',
        description: `Nueva dependencia "${dependency}" → profile "${technologyId}" disponible`,
        suggestedAction: `Ejecuta \`/diverger-sync\` para activar el profile de ${technologyId}`,
        priority: 'high',
      });
    }
  }

  // Check removed dependencies
  const mappedRemoved = mapDependencies(removedDependencies);
  for (const { dependency, technologyId } of mappedRemoved) {
    if (meta.detectedStack.includes(technologyId)) {
      advice.push({
        type: 'dependency-update',
        description: `Dependencia "${dependency}" eliminada — profile "${technologyId}" puede ser innecesario`,
        suggestedAction: 'Ejecuta `/diverger-sync` para actualizar la configuración',
        priority: 'medium',
      });
    }
  }

  // Detect unknown technologies (new deps that don't map to any known tech)
  const unmapped = newDependencies.filter(
    (dep) => !mapDependencyToTechnology(dep) && shouldReport(dep),
  );
  if (unmapped.length > 0) {
    advice.push({
      type: 'unknown-technology',
      description: `${unmapped.length} tecnologías desconocidas detectadas: ${unmapped.join(', ')}`,
      suggestedAction: 'Considera abrir un GitHub Issue para solicitar soporte de estas tecnologías',
      priority: 'medium',
      data: { unknownDeps: unmapped },
    });
  }

  // Detect architecture changes
  const archChanges = await detectArchitectureChanges(projectRoot, meta.detectedStack);
  for (const change of archChanges) {
    advice.push({
      type: 'architecture-change',
      description: change.description,
      suggestedAction: change.suggestedAction,
      priority: 'high',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  advice.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return advice;
}
