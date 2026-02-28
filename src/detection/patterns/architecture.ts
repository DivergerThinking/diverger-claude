import type { ArchitecturePattern, DetectedTechnology, MonorepoInfo } from '../../core/types.js';

/** Infer architecture pattern from detected technologies and structure */
export function detectArchitecture(
  technologies: DetectedTechnology[],
  monorepo?: MonorepoInfo,
  files?: Map<string, string>,
): ArchitecturePattern | undefined {
  const techIds = new Set(technologies.map((t) => t.id));

  // Serverless indicators (use exact file matching to avoid false positives)
  const serverlessFileNames = ['serverless.yml', 'serverless.yaml', 'serverless.ts', 'cdk.json'];
  let serverlessFiles = files
    ? serverlessFileNames.some((f) => files.has(f))
    : false;

  // template.yaml/yml are generic; only treat as serverless if they contain SAM markers
  if (!serverlessFiles && files) {
    for (const name of ['template.yaml', 'template.yml']) {
      const content = files.get(name);
      if (content && (content.includes('AWS::Serverless') || content.includes('AWSTemplateFormatVersion'))) {
        serverlessFiles = true;
        break;
      }
    }
  }

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
