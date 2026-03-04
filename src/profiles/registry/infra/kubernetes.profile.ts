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

## Resource Requests and Limits
- Every container MUST define \`resources.requests\` and \`resources.limits\` for memory
- CPU requests are mandatory; CPU limits are recommended but may be omitted to avoid throttling
- Set values appropriate to the workload — not placeholder minimums

## Health Checks
- Every long-running container MUST have liveness and readiness probes
- Use startup probes for applications with init times exceeding 10 seconds
- Liveness probes: lightweight, check only the process itself — NOT external dependencies
- Readiness probes: comprehensive, verify the app can serve traffic (DB connected, cache warm)
- Use dedicated endpoints: \`/healthz\` (liveness), \`/readyz\` (readiness)

## Pod Security
- \`runAsNonRoot: true\` and numeric \`runAsUser\` on every pod
- \`readOnlyRootFilesystem: true\` — mount emptyDir for writable temp paths
- \`allowPrivilegeEscalation: false\` on every container
- Drop ALL capabilities (\`drop: ["ALL"]\`) and add back only specific ones needed
- \`seccompProfile.type: RuntimeDefault\` on every pod
- Never use \`privileged: true\` without explicit documented justification

## Workload Types
- Stateless API/web: Deployment + HPA (replicas, PDB, anti-affinity)
- Stateful (database, cache): StatefulSet (volumeClaimTemplates, headless Service)
- Node-level agent: DaemonSet (tolerations, hostNetwork if needed)
- One-off task: Job (backoffLimit, activeDeadlineSeconds)
- Scheduled task: CronJob (schedule, concurrencyPolicy, startingDeadlineSeconds)

## Labels and Organization
- Apply Kubernetes recommended labels on every resource: \`app.kubernetes.io/name\`, \`version\`, \`component\`, \`part-of\`, \`managed-by\`
- Use namespaces consistently — never deploy to the default namespace

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

## Pod Security Admission (PSA)
- Every production namespace MUST enforce at least \`baseline\` Pod Security Standard
- Critical namespaces SHOULD enforce \`restricted\`
- Set labels: \`pod-security.kubernetes.io/enforce\`, \`audit\`, \`warn\`
- Levels: Privileged (kube-system), Baseline (dev/staging), Restricted (production)

## RBAC Rules
- Use namespace-scoped Roles instead of ClusterRoles when possible
- Never grant wildcard verbs (\`*\`) or wildcard resources (\`*\`) in production
- Never add service accounts to \`system:masters\` — it bypasses all RBAC
- Set \`automountServiceAccountToken: false\` on pods that do not need API access
- Create dedicated service accounts per workload — never use the \`default\` SA
- Review and prune RBAC bindings quarterly

## Secrets
- NEVER store secrets in ConfigMaps or plain-text manifests
- Enable encryption at rest for Secrets in etcd
- Use external secret managers (Vault, AWS Secrets Manager) via CSI driver or External Secrets Operator
- Mount secrets as files, not environment variables — env vars leak into process listings and crash dumps
- Rotate secrets regularly; use short-lived tokens when possible
- Never commit secret values to version control — use sealed-secrets or external refs

## Network Policies
- Apply default-deny (Ingress + Egress) in every namespace, then allowlist required traffic
- Allow ingress from Ingress controller to frontend pods
- Allow frontend-to-backend and backend-to-database communication
- Allow egress to external APIs on specific ports only
- Deny all other traffic by default

## Image Security
- Use specific image tags or SHA256 digests — never \`:latest\` in production
- Pull images only from trusted registries — \`imagePullPolicy: IfNotPresent\` with pinned tags
- Scan images for vulnerabilities in CI (Trivy, Grype, Snyk)
- Use minimal base images (distroless, alpine, scratch)
- Sign images and verify with admission controllers (cosign, Kyverno, OPA Gatekeeper)
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
        name: 'k8s-security-guide',
        description: 'Detailed reference for Kubernetes security: PSS, RBAC, NetworkPolicies, Secrets, image policies',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Kubernetes Security — Detailed Reference

## Why This Matters
Kubernetes runs workloads with broad default permissions. Without explicit hardening,
a compromised pod can escalate to cluster-wide access. These rules prevent lateral movement,
privilege escalation, and data exfiltration following CIS Kubernetes Benchmark, NSA/CISA
hardening guidance, and Pod Security Standards.

---

## Pod Security Standards (PSS)

Kubernetes defines three profiles enforced via Pod Security Admission (PSA):

| Level | Use Case | Key Restrictions |
|---|---|---|
| Privileged | kube-system, CNI, storage drivers | None — all features allowed |
| Baseline | Dev/staging, trusted workloads | No hostNetwork, hostPID, privileged containers |
| Restricted | Production, multi-tenant | Non-root, read-only FS, drop ALL caps, seccomp required |

### Correct — Namespace with Restricted enforcement
\`\`\`yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
\`\`\`

### Anti-Pattern — No PSA labels
\`\`\`yaml
# BAD: namespace without PSA enforcement allows privileged pods
apiVersion: v1
kind: Namespace
metadata:
  name: production
  # No pod-security labels — any pod shape is accepted
\`\`\`

---

## SecurityContext — Pod and Container Level

### Correct — Fully hardened pod
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: api
          image: registry.example.com/api:v1.2.3
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
\`\`\`

### Anti-Pattern — Missing security context
\`\`\`yaml
# BAD: no securityContext — runs as root by default
containers:
  - name: api
    image: registry.example.com/api:latest  # also bad: :latest tag
    # No securityContext at all — defaults to root, writable FS, all caps
\`\`\`

---

## RBAC — Least Privilege

### Rules
- Use namespace-scoped \`Role\` instead of \`ClusterRole\` whenever possible
- Never grant wildcard verbs (\`*\`) or wildcard resources (\`*\`) in production
- Never bind to \`system:masters\` — it bypasses ALL RBAC checks
- Create one ServiceAccount per workload — never use the \`default\` SA
- Set \`automountServiceAccountToken: false\` on pods that do not call the K8s API

### Correct — Scoped Role
\`\`\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: configmap-reader
  namespace: app-ns
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch"]
    resourceNames: ["app-config"]  # restrict to specific resources
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: app-ns
automountServiceAccountToken: false  # opt-in at pod level if needed
\`\`\`

### Anti-Pattern — Overly permissive ClusterRole
\`\`\`yaml
# BAD: god-mode permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: super-admin
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]
\`\`\`

---

## NetworkPolicies

### Correct — Default deny + explicit allow
\`\`\`yaml
# Step 1: Default deny all traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: app-ns
spec:
  podSelector: {}
  policyTypes: ["Ingress", "Egress"]
---
# Step 2: Allow only needed ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: app-ns
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8080
          protocol: TCP
\`\`\`

---

## Secrets Management

### Rules
- NEVER store secrets in ConfigMaps or plain manifests committed to git
- Mount secrets as files, not environment variables (env vars leak in logs and core dumps)
- Use external-secrets-operator or sealed-secrets for GitOps workflows
- Rotate secrets regularly; prefer short-lived tokens (e.g., IRSA for AWS)
- Enable encryption at rest for etcd Secrets

### Correct — External Secrets Operator
\`\`\`yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: app-ns
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials
  data:
    - secretKey: password
      remoteRef:
        key: prod/db/password
\`\`\`

---

## Image Policies

### Rules
- Never use \`:latest\` — always pin specific version tags or SHA256 digests
- Set \`imagePullPolicy: IfNotPresent\` with pinned tags (or \`Always\` with digests)
- Pull only from trusted private registries
- Scan images in CI (Trivy, Grype) and block deployments with critical CVEs
- Use minimal base images: distroless, alpine, or scratch
- Sign images (cosign) and verify with admission controllers (Kyverno, OPA Gatekeeper)

### Correct
\`\`\`yaml
containers:
  - name: api
    image: registry.example.com/api@sha256:abc123def456...
    imagePullPolicy: IfNotPresent
\`\`\`

### Anti-Pattern
\`\`\`yaml
containers:
  - name: api
    image: api:latest            # BAD: mutable tag
    imagePullPolicy: Always      # hides the fact that you don't know what version is running
\`\`\`

---

## Resource Limits Preventing DoS
- Always set \`resources.limits.memory\` — prevents a single pod from OOMKilling the node
- Set \`resources.requests\` to guarantee scheduling — prevents starvation
- Use LimitRange per namespace as a safety net for pods that omit resource specs
- Use ResourceQuota per namespace to cap total resource consumption in multi-tenant clusters
`,
      },
      {
        name: 'k8s-debugging-guide',
        description: 'Detailed reference for Kubernetes debugging: kubectl commands, common errors, troubleshooting flows',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Kubernetes Debugging — Detailed Reference

## Why This Matters
Kubernetes abstracts infrastructure behind multiple layers. When things break, you need a
systematic approach to navigate pods, containers, events, and logs. This guide covers the
essential kubectl commands, common failure modes, and a troubleshooting flowchart.

---

## Essential kubectl Commands

### Inspecting Resources
\`\`\`bash
# Describe a resource — shows events, conditions, and full spec
kubectl describe pod <pod-name> -n <namespace>
kubectl describe node <node-name>

# Get resources with extra info
kubectl get pods -n <namespace> -o wide          # shows node, IP
kubectl get pods -n <namespace> -o yaml           # full YAML spec
kubectl get events -n <namespace> --sort-by=.lastTimestamp

# Watch for changes in real time
kubectl get pods -n <namespace> -w
\`\`\`

### Logs
\`\`\`bash
# Current container logs
kubectl logs <pod-name> -n <namespace>

# Logs from a specific container in a multi-container pod
kubectl logs <pod-name> -c <container-name> -n <namespace>

# Previous container logs (after a crash restart)
kubectl logs <pod-name> --previous -n <namespace>

# Follow logs in real time
kubectl logs -f <pod-name> -n <namespace>

# Aggregate logs from all pods matching a label
kubectl logs -l app=api -n <namespace> --all-containers

# Stern — multi-pod log tailing (if installed)
stern api -n <namespace>
\`\`\`

### Interactive Access
\`\`\`bash
# Exec into a running container
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh

# Port-forward to access a service locally
kubectl port-forward svc/<service-name> 8080:80 -n <namespace>

# Copy files to/from a container
kubectl cp <namespace>/<pod-name>:/path/to/file ./local-file
\`\`\`

### Resource Usage
\`\`\`bash
# Node resource usage (requires metrics-server)
kubectl top nodes

# Pod resource usage
kubectl top pods -n <namespace> --sort-by=memory

# Check resource requests vs limits vs actual usage
kubectl describe node <node-name> | grep -A 5 "Allocated resources"
\`\`\`

---

## Common Failure Modes

### CrashLoopBackOff
**Meaning:** Container starts, crashes, K8s restarts it with exponential backoff.

**Diagnosis:**
\`\`\`bash
kubectl describe pod <pod-name> -n <namespace>     # check Exit Code, Reason
kubectl logs <pod-name> --previous -n <namespace>  # logs from last crash
\`\`\`

**Common causes:**
- Application error on startup (missing config, bad connection string)
- Missing environment variable or secret
- Entrypoint/command misconfigured in the container image
- Liveness probe too aggressive — kills the container before it's ready

**Fix:** Check logs from the previous crash. If the app exits immediately, the issue is in application code or configuration, not Kubernetes.

### ImagePullBackOff
**Meaning:** Kubelet cannot pull the container image.

**Diagnosis:**
\`\`\`bash
kubectl describe pod <pod-name> -n <namespace>     # look for "Failed to pull image"
kubectl get events -n <namespace> | grep -i pull
\`\`\`

**Common causes:**
- Image tag does not exist (typo, not pushed)
- Private registry without \`imagePullSecrets\` configured
- Registry rate limit exceeded (Docker Hub)
- Network policy blocking egress to the registry

**Fix:** Verify the image exists (\`docker pull\` locally), check \`imagePullSecrets\`, check node network egress.

### OOMKilled
**Meaning:** Container exceeded its memory limit and was killed by the kernel OOM killer.

**Diagnosis:**
\`\`\`bash
kubectl describe pod <pod-name> -n <namespace>     # look for "OOMKilled" in Last State
kubectl top pods -n <namespace>                    # check current memory usage
\`\`\`

**Common causes:**
- Memory limit set too low for the workload
- Memory leak in the application
- JVM heap not configured to respect container limits (\`-XX:MaxRAMPercentage\`)

**Fix:** Increase \`resources.limits.memory\` or fix the memory leak. For JVM apps, set \`-XX:MaxRAMPercentage=75\`.

### Pending Pods
**Meaning:** Pod cannot be scheduled to any node.

**Diagnosis:**
\`\`\`bash
kubectl describe pod <pod-name> -n <namespace>     # check Events for scheduling errors
kubectl get nodes -o wide                          # check node status
kubectl describe node <node-name>                  # check Allocatable vs Allocated
\`\`\`

**Common causes:**
- Insufficient CPU or memory on available nodes
- Node selector or affinity rules too restrictive
- Taints on nodes without matching tolerations
- PersistentVolumeClaim not bound (wrong StorageClass, no available PVs)

**Fix:** Check node capacity, relax affinity rules, add nodes, or fix PVC bindings.

---

## Readiness and Liveness Probes Debugging

\`\`\`bash
# Check probe configuration and status
kubectl describe pod <pod-name> -n <namespace> | grep -A 10 "Liveness\\|Readiness\\|Startup"

# Check if the probe endpoint responds
kubectl exec <pod-name> -n <namespace> -- wget -qO- http://localhost:8080/healthz
kubectl exec <pod-name> -n <namespace> -- curl -sf http://localhost:8080/readyz
\`\`\`

**Common probe issues:**
- Liveness probe calls external dependencies — if DB is down, all pods restart (cascading failure)
- \`initialDelaySeconds\` too short — probe fires before app finishes starting
- \`timeoutSeconds\` too short — slow responses are treated as failures
- Wrong port or path — returns 404, treated as failure

---

## Ephemeral Debug Containers

For distroless or minimal images with no shell:
\`\`\`bash
# Attach an ephemeral debug container (K8s 1.23+)
kubectl debug -it <pod-name> -n <namespace> --image=busybox --target=<container-name>

# Debug a node directly
kubectl debug node/<node-name> -it --image=ubuntu

# Create a copy of the pod with a debug container
kubectl debug <pod-name> -it --copy-to=debug-pod --container=debugger --image=nicolaka/netshoot
\`\`\`

---

## Useful Tools

| Tool | Purpose |
|---|---|
| \`k9s\` | Terminal UI for cluster navigation, log viewing, shell access |
| \`stern\` | Multi-pod log tailing with color-coded output |
| \`lens\` | GUI IDE for Kubernetes cluster management |
| \`kubectx\` / \`kubens\` | Fast context and namespace switching |
| \`kubectl-neat\` | Clean up \`kubectl get -o yaml\` output (removes managed fields) |
| \`kube-score\` | Static analysis of K8s manifests for best practices |
| \`netshoot\` | Network troubleshooting container (tcpdump, dig, curl, nmap) |

---

## Troubleshooting Flowchart

\`\`\`
Pod not running?
  |
  +-- Status: Pending
  |     +-- Check: kubectl describe pod → Events
  |     +-- Insufficient resources? → Scale nodes or reduce requests
  |     +-- Taint/affinity mismatch? → Fix selectors or add tolerations
  |     +-- PVC unbound? → Check StorageClass and PV availability
  |
  +-- Status: CrashLoopBackOff
  |     +-- Check: kubectl logs --previous
  |     +-- App error? → Fix application code/config
  |     +-- Missing secret/configmap? → Verify mounts exist
  |     +-- Liveness probe too aggressive? → Increase thresholds
  |
  +-- Status: ImagePullBackOff
  |     +-- Check: kubectl describe pod → Events
  |     +-- Image exists? → Verify tag in registry
  |     +-- Auth required? → Add imagePullSecrets
  |     +-- Rate limited? → Use private registry mirror
  |
  +-- Status: Running but not Ready
  |     +-- Check: readiness probe endpoint manually
  |     +-- Dependency down? → Check upstream services
  |     +-- Probe misconfigured? → Verify port, path, thresholds
  |
  +-- Status: Running but OOMKilled restarts
        +-- Check: kubectl describe pod → Last State
        +-- Increase memory limit or fix memory leak
        +-- For JVM: set -XX:MaxRAMPercentage=75
\`\`\`
`,
      },
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.ya?ml$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(!/kind:\\s*(Deployment|StatefulSet|DaemonSet|Job|CronJob|Pod)/.test(c))process.exit(0);const issues=[];if(!/resources:/.test(c))issues.push(\'Missing resource requests/limits\');if(/kind:\\s*(Deployment|StatefulSet|DaemonSet)/.test(c)){if(!/livenessProbe:/.test(c))issues.push(\'Missing livenessProbe\');if(!/readinessProbe:/.test(c))issues.push(\'Missing readinessProbe\')}if(!/runAsNonRoot:\\s*true/.test(c))issues.push(\'Missing runAsNonRoot: true in securityContext\');if(/:latest/.test(c))issues.push(\'Using :latest image tag — pin a specific version\');if(issues.length)console.log(\'\\u26a0\\ufe0f K8s manifest issues in \'+f+\':\\n  - \'+issues.join(\'\\n  - \'))" -- "$FILE_PATH"',
            timeout: 5,
            statusMessage: 'Auditing K8s manifest for resource limits, probes, and security',
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
              'TOOL_CMD=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.command||\'\')}catch{console.log(\'\')}") && echo "$TOOL_CMD" | grep -qE "kubectl\\s+(delete|drain|cordon|taint)\\s" && { echo "Warning: destructive kubectl command detected (delete/drain/cordon/taint) — verify target namespace and resource" >&2; exit 2; } || exit 0',
            timeout: 5,
            statusMessage: 'Checking for destructive kubectl commands',
          },
        ],
      },
    ],
  },
};
