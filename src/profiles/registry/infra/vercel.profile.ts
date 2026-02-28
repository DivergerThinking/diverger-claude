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

- Configure deployments in \`vercel.json\` for custom routing, headers, and redirects
- Use Edge Functions for latency-sensitive endpoints requiring global distribution
- Manage environment variables through Vercel dashboard or CLI - never commit secrets
- Use preview deployments for pull request review and testing
- Configure build settings and framework presets in project settings
- Use Vercel's built-in analytics and speed insights for performance monitoring
- Leverage ISR (Incremental Static Regeneration) for data-driven static pages
- Use \`middleware.ts\` for request-level logic (auth, redirects, rewrites)
- Configure caching headers appropriately for static and dynamic content
- Use Vercel Cron Jobs for scheduled serverless function execution`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(vercel:*)',
          'Bash(npx vercel:*)',
          'Bash(vc:*)',
        ],
      },
    },
    rules: [
      {
        path: 'infra/vercel-conventions.md',
        governance: 'mandatory',
        description: 'Vercel deployment conventions and best practices',
        content: `# Vercel Conventions

## Deployment Configuration
- Use \`vercel.json\` for project-level configuration
- Configure framework preset to match your project (Next.js, Vite, etc.)
- Set appropriate build commands and output directories
- Use \`rewrites\` for clean URLs and API proxying
- Configure \`headers\` for security headers (CSP, HSTS, X-Frame-Options)
- Use \`redirects\` for URL migration and canonical URLs
- Set \`regions\` to control function deployment regions

## Edge Functions
- Use Edge Functions for middleware, authentication, and geolocation
- Keep Edge Functions lightweight - limited runtime APIs available
- Use Edge Config for low-latency key-value data at the edge
- Handle errors gracefully - edge functions must respond quickly
- Use \`export const runtime = 'edge'\` in route handlers for edge deployment
- Be aware of Edge Runtime limitations (no Node.js APIs like \`fs\`, \`child_process\`)

## Environment Variables
- Store sensitive values (API keys, tokens) in Vercel Environment Variables
- Use separate values for Development, Preview, and Production environments
- Use \`NEXT_PUBLIC_\` prefix only for client-side variables (Next.js)
- Never commit \`.env.local\` or \`.env.production\` files with real values
- Use Vercel CLI (\`vercel env pull\`) to sync environment variables locally
- Document required environment variables in \`.env.example\`

## Performance
- Leverage automatic static optimization for eligible pages
- Use ISR for pages with dynamic data that can be cached
- Configure appropriate \`Cache-Control\` headers for API routes
- Use Vercel's Image Optimization for responsive images
- Monitor performance with Vercel Speed Insights and Analytics
- Use \`next/dynamic\` or lazy loading for code splitting
`,
      },
      {
        path: 'infra/vercel-security.md',
        governance: 'recommended',
        description: 'Vercel security best practices',
        content: `# Vercel Security

## Authentication and Authorization
- Use middleware for authentication checks at the edge
- Protect API routes with proper authentication
- Use Vercel's deployment protection for preview environments
- Configure password protection or Vercel Authentication for staging

## Headers
- Set Content-Security-Policy headers to prevent XSS
- Enable HSTS for HTTPS enforcement
- Set X-Frame-Options to prevent clickjacking
- Configure CORS headers for API routes

## Secrets Management
- Use Vercel Environment Variables for all secrets
- Rotate secrets regularly
- Use different secrets per environment (dev, preview, production)
- Audit environment variable access through Vercel dashboard
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Vercel-Specific Review
- Check vercel.json configuration for proper routing and headers
- Verify environment variables are not hardcoded in source code
- Check Edge Function usage for runtime API compatibility
- Verify proper caching configuration for static and dynamic content
- Check middleware for performance impact on request latency
- Verify security headers are configured
- Check for proper use of ISR and static optimization`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Vercel Security Review
- Verify no secrets committed in source code or vercel.json
- Check for proper Content-Security-Policy headers
- Verify API routes have authentication and authorization
- Check for exposed environment variables in client-side code
- Verify deployment protection is enabled for preview environments
- Check CORS configuration on API routes`,
      },
    ],
  },
};
