import type { ArchitecturePattern, DetectedTechnology, MonorepoInfo } from '../../core/types.js';

/** Infer architecture pattern from detected technologies and structure */
export function detectArchitecture(
  technologies: DetectedTechnology[],
  monorepo?: MonorepoInfo,
  files?: Map<string, string>,
): ArchitecturePattern | undefined {
  const techIds = new Set(technologies.map((t) => t.id));

  // Serverless indicators
  const serverlessFiles = files
    ? [...files.keys()].some((f) =>
        f.includes('serverless.yml') ||
        f.includes('serverless.yaml') ||
        f.includes('template.yaml') || // SAM
        f.includes('cdk.json'),
      )
    : false;

  if (serverlessFiles) return 'serverless';

  // JAMStack indicators
  if (
    (techIds.has('nextjs') || techIds.has('nuxt') || techIds.has('gatsby')) &&
    !techIds.has('express') &&
    !techIds.has('nestjs') &&
    !techIds.has('spring-boot')
  ) {
    const hasVercel = files ? files.has('vercel.json') : false;
    const hasNetlify = files ? files.has('netlify.toml') : false;
    if (hasVercel || hasNetlify) return 'jamstack';
  }

  // Microservices indicators
  const hasDocker = techIds.has('docker');
  const hasK8s = techIds.has('kubernetes');
  const multiServiceHint = technologies.some((t) => t.id === 'microservices-hint');

  if (monorepo && monorepo.packages.length > 3 && hasDocker) {
    return 'microservices';
  }
  if (hasK8s || multiServiceHint) {
    return 'microservices';
  }

  // Modular monolith: monorepo but no docker/k8s hints
  if (monorepo && monorepo.packages.length > 2) {
    return 'modular-monolith';
  }

  // Default: monolith
  return 'monolith';
}
