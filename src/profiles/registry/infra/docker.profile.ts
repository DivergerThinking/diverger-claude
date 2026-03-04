import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const dockerProfile: Profile = {
  id: 'infra/docker',
  name: 'Docker',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['docker'],
  contributions: {
    claudeMd: [
      {
        heading: 'Docker Conventions',
        order: 40,
        content: `## Docker Conventions

Multi-stage builds, minimal images, security-first container design.

**Detailed rules:** see \`.claude/rules/docker/\` directory.

**Key rules:**
- Multi-stage builds: separate build and runtime stages, copy only artifacts
- Use specific base image tags (not \`latest\`), prefer distroless or Alpine
- Non-root user (\`USER\`) in production, read-only filesystem where possible
- \`.dockerignore\` to exclude \`node_modules\`, \`.git\`, secrets from build context`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(docker:*)',
          'Bash(docker compose:*)',
          'Bash(docker build:*)',
          'Bash(docker run:*)',
          'Bash(docker exec:*)',
          'Bash(docker logs:*)',
          'Bash(docker ps:*)',
          'Bash(docker images:*)',
          'Bash(docker scout:*)',
          'Bash(docker buildx:*)',
          'Bash(DOCKER_BUILDKIT=1 docker:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/dockerfile-best-practices.md',
        governance: 'mandatory',
        paths: ['Dockerfile*', 'docker-compose*.yml', '.dockerignore'],
        description: 'Dockerfile construction, multi-stage builds, layer caching, and image optimization',
        content: `# Dockerfile Best Practices

## Multi-Stage Builds
- Every production Dockerfile MUST use multi-stage builds
- Separate build-time dependencies from runtime image
- Copy only artifacts needed at runtime with \`COPY --from=builder\`
- Use \`--chown=app:app\` on COPY to set correct ownership

## Layer Caching
- Order instructions from least-changing to most-changing
- Copy dependency manifests (package.json, go.mod) BEFORE source code
- Install dependencies in a separate layer from source code copy
- Use BuildKit cache mounts for package manager caches: \`--mount=type=cache\`

## Instruction Best Practices
- **FROM**: Pin to specific tag (\`node:20.11-alpine3.19\`), never use \`:latest\`
- **RUN**: Combine related commands with \`&&\`, clean caches in the same layer
- **COPY vs ADD**: Use COPY for all local files — ADD only for tar extraction
- **CMD vs ENTRYPOINT**: ENTRYPOINT for executable, CMD for default args; prefer exec form
- **USER**: Set non-root user after installing packages, before COPY of app code
- **HEALTHCHECK**: Always define for production images with appropriate intervals

## .dockerignore
- Always create a \`.dockerignore\` to minimize build context
- Exclude: \`.git\`, \`node_modules\`, \`__pycache__\`, \`.venv\`, \`.env\`, \`.env.*\`
- Exclude: \`dist\`, \`build\`, IDE configs, test files, Docker files themselves
- A large build context slows every build, even cached ones
`,
      },
      {
        path: 'infra/docker-security.md',
        governance: 'mandatory',
        paths: ['Dockerfile*', 'docker-compose*.yml', '.dockerignore'],
        description: 'Docker container security hardening and secret management',
        content: `# Docker Security

## Non-Root Execution (MANDATORY)
- Every production container MUST run as a non-root user
- Create a dedicated system user before COPY of app code
- Alpine: \`addgroup -S app && adduser -S app -G app\`
- Debian: \`groupadd -r app && useradd -r -g app -s /sbin/nologin app\`
- Set \`USER app\` after system package installs

## Secret Management
- Use BuildKit secrets for build-time credentials: \`--mount=type=secret,id=...\`
- Runtime: use Docker secrets, \`env_file\` in Compose, or volume-mounted secret files
- NEVER use \`ENV\` or \`ARG\` for secrets — they persist in image layer metadata
- NEVER COPY credential files into the image

## Image Hardening
- Use minimal base images: Alpine, slim, distroless, or scratch
- Drop all capabilities (\`cap_drop: ALL\`), add only needed ones
- Set \`no-new-privileges:true\` in security_opt
- Use \`read_only: true\` with explicit \`tmpfs\` for writable directories
- Run \`docker scout cves\` or \`trivy image\` in CI — fail on critical CVEs
- Rebuild images regularly for base image security patches

## Compose Security
- Never use \`privileged: true\` unless required with documented justification
- Use internal networks for backend services not needing external access
- Set resource limits (memory, CPU) to prevent exhaustion attacks
- Use \`env_file\` for secrets, add \`.env\` to \`.gitignore\`
`,
      },
      {
        path: 'infra/docker-compose-patterns.md',
        governance: 'recommended',
        paths: ['Dockerfile*', 'docker-compose*.yml', '.dockerignore'],
        description: 'Docker Compose service orchestration, networking, and development workflow patterns',
        content: `# Docker Compose Patterns

## Service Definition
- Define health checks for every service using \`healthcheck:\`
- Use \`depends_on\` with \`condition: service_healthy\` (not just service name)
- Set resource limits: \`deploy.resources.limits\` for memory and CPUs
- Use \`restart: unless-stopped\` for production services
- Use named volumes for persistent data (not bind mounts in production)
- Use \`env_file\` for secrets instead of inline environment values

## Override Files
- \`compose.override.yaml\` auto-loads for local dev — add volumes, dev commands, debug ports
- Use \`docker compose -f compose.yaml -f compose.prod.yaml up\` for production overrides

## Profiles for Optional Services
- Use \`profiles: ["debug"]\` for optional services (debug tools, monitoring)
- Start with \`docker compose --profile debug up\`
- Default services (no profile) always start

## Extension Fields for DRY Config
- Define shared config with \`x-common: &common\` and merge with \`<<: *common\`
- Common fields: restart policy, logging driver, resource limits

## Networking
- Use separate networks for frontend and backend isolation
- Set \`internal: true\` on backend networks to prevent external access
- Never expose database/cache ports to the host in production
- Connect services only to the networks they need
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Docker-Specific Review

**Available skill:** \`docker-scaffold\` — use when generating new Docker configurations.

### Dockerfile Quality
- Verify multi-stage builds are used to separate build dependencies from runtime
- Check layer ordering: dependency manifests copied BEFORE source code
- Verify base image tags are pinned to specific versions (no \`latest\`, no untagged)
- Check that \`COPY\` is used instead of \`ADD\` (unless extracting archives)
- Verify RUN commands are combined with \`&&\` to reduce layer count
- Check for proper layer cleanup (rm -rf caches in the same RUN layer)
- Verify \`HEALTHCHECK\` is defined for production images
- Check that \`WORKDIR\` is set before COPY/RUN instructions

### Security
- Verify containers run as non-root user (\`USER\` directive present)
- Check that no secrets are embedded via \`ENV\`, \`ARG\`, or \`COPY\` of credential files
- Verify BuildKit secrets (\`--mount=type=secret\`) are used for build-time credentials
- Check that \`.dockerignore\` excludes .env, .git, node_modules, and test files
- Verify images use minimal base images (alpine, slim, distroless, or scratch)
- Check for \`privileged: true\` or unnecessary capabilities in Compose files

### Compose Quality
- Verify health checks are defined for all services
- Check that \`depends_on\` uses \`condition: service_healthy\` not just service name
- Verify named volumes are used for persistent data (not bind mounts in production)
- Check that resource limits are configured (memory, CPU)
- Verify secrets are loaded via \`env_file\`, not inline in compose.yaml
- Check for proper network isolation (internal networks for backend services)`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Docker Security Review

**Available skill:** \`docker-scaffold\` — use when generating secure Docker configurations from scratch.

### Image Security
- Verify all images run as non-root user (\`USER\` directive after \`RUN adduser\`)
- Check for secrets in Dockerfile: \`ENV\` with passwords, \`ARG\` with tokens, \`COPY\` of .env or credential files
- Verify base images are from trusted registries (Docker Hub official, verified publishers, or private registry)
- Check that base image tags are pinned to specific versions and digests for critical deployments
- Verify image vulnerability scanning is integrated in CI pipeline (docker scout, Trivy, Snyk)
- Check that no unnecessary packages or tools are installed in the production image

### Runtime Security
- Check for \`privileged: true\` — CRITICAL: almost never needed, provides full host access
- Verify \`no-new-privileges:true\` is set in security_opt
- Check that capabilities are dropped (\`cap_drop: ALL\`) and only needed ones added back
- Verify read-only root filesystem is used (\`read_only: true\`) with explicit tmpfs for writable dirs
- Check for \`network_mode: host\` — avoid in production, breaks network isolation
- Verify resource limits are set to prevent denial-of-service via resource exhaustion

### Secret Management
- Check that .env files are listed in .gitignore
- Verify no secrets are hardcoded in compose.yaml environment section
- Check that BuildKit secrets (\`--mount=type=secret\`) are used for build-time credentials
- Verify runtime secrets use proper mechanisms (Docker secrets, env_file, volume-mounted secret files)
- Check for sensitive data in Docker image layers: run \`docker history\` to verify no secrets persist

### Network Security
- Verify backend services use internal networks (\`internal: true\`)
- Check that only necessary ports are exposed to the host
- Verify no database or cache ports are exposed externally in production
- Check for DNS rebinding risks with container hostname configuration`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Docker Documentation Standards

**Available skill:** \`docker-scaffold\` — use when scaffolding new Docker projects with documentation.

### README Docker Section
- Document how to build the Docker image: exact \`docker build\` command with any required build args
- Document how to run the container: \`docker run\` or \`docker compose up\` with required env vars
- List all required environment variables with descriptions (but never include actual values)
- Document all exposed ports and their purposes
- Include health check endpoint documentation

### Dockerfile Comments
- Add a comment at the top of each stage explaining its purpose
- Document non-obvious RUN commands (why specific flags, why specific package versions)
- Document HEALTHCHECK parameters (why specific intervals, timeouts)

### Compose Documentation
- Document the purpose of each service in the compose file
- Explain profile groups and when to use them
- Document volume mount purposes and persistence expectations
- List environment variable files needed and provide a \`.env.example\` template`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Docker Migration Assistance

**Available skill:** \`docker-scaffold\` — use when generating Docker configs for migrated projects.

### Compose V1 to V2 Migration
- Replace \`docker-compose\` CLI with \`docker compose\` (built-in plugin)
- Rename \`docker-compose.yml\` to \`compose.yaml\` (V2 convention)
- Remove \`version:\` key from compose files (no longer required in V2)
- Replace \`depends_on\` array with condition-based syntax (\`service_healthy\`, \`service_started\`)
- Migrate \`links:\` to user-defined networks (links are legacy)

### Image Base Migration
- Migrate from full OS images to slim/alpine/distroless variants
- Migrate from single-stage to multi-stage builds
- Migrate from docker-compose V1 override patterns to V2 profiles
- Migrate hardcoded secrets to BuildKit secrets or runtime injection
- Migrate \`ADD\` instructions to \`COPY\` where archive extraction is not needed`,
      },
    ],
    skills: [
      {
        name: 'docker-security-guide',
        description: 'Detailed reference for Docker security: non-root users, multi-stage minimal images, secrets management, read-only filesystems, resource limits, image scanning, network isolation',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Docker Security — Detailed Reference

## Non-Root Users (USER Directive)
Every production container MUST run as a non-root user. Running as root inside a container
means an escape exploit grants host-level root. Create a dedicated system user early in the
Dockerfile and switch to it before copying application code.

### Correct Pattern
\\\`\\\`\\\`dockerfile
FROM node:20-alpine AS runtime
WORKDIR /app

# Create non-root user before copying app code
RUN addgroup -S app && adduser -S app -G app

# Copy artifacts owned by the app user
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

USER app
EXPOSE 3000
CMD ["node", "dist/index.js"]
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`dockerfile
# BAD: No USER directive — container runs as root
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "index.js"]
\\\`\\\`\\\`

## Multi-Stage Builds for Minimal Images
Multi-stage builds separate build-time dependencies (compilers, dev packages) from the
runtime image. The production stage should only contain the binary or compiled output,
not the entire build toolchain.

- Use \`scratch\` or \`distroless\` for Go, Rust binaries
- Use \`alpine\` variants for Node, Python when native modules are needed
- Copy only the exact artifacts needed with \`COPY --from=builder\`
- Never install \`gcc\`, \`make\`, \`git\`, or dev headers in the runtime stage

## Secrets Management
Secrets MUST never be baked into image layers. They persist in layer metadata and can be
extracted with \`docker history\` or by inspecting the image filesystem.

### Correct: BuildKit Secrets
\\\`\\\`\\\`dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Secret is mounted at build time, never stored in a layer
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
COPY . .
RUN npm run build
\\\`\\\`\\\`

Build command: \`DOCKER_BUILDKIT=1 docker build --secret id=npmrc,src=.npmrc .\`

### Anti-Pattern: Secrets in ENV/ARG
\\\`\\\`\\\`dockerfile
# BAD: Secret persists in image layer metadata
ARG NPM_TOKEN
ENV NPM_TOKEN=\${NPM_TOKEN}
RUN echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > .npmrc
\\\`\\\`\\\`

### Runtime Secrets
- Use Docker secrets in Swarm or Compose: \`docker secret create\`
- Use \`env_file\` in Compose — never inline secrets in \`environment:\`
- Mount secret files as volumes at runtime (e.g., \`/run/secrets/db-password\`)

## Read-Only Filesystems
Run containers with a read-only root filesystem to prevent runtime tampering.
Use explicit \`tmpfs\` mounts for directories that need write access.

\\\`\\\`\\\`yaml
services:
  app:
    image: myapp:latest
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    security_opt:
      - no-new-privileges:true
\\\`\\\`\\\`

## Resource Limits
Always set memory and CPU limits to prevent resource exhaustion attacks and noisy neighbors.

\\\`\\\`\\\`yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.25'
\\\`\\\`\\\`

## Image Scanning
Integrate vulnerability scanning into CI/CD. Fail builds on critical or high CVEs.

- **Trivy**: \`trivy image --severity CRITICAL,HIGH --exit-code 1 myapp:latest\`
- **Docker Scout**: \`docker scout cves myapp:latest --only-severity critical,high\`
- Scan on every build, not just releases
- Rebuild images regularly for base image security patches

## Trusted Base Images
- Use Docker Official Images or Verified Publisher images only
- Pin images by digest for critical deployments: \`node:20-alpine@sha256:abc123...\`
- Prefer minimal variants: \`alpine\`, \`slim\`, \`distroless\`, \`scratch\`
- Never use \`:latest\` — it is mutable and unpredictable across environments

## .dockerignore for Security
Prevent sensitive files from entering the build context:

\\\`\\\`\\\`
.env
.env.*
*.pem
*.key
.git
.ssh
credentials.json
\\\`\\\`\\\`

## No Privileged Containers
\`privileged: true\` gives the container almost full host access — equivalent to disabling
all container isolation. It should NEVER be used unless there is a documented, exceptional
reason (e.g., Docker-in-Docker for CI runners).

### Correct: Minimal Capabilities
\\\`\\\`\\\`yaml
services:
  app:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE   # Only if binding to port < 1024
    security_opt:
      - no-new-privileges:true
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`yaml
services:
  app:
    privileged: true        # BAD: full host access
    network_mode: host      # BAD: breaks network isolation
\\\`\\\`\\\`

## Network Isolation
- Use separate Docker networks for frontend and backend tiers
- Mark backend networks as \`internal: true\` to block external access
- Never expose database or cache ports to the host in production
- Connect each service only to the networks it actually needs

\\\`\\\`\\\`yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true    # No external access

services:
  api:
    networks: [frontend, backend]
  db:
    networks: [backend]   # Only reachable from backend
\\\`\\\`\\\`
`,
      },
      {
        name: 'dockerfile-best-practices',
        description: 'Detailed reference for Dockerfile optimization: layer ordering, COPY vs ADD, multi-stage patterns, health checks, ENTRYPOINT vs CMD, BuildKit features, reducing image size',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Dockerfile Best Practices — Detailed Reference

## Layer Ordering for Cache Efficiency
Docker caches each layer and invalidates from the first changed layer downward. Ordering
instructions from least-changing to most-changing maximizes cache hits.

### Correct Order
\\\`\\\`\\\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Copy dependency manifests FIRST (rarely change)
COPY package.json package-lock.json ./

# 2. Install dependencies (cached unless manifests change)
RUN npm ci --production=false

# 3. Copy source code LAST (changes frequently)
COPY . .

# 4. Build
RUN npm run build
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`dockerfile
# BAD: COPY . . before npm install — every source change busts dependency cache
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
\\\`\\\`\\\`

## COPY vs ADD
- **COPY**: Use for ALL local file copies — predictable, no side effects
- **ADD**: Only for two cases: remote URL download, or automatic tar extraction

### Correct
\\\`\\\`\\\`dockerfile
COPY package.json package-lock.json ./
COPY src/ ./src/
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`dockerfile
# BAD: ADD for local files — use COPY instead
ADD package.json ./
ADD src/ ./src/
\\\`\\\`\\\`

## Multi-Stage Patterns by Language

### Go — Static Binary
\\\`\\\`\\\`dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/server ./cmd/server

FROM scratch
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 8080
ENTRYPOINT ["/server"]
\\\`\\\`\\\`

### Node.js — Alpine Runtime
\\\`\\\`\\\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./
USER app
EXPOSE 3000
CMD ["node", "dist/index.js"]
\\\`\\\`\\\`

### Rust — Distroless Runtime
\\\`\\\`\\\`dockerfile
FROM rust:1.77-alpine AS builder
WORKDIR /app
RUN apk add --no-cache musl-dev
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release && rm -rf src
COPY src/ ./src/
RUN cargo build --release

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/target/release/myapp /
EXPOSE 8080
ENTRYPOINT ["/myapp"]
\\\`\\\`\\\`

## Health Checks
Always define a HEALTHCHECK for production images. Docker and orchestrators use it to
determine container readiness and trigger restarts on failure.

### Correct
\\\`\\\`\\\`dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
\\\`\\\`\\\`

- \`--interval\`: Time between checks (30s is a good default)
- \`--timeout\`: Max time for a single check (5s)
- \`--start-period\`: Grace period for container startup (increase for slow-starting apps)
- \`--retries\`: Failures before marking unhealthy (3)

### Prefer wget over curl in Alpine
Alpine images include \`wget\` but not \`curl\` by default. Using \`wget\` avoids installing
an additional package. For distroless or scratch, use a compiled health check binary.

## ENTRYPOINT vs CMD
- **ENTRYPOINT**: Defines the executable — use for single-purpose containers
- **CMD**: Provides default arguments — can be overridden at runtime
- **Combined**: ENTRYPOINT for the binary, CMD for default flags

### Correct: Exec Form
\\\`\\\`\\\`dockerfile
# Exec form: signals are forwarded correctly to PID 1
ENTRYPOINT ["node", "dist/server.js"]
CMD ["--port", "3000"]
\\\`\\\`\\\`

### Anti-Pattern: Shell Form
\\\`\\\`\\\`dockerfile
# BAD: Shell form wraps in /bin/sh -c — signals not forwarded, PID 1 is shell
ENTRYPOINT node dist/server.js
CMD --port 3000
\\\`\\\`\\\`

## BuildKit Features
Enable BuildKit for advanced Dockerfile features: \`DOCKER_BUILDKIT=1 docker build .\`

### Cache Mounts
Speed up package installs by caching the package manager's download cache across builds:

\\\`\\\`\\\`dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=cache,target=/root/.npm npm ci
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
RUN --mount=type=cache,target=/root/.cache/go-build go build ./...
\\\`\\\`\\\`

### Secret Mounts
Access secrets at build time without storing them in layers:

\\\`\\\`\\\`dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
\\\`\\\`\\\`

### Bind Mounts
Mount files from the build context without COPY (useful for large, read-only inputs):

\\\`\\\`\\\`dockerfile
RUN --mount=type=bind,source=data,target=/data process /data
\\\`\\\`\\\`

## .dockerignore Patterns
Reduce build context size and prevent sensitive files from entering the image:

\\\`\\\`\\\`
# VCS
.git
.gitignore

# Dependencies (installed inside container)
node_modules
__pycache__
.venv

# Secrets and env
.env
.env.*
!.env.example
*.pem
*.key

# Build artifacts
dist
build

# IDE and OS
.vscode
.idea
.DS_Store

# Docker meta (avoid recursive inclusion)
Dockerfile*
compose*.yaml
.dockerignore
\\\`\\\`\\\`

## Reducing Image Size
- Start from \`alpine\`, \`slim\`, or \`distroless\` base images
- Combine RUN commands with \`&&\` and clean caches in the SAME layer
- Remove package manager caches: \`rm -rf /var/cache/apk/*\` (Alpine), \`rm -rf /var/lib/apt/lists/*\` (Debian)
- Use \`npm prune --production\` or \`pip install --no-cache-dir\` to skip dev dependencies
- Use \`.dockerignore\` to exclude test files, docs, and IDE configs from build context
- For Go/Rust: produce a static binary and use \`scratch\` or \`distroless\` (as small as 2-5 MB)

## Pinning Versions — Avoid :latest
Using \`:latest\` is mutable — the same tag can point to different images over time, causing
non-reproducible builds and silent breakage.

### Correct
\\\`\\\`\\\`dockerfile
FROM node:20.11-alpine3.19
FROM python:3.12.2-slim-bookworm
FROM golang:1.22.1-alpine3.19
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`dockerfile
FROM node:latest       # BAD: mutable, different image each pull
FROM python            # BAD: no tag at all, defaults to :latest
FROM ubuntu:latest     # BAD: latest is a moving target
\\\`\\\`\\\`

For critical deployments, pin by digest:
\\\`\\\`\\\`dockerfile
FROM node:20.11-alpine3.19@sha256:1a2b3c4d...
\\\`\\\`\\\`
`,
      },
      {
        name: 'docker-scaffold',
        description: 'Generate production-ready Dockerfile and Compose configuration for a project',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Docker Scaffold

Generate a complete, production-ready Docker setup for a project including:

## 1. Dockerfile (multi-stage)

Generate a Dockerfile with these stages:
- **builder** — install dependencies, compile/transpile source
- **test** (optional) — run the test suite
- **runtime** — minimal production image with only runtime artifacts

Template structure:
\`\`\`dockerfile
# Stage 1: Build
FROM <base>:<version>-alpine AS builder
WORKDIR /app
COPY <manifest-files> ./
RUN <install-dependencies>
COPY . .
RUN <build-command>

# Stage 2: Test (optional, use --target=test)
FROM builder AS test
RUN <test-command>

# Stage 3: Production runtime
FROM <base>:<version>-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/<artifacts> ./<artifacts>
USER app
EXPOSE <port>
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD <health-check-command>
CMD [<entrypoint>]
\`\`\`

## 2. compose.yaml

Generate a Compose file with:
- Application service with build context, health check, resource limits, and restart policy
- Database service (if applicable) with named volume and health check
- Cache service (if applicable) with named volume and health check
- Proper networking with internal networks for backend services
- Extension fields for shared configuration (restart, logging)
- env_file references (never inline secrets)

## 3. compose.override.yaml

Generate a development override with:
- Volume mount for hot-reload
- Debug port exposure
- Development-specific environment variables
- Relaxed resource limits

## 4. .dockerignore

Generate a .dockerignore excluding:
- .git, node_modules, __pycache__, .venv
- .env files, IDE configs, OS files
- Test files, documentation, Docker config files themselves

## 5. .env.example

Generate a template with all required environment variables (placeholder values only).
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/Dockerfile/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const lines=c.split(\'\\n\');const issues=[];for(const l of lines){if(/^FROM\\s+/.test(l)){const img=(l.split(/\\s+/)[1]||\'\');if(/:latest/.test(img))issues.push(\'CRITICAL: Uses :latest tag: \'+l.trim());else if(!/:/.test(img)&&!/^scratch$/.test(img)&&!/\\$/.test(img))issues.push(\'WARNING: Untagged base image: \'+l.trim())}}if(!/^USER\\s+/m.test(c)&&!/FROM\\s+scratch/m.test(c))issues.push(\'WARNING: No USER directive — container will run as root\');if(!/HEALTHCHECK/m.test(c)&&!/FROM\\s+scratch/m.test(c))issues.push(\'INFO: No HEALTHCHECK defined — consider adding one for production\');if(/^(ENV|ARG)\\s+.*(PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)/mi.test(c))issues.push(\'CRITICAL: Potential secret in ENV/ARG — use BuildKit secrets instead\');if(/^ADD\\s+(?!https?:)[^*]*\\s/m.test(c)&&!/\\.tar/.test(c))issues.push(\'INFO: ADD used for local file — prefer COPY unless extracting an archive\');issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/compose.*\\.ya?ml$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/privileged:\\s*true/.test(c))issues.push(\'CRITICAL: privileged: true found — almost never needed, provides full host access\');if(/network_mode:\\s*[\"\\x27]?host/.test(c))issues.push(\'WARNING: network_mode: host breaks container network isolation\');if(/(PASSWORD|SECRET|TOKEN|API_KEY)\\s*[:=]\\s*[\"\\x27]?[a-zA-Z0-9]/.test(c)&&!/\\$\\{/.test(c))issues.push(\'WARNING: Possible hardcoded secret — use env_file or Docker secrets\');if(/ports:/.test(c)&&/(5432|3306|6379|27017):[0-9]/.test(c))issues.push(\'INFO: Database/cache port exposed to host — consider using internal networks only\');issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
    externalTools: [
      {
        type: 'dockerignore',
        filePath: '.dockerignore',
        mergeStrategy: 'create-only',
        config: {
          patterns: [
            '# Version control',
            '.git',
            '.gitignore',
            '',
            '# Dependencies (installed inside container)',
            'node_modules',
            '__pycache__',
            '.venv',
            'vendor',
            '',
            '# Build artifacts',
            'dist',
            'build',
            '*.egg-info',
            '',
            '# Environment and secrets',
            '.env',
            '.env.*',
            '!.env.example',
            '',
            '# IDE and OS',
            '.vscode',
            '.idea',
            '.DS_Store',
            'Thumbs.db',
            '',
            '# Testing and documentation',
            'tests',
            '__tests__',
            'coverage',
            '.nyc_output',
            '*.md',
            'LICENSE',
            '',
            '# Docker files (prevent recursive context)',
            'Dockerfile*',
            'compose*.yaml',
            'compose*.yml',
            'docker-compose*.yml',
            '.dockerignore',
            '',
            '# AI/Claude config',
            '.claude',
          ],
        },
      },
    ],
  },
};
