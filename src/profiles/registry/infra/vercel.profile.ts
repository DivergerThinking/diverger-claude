import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const vercelProfile: Profile = {
  id: 'infra/vercel',
  name: 'Vercel',
  layer: PROFILE_LAYERS.INFRA,
  technologyIds: ['vercel'],
  contributions: {
    claudeMd: [
      {
        heading: 'Vercel Conventions',
        order: 40,
        content: `## Vercel Conventions

Edge-first deployment. Serverless/edge functions, environment-based configuration.

**Detailed rules:** see \`.claude/rules/vercel/\` directory.

**Key rules:**
- Use \`vercel.json\` for rewrites, headers, and function configuration
- Environment variables via Vercel dashboard — never commit secrets
- Edge Functions for low-latency, Serverless Functions for compute-heavy tasks
- Preview deployments for every PR — use \`VERCEL_ENV\` to detect environment`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(vercel:*)',
          'Bash(vercel dev:*)',
          'Bash(vercel env:*)',
          'Bash(vercel deploy:*)',
          'Bash(vercel ls:*)',
          'Bash(vercel inspect:*)',
          'Bash(vercel logs:*)',
          'Bash(vercel link:*)',
          'Bash(vercel build:*)',
          'Bash(vercel promote:*)',
          'Bash(vercel rollback:*)',
          'Bash(vercel certs:*)',
          'Bash(vercel dns:*)',
          'Bash(vercel domains:*)',
          'Bash(vercel project:*)',
          'Bash(vercel pull:*)',
          'Bash(vercel whoami:*)',
          'Bash(npx vercel:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/vercel-deployment-conventions.md',
        governance: 'mandatory',
        paths: ['vercel.json', 'api/**/*', '.vercel/**/*'],
        description: 'Vercel deployment configuration, functions, routing, and caching best practices',
        content: `# Vercel Deployment Conventions

## Project Configuration (vercel.json)
- Always include \`$schema\` reference for IDE autocomplete
- Set \`framework\` to match the actual project framework
- Configure \`regions\` to match your data source location (default: \`iad1\`)
- Configure \`functions\` with appropriate \`memory\` and \`maxDuration\`
- Add security headers: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- Configure rewrites, redirects, and crons as needed

## Function Design
- Use Web Standard Request/Response APIs
- Include proper error handling with appropriate HTTP status codes
- Set \`Cache-Control\` headers on all API responses
- Never hardcode secrets in function code — use environment variables
- Set \`Content-Type\` headers on all responses

## Edge Functions
- **Use for**: auth/session validation, geolocation routing, A/B testing, bot detection, header manipulation
- **Do NOT use for**: heavy computation, Node.js-specific APIs (fs, child_process), persistent TCP connections, long-running tasks
- Configure middleware matchers to be specific — avoid matching all routes

## Caching Strategy
- Static data: \`s-maxage=86400, stale-while-revalidate=604800\`
- Dynamic data: \`s-maxage=60, stale-while-revalidate=300\`
- User-specific data: \`private, no-store\`
- Use ISR with \`revalidate\` for pages that change periodically
- Only use \`immutable\` for versioned static assets with content hashes

## Region Configuration
- Set \`regions\` to match your data source location for minimal latency
- Use \`functionFailoverRegions\` for HA on critical functions
- Edge Functions run globally — no region config needed
`,
      },
      {
        path: 'infra/vercel-security.md',
        governance: 'mandatory',
        paths: ['vercel.json', 'api/**/*', '.vercel/**/*'],
        description: 'Vercel security: environment variables, headers, deployment protection, and secrets management',
        content: `# Vercel Security Best Practices

## Environment Variable Security
- Store all secrets in Vercel Environment Variables with appropriate scope (Development, Preview, Production)
- Use \`NEXT_PUBLIC_\` prefix ONLY for values safe to expose to the browser (analytics IDs, public API URLs)
- NEVER use \`NEXT_PUBLIC_\` on secret values — they are exposed in the client bundle
- Use Sensitive Environment Variables to mask values from logs and dashboard
- Rotate secrets regularly; use different values per environment
- Never commit \`.env\` files with real values to Git

## Security Headers (MANDATORY)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: restrict unnecessary browser APIs
- Content-Security-Policy: configure per app needs (default-src 'self' as baseline)

## Deployment Protection
- Enable Deployment Protection for preview environments
- Use Vercel Authentication or password protection for staging
- Configure Trusted IPs to restrict preview access by IP range
- Use \`x-vercel-protection-bypass\` only for automated testing (CI/CD)

## API Route Security
- All mutating routes (POST, PUT, DELETE) MUST have authentication and authorization
- Validate all request parameters and body
- Implement rate limiting for public-facing API routes
- Verify \`CRON_SECRET\` on cron job endpoints
- Never leak sensitive data in error responses

## CORS Configuration
- Set \`Access-Control-Allow-Origin\` to specific domain — never \`*\` on authenticated endpoints
- Configure allowed methods, headers, and max-age per API route group
`,
      },
      {
        path: 'infra/vercel-function-patterns.md',
        governance: 'recommended',
        paths: ['vercel.json', 'api/**/*', '.vercel/**/*'],
        description: 'Vercel function patterns: streaming, Edge Config, cron jobs, and performance optimization',
        content: `# Vercel Function Patterns

## Streaming Responses
- Use \`ReadableStream\` for AI responses, large data sets, and real-time updates
- Set \`Content-Type: text/event-stream\` for SSE patterns
- Use \`TextEncoder\` to encode chunks

## Edge Config for Feature Flags
- Use \`@vercel/edge-config\` for low-latency feature flags and A/B testing
- Read config in middleware for maintenance mode, beta features, IP blocking
- Edge Config reads are globally fast (no cold start)

## Background Work with waitUntil
- Use \`waitUntil()\` from \`@vercel/functions\` for tasks that should not block the response
- Send response immediately, then run analytics, notifications, and logging in background
- Do NOT extend \`maxDuration\` for background tasks — use \`waitUntil()\` instead

## Cron Job Functions
- Verify requests are from Vercel Cron using \`CRON_SECRET\` authorization header
- Configure schedules in vercel.json \`crons\` array
- Return structured JSON responses with status information

## Cold Start Minimization
- Keep function bundles small — tree-shake unused imports
- Use dynamic imports for heavy dependencies not always needed
- Enable fluid compute for I/O-bound functions
- Place functions in the region closest to your data source

## Memory and Duration
- Start with default memory (1024 MB), increase only if needed
- Set \`maxDuration\` to the minimum necessary — prevents runaway costs
- Monitor execution times in Vercel Observability

## Connection Management
- Never create DB connections inside the request handler — use module-level singletons
- Use connection pooling (PgBouncer, Prisma Accelerate, Neon serverless driver)
- Design functions as stateless — no shared mutable state between invocations
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Vercel-Specific Review

**Available skill:** \`vercel-scaffold\` — use when generating new Vercel configurations.

### Configuration
- Check vercel.json for proper $schema reference and valid configuration properties
- Verify framework preset matches the actual project framework
- Verify security headers are configured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Check routing rules (rewrites, redirects) for correctness and no conflicts
- Verify function configuration: appropriate memory, maxDuration, and regions

### Functions
- Verify functions use Web Standard Request/Response APIs
- Check that functions include proper error handling with appropriate HTTP status codes
- Verify Cache-Control headers are set on API responses (s-maxage, stale-while-revalidate)
- Check Edge Function usage for runtime API compatibility (no Node.js APIs in edge runtime)
- Verify middleware matcher patterns are specific — avoid matching all routes unnecessarily
- Check for proper use of waitUntil() for background work instead of blocking responses

### Environment Variables
- Verify no secrets are hardcoded in source code or committed in .env files
- Check that NEXT_PUBLIC_ prefix is only used for truly public values
- Verify server-only env vars are not accessed in client components

### Performance
- Check for proper ISR configuration with appropriate revalidate intervals
- Verify images use Vercel Image Optimization or next/image
- Check for unnecessary server-side rendering where static generation would suffice
- Verify function regions are configured close to the data source`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Vercel Security Review

**Available skill:** \`vercel-scaffold\` — use when generating secure Vercel configurations from scratch.

### Environment Variables and Secrets
- Verify no secrets committed in source code, vercel.json, or .env files
- Check for NEXT_PUBLIC_ prefix on secret values — these are exposed to the browser
- Verify sensitive environment variables are scoped to appropriate environments (dev/preview/prod)
- Check for hardcoded API keys, tokens, or connection strings in function code

### Headers and CORS
- Verify Content-Security-Policy header is configured and appropriately restrictive
- Check that HSTS is enabled with adequate max-age (minimum 1 year recommended)
- Verify CORS configuration does not use wildcard (*) origin on authenticated endpoints
- Check for X-Frame-Options to prevent clickjacking
- Verify Permissions-Policy restricts unnecessary browser APIs

### API Routes
- Verify all mutating API routes (POST, PUT, DELETE) have authentication and authorization
- Check for input validation on all request parameters and body
- Verify rate limiting is implemented for public-facing API routes
- Check cron job endpoints for proper CRON_SECRET verification
- Verify no sensitive data is leaked in API error responses

### Deployment Security
- Check that deployment protection is enabled for preview environments
- Verify no sensitive data is exposed in build logs or function logs
- Check that preview deployments do not use production secrets
- Verify protection bypass secrets are not committed to source code`,
      },
      {
        name: 'doc-writer',
        type: 'enrich',
        prompt: `## Vercel Documentation Standards

**Available skill:** \`vercel-scaffold\` — use when scaffolding documented Vercel projects.

### Deployment Documentation
- Document the deployment pipeline: Git push → Preview → Production promotion flow
- List all required environment variables with descriptions (never include actual values)
- Document vercel.json configuration and the purpose of each routing rule, header, and redirect
- Document which regions functions are deployed to and why

### Function Documentation
- Document each API route: HTTP method, request/response format, authentication requirements
- Document cron jobs: schedule, purpose, expected execution time, and failure handling
- Document middleware logic: what routes it matches, what decisions it makes
- Document Edge Config keys and their purpose, expected values, and who can update them

### Onboarding Guide
- Document how to set up local development with \`vercel dev\` and \`vercel env pull\`
- Document how to create and manage preview deployments
- Document the process for promoting a preview deployment to production
- Provide a .env.example file with all required environment variables and placeholder values`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Vercel Migration Assistance

**Available skill:** \`vercel-scaffold\` — use when generating Vercel configs for migrated projects.

### Framework Migration
- When migrating frameworks (e.g., Pages Router to App Router), update vercel.json function paths
- Update API route signatures to Web Standard Request/Response format
- Migrate environment variable prefixes if switching frameworks (NEXT_PUBLIC_ is Next.js-specific)
- Update middleware configuration for new framework patterns

### Function Runtime Migration
- Migrate from legacy serverless function signatures to Web Standard fetch/Request/Response
- Migrate from \`export default function handler(req, res)\` to \`export function GET(request)\`
- Update Edge Functions to use @vercel/functions helpers instead of deprecated context parameter
- Migrate from inline function config to vercel.json centralized configuration

### Build Configuration Migration
- Migrate from vercel.json v1/v2 to current schema with $schema reference
- Migrate from deprecated \`routes\` array to \`rewrites\`, \`redirects\`, and \`headers\` objects
- Update deprecated build configuration properties to current equivalents
- Migrate from docker/custom builders to framework-native build commands`,
      },
    ],
    skills: [
      {
        name: 'vercel-scaffold',
        description: 'Generate production-ready Vercel configuration for a project',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Vercel Scaffold

Generate a complete, production-ready Vercel configuration including:

## 1. vercel.json Configuration

Generate a vercel.json with:
- \`$schema\` reference for IDE autocomplete
- Framework preset matching the project
- Function configuration (memory, maxDuration, regions)
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Routing rules (rewrites for SPA fallback, redirects for URL migration)
- Cron jobs if the project has scheduled tasks
- Image optimization configuration if the project serves images

Template:
\`\`\`json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "<detected-framework>",
  "regions": ["<nearest-region-to-data-source>"],
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
\`\`\`

## 2. Environment Variables Template

Generate a .env.example with:
- All required environment variables with descriptions
- Placeholder values (never real secrets)
- Comments explaining which are required vs optional
- Notes on which need NEXT_PUBLIC_ prefix (if Next.js)

## 3. Middleware Template (if applicable)

Generate middleware.ts with:
- Authentication check patterns
- Route matcher configuration
- Geolocation-based routing (if needed)

## 4. API Route Template

Generate a sample API route using Web Standard APIs:
- Proper Request/Response handling
- Error handling with appropriate status codes
- Cache-Control headers
- TypeScript types for request/response payloads
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/vercel\\.json$/.test(f)&&!/vercel\\.ts$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/\\.json$/.test(f)){try{const j=JSON.parse(c);if(!j.headers||!j.headers.some(h=>h.headers&&h.headers.some(hh=>hh.key===\'Strict-Transport-Security\')))issues.push(\'WARNING: No HSTS header configured in vercel.json — add Strict-Transport-Security\');if(!j.headers||!j.headers.some(h=>h.headers&&h.headers.some(hh=>hh.key===\'X-Content-Type-Options\')))issues.push(\'WARNING: No X-Content-Type-Options header — add nosniff\');if(!j.headers||!j.headers.some(h=>h.headers&&h.headers.some(hh=>hh.key===\'X-Frame-Options\')))issues.push(\'WARNING: No X-Frame-Options header — add DENY or SAMEORIGIN\');if(j.functions){for(const[p,cfg]of Object.entries(j.functions)){if(cfg.maxDuration&&cfg.maxDuration>60)issues.push(\'INFO: Function \'+p+\' has maxDuration>\'+cfg.maxDuration+\'s — verify this is intentional\')}}if(!j.regions)issues.push(\'INFO: No regions configured — functions default to iad1 (Washington D.C.)\');}catch(e){issues.push(\'CRITICAL: Invalid JSON in vercel config file\')}}issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/middleware\\.(ts|js)$/.test(f)&&!/api\\//.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/NEXT_PUBLIC_.*(?:SECRET|KEY|TOKEN|PASSWORD)/i.test(c))issues.push(\'CRITICAL: NEXT_PUBLIC_ prefix on a secret variable — this value is exposed to the browser\');if(/[\"\\x27](sk-|ghp_|gho_|AKIA|AIza)[a-zA-Z0-9]/.test(c))issues.push(\'CRITICAL: Potential hardcoded API key detected in function code\');if(/headers\\.get\\([\"\\x27]authorization/.test(c)===false&&/api\\//.test(f)&&/(POST|PUT|DELETE|PATCH)/.test(c))issues.push(\'INFO: Mutating API route without apparent authorization check — verify authentication is handled\');issues.forEach(i=>console.log(i))" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
