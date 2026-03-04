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

Nuxt 3 with auto-imports, file-based routing, and \`useFetch\`/\`useAsyncData\` for data loading.

**Detailed rules:** see \`.claude/rules/nuxt/\` directory.

**Key rules:**
- File-based routing in \`pages/\`, layouts in \`layouts/\`, server routes in \`server/api/\`
- \`useFetch\` for component data, \`$fetch\` for event handlers — avoid mixing
- Composables auto-imported from \`composables/\` — prefix with \`use\`
- Server-side: use \`defineEventHandler\`, validate with \`zod\` or \`h3\` validators`,
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
          'Bash(npm run preview:*)',
          'Bash(npx vitest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'nuxt/architecture.md',
        paths: ['**/*.vue', 'pages/**/*', 'server/**/*', 'composables/**/*'],
        governance: 'mandatory',
        description: 'Nuxt directory structure, routing, data fetching, server routes, and state management',
        content: `# Nuxt Architecture

## Directory Structure (Nuxt 4)
- \`app/\` — client-side: \`pages/\`, \`components/\`, \`composables/\`, \`layouts/\`, \`middleware/\`, \`plugins/\`, \`app.vue\`, \`error.vue\`
- \`server/\` — server-side: \`api/\` (Nitro handlers), \`routes/\`, \`middleware/\`, \`plugins/\`, \`utils/\`
- \`shared/\` — types and utilities shared between app/ and server/
- \`public/\` — static assets; \`layers/\` — shared configuration; \`nuxt.config.ts\`

## File-Based Routing
- Every \`.vue\` in \`app/pages/\` becomes a route automatically
- Dynamic: \`[id].vue\`, catch-all: \`[...slug].vue\`, optional: \`[[param]].vue\`
- \`definePageMeta\` for layout, middleware, keepalive

## Route Middleware
- Global: \`.global.ts\` suffix in \`app/middleware/\`
- Named: reference via \`definePageMeta({ middleware: ['auth'] })\`
- Use \`defineNuxtRouteMiddleware\` for type-safe middleware

## Auto-Imports
- Vue APIs, Nuxt composables, \`app/composables/\`, \`app/utils/\`, \`app/components/\`, \`server/utils/\` are all auto-imported
- Use \`#imports\` for explicit type-only imports when needed
- Never add manual imports for auto-imported APIs

## Data Fetching
- \`useFetch\` / \`useAsyncData\` in component setup (SSR-safe, caching, deduplication)
- \`$fetch\` ONLY in event handlers or server routes — never in component setup (double fetch)
- Never use raw \`fetch\` in components — no SSR payload transfer

## Server Routes (Nitro)
- \`defineEventHandler\` for all handlers
- HTTP method suffixes: \`.get.ts\`, \`.post.ts\`, \`.put.ts\`, \`.delete.ts\`
- Validate all input; use \`createError\` for error responses
- Server middleware must NOT return values (returning ends the request)
- Shared logic in \`server/utils/\` (auto-imported)

## State Management
- \`ref()\` / \`reactive()\` for local component state
- \`useState()\` for SSR-safe shared state — NEVER use module-scope \`ref()\` (state leak in SSR)
- Pinia with \`@pinia/nuxt\` for complex state with actions and getters
- \`useRuntimeConfig()\` for env values; \`useAppConfig()\` for build-time values

## Layouts
- Define in \`app/layouts/\` (\`default.vue\`, \`admin.vue\`, etc.)
- Set per page with \`definePageMeta({ layout: 'admin' })\`
- Disable with \`layout: false\`
`,
      },
      {
        path: 'nuxt/rendering-and-deployment.md',
        paths: ['**/*.vue', 'pages/**/*', 'server/**/*', 'composables/**/*'],
        governance: 'recommended' as const,
        description: 'Nuxt rendering modes, route rules, Nitro deployment, modules, SEO, error handling, and layers',
        content: `# Nuxt Rendering, Deployment & Advanced Patterns

## Rendering Modes
- \`ssr: true\` (default) — dynamic content needing SEO and fresh data
- \`prerender: true\` — static pages known at build time (landing, blog)
- \`isr: seconds\` — content that changes occasionally (product pages)
- \`swr: seconds\` — serve stale while revalidating in background
- \`ssr: false\` — client-only pages with no SEO need (admin dashboards)
- Configure per route with \`routeRules\` in \`nuxt.config.ts\`

## Nitro Deployment
- Configure with \`nitro.preset\`: \`node-server\`, \`vercel\`, \`netlify\`, \`cloudflare-pages\`, etc.
- \`useStorage()\` for KV storage (fs, redis, cloudflare-kv drivers)
- \`defineCachedEventHandler\` / \`defineCachedFunction\` for server-side caching
- \`defineTask()\` for background/scheduled jobs
- \`defineNitroPlugin()\` for server lifecycle hooks (DB init, shutdown)

## Modules
- Register in \`nuxt.config.ts\` \`modules\` array
- Prefer official: \`@pinia/nuxt\`, \`@nuxt/image\`, \`@nuxt/content\`, \`@nuxt/fonts\`, \`@nuxt/eslint\`
- Custom: \`defineNuxtModule\` with meta, defaults, and setup function

## SEO & Head Management
- \`useSeoMeta()\` for type-safe SEO tags (title, og, twitter)
- \`useHead()\` for non-SEO head tags (scripts, links, htmlAttrs)
- \`useServerSeoMeta()\` for server-only SEO tags
- Global defaults in \`nuxt.config.ts\` \`app.head\`

## Error Handling
- \`app/error.vue\` for global error page with \`clearError()\`
- \`<NuxtErrorBoundary>\` for granular in-page error isolation
- Server: \`createError()\` with status code — never expose internal details

## Nuxt Layers
- Extend with \`extends\` in config: local paths, GitHub repos, npm packages
- Use for: design systems, shared configs, multi-tenant apps, monorepo shared code

## Environment & Configuration
- \`runtimeConfig\` for server-only and public env values (overridden by \`NUXT_*\` env vars)
- \`appConfig\` for build-time config that doesn't change per environment
- Access via \`useRuntimeConfig()\` and \`useAppConfig()\`
- NEVER use \`process.env\` directly in app code — always use \`useRuntimeConfig()\`
- NEVER hardcode secrets in source code
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['nuxt-page-generator', 'nuxt-api-route-generator'],
        prompt: `## Nuxt-Specific Review

### Routing & Navigation
- Verify file-based routing conventions in pages/ — correct dynamic param syntax ([param], [...slug], [[optional]])
- Check that NuxtLink is used for internal navigation, never raw <a> tags
- Verify definePageMeta is used for layout, middleware, and transitions
- Check that route middleware follows naming convention and uses defineNuxtRouteMiddleware

### Data Fetching
- Verify useFetch or useAsyncData is used in component setup — flag raw $fetch or fetch in setup context
- Check that $fetch is used only inside event handlers, onMounted, or server routes
- Verify unique keys are provided to useAsyncData when fetching the same endpoint with different params
- Check for missing error handling on useFetch/useAsyncData (status, error ref)
- Verify lazy option or Suspense usage for non-critical data

### Auto-Imports
- Flag unnecessary manual imports of Vue APIs (ref, computed, watch) — they are auto-imported
- Flag unnecessary imports of Nuxt composables (useFetch, useHead, useState, navigateTo)
- Flag unnecessary component imports — components in app/components/ are auto-imported
- Verify #imports is used for explicit type-only imports when needed

### Server Routes
- Verify server/api/ handlers use defineEventHandler
- Check that all input is validated in server routes (readBody, getQuery, getRouterParam)
- Verify createError is used for error responses with proper status codes
- Check that server middleware does not return values (returning ends the request)
- Verify HTTP method suffixes are used (.get.ts, .post.ts) for method-specific handlers

### State Management
- Verify useState is used for shared state instead of module-scope ref() — SSR state leak risk
- Check that useRuntimeConfig is used for env values, not process.env in app code
- Verify runtimeConfig.public is used for client-accessible values
- Check for proper Pinia store setup when using @pinia/nuxt

### SEO & Head
- Verify useSeoMeta or useHead is used for page-level metadata
- Check for useServerSeoMeta when tags only need server rendering
- Flag pages missing title and description metadata

### Error Handling
- Verify app/error.vue exists for global error handling
- Check NuxtErrorBoundary usage for granular error isolation
- Verify server routes use createError with appropriate status codes`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['nuxt-page-generator', 'nuxt-api-route-generator'],
        prompt: `## Nuxt Testing

### Setup
- Use @nuxt/test-utils with Vitest for Nuxt-aware testing
- Register @nuxt/test-utils/module in nuxt.config.ts modules for test mode
- Use \`setup\` option from @nuxt/test-utils/e2e for full Nuxt context in integration tests

### Component Testing
- Use mountSuspended from @nuxt/test-utils/runtime to mount components with Nuxt context
- Test pages and components with SSR compatibility — mountSuspended handles async setup
- Mock useFetch and useAsyncData responses using vi.mock('#imports') or mockNuxtImport
- Test definePageMeta by verifying layout and middleware assignments

### Server Route Testing
- Test server routes by calling them with $fetch in a Nuxt test context
- Use setup({ host }) from @nuxt/test-utils to start a test server
- Validate response status, headers, and body for all HTTP methods
- Test error cases: invalid input, missing resources, unauthorized access

### Composable Testing
- Test composables in isolation using renderSuspended or a test component wrapper
- Verify SSR behavior: test that useState returns the same value on hydration
- Mock external dependencies (API calls, browser APIs)

### Middleware Testing
- Test route middleware by calling the middleware function directly
- Verify navigation guards: redirect conditions, auth checks
- Mock useUserSession or other auth composables

### E2E Testing
- Use @nuxt/test-utils with Playwright or Cypress for E2E tests
- Test full page renders including SSR hydration
- Verify SEO metadata in rendered HTML
- Test client-side navigation and data fetching transitions`,
      },
    ],
    skills: [
      {
        name: 'nuxt-page-generator',
        description: 'Generate Nuxt pages with proper Nuxt 4 patterns',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Nuxt Page Generator

Generate a Nuxt page following Nuxt 4 conventions:

## File Structure
- Page in \`app/pages/\` with correct file-based routing name
- Server API route in \`server/api/\` if the page needs backend data
- Composable in \`app/composables/\` if the page has reusable logic

## Page Template
\`\`\`vue
<script setup lang="ts">
// 1. Page metadata
definePageMeta({
  layout: 'default',
  middleware: [],
})

// 2. SEO metadata
useSeoMeta({
  title: 'Page Title',
  description: 'Page description',
})

// 3. Data fetching with useFetch or useAsyncData
const { data, status, error } = await useFetch('/api/resource')

// 4. Local state and computed values (auto-imported, no manual imports)
const searchQuery = ref('')
const filteredData = computed(() =>
  data.value?.filter(item => item.name.includes(searchQuery.value)) ?? []
)

// 5. Event handlers using $fetch for mutations
async function handleCreate(payload: CreatePayload) {
  await $fetch('/api/resource', { method: 'POST', body: payload })
  await refreshNuxtData()
}
</script>

<template>
  <div>
    <NuxtErrorBoundary>
      <div v-if="status === 'pending'">Loading...</div>
      <div v-else-if="error">Error: {{ error.message }}</div>
      <div v-else>
        <!-- Page content using data -->
      </div>
      <template #error="{ error: boundaryError, clearError }">
        <p>{{ boundaryError.message }}</p>
        <button @click="clearError">Retry</button>
      </template>
    </NuxtErrorBoundary>
  </div>
</template>
\`\`\`

## Server API Route Template
\`\`\`typescript
// server/api/resource.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  // Validate, fetch from DB/external service, return data
  return { items: [] }
})
\`\`\`

## Test Template
\`\`\`typescript
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import MyPage from '~/pages/my-page.vue'

describe('MyPage', () => {
  it('renders page content when data loads', async () => {
    const component = await mountSuspended(MyPage)
    expect(component.text()).toContain('Expected content')
  })
})
\`\`\`
`,
      },
      {
        name: 'nuxt-api-route-generator',
        description: 'Generate Nuxt server API routes with validation and error handling',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Nuxt API Route Generator

Generate Nitro server API routes following Nuxt conventions:

## CRUD Route Set
For a given resource, generate the following files:
- \`server/api/[resource].get.ts\` — List all (with pagination)
- \`server/api/[resource].post.ts\` — Create new
- \`server/api/[resource]/[id].get.ts\` — Get by ID
- \`server/api/[resource]/[id].put.ts\` — Update by ID
- \`server/api/[resource]/[id].delete.ts\` — Delete by ID

## Template
\`\`\`typescript
// server/api/posts/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing post ID' })
  }

  const post = await getPostById(id)
  if (!post) {
    throw createError({ statusCode: 404, message: 'Post not found' })
  }

  return post
})
\`\`\`

\`\`\`typescript
// server/api/posts.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<{ title: string; content: string }>(event)

  if (!body.title?.trim() || !body.content?.trim()) {
    throw createError({ statusCode: 422, message: 'Title and content are required' })
  }

  return await createPost(body)
})
\`\`\`

## Key Patterns
- Always validate all inputs (params, query, body)
- Use HTTP method suffixes for file names
- Use createError for all error responses with proper status codes
- Place shared DB/service logic in server/utils/ (auto-imported)
- Use defineCachedEventHandler for read endpoints that benefit from caching
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';const c=require(\'fs\').readFileSync(f,\'utf8\');if(/composables[\\\\/]/.test(f)&&/^import\\s.*from\\s+[\'\\\"](vue|nuxt|#app)[\'\\\"]/m.test(c))console.log(\'Warning: composable has manual imports of Vue/Nuxt APIs — these are auto-imported in Nuxt, remove the import statements\')" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/pages[\\\\/]/.test(f)||!/\\.vue$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/await\\s+\\$fetch\\s*\\(/.test(c)&&/setup/.test(c)&&!/onMounted|onClick|onSubmit|handle[A-Z]/.test(c))console.log(\'Warning: $fetch used in page setup — use useFetch or useAsyncData instead to avoid double fetching\')" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/server[\\\\/]middleware[\\\\/]/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/return\\s+(?!void|undefined)/.test(c)&&!/createError|throw/.test(c))console.log(\'Warning: server middleware returns a value — this ends the request. Remove the return unless intentional.\')" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
