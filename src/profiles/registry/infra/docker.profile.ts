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

## Why This Matters
A well-constructed Dockerfile produces small, secure, reproducible images that build fast
and deploy reliably. Poor Dockerfiles lead to bloated images, slow builds, security
vulnerabilities, and cache invalidation nightmares. These rules follow the official Docker
documentation best practices (docs.docker.com/build/building/best-practices).

---

## Multi-Stage Builds

Every production Dockerfile MUST use multi-stage builds to separate build-time dependencies
from the runtime image.

### Correct — Node.js multi-stage build
\`\`\`dockerfile
# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
\`\`\`

### Correct — Go multi-stage build with scratch
\`\`\`dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

FROM scratch
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 8080
ENTRYPOINT ["/server"]
\`\`\`

### Correct — Python multi-stage build
\`\`\`dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir poetry
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim AS runtime
WORKDIR /app
RUN groupadd -r app && useradd -r -g app app
COPY --from=builder /install /usr/local
COPY --chown=app:app . .
USER app
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

### Anti-Pattern — single stage, fat image
\`\`\`dockerfile
# BAD: build tools, dev dependencies, and source code all in the final image
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/index.js"]
# Problem: image contains devDependencies, TypeScript source, .git, tests
# Results in 1GB+ image instead of ~150MB
\`\`\`

---

## Layer Caching

Dockerfile instructions are cached by Docker's layer system. Maximize cache hits by
ordering instructions from least-changing to most-changing.

### Correct — optimal layer ordering
\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app

# Layer 1: Rarely changes — system dependencies
RUN apk add --no-cache curl

# Layer 2: Changes when dependencies change — manifests first
COPY package.json package-lock.json ./

# Layer 3: Changes when dependencies change — install separately
RUN npm ci --ignore-scripts

# Layer 4: Changes frequently — source code last
COPY . .

RUN npm run build
\`\`\`

### Anti-Pattern — cache-busting order
\`\`\`dockerfile
# BAD: COPY . . before npm install — any source change invalidates dependency cache
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
# Problem: editing a single .ts file forces a full npm install
\`\`\`

### BuildKit Cache Mounts
Use cache mounts to persist package manager caches across builds:
\`\`\`dockerfile
# npm cache mount
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

# pip cache mount
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# Go module cache mount
RUN --mount=type=cache,target=/go/pkg/mod go mod download
\`\`\`

---

## Instruction Best Practices

### FROM
- Always pin to a specific tag: \`FROM node:20.11-alpine3.19\`, never \`FROM node:latest\`
- Use \`AS\` to name stages for clarity and \`--from=\` references

### RUN
- Combine related commands with \`&&\` to reduce layers
- Clean up caches in the same layer to keep image size small
- Use \`set -e\` in shell form commands (or prefer exec form)

\`\`\`dockerfile
# Correct: install + cleanup in one layer
RUN apt-get update && \\
    apt-get install -y --no-install-recommends curl ca-certificates && \\
    rm -rf /var/lib/apt/lists/*

# Anti-pattern: separate layers — cleanup does not reduce image size
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
\`\`\`

### COPY vs ADD
- Use \`COPY\` for all local file copying (explicit, predictable)
- Use \`ADD\` only for: auto-extracting local tar archives, or fetching URLs (rare)
- Never use \`ADD\` for simple file copies

### CMD vs ENTRYPOINT
- Use \`ENTRYPOINT\` for the main executable, \`CMD\` for default arguments
- Prefer exec form \`["executable", "arg"]\` over shell form \`executable arg\`
- Exec form: PID 1, receives signals correctly, no shell overhead
- Shell form: PID 1 is /bin/sh, signals not forwarded to the process

### USER
- Always set a non-root user AFTER installing system packages and BEFORE COPY of app code
- Create a dedicated system user: \`addgroup\`/\`adduser\` on Alpine, \`groupadd\`/\`useradd\` on Debian

### HEALTHCHECK
- Always define HEALTHCHECK for production images
- Use lightweight checks (wget, curl, or a dedicated /health endpoint)
- Configure appropriate intervals, timeouts, and retries

---

## .dockerignore

Always create a \`.dockerignore\` to minimize the build context. A large build context slows
every build, even cached ones.

\`\`\`
# Version control
.git
.gitignore

# Dependencies (installed inside container)
node_modules
__pycache__
.venv

# Build artifacts
dist
build
*.egg-info

# Environment and secrets
.env
.env.*

# IDE and OS
.vscode
.idea
.DS_Store
Thumbs.db

# Testing and docs
tests
__tests__
coverage
.nyc_output
*.md
LICENSE

# Docker files (prevent recursive context)
Dockerfile*
compose*.yaml
.dockerignore

# Claude/AI config
.claude
\`\`\`
`,
      },
      {
        path: 'infra/docker-security.md',
        governance: 'mandatory',
        paths: ['Dockerfile*', 'docker-compose*.yml', '.dockerignore'],
        description: 'Docker container security hardening and secret management',
        content: `# Docker Security

## Why This Matters
Containers share the host kernel — a misconfigured container can expose the host system,
leak secrets, or serve as an attack vector. These rules follow Docker Engine security
documentation (docs.docker.com/engine/security) and CIS Docker Benchmark.

---

## Non-Root Execution (MANDATORY)

Every production container MUST run as a non-root user.

### Correct
\`\`\`dockerfile
# Alpine
RUN addgroup -S app && adduser -S app -G app
COPY --chown=app:app . .
USER app

# Debian/Ubuntu
RUN groupadd -r app && useradd -r -g app -s /sbin/nologin app
COPY --chown=app:app . .
USER app
\`\`\`

### Anti-Pattern
\`\`\`dockerfile
# BAD: no USER directive — container runs as root
FROM node:20-alpine
WORKDIR /app
COPY . .
CMD ["node", "index.js"]
# Problem: if the app has an RCE vulnerability, attacker gets root in the container
\`\`\`

---

## Secret Management

### Build-Time Secrets
\`\`\`dockerfile
# Correct: BuildKit secrets (never persisted in image layers)
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

# Build command:
# docker build --secret id=npmrc,src=$HOME/.npmrc .
\`\`\`

### Runtime Secrets
- Use Docker secrets (Swarm) or orchestrator-managed secrets (Kubernetes)
- Use environment variables via \`env_file\` in Compose (NOT inline in compose.yaml)
- Use volume-mounted secret files at a known path (/run/secrets/)
- Never use \`ENV\` or \`ARG\` for secrets — they persist in image layer metadata

### Anti-Pattern
\`\`\`dockerfile
# BAD: secret in ENV — visible in docker inspect and image history
ENV DATABASE_URL=postgres://user:password@db:5432/mydb

# BAD: secret in ARG — visible in image history
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc && npm ci

# BAD: COPY of credential file
COPY .env /app/.env
\`\`\`

---

## Image Hardening

### Minimal Base Images
| Use Case | Recommended Base |
|----------|------------------|
| Node.js | \`node:20-alpine\` or \`node:20-slim\` |
| Python | \`python:3.12-slim\` |
| Go (static binary) | \`scratch\` or \`gcr.io/distroless/static\` |
| Java | \`eclipse-temurin:21-jre-alpine\` |
| Rust (static binary) | \`scratch\` or \`gcr.io/distroless/static\` |
| General purpose | \`gcr.io/distroless/base-debian12\` |

### Capabilities and Privileges
\`\`\`yaml
# compose.yaml — drop all caps, add only what is needed
services:
  app:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
\`\`\`

### Image Scanning
- Run \`docker scout cves <image>\` or \`trivy image <image>\` in CI before pushing
- Set a vulnerability threshold: fail CI on critical/high CVEs
- Rebuild images regularly to pick up base image security patches
- Use Docker Scout or Snyk to monitor deployed images for new CVEs

---

## Compose Security

- Never use \`privileged: true\` unless absolutely required (and document why)
- Use \`read_only: true\` with explicit \`tmpfs\` mounts for writable directories
- Set \`no-new-privileges:true\` in security_opt to prevent privilege escalation
- Use internal networks for backend services not needing external access
- Set resource limits to prevent resource exhaustion attacks
- Use \`env_file\` for secrets, add \`.env\` to \`.gitignore\`
`,
      },
      {
        path: 'infra/docker-compose-patterns.md',
        governance: 'recommended',
        paths: ['Dockerfile*', 'docker-compose*.yml', '.dockerignore'],
        description: 'Docker Compose service orchestration, networking, and development workflow patterns',
        content: `# Docker Compose Patterns

## Why This Matters
Docker Compose orchestrates multi-service development environments and provides a consistent
interface for local development, testing, and CI. Well-structured Compose files reduce
onboarding friction and prevent environment drift.

---

## Service Definition

### Correct — complete service with health check and resource limits
\`\`\`yaml
# compose.yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: runtime
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
    env_file:
      - .env.db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  pgdata:
  redisdata:
\`\`\`

---

## Override Files for Development

\`\`\`yaml
# compose.override.yaml — automatically loaded for local dev
services:
  api:
    build:
      target: builder
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
    command: ["npm", "run", "dev"]
    ports:
      - "9229:9229"  # Node.js debugger
\`\`\`

Use \`docker compose -f compose.yaml -f compose.prod.yaml up\` for production overrides.

---

## Profiles for Optional Services

\`\`\`yaml
services:
  app:
    # ... always starts

  debug-tools:
    image: nicolaka/netshoot
    profiles: ["debug"]
    network_mode: "service:app"

  monitoring:
    image: prom/prometheus
    profiles: ["monitoring"]
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
\`\`\`

Start optional services with: \`docker compose --profile debug up\`

---

## Extension Fields for DRY Configuration

\`\`\`yaml
x-common: &common
  restart: unless-stopped
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "3"

services:
  api:
    <<: *common
    build: .
    ports: ["3000:3000"]

  worker:
    <<: *common
    build: .
    command: ["node", "dist/worker.js"]
\`\`\`

---

## Networking

### Correct — isolated networks
\`\`\`yaml
services:
  web:
    networks:
      - frontend
      - backend
  api:
    networks:
      - backend
  db:
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true  # no external access
\`\`\`

### Anti-Pattern
\`\`\`yaml
# BAD: all services on default network, database exposed to frontend
services:
  web:
    ports: ["80:80"]
  api:
    ports: ["3000:3000"]
  db:
    ports: ["5432:5432"]  # database port exposed to host
\`\`\`
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
        name: 'docker-scaffold',
        description: 'Generate production-ready Dockerfile and Compose configuration for a project',
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
          command: 'node -e "const f=process.argv[1]||\'\';if(!/Dockerfile/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const lines=c.split(\'\\n\');const issues=[];for(const l of lines){if(/^FROM\\s+/.test(l)){const img=(l.split(/\\s+/)[1]||\'\');if(/:latest/.test(img))issues.push(\'CRITICAL: Uses :latest tag: \'+l.trim());else if(!/:/.test(img)&&!/^scratch$/.test(img)&&!/\\$/.test(img))issues.push(\'WARNING: Untagged base image: \'+l.trim())}}if(!/^USER\\s+/m.test(c)&&!/FROM\\s+scratch/m.test(c))issues.push(\'WARNING: No USER directive — container will run as root\');if(!/HEALTHCHECK/m.test(c)&&!/FROM\\s+scratch/m.test(c))issues.push(\'INFO: No HEALTHCHECK defined — consider adding one for production\');if(/^(ENV|ARG)\\s+.*(PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)/mi.test(c))issues.push(\'CRITICAL: Potential secret in ENV/ARG — use BuildKit secrets instead\');if(/^ADD\\s+(?!https?:)[^*]*\\s/m.test(c)&&!/\\.tar/.test(c))issues.push(\'INFO: ADD used for local file — prefer COPY unless extracting an archive\');issues.forEach(i=>console.log(i))" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'node -e "const f=process.argv[1]||\'\';if(!/compose.*\\.ya?ml$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/privileged:\\s*true/.test(c))issues.push(\'CRITICAL: privileged: true found — almost never needed, provides full host access\');if(/network_mode:\\s*[\"\\x27]?host/.test(c))issues.push(\'WARNING: network_mode: host breaks container network isolation\');if(/(PASSWORD|SECRET|TOKEN|API_KEY)\\s*[:=]\\s*[\"\\x27]?[a-zA-Z0-9]/.test(c)&&!/\\$\\{/.test(c))issues.push(\'WARNING: Possible hardcoded secret — use env_file or Docker secrets\');if(/ports:/.test(c)&&/(5432|3306|6379|27017):[0-9]/.test(c))issues.push(\'INFO: Database/cache port exposed to host — consider using internal networks only\');issues.forEach(i=>console.log(i))" -- "$CLAUDE_FILE_PATH"',
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
