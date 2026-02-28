import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const nextjsProfile: Profile = {
  id: 'frameworks/nextjs',
  name: 'Next.js',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['nextjs'],
  dependsOn: ['frameworks/react'],
  contributions: {
    claudeMd: [
      {
        heading: 'Next.js Conventions',
        order: 20,
        content: `## Next.js Conventions

- Use the App Router (\`app/\` directory) for all new routes
- Default to Server Components - add \`'use client'\` only when client interactivity is required
- Use Server Actions for form mutations and data writes
- Use the \`metadata\` export or \`generateMetadata\` for SEO on every page
- Use \`next/image\` for all images - never use raw \`<img>\` tags
- Use \`next/link\` for all internal navigation
- Use \`next/font\` for font loading to eliminate layout shift
- Leverage route segment config for caching and revalidation (\`revalidate\`, \`dynamic\`)
- Colocate loading.tsx, error.tsx, and not-found.tsx in route segments
- Use Route Handlers (\`route.ts\`) for API endpoints in the App Router
- Keep \`'use client'\` boundaries as low in the component tree as possible
- Use Suspense boundaries to stream content and improve TTFB`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx next:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
        ],
      },
    },
    rules: [
      {
        path: 'nextjs/architecture.md',
        governance: 'mandatory',
        description: 'Next.js App Router architecture and patterns',
        content: `# Next.js Architecture

## App Router
- Use the \`app/\` directory for all routes
- Each route segment should have its own folder
- Use \`page.tsx\` for route UI, \`layout.tsx\` for shared layouts
- Use \`loading.tsx\` for Suspense fallbacks, \`error.tsx\` for error boundaries
- Use \`not-found.tsx\` for 404 handling per segment
- Use route groups \`(groupName)\` to organize without affecting URL structure

## Server Components vs Client Components
- Default to Server Components - they render on the server with zero client JS
- Add \`'use client'\` only when using: useState, useEffect, event handlers, browser APIs
- Keep \`'use client'\` boundary as low as possible in the component tree
- Never import Server Components inside Client Components
- Pass Server Component content as \`children\` to Client Components

## Server Actions
- Use \`'use server'\` directive for server-side mutations
- Place shared actions in \`app/actions/\` or colocate with their route
- Validate all input in Server Actions - they are public API endpoints
- Use \`revalidatePath\` or \`revalidateTag\` after mutations
- Handle errors gracefully and return typed responses

## Data Fetching
- Fetch data in Server Components using \`async/await\`
- Use \`fetch\` with Next.js caching extensions for deduplication
- Configure caching: \`force-cache\` (default), \`no-store\`, or \`revalidate\`
- Use \`generateStaticParams\` for static generation of dynamic routes
- Implement parallel data fetching with \`Promise.all\` when requests are independent

## Caching Strategies
- Understand the four caching layers: Request Memoization, Data Cache, Full Route Cache, Router Cache
- Use \`revalidate\` for time-based cache invalidation
- Use cache tags and \`revalidateTag\` for on-demand revalidation
- Set \`dynamic = 'force-dynamic'\` only when caching is truly inappropriate
`,
      },
      {
        path: 'nextjs/performance.md',
        governance: 'recommended',
        description: 'Next.js performance and optimization guidelines',
        content: `# Next.js Performance

## Image Optimization
- Always use \`next/image\` - it provides automatic optimization, lazy loading, and responsive sizing
- Specify \`width\` and \`height\` or use \`fill\` to prevent layout shift
- Use \`priority\` prop for above-the-fold images (LCP candidates)
- Configure \`remotePatterns\` in next.config for external image domains

## Font Optimization
- Use \`next/font/google\` or \`next/font/local\` for zero-layout-shift fonts
- Apply fonts via CSS variable for flexibility
- Subset fonts to only needed characters when possible

## Bundle Optimization
- Use dynamic imports (\`next/dynamic\`) for heavy client components
- Analyze bundle with \`@next/bundle-analyzer\`
- Avoid importing entire libraries - use tree-shakeable imports
- Use \`loading\` option with \`next/dynamic\` for suspense fallback

## Metadata and SEO
- Export \`metadata\` object or \`generateMetadata\` function from every page
- Include Open Graph and Twitter card metadata
- Use \`robots.ts\` and \`sitemap.ts\` for search engine configuration
- Implement structured data (JSON-LD) for rich search results
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Next.js-Specific Review
- Verify correct use of Server vs Client Components (\`'use client'\` only where needed)
- Check that \`'use client'\` boundaries are pushed as low as possible
- Verify Server Actions validate all input and handle errors
- Check for proper caching configuration - avoid unnecessary \`dynamic = 'force-dynamic'\`
- Verify \`next/image\` usage instead of raw \`<img>\` tags
- Check metadata exports on all pages for SEO
- Verify proper use of \`loading.tsx\`, \`error.tsx\`, and \`not-found.tsx\`
- Check for data fetching in Client Components that should be in Server Components
- Verify revalidation strategy after mutations
- Check for proper Suspense boundaries for streaming`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Next.js Testing
- Test Server Components by rendering them directly (they are async functions)
- Test Server Actions by calling them directly with mocked dependencies
- Test Client Components with React Testing Library
- Mock \`next/navigation\` hooks (\`useRouter\`, \`useSearchParams\`, \`usePathname\`)
- Mock \`next/image\` in tests to avoid optimization overhead
- Test loading, error, and not-found states for route segments
- Test metadata generation functions for correct SEO output
- Use \`next/jest\` for proper Next.js test configuration`,
      },
    ],
  },
};
