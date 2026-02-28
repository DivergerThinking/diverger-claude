import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const kubernetesProfile: Profile = {
  id: 'infra/kubernetes',
  name: 'Kubernetes',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['kubernetes'],
  contributions: {
    claudeMd: [
      {
        heading: 'Kubernetes Conventions',
        order: 40,
        content: `## Kubernetes Conventions

- Define resource requests and limits for every container
- Use liveness and readiness probes for all deployments
- Run containers with a read-only root filesystem when possible
- Use \`securityContext\` to enforce non-root execution and drop capabilities
- Use namespaces to isolate workloads by environment or team
- Prefer Deployments over bare Pods for stateless workloads
- Use ConfigMaps for configuration, Secrets for sensitive data
- Define Pod Disruption Budgets for high-availability services
- Use labels and annotations consistently for resource organization
- Apply network policies to restrict inter-pod communication`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(kubectl:*)',
          'Bash(helm:*)',
          'Bash(kustomize:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/kubernetes-conventions.md',
        governance: 'mandatory',
        description: 'Kubernetes resource definition best practices',
        content: `# Kubernetes Conventions

## Resource Definitions
- Always specify \`resources.requests\` and \`resources.limits\` for CPU and memory
- Use \`LimitRange\` and \`ResourceQuota\` at namespace level for guardrails
- Set appropriate replica counts for production workloads
- Use \`topologySpreadConstraints\` for high-availability pod distribution
- Define \`PodDisruptionBudget\` for critical services

## Health Checks
- Configure \`livenessProbe\` to detect and restart unhealthy containers
- Configure \`readinessProbe\` to control traffic routing to healthy pods
- Use \`startupProbe\` for slow-starting applications
- Set appropriate \`initialDelaySeconds\`, \`periodSeconds\`, and \`failureThreshold\`
- Prefer HTTP probes for web services, TCP for non-HTTP services

## Security Contexts
- Set \`runAsNonRoot: true\` at pod or container level
- Set \`readOnlyRootFilesystem: true\` where possible
- Drop all capabilities and add back only what is needed
- Set \`allowPrivilegeEscalation: false\`
- Use \`seccompProfile\` with RuntimeDefault or Localhost profiles
- Avoid running containers in privileged mode

## Resource Limits
- Set memory limits slightly above requests to allow burst capacity
- Set CPU requests based on observed usage, limits to prevent runaway
- Use Vertical Pod Autoscaler recommendations for tuning
- Use Horizontal Pod Autoscaler for scaling based on metrics
- Monitor and adjust limits based on production usage patterns

## Organization
- Use consistent labeling: \`app.kubernetes.io/name\`, \`app.kubernetes.io/version\`
- Use namespaces for environment isolation (dev, staging, production)
- Store manifests in version control alongside application code
- Use Kustomize or Helm for environment-specific configuration
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Kubernetes-Specific Review
- Check for resource requests and limits on all containers
- Verify liveness and readiness probes are configured
- Check security context settings (non-root, read-only filesystem)
- Verify no hardcoded secrets in manifests
- Check for proper label and annotation usage
- Verify Pod Disruption Budgets for production workloads
- Check namespace isolation and network policies`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Kubernetes Security Review
- Verify pods run as non-root with minimal capabilities
- Check for privileged containers or privilege escalation
- Verify Secrets are not stored in plain text in manifests
- Check network policies for proper isolation
- Verify RBAC roles follow least-privilege principle
- Check for service account token auto-mounting restrictions`,
      },
    ],
  },
};
