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

Declarative resource management. Security contexts, resource limits, health checks.

**Detailed rules:** see \`.claude/rules/kubernetes/\` directory.

**Key rules:**
- Resource requests AND limits on every container — prevent noisy neighbor issues
- Liveness + readiness probes for all deployments, startup probes for slow apps
- SecurityContext: \`runAsNonRoot\`, \`readOnlyRootFilesystem\`, drop all capabilities
- Use namespaces, labels, and annotations consistently for organization`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(kubectl:*)',
          'Bash(helm:*)',
          'Bash(kustomize:*)',
          'Bash(kubens:*)',
          'Bash(kubectx:*)',
          'Bash(k9s:*)',
          'Bash(stern:*)',
          'Bash(kubeseal:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/kubernetes-resource-standards.md',
        governance: 'mandatory',
        paths: ['**/*.yaml', '**/*.yml', 'k8s/**/*', 'manifests/**/*'],
        description: 'Kubernetes resource definition standards and pod design conventions',
        content: `# Kubernetes Resource Standards

## Why This Matters
Misconfigured Kubernetes resources cause the majority of production incidents: OOM kills from missing
memory limits, cascading failures from missing health checks, security breaches from overprivileged
pods, and downtime from missing disruption budgets. These standards prevent the most common failures.

---

## Resource Requests and Limits

Every container MUST define \`resources.requests\` and \`resources.limits\` for memory.
CPU requests are mandatory; CPU limits are recommended but may be omitted to avoid throttling.

### Correct
\`\`\`yaml
containers:
  - name: app
    resources:
      requests:
        cpu: "100m"
        memory: "128Mi"
      limits:
        cpu: "500m"
        memory: "256Mi"
\`\`\`

### Anti-Pattern
\`\`\`yaml
containers:
  - name: app
    # No resource definitions — container can consume unlimited resources
    # and starve other pods on the same node
\`\`\`

---

## Health Checks

Every long-running container MUST have liveness and readiness probes.
Use startup probes for applications with initialization times exceeding 10 seconds.

### Probe Design Rules
- Liveness probes: lightweight, check only the process itself — NOT external dependencies
- Readiness probes: comprehensive, verify the application can serve traffic (DB connected, cache warm)
- Startup probes: allow generous time for initialization without compromising liveness detection

### Correct
\`\`\`yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /readyz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 2
\`\`\`

---

## Pod Security

### Mandatory Security Context
\`\`\`yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault
\`\`\`

### Rules
- Never run containers as root in production
- Drop ALL capabilities and add back only specific ones needed
- Use read-only root filesystem — mount emptyDir for writable temp paths
- Set \`allowPrivilegeEscalation: false\` on every container
- Never use \`privileged: true\` without explicit documented justification

---

## Workload Types
| Workload | Resource Type | Key Configuration |
|----------|--------------|-------------------|
| Stateless API/web | Deployment + HPA | replicas, PDB, anti-affinity |
| Stateful (database, cache) | StatefulSet | volumeClaimTemplates, headless Service |
| Node-level agent | DaemonSet | tolerations, hostNetwork if needed |
| One-off task | Job | backoffLimit, activeDeadlineSeconds |
| Scheduled task | CronJob | schedule, concurrencyPolicy, startingDeadlineSeconds |
| Batch processing | Job (parallelism) | completions, parallelism |

---

## Labels and Organization

Apply the Kubernetes recommended labels on every resource:
\`\`\`yaml
metadata:
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/version: "1.2.3"
    app.kubernetes.io/component: api
    app.kubernetes.io/part-of: my-platform
    app.kubernetes.io/managed-by: helm
\`\`\`

---

## High Availability
- Define \`PodDisruptionBudget\` for every production Deployment (\`minAvailable\` or \`maxUnavailable\`)
- Use \`topologySpreadConstraints\` to distribute pods across zones and nodes
- Set \`podAntiAffinity\` to prevent replicas from co-locating on the same node
- Use multiple replicas (minimum 2) for all production workloads
`,
      },
      {
        path: 'infra/kubernetes-security.md',
        governance: 'mandatory',
        paths: ['**/*.yaml', '**/*.yml', 'k8s/**/*', 'manifests/**/*'],
        description: 'Kubernetes security standards: PSS, RBAC, secrets, network policies',
        content: `# Kubernetes Security Standards

## Why This Matters
Kubernetes clusters are high-value targets. A single misconfigured RBAC binding, an overprivileged
pod, or an exposed secret can compromise the entire cluster. These rules enforce defense-in-depth
aligned with Pod Security Standards and RBAC best practices.

---

## Pod Security Admission (PSA)

### Namespace Labels
Every production namespace MUST enforce at least the \`baseline\` Pod Security Standard.
Critical namespaces SHOULD enforce \`restricted\`.

\`\`\`yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
\`\`\`

### Policy Levels
| Level | Use Case | Key Restrictions |
|-------|----------|------------------|
| Privileged | System-level (kube-system) | None — unrestricted |
| Baseline | Development/staging | No privileged, no hostNetwork, no hostPID |
| Restricted | Production | Non-root, read-only FS, drop caps, seccomp |

---

## RBAC Rules

- Use namespace-scoped Roles instead of ClusterRoles when possible
- Never grant wildcard verbs (\`*\`) or wildcard resources (\`*\`) in production
- Never add service accounts to \`system:masters\` — it bypasses all RBAC
- Set \`automountServiceAccountToken: false\` on pods that do not need API access
- Create dedicated service accounts per workload — never use the \`default\` service account
- Review and prune RBAC bindings quarterly

### Correct
\`\`\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: my-app
  name: my-app-reader
rules:
  - apiGroups: [""]
    resources: ["pods", "services"]
    verbs: ["get", "list", "watch"]
\`\`\`

### Anti-Pattern
\`\`\`yaml
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
  # Grants god-mode access — any compromise of this SA owns the cluster
\`\`\`

---

## Secrets

- NEVER store secrets in ConfigMaps or plain-text manifests
- Enable encryption at rest for Secrets in etcd
- Use external secret managers (Vault, AWS Secrets Manager) via CSI driver or External Secrets Operator
- Mount secrets as files, not environment variables — env vars leak into process listings and crash dumps
- Rotate secrets regularly; use short-lived tokens when possible
- Never commit secret values to version control — use sealed-secrets or external refs

---

## Network Policies

Apply default-deny in every namespace, then allowlist required traffic:

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: my-app
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
\`\`\`

Then add specific policies for allowed traffic:
- Allow ingress from Ingress controller to frontend pods
- Allow frontend to backend communication
- Allow backend to database communication
- Allow egress to external APIs on specific ports
- Deny all other traffic by default

---

## Image Security
- Use specific image tags or SHA256 digests — never \`:latest\` in production
- Pull images only from trusted registries — configure \`imagePullPolicy: IfNotPresent\` with pinned tags
- Scan images for vulnerabilities in CI before deployment (Trivy, Grype, Snyk)
- Use minimal base images (distroless, alpine, scratch) to reduce attack surface
- Sign images and verify signatures with admission controllers (cosign, Kyverno, OPA Gatekeeper)
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Kubernetes Manifest Review

**Available skill:** \`k8s-manifest-audit\` — use for comprehensive manifest compliance audits.

- Verify every container defines \`resources.requests\` and \`resources.limits\` for memory and CPU
- Check liveness and readiness probes are configured on all long-running containers
- Verify startup probes are used for slow-starting applications
- Check liveness probes do NOT call external dependencies (database, cache, external APIs)
- Verify security context: \`runAsNonRoot: true\`, \`readOnlyRootFilesystem: true\`, \`allowPrivilegeEscalation: false\`
- Check capabilities are dropped (\`drop: ["ALL"]\`) with only needed ones added back
- Verify no hardcoded secrets in manifests — Secrets should reference external managers or sealed-secrets
- Check for consistent recommended labels (\`app.kubernetes.io/*\`)
- Verify PodDisruptionBudgets exist for production Deployments
- Check image tags are specific versions or SHA digests — never \`:latest\`
- Verify namespace-level Pod Security Admission labels are set
- Review Helm charts: values documented, templates scoped, chart version follows SemVer`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Kubernetes Security Review

**Available skill:** \`k8s-manifest-audit\` — use for security-focused manifest audits.

- Verify Pod Security Standards: namespaces enforce \`restricted\` or \`baseline\` PSA profile
- Check all pods run as non-root with \`runAsNonRoot: true\` and a numeric \`runAsUser\`
- Verify \`allowPrivilegeEscalation: false\` and no \`privileged: true\` containers
- Check capabilities: ALL dropped, only specific caps added back with justification
- Verify \`seccompProfile.type: RuntimeDefault\` is set
- Check Secrets are not stored in ConfigMaps or plain-text manifests
- Verify RBAC follows least-privilege: no wildcard verbs/resources, namespace-scoped Roles preferred
- Check \`automountServiceAccountToken: false\` on pods that do not need Kubernetes API access
- Verify default-deny NetworkPolicies exist in production namespaces
- Check images use specific tags or SHA digests from trusted registries
- Verify no \`hostNetwork\`, \`hostPID\`, \`hostIPC\` unless explicitly justified
- Check for image vulnerability scanning in CI pipeline
- Verify encryption at rest is configured for Secrets in etcd`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Kubernetes Documentation

**Available skill:** \`k8s-manifest-audit\` — use to generate audit reports for documentation.

- Document all Kubernetes resources with inline comments explaining non-obvious configuration choices
- Include architecture diagrams showing service communication patterns and network policies
- Document resource sizing rationale: why specific CPU/memory requests and limits were chosen
- Document RBAC design: which service accounts exist, what permissions they have, and why
- Document secret management strategy: where secrets are stored, how they are injected, rotation policy
- Document health check design: what each probe verifies and the reasoning behind threshold values
- Document disaster recovery procedures: backup strategy, restore process, failover steps
- Include runbook entries for common operational scenarios (scale up, rollback, certificate renewal)`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Kubernetes Migration Assistance

**Available skill:** \`k8s-manifest-audit\` — use to audit manifests before and after migration.

- When migrating Kubernetes versions, review the changelog for deprecated and removed APIs
- Use \`kubectl convert\` or \`kubectl api-resources\` to identify resources using deprecated API versions
- Check for removed PodSecurityPolicy when migrating to 1.25+ — migrate to Pod Security Admission
- Verify Ingress resources use \`networking.k8s.io/v1\` (not the deprecated \`extensions/v1beta1\`)
- Update CRDs and operators before upgrading the cluster control plane
- Test migrations in a staging cluster that mirrors production topology
- Use Helm \`helm diff\` to review chart upgrade changes before applying
- Validate all manifests against the target API version with \`kubectl --dry-run=server\``,
      },
    ],
    skills: [
      {
        name: 'k8s-manifest-audit',
        description: 'Audits Kubernetes manifests for resource limits, probes, security, and best practices',
        content: `# Kubernetes Manifest Audit

## When to Use
Run this skill when you need to review Kubernetes YAML manifests for compliance with
production-readiness standards.

## Audit Checklist

### 1. Resource Management
- [ ] Every container has \`resources.requests.cpu\` and \`resources.requests.memory\`
- [ ] Every container has \`resources.limits.memory\` (CPU limits optional)
- [ ] Values are reasonable for the workload type (not placeholder 10m/10Mi)
- [ ] HPA is configured for workloads that need auto-scaling
- [ ] VPA recommendations have been reviewed for resource right-sizing

### 2. Health Checks
- [ ] Liveness probe configured (lightweight, process-only check)
- [ ] Readiness probe configured (comprehensive, includes dependency checks)
- [ ] Startup probe configured for slow-starting apps (>10s init time)
- [ ] Probe thresholds are tuned (not using defaults blindly)
- [ ] Dedicated health endpoints exist (\`/healthz\`, \`/readyz\`)

### 3. Security
- [ ] \`runAsNonRoot: true\` set at pod or container level
- [ ] \`readOnlyRootFilesystem: true\` with emptyDir for writable paths
- [ ] \`allowPrivilegeEscalation: false\` on all containers
- [ ] All capabilities dropped, only needed ones added back
- [ ] \`seccompProfile.type: RuntimeDefault\` set
- [ ] No \`privileged: true\` containers
- [ ] No \`hostNetwork\`, \`hostPID\`, \`hostIPC\` unless justified
- [ ] \`automountServiceAccountToken: false\` if API access not needed
- [ ] Images use specific tags or SHA256 digests (no \`:latest\`)
- [ ] Namespace has Pod Security Admission labels

### 4. High Availability
- [ ] PodDisruptionBudget defined for production Deployments
- [ ] Pod anti-affinity or topology spread constraints configured
- [ ] Multiple replicas (>= 2) for production workloads
- [ ] \`terminationGracePeriodSeconds\` set appropriately

### 5. Organization
- [ ] Recommended labels applied (\`app.kubernetes.io/*\`)
- [ ] Resources are namespaced (not in default namespace)
- [ ] Network policies exist for the namespace

### 6. Secrets
- [ ] No plaintext secrets in manifests or ConfigMaps
- [ ] Secrets mounted as volumes (not env vars) where possible
- [ ] External secret manager integration configured

## Output Format
Report each finding with severity (CRITICAL / WARNING / INFO) and specific remediation.
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'node -e "const f=process.argv[1]||\'\';if(!/\\.ya?ml$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(!/kind:\\s*(Deployment|StatefulSet|DaemonSet|Job|CronJob|Pod)/.test(c))process.exit(0);const issues=[];if(!/resources:/.test(c))issues.push(\'Missing resource requests/limits\');if(/kind:\\s*(Deployment|StatefulSet|DaemonSet)/.test(c)){if(!/livenessProbe:/.test(c))issues.push(\'Missing livenessProbe\');if(!/readinessProbe:/.test(c))issues.push(\'Missing readinessProbe\')}if(!/runAsNonRoot:\\s*true/.test(c))issues.push(\'Missing runAsNonRoot: true in securityContext\');if(/:latest/.test(c))issues.push(\'Using :latest image tag — pin a specific version\');if(issues.length)console.log(\'\\u26a0\\ufe0f K8s manifest issues in \'+f+\':\\n  - \'+issues.join(\'\\n  - \'))" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Bash',
        hooks: [
          {
            type: 'command' as const,
            command:
              'echo "$CLAUDE_TOOL_INPUT" | grep -qE "kubectl\\s+(delete|drain|cordon|taint)\\s" && echo "HOOK_EXIT:0:Warning: destructive kubectl command detected (delete/drain/cordon/taint) — verify target namespace and resource" || true',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
