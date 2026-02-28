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

- Use Svelte 5 runes (\`$state\`, \`$derived\`, \`$effect\`) for reactivity
- Keep components small and focused on a single responsibility
- Use \`$props\` for component inputs and \`$bindable\` for two-way binding
- Use SvelteKit for full-stack applications with file-based routing
- Use \`+page.svelte\` for route pages and \`+layout.svelte\` for shared layouts
- Use \`+page.server.ts\` for server-side data loading (load functions)
- Use form actions in \`+page.server.ts\` for mutations
- Use stores (\`$state\` in .svelte.ts files) for shared reactive state
- Use \`<script>\` for component logic and keep templates declarative
- Use CSS scoping (styles are scoped to the component by default)
- Use \`{#snippet}\` blocks for reusable template fragments
- Use transitions and animations via Svelte's built-in directives`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx vite:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npx vitest:*)',
          'Bash(npx svelte-kit:*)',
        ],
      },
    },
    rules: [
      {
        path: 'svelte/architecture.md',
        governance: 'mandatory',
        description: 'SvelteKit architecture and component patterns',
        content: `# Svelte / SvelteKit Architecture

## SvelteKit Directory Structure
- \`/src/routes\` - File-based routing with +page.svelte, +layout.svelte, +server.ts
- \`/src/lib\` - Shared library code (importable via \`$lib\` alias)
- \`/src/lib/components\` - Reusable UI components
- \`/src/lib/server\` - Server-only utilities (importable via \`$lib/server\`)
- \`/src/params\` - Parameter matchers for typed route parameters
- \`/static\` - Static assets served at root

## Routing
- File-based routes: \`src/routes/+page.svelte\` -> \`/\`, \`src/routes/users/[id]/+page.svelte\` -> \`/users/:id\`
- Use \`+page.server.ts\` for server-side load functions and form actions
- Use \`+page.ts\` for universal load functions (run on server and client)
- Use \`+layout.svelte\` and \`+layout.server.ts\` for shared layouts and data
- Use \`+error.svelte\` for error pages per route segment
- Use route groups \`(group)\` to organize without affecting URL structure

## Reactivity (Svelte 5 Runes)
- Use \`$state\` for reactive variables
- Use \`$derived\` for computed values that depend on reactive state
- Use \`$effect\` for side effects that run when dependencies change
- Use \`$props\` to declare component props
- Use \`$bindable\` for props that support two-way binding
- Use \`.svelte.ts\` files for shared reactive state (replaces stores)

## Data Loading
- Use \`load\` functions in \`+page.server.ts\` for server-side data fetching
- Return data as plain objects from load functions
- Access loaded data in components via \`data\` prop
- Use \`depends()\` and \`invalidate()\` for reactive data reloading
- Use \`+page.ts\` for data that can be fetched on both server and client

## Form Actions
- Use form actions in \`+page.server.ts\` for mutations
- Use progressive enhancement with \`use:enhance\` on forms
- Return validation errors from actions with \`fail()\`
- Access action data via \`form\` prop in the component
- Use named actions for multiple forms on the same page
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Svelte-Specific Review
- Verify Svelte 5 runes ($state, $derived, $effect) are used for reactivity
- Check that SvelteKit file conventions are followed (+page.svelte, +page.server.ts)
- Verify server-side load functions are used for data fetching, not client-side fetch
- Check that form actions are used for mutations with proper validation
- Verify use:enhance is applied to forms for progressive enhancement
- Check for proper component composition - small, focused components
- Verify $lib alias is used for imports from the lib directory
- Check that server-only code is in +page.server.ts or $lib/server
- Verify proper error handling with +error.svelte boundaries
- Check for proper use of scoped styles and CSS best practices`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Svelte Testing
- Use @testing-library/svelte for component tests
- Use Vitest as the test runner
- Test components by rendering and interacting with them via user events
- Test load functions by calling them directly with mocked event objects
- Test form actions by calling them with mocked request data
- Mock SvelteKit modules ($app/navigation, $app/stores) in tests
- Test reactive state changes by awaiting tick() after state mutations
- Verify component renders with different prop combinations
- Test error boundaries by triggering error conditions`,
      },
    ],
  },
};
