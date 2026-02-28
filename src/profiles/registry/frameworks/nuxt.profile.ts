import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const nuxtProfile: Profile = {
  id: 'frameworks/nuxt',
  name: 'Nuxt',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['nuxt'],
  dependsOn: ['frameworks/vue'],
  contributions: {
    claudeMd: [
      {
        heading: 'Nuxt Conventions',
        order: 20,
        content: `## Nuxt Conventions

- Use the file-based routing system in the \`pages/\` directory
- Use \`<script setup>\` with the Composition API in all components
- Leverage Nuxt auto-imports for Vue APIs, composables, and utilities
- Use \`useFetch\` and \`useAsyncData\` for data fetching with SSR support
- Use server routes in \`server/api/\` for backend API endpoints
- Use \`definePageMeta\` for page-level metadata, layouts, and middleware
- Use Nuxt modules for extending functionality (e.g., @nuxtjs/tailwindcss, @pinia/nuxt)
- Use \`useState\` for SSR-safe shared state across components
- Use runtime config (\`useRuntimeConfig\`) for environment-specific values
- Use Nitro server engine features for server-side logic
- Use \`NuxtLink\` for all internal navigation
- Organize reusable logic in \`composables/\` directory for auto-import`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx nuxi:*)',
          'Bash(npx nuxt:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run generate:*)',
          'Bash(npx vitest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'nuxt/architecture.md',
        governance: 'mandatory',
        description: 'Nuxt directory structure and SSR patterns',
        content: `# Nuxt Architecture

## Directory Structure
- \`/pages\` - File-based routing (each file becomes a route)
- \`/components\` - Auto-imported Vue components
- \`/composables\` - Auto-imported composable functions
- \`/layouts\` - Page layout wrappers
- \`/middleware\` - Route middleware (navigation guards)
- \`/server/api\` - Server API routes (Nitro)
- \`/server/middleware\` - Server-side middleware
- \`/plugins\` - Vue plugins and Nuxt plugins
- \`/public\` - Static assets served at root
- \`/assets\` - Build-processed assets (CSS, images)

## Routing
- File-based routes: \`pages/index.vue\` -> \`/\`, \`pages/users/[id].vue\` -> \`/users/:id\`
- Use \`[param]\` for dynamic routes and \`[...slug]\` for catch-all routes
- Use \`definePageMeta\` to set layout, middleware, and page transitions
- Use route middleware for auth guards and redirects

## Data Fetching
- Use \`useFetch\` for simple API calls with SSR support and caching
- Use \`useAsyncData\` for custom async logic with SSR support
- Use \`$fetch\` for client-only or event-handler API calls
- Use \`lazy\` option to defer fetching until client-side navigation
- Use \`server: false\` to skip SSR for specific data fetches

## Server Routes (Nitro)
- Define API endpoints in \`server/api/\` using \`defineEventHandler\`
- Use \`readBody\`, \`getQuery\`, and \`getRouterParam\` for request data
- Return objects directly - Nitro serializes them as JSON
- Use server middleware in \`server/middleware/\` for request processing
- Use Nitro storage and caching for server-side data management

## State Management
- Use \`useState\` for SSR-safe reactive state shared across components
- Use Pinia with \`@pinia/nuxt\` module for complex state management
- Avoid \`ref\` at module scope for shared state - it is not SSR-safe
- Use \`useRuntimeConfig\` for environment variables accessible in both server and client
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Nuxt-Specific Review
- Verify file-based routing conventions are followed in pages/ directory
- Check that useFetch/useAsyncData are used instead of raw fetch for SSR support
- Verify useState is used for shared reactive state instead of plain ref at module scope
- Check that server routes in server/api/ use defineEventHandler
- Verify auto-imports are leveraged - no unnecessary manual imports of Vue APIs
- Check that NuxtLink is used instead of anchor tags for internal navigation
- Verify runtime config is used for environment-specific values
- Check for proper use of definePageMeta for layouts and middleware
- Verify middleware is used for route guards instead of in-component checks
- Check that Nuxt modules are used for common integrations`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Nuxt Testing
- Use @nuxt/test-utils for Nuxt-aware testing with proper context
- Test pages and components with mountSuspended for SSR compatibility
- Test server routes by calling them directly with $fetch in test context
- Mock useFetch and useAsyncData responses in component tests
- Test middleware by simulating navigation with navigateTo
- Use Vitest as the test runner
- Test composables in isolation by wrapping in a test component
- Verify SSR hydration by testing both server and client renders`,
      },
    ],
  },
};
