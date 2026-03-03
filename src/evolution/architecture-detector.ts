import { fileExists } from '../utils/fs.js';
import path from 'path';

export interface ArchitectureChange {
  type: 'docker-added' | 'ci-added' | 'monorepo-added' | 'mobile-added' | 'serverless-added';
  description: string;
  suggestedAction: string;
}

/**
 * Detect significant architectural changes by checking for new infrastructure files.
 * Compares current state against what was tracked in meta.
 */
export async function detectArchitectureChanges(
  projectRoot: string,
  trackedStack: string[],
): Promise<ArchitectureChange[]> {
  const changes: ArchitectureChange[] = [];

  // Docker added?
  if (!trackedStack.includes('docker')) {
    const hasDockerfile = await fileExists(path.join(projectRoot, 'Dockerfile'));
    const hasCompose = await fileExists(path.join(projectRoot, 'docker-compose.yml')) ||
      await fileExists(path.join(projectRoot, 'docker-compose.yaml'));
    if (hasDockerfile || hasCompose) {
      changes.push({
        type: 'docker-added',
        description: 'Dockerfile o docker-compose detectado',
        suggestedAction: 'Ejecuta `/diverger-sync` para activar profiles de Docker',
      });
    }
  }

  // CI added?
  if (!trackedStack.includes('github-actions') && !trackedStack.includes('gitlab-ci')) {
    const hasGitHubActions = await fileExists(path.join(projectRoot, '.github', 'workflows'));
    const hasGitLabCI = await fileExists(path.join(projectRoot, '.gitlab-ci.yml'));
    if (hasGitHubActions || hasGitLabCI) {
      changes.push({
        type: 'ci-added',
        description: 'Pipeline de CI/CD detectado',
        suggestedAction: 'Ejecuta `/diverger-sync` para activar profiles de CI',
      });
    }
  }

  // Monorepo added?
  if (!trackedStack.some((s) => s.includes('monorepo') || s.includes('workspace'))) {
    const hasTurbo = await fileExists(path.join(projectRoot, 'turbo.json'));
    const hasNx = await fileExists(path.join(projectRoot, 'nx.json'));
    const hasLerna = await fileExists(path.join(projectRoot, 'lerna.json'));
    const hasPnpmWorkspace = await fileExists(path.join(projectRoot, 'pnpm-workspace.yaml'));
    if (hasTurbo || hasNx || hasLerna || hasPnpmWorkspace) {
      changes.push({
        type: 'monorepo-added',
        description: 'Estructura de monorepo detectada',
        suggestedAction: 'Ejecuta `/diverger-sync` para activar profiles de monorepo',
      });
    }
  }

  return changes;
}
