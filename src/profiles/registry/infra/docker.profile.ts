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

- Use multi-stage builds to minimize final image size
- Order Dockerfile instructions to maximize layer caching (least-changing first)
- Run containers as non-root user with \`USER\` directive
- Use specific base image tags, never \`latest\` in production
- Use \`.dockerignore\` to exclude unnecessary files from build context
- Prefer \`COPY\` over \`ADD\` unless extracting archives
- Combine \`RUN\` commands with \`&&\` to reduce layer count
- Use \`HEALTHCHECK\` instructions for container health monitoring
- Use Docker Compose for local multi-service development environments
- Pin dependency versions in Dockerfile for reproducible builds`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(docker:*)',
          'Bash(docker-compose:*)',
          'Bash(docker compose:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/docker-conventions.md',
        governance: 'mandatory',
        description: 'Docker best practices and conventions',
        content: `# Docker Conventions

## Multi-Stage Builds
- Use builder stage for compilation and dependencies
- Copy only necessary artifacts to the final stage
- Use named stages for clarity: \`FROM node:20-alpine AS builder\`
- Minimize final image to runtime dependencies only
- Use \`--from=builder\` to copy artifacts between stages

## Layer Caching
- Copy dependency manifests before source code (\`package.json\` before \`src/\`)
- Install dependencies in a separate layer from source copy
- Order instructions from least to most frequently changing
- Use \`.dockerignore\` to prevent cache invalidation from irrelevant files
- Leverage BuildKit cache mounts for package manager caches

## Security
- Run application as non-root user: \`RUN adduser\` then \`USER appuser\`
- Use minimal base images (\`alpine\`, \`distroless\`, \`slim\` variants)
- Do not store secrets in images - use build secrets or runtime injection
- Scan images for vulnerabilities with \`docker scout\` or equivalent
- Set \`readonly\` root filesystem when possible
- Drop unnecessary Linux capabilities

## Compose Patterns
- Use \`docker-compose.yml\` for local development setup
- Use environment-specific override files: \`docker-compose.override.yml\`
- Define health checks for service dependencies
- Use named volumes for persistent data
- Configure resource limits (\`mem_limit\`, \`cpus\`) for local development
- Use profiles for optional services
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Docker-Specific Review
- Check for multi-stage build usage to minimize image size
- Verify layer ordering for optimal cache utilization
- Check that containers run as non-root user
- Verify no secrets are baked into images
- Check for specific base image version tags (no \`latest\`)
- Verify \`.dockerignore\` excludes unnecessary files
- Check for proper HEALTHCHECK configuration`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Docker Security Review
- Verify images run as non-root user
- Check for secrets in Dockerfile (ENV, ARG, COPY of credential files)
- Verify base images are from trusted registries
- Check for unnecessary capabilities and privileges
- Verify no sensitive data in build context
- Check for image vulnerability scanning in CI pipeline`,
      },
    ],
  },
};
