import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const svelteProfile: Profile = {
  id: 'frameworks/svelte',
  name: 'Svelte',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['svelte'],
  contributions: {
    claudeMd: [
      {
        heading: 'Svelte Conventions',
        order: 20,
        content: `## Svelte Conventions

Svelte 5 runes (\`$state\`, \`$derived\`, \`$effect\`). Minimal boilerplate, compiler-driven reactivity.

**Detailed rules:** see \`.claude/rules/svelte/\` directory.

**Key rules:**
- Use runes: \`$state()\` for reactive state, \`$derived()\` for computed, \`$effect()\` sparingly
- Components are \`.svelte\` files — one component per file, props via \`$props()\`
- SvelteKit for routing and SSR — \`+page.svelte\`, \`+layout.svelte\`, \`+server.ts\`
- Minimal \`$effect\` usage — derive state instead of syncing it`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx vite:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npm run preview:*)',
          'Bash(npx vitest:*)',
          'Bash(npx svelte-kit:*)',
          'Bash(npx svelte-check:*)',
          'Bash(npx playwright:*)',
        ],
      },
    },
    rules: [
      {
        path: 'svelte/architecture.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'mandatory',
        description: 'SvelteKit architecture, routing, data loading, and form actions',
        content: `# Svelte / SvelteKit Architecture

## SvelteKit Project Structure
- \`routes/\` — file-based routing (\`+page.svelte\`, \`+page.server.ts\`, \`+layout.svelte\`, \`+error.svelte\`, \`+server.ts\`)
- \`lib/\` — shared code (\`$lib\` alias): \`components/\`, \`server/\`, \`utils/\`, \`stores/\`
- \`params/\` — route parameter matchers
- \`hooks.server.ts\` / \`hooks.client.ts\` — server/client hooks
- \`(group)/\` folders organize routes without affecting URL

## Routing
- \`+page.svelte\` at \`/\`, \`blog/[slug]/+page.svelte\` at \`/blog/:slug\`
- \`[...path]/+page.svelte\` catches all unmatched; \`(group)/\` groups without URL impact
- Use parameter matchers in \`src/params/\` for typed dynamic params

## Data Loading
- \`+page.server.ts\` (default) — data fetched on server, serialized to client
- \`+page.ts\` only when load must also run on client-side navigation AND has no secrets
- Server load has access to \`locals\`, cookies, database; universal load does not
- Use \`depends()\` and \`invalidate()\` for targeted re-fetching
- Use \`Promise.all\` for independent data fetches within a single load function

## Form Actions
- Define actions in \`+page.server.ts\` with \`export const actions: Actions\`
- Use \`fail()\` for validation errors, \`redirect()\` for successful mutations
- Always validate all inputs server-side
- Use \`use:enhance\` on forms for progressive enhancement

## Hooks (Server Middleware)
- \`handle\` hook in \`hooks.server.ts\` for auth, logging, request processing
- \`handleError\` for consistent server-side error handling
- Generate error IDs for tracking; return user-friendly messages only
`,
      },
      {
        path: 'svelte/reactivity-and-components.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'mandatory',
        description: 'Svelte 5 runes, component patterns, snippets, and state management',
        content: `# Svelte 5 Reactivity & Component Patterns

## Runes — The Svelte 5 Reactivity Model

### $state — Mutable Reactive State
- Deep reactivity: mutations to nested properties trigger updates
- Use \`$state.raw\` for large arrays/objects replaced wholesale (better performance)
- With \`$state.raw\`, only reassignment triggers updates — mutation does NOT

### $derived — Computed Values
- Single expression: \`let total = $derived(items.reduce(...))\`
- Multi-statement: \`let summary = $derived.by(() => { ... return result; })\`
- NEVER use \`$effect\` to derive state — always use \`$derived\`

### $effect — Side Effects Only
- Use for syncing with external systems (fetch, DOM, localStorage)
- Always return a cleanup function for subscriptions, timers, abort controllers
- Use \`untrack()\` to read reactive values without creating a dependency
- \`$effect\` replaces \`onMount\` for most use cases
- Use \`onMount\` only for code that runs exclusively on client after initial render

## Component Props ($props)
- Declare typed props with \`$props()\` and a TypeScript \`Props\` interface
- Event callbacks: \`onEventName\` pattern (\`onClick\`, \`onSubmit\`)
- Children via \`Snippet\` type: \`children?: import('svelte').Snippet\`

## Snippets — Reusable Template Fragments
- Replace Svelte 4 \`<slot />\` with \`{#snippet}\` and \`{@render}\`
- Pass snippets as typed props (\`Snippet<[T]>\`) for customizable rendering

## Shared Reactive State (.svelte.ts files)
- Export factory functions that use \`$state\` and \`$derived\`
- Expose state via getters for reactivity: \`get count() { return count; }\`
- Import and call in any component for shared state

## Event Handling (Svelte 5)
- Use \`onclick\`, \`oninput\`, etc. — NOT \`on:click\`, \`on:input\` (Svelte 4 legacy)
- Svelte 5 uses standard callback props, not event directives
`,
      },
      {
        path: 'svelte/performance-and-ssr.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'recommended' as const,
        description: 'SvelteKit SSR, streaming, caching, transitions, and bundle optimization',
        content: `# SvelteKit Performance & SSR

## Server-Side Rendering
- Fetch data in \`+page.server.ts\` load functions — avoids client-side waterfalls
- Use \`Promise.all\` for independent fetches within a single load function
- Return unresolved promises for streaming — fast data awaited, slow data streams in
- Use \`{#await}\` in templates for streamed data with loading/error states

## Caching
- Use \`setHeaders\` in load functions for per-route cache control
- \`export const prerender = true\` for static pages (blog, docs, marketing)

## Transitions & Animations
- Built-in: \`fade\`, \`fly\`, \`slide\`, \`scale\` from \`svelte/transition\`; \`flip\` from \`svelte/animate\`
- Use \`|local\` modifier to prevent transitions on initial mount
- Keep durations under 300ms for interactive elements
- Use \`animate:flip\` only on \`{#each}\` with keyed items

## Bundle & Runtime Optimization
- SvelteKit auto-splits code per route
- Use dynamic imports for heavy libraries in specific routes only
- Prefer \`$state.raw\` for large collections replaced wholesale
- Keep reactive state granular — multiple small \`$state\` over one large object
- Avoid \`$effect\` chains — each state-setting effect triggers another cycle
- \`{#key expression}\` blocks to force re-creation on identity change

## Prerendering & Adapters
- \`adapter-auto\` for auto-detected targets; \`adapter-node\` for Node.js; \`adapter-vercel\`/\`adapter-cloudflare\` for edge
- Configure \`trailingSlash\` in \`svelte.config.js\` for URL consistency
`,
      },
      {
        path: 'svelte/naming-and-files.md',
        paths: ['**/*.svelte', '**/*.svelte.ts'],
        governance: 'recommended' as const,
        description: 'Svelte naming conventions and file organization',
        content: `# Svelte Naming & File Conventions

## File Naming
- Components: PascalCase (\`UserCard.svelte\`, \`DataTable.svelte\`)
- Stores: camelCase with \`.svelte.ts\` (\`counter.svelte.ts\`, \`auth.svelte.ts\`)
- Utils: camelCase (\`formatDate.ts\`, \`validators.ts\`)
- Routes: SvelteKit conventions (\`+page.svelte\`, \`+page.server.ts\`, \`+layout.svelte\`)
- Tests: same name + \`.test.ts\` (\`UserCard.test.ts\`)

## Component Naming
- PascalCase matching filename
- Props: typed \`$props()\` with \`Props\` interface
- Event callbacks: \`onEventName\` pattern (\`onClick\`, \`onSubmit\`)

## $lib Organization
- \`components/\` — reusable UI (\`ui/\` for primitives, \`domain/\` for domain-specific)
- \`server/\` — server-only code (DB clients, auth helpers)
- \`stores/\` — shared reactive state (\`.svelte.ts\` files)
- \`utils/\` — pure utility functions
- \`types/\` — shared TypeScript types

## Route Organization
- Group with \`(groupName)/\` folders (no URL impact)
- Colocate route-specific components alongside the route file
- Extract shared logic into \`$lib/server/\` or \`$lib/stores/\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['svelte-component-generator', 'svelte-route-generator'],
        prompt: `## Svelte / SvelteKit Review Checklist

### Runes & Reactivity
- Verify Svelte 5 runes are used: \`$state\`, \`$derived\`, \`$effect\`, \`$props\` — flag any Svelte 4 patterns (\`export let\`, \`$:\` labels, \`on:\` events)
- Check that \`$derived\` is used for computed values — flag \`$effect\` used to derive state
- Verify \`$state.raw\` is used for large collections that are replaced wholesale
- Check that \`$effect\` includes cleanup returns for subscriptions, timers, and abort controllers
- Verify \`$props\` has TypeScript types — flag untyped props

### Component Patterns
- Check that snippets (\`{#snippet}\` / \`{@render}\`) are used instead of Svelte 4 \`<slot />\`
- Verify event handlers use \`onclick\` / \`oninput\` — flag \`on:click\` / \`on:input\` directives
- Check components are small and focused — flag components exceeding 200 lines
- Verify scoped CSS is used — flag unnecessary \`:global()\`
- Check for proper accessibility: semantic HTML, ARIA labels, keyboard handling

### SvelteKit Data Flow
- Verify server-side load functions in \`+page.server.ts\` for data fetching — flag client-side fetch in \`onMount\`
- Check that form actions use \`use:enhance\` for progressive enhancement
- Verify \`fail()\` is used for validation errors in form actions — flag throwing errors
- Check that \`$lib\` alias is used — flag relative imports reaching outside the current route
- Verify server-only code is in \`+page.server.ts\`, \`+server.ts\`, or \`$lib/server/\`
- Check for proper error handling with \`+error.svelte\` boundaries per route segment

### Security
- Verify all form action inputs are validated server-side — never trust client data
- Check that secrets/API keys are only accessed in server load functions or \`$lib/server\`
- Verify \`hooks.server.ts\` handles auth consistently for protected routes`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['svelte-component-generator', 'svelte-route-generator'],
        prompt: `## Svelte / SvelteKit Testing

### Component Testing
- Use \`@testing-library/svelte\` with Vitest for component tests
- Render components with \`render(Component, { props })\` and query the DOM
- Test user interactions via \`@testing-library/user-event\` — click, type, select
- Test reactive state changes by interacting and asserting DOM updates (no direct state access)
- Test snippet rendering by passing snippet props as functions
- Use \`cleanup()\` or auto-cleanup between tests

### Example Pattern
\`\`\`typescript
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Counter from './Counter.svelte';

test('increments count on button click', async () => {
  const user = userEvent.setup();
  render(Counter, { props: { initial: 0 } });

  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('1')).toBeInTheDocument();
});
\`\`\`

### Server Load & Actions Testing
- Test load functions by calling them directly with mocked event objects (\`params\`, \`locals\`, \`cookies\`)
- Test form actions by constructing \`Request\` objects with \`FormData\`
- Verify \`fail()\` responses for validation errors
- Verify \`redirect()\` calls for successful mutations
- Mock database and auth services in \`locals\`

### SvelteKit Module Mocking
- Mock \`$app/navigation\` (\`goto\`, \`invalidate\`, \`invalidateAll\`)
- Mock \`$app/stores\` (\`page\`, \`navigating\`, \`updated\`)
- Mock \`$app/forms\` (\`enhance\`) when testing form components
- Use \`vi.mock()\` for SvelteKit module mocks in Vitest`,
      },
    ],
    skills: [
      {
        name: 'svelte-component-generator',
        description: 'Generate Svelte 5 components with runes, TypeScript, and tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Svelte 5 Component Generator

Generate a Svelte 5 component following these requirements:

## Component File (.svelte)
- Use \`<script lang="ts">\` with Svelte 5 runes
- Declare props with \`$props()\` and a TypeScript \`Props\` interface
- Use \`$state\` for local mutable state
- Use \`$derived\` / \`$derived.by\` for computed values
- Use \`$effect\` only for DOM side effects or external sync — include cleanup
- Use snippets (\`{#snippet}\`) instead of slots for reusable template fragments
- Use \`onclick\` / \`oninput\` for event handling — not \`on:click\`
- Include scoped \`<style>\` block with CSS custom properties for theming
- Add semantic HTML and ARIA attributes for accessibility

## Test File (.test.ts)
- Use \`@testing-library/svelte\` + Vitest
- Test rendering with different prop combinations
- Test user interactions and resulting DOM changes
- Test accessibility: roles, labels, keyboard navigation

## SvelteKit Integration (if route component)
- Create \`+page.server.ts\` with typed load function
- Create form actions with \`fail()\` validation
- Add \`use:enhance\` to forms
- Add \`+error.svelte\` for the route segment
`,
      },
      {
        name: 'svelte-route-generator',
        description: 'Generate SvelteKit routes with load functions, form actions, and error handling',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# SvelteKit Route Generator

Generate a complete SvelteKit route with:

## Server Load (+page.server.ts)
- Typed \`PageServerLoad\` function from \`./$types\`
- Data fetching via \`locals\` (database, auth)
- Error handling with \`error()\` from \`@sveltejs/kit\`
- Proper use of \`depends()\` for invalidation keys
- Cache headers via \`setHeaders\` when applicable

## Form Actions (+page.server.ts)
- Named actions when multiple forms exist on the page
- Input validation with \`fail()\` for errors
- \`redirect()\` for successful mutations
- TypeScript types for form data

## Page Component (+page.svelte)
- \`$props()\` to receive \`data\` and \`form\` from server
- \`use:enhance\` on all forms for progressive enhancement
- Loading states with \`{#await}\` for streamed data
- Proper error display from form action results

## Error Boundary (+error.svelte)
- Access error via \`$page.error\` from \`$app/stores\`
- User-friendly error message — no stack traces
- Navigation link back to a safe route

## Layout (+layout.svelte / +layout.server.ts)
- Shared layout with \`{@render children()}\` for child routes
- Layout-level load for shared data (auth, navigation)
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.svelte\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/export\\s+let\\s/.test(c))issues.push(\'export let detected — use $props() in Svelte 5\');if(/\\$:\\s/.test(c)&&!/\\$:\\/\\//.test(c))issues.push(\'$: reactive label detected — use $derived or $effect in Svelte 5\');if(/on:click|on:input|on:change|on:submit/.test(c))issues.push(\'on: event directive detected — use onclick/oninput in Svelte 5\');if(/<slot/.test(c)&&!/<slot\\s/.test(c)||/<slot\\s/.test(c))issues.push(\'<slot> detected — use {#snippet} and {@render} in Svelte 5\');if(issues.length)console.log(\'Warning: \'+issues.join(\'; \'))" -- "$FILE_PATH"',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\+page\\.server\\.(ts|js)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/actions/.test(c)&&!/fail\\(/.test(c))console.log(\'Warning: form actions without fail() — add validation error handling with fail() from @sveltejs/kit\')" -- "$FILE_PATH"',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.svelte\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/\\$effect\\s*\\(/.test(c)){const lines=c.split(\'\\n\');let hasCleanup=false;let inEffect=false;let depth=0;for(const l of lines){if(/\\$effect\\s*\\(/.test(l)){inEffect=true;depth=0;}if(inEffect){depth+=(l.match(/\\{/g)||[]).length-(l.match(/\\}/g)||[]).length;if(/return\\s*\\(\\)\\s*=>/.test(l)||/return\\s*\\(\\)\\s*\\{/.test(l)||/return\\s+function/.test(l))hasCleanup=true;if(depth<=0&&inEffect){inEffect=false;}}}if(!hasCleanup&&/fetch|addEventListener|subscribe|setInterval|setTimeout/.test(c))console.log(\'Warning: $effect with async/subscription pattern but no cleanup return detected — add return () => cleanup()\')}" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'eslint' as const,
        filePath: 'svelte.config.js',
        config: {
          kit: {
            alias: {
              $lib: 'src/lib',
              '$lib/*': 'src/lib/*',
            },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
