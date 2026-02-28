import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const vueProfile: Profile = {
  id: 'frameworks/vue',
  name: 'Vue.js',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['vue'],
  contributions: {
    claudeMd: [
      {
        heading: 'Vue.js Conventions',
        order: 20,
        content: `## Vue.js Conventions

- Use the Composition API with \`<script setup>\` for all new components
- Use \`ref()\` for primitive reactive state, \`reactive()\` for objects
- Extract reusable stateful logic into composables (functions prefixed with \`use\`)
- Use Pinia for global state management - avoid Vuex in new projects
- Use single-file components (.vue) with scoped styles
- Keep components small and focused on a single responsibility
- Use \`defineProps()\` and \`defineEmits()\` for component communication
- Use \`computed()\` for derived state - avoid computing in templates
- Use \`watch()\` and \`watchEffect()\` for side effects based on reactive state
- Use Vue Router for navigation with lazy-loaded routes
- Use \`v-model\` with custom events for two-way binding on custom components
- Prefer template refs over direct DOM manipulation`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx vite:*)',
          'Bash(npx vue-cli-service:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npx vitest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'vue/component-patterns.md',
        governance: 'mandatory',
        description: 'Vue.js Composition API and component patterns',
        content: `# Vue.js Component Patterns

## Composition API
- Use \`<script setup>\` syntax for all components - it is the recommended default
- Use \`ref()\` for primitive values and \`reactive()\` for object state
- Use \`computed()\` for derived values - it caches and updates reactively
- Use \`watch()\` for reacting to specific reactive source changes
- Use \`watchEffect()\` when you want automatic dependency tracking
- Use \`toRefs()\` when destructuring reactive objects to preserve reactivity
- Use \`shallowRef()\` and \`shallowReactive()\` for large objects where deep reactivity is costly

## Component Communication
- Props down, events up: \`defineProps()\` for input, \`defineEmits()\` for output
- Use TypeScript generics with \`defineProps<T>()\` for type-safe props
- Use \`provide()\` / \`inject()\` for deep component tree data sharing
- Use Pinia stores for shared global state
- Use \`defineModel()\` for simplified two-way binding on custom components

## Composables
- Name composable functions with \`use\` prefix (\`useAuth\`, \`useFetch\`, \`useLocalStorage\`)
- Composables should return reactive refs and functions
- Accept refs as parameters to maintain reactivity
- Handle cleanup with \`onUnmounted()\` or the \`onScopeDispose()\` hook
- Keep composables focused on a single concern

## Single-File Components
- Order sections: \`<script setup>\`, \`<template>\`, \`<style scoped>\`
- Use scoped styles to avoid CSS leakage
- Use CSS \`v-bind()\` for dynamic styles from component state
- Use \`<Teleport>\` for rendering modals and tooltips outside the component tree
- Use \`<Suspense>\` for async component loading with fallback

## Pinia State Management
- Create one store per domain concern (\`useUserStore\`, \`useCartStore\`)
- Use the setup store syntax with \`defineStore\` and a composition function
- Keep store actions for async operations and complex mutations
- Use getters (computed) for derived store state
- Avoid directly mutating store state from components - use actions
`,
      },
      {
        path: 'vue/naming.md',
        governance: 'recommended',
        description: 'Vue.js naming and file conventions',
        content: `# Vue.js Naming Conventions

## Files
- Component files: PascalCase (\`UserProfile.vue\`, \`NavBar.vue\`)
- Composable files: camelCase with \`use\` prefix (\`useAuth.ts\`, \`useFetch.ts\`)
- Store files: camelCase with store context (\`user.store.ts\`, \`cart.store.ts\`)
- Utility files: camelCase (\`formatDate.ts\`)
- Test files: same name with \`.test.ts\` or \`.spec.ts\` suffix

## Components
- Use PascalCase in templates: \`<UserProfile />\` (not \`<user-profile />\`)
- Use multi-word component names to avoid conflicts with HTML elements
- Base components: prefix with \`Base\`, \`App\`, or \`V\` (\`BaseButton\`, \`AppHeader\`)
- Single-instance components: prefix with \`The\` (\`TheNavbar\`, \`TheSidebar\`)
- Props: camelCase in script, kebab-case in templates

## Project Structure
- \`/src/components/\` - Reusable UI components
- \`/src/composables/\` - Composition functions
- \`/src/stores/\` - Pinia stores
- \`/src/views/\` or \`/src/pages/\` - Route-level components
- \`/src/router/\` - Vue Router configuration
- \`/src/assets/\` - Static assets
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Vue.js-Specific Review
- Verify Composition API with \`<script setup>\` is used - flag Options API in new code
- Check for proper reactivity: ref() for primitives, reactive() for objects, computed() for derived
- Verify composables follow the \`use\` prefix convention and return reactive refs
- Check for reactivity loss: destructuring reactive objects without toRefs()
- Verify Pinia stores use actions for mutations, not direct state modification from components
- Check for memory leaks: event listeners and watchers cleaned up on unmount
- Verify provide/inject has proper TypeScript typing with InjectionKey
- Check template expressions are simple - complex logic should be in computed properties
- Verify props use TypeScript types via defineProps<T>() for type safety
- Check for proper v-model implementation on custom components`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Vue.js Testing
- Use Vue Test Utils (\`@vue/test-utils\`) with \`mount\` or \`shallowMount\`
- Test components: render, interact (trigger events), assert (DOM, emitted events)
- Test composables by wrapping them in a test component or using a test utility
- Mock Pinia stores with \`createTestingPinia\` from @pinia/testing
- Test props with \`wrapper.setProps()\` and verify rendered output changes
- Test emitted events with \`wrapper.emitted()\`
- Mock Vue Router with \`createRouter\` using \`createMemoryHistory\`
- Test async behavior with \`await nextTick()\` or \`flushPromises()\`
- Use Vitest as the test runner for Vue 3 projects`,
      },
    ],
  },
};
