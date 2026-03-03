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

Composition API with \`<script setup>\`. Reactive state with \`ref()\` as primary primitive.

**Detailed rules:** see \`.claude/rules/vue/\` directory.

**Key rules:**
- \`ref()\` over \`reactive()\` for most state, \`computed()\` for derived values
- Props via \`defineProps\`, emits via \`defineEmits\` — no implicit \`this\` access
- Composables prefixed with \`use\`, return plain objects, handle cleanup
- Follow Vue Style Guide priority levels (A: Essential, B: Strongly Recommended)`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx vite:*)',
          'Bash(npx vue-tsc:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run build:*)',
          'Bash(npx vitest:*)',
          'Bash(npx eslint:*)',
          'Bash(npx histoire:*)',
        ],
      },
    },
    rules: [
      {
        path: 'vue/reactivity-and-composition.md',
        paths: ['**/*.vue', '**/*.ts', '**/*.tsx'],
        governance: 'mandatory',
        description: 'Vue 3 reactivity system, Composition API patterns, and composable conventions',
        content: `# Vue.js Reactivity & Composition API

## Reactivity Fundamentals

### ref() — Primary Reactive Primitive
- Use \`ref()\` for ALL reactive state — works with primitives and objects
- Access with \`.value\` in script, auto-unwrapped in template
- Prefer \`ref()\` over \`reactive()\` to avoid reassignment and destructuring pitfalls

### reactive() — Use Sparingly
- Only for plain objects that will never be reassigned or destructured
- Reassigning a reactive variable breaks all existing watchers
- Destructuring loses reactivity — use \`toRefs()\` or \`toRef()\` if needed

### computed() — All Derived State
- Move non-trivial expressions out of templates into \`computed()\`
- Split complex computations into simple, testable computed properties
- Computed values are cached and only re-evaluate when dependencies change

### watch() vs watchEffect()
- \`watch()\`: explicit source, access old + new value, react to specific sources
- \`watchEffect()\`: automatic dependency tracking, no old value access
- Always clean up side effects in watchers (return cleanup function)

### Preserving Reactivity
- Use \`toRefs(state)\` when destructuring a reactive object
- Use \`toRef(state, 'key')\` for a single property reference

### Advanced Reactivity APIs
- \`shallowRef()\`: only \`.value\` assignment is reactive — use for large immutable data
- \`triggerRef()\`: force effects after mutating shallowRef inner state
- \`customRef()\`: full control over tracking — use for debounced refs
- \`markRaw()\`: prevent proxying — use for third-party class instances
- \`toRaw()\`: get original object from proxy — use for serialization
- \`effectScope()\`: group effects for bulk disposal in composables

---

## Composables

### Conventions
- Prefix with \`use\` (e.g., \`useMouse\`, \`useFetch\`)
- Return a plain object of refs — not a reactive object — for destructurable reactivity
- Accept flexible inputs via \`MaybeRefOrGetter<T>\` + \`toValue()\`
- Clean up event listeners and timers in \`onUnmounted()\` or \`onScopeDispose()\`
- Use \`onScopeDispose()\` for cleanup that works in both component and effectScope contexts
- Extract into composable when same ref + watch + cleanup pattern appears in 2+ components
`,
      },
      {
        path: 'vue/component-patterns.md',
        paths: ['**/*.vue', '**/*.ts', '**/*.tsx'],
        governance: 'mandatory',
        description: 'Vue.js component design, communication, and naming conventions',
        content: `# Vue.js Component Patterns

## Component Communication

### Props
- Use TypeScript generics: \`defineProps<Props>()\` with \`withDefaults()\` for defaults
- JSDoc on non-obvious prop fields
- Never mutate props directly — emit an event and let the parent update

### Emits
- Type all emits: \`defineEmits<{ select: [userId: string] }>()\`
- Name event handlers \`handle*\` (e.g., \`handleSubmit\`, \`handleSelect\`)

### defineModel() (Vue 3.4+)
- Use \`defineModel()\` for v-model bindings instead of manual prop + emit pattern

### Provide / Inject
- Use typed \`InjectionKey<T>\` for type-safe provide/inject
- Always handle the case where inject returns undefined

---

## Naming Conventions (Priority A + B)

### Files
- Components: PascalCase (\`UserProfile.vue\`)
- Base components: prefix with Base/App/V (\`BaseButton.vue\`)
- Singletons: prefix with The (\`TheNavbar.vue\`)
- Coupled children: parent name as prefix (\`TodoListItem.vue\`)
- Composables: camelCase with \`use\` prefix (\`useAuth.ts\`)
- Stores: camelCase (\`user.store.ts\`)

### Components
- Always multi-word names (avoid HTML element conflicts)
- PascalCase in SFC templates: \`<UserProfile />\`
- Self-close components with no content: \`<BaseIcon />\`
- Multiple attributes on separate lines

### Props and Events
- Props: camelCase in script, kebab-case in templates
- Events: kebab-case strings in \`defineEmits\`

---

## Essential Rules (Priority A)

### v-for and v-if
- NEVER use \`v-if\` and \`v-for\` on the same element — use computed to filter
- Always provide a stable, unique \`:key\` on \`v-for\` loops

### Teleport and Suspense
- Use \`<Teleport to="body">\` for modals to ensure correct stacking context
- Wrap async components with \`<Suspense>\` and provide a fallback template

## Project Structure
- \`components/\` — reusable UI (\`base/\` for presentational, \`layout/\` for structure)
- \`composables/\` — composition functions (\`useAuth\`, \`useFetch\`)
- \`stores/\` — Pinia stores (\`user.store.ts\`)
- \`views/\` or \`pages/\` — route-level components
- \`router/\`, \`types/\`, \`utils/\`, \`assets/\`
`,
      },
      {
        path: 'vue/pinia-state-management.md',
        paths: ['**/*.vue', '**/*.ts', '**/*.tsx'],
        governance: 'recommended',
        description: 'Pinia store patterns, conventions, and anti-patterns',
        content: `# Pinia State Management

## Setup Store Syntax (Recommended)
- Use Composition API style with \`defineStore\` — aligns with \`<script setup>\`
- State as \`ref()\`, getters as \`computed()\`, actions as plain functions
- Return all state, getters, and actions from the setup function
- Do NOT use Vuex in new projects — it is in maintenance mode

## Store Conventions
- One store per domain concern: \`useUserStore\`, \`useCartStore\`, \`useNotificationStore\`
- Use actions for ALL mutations — never modify store state directly from components
- Use getters (computed) for derived state — avoid duplicating computation
- Keep stores thin — business logic that doesn't need shared state goes in composables
- Avoid circular store dependencies — extract shared logic into a composable

## Usage in Components
- Use \`storeToRefs()\` for reactive destructuring of state and getters
- Destructure actions directly (they are plain functions, no reactivity needed)
- Never destructure state/getters without \`storeToRefs()\` — loses reactivity

## Testing
- Use \`setActivePinia(createPinia())\` in \`beforeEach\` for isolated store unit tests
- Use \`createTestingPinia\` from \`@pinia/testing\` for component tests
- Test actions, getters, and state transitions independently
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['vue-component-generator', 'vue-composable-generator'],
        prompt: `## Vue.js-Specific Review

### Composition API Compliance
- Verify \`<script setup>\` with TypeScript is used — flag Options API in new code
- Flag use of \`this\` outside Options API migration code — \`<script setup>\` has no \`this\`
- Verify component names are multi-word (Priority A Essential rule)

### Reactivity Correctness
- Verify \`ref()\` is used for reactive state — flag bare \`let\` variables that should be refs
- Check for reactivity loss: destructuring \`reactive()\` without \`toRefs()\` / \`toRef()\`
- Check for \`reactive()\` reassignment: \`state = reactive({...})\` breaks all existing watchers
- Verify \`computed()\` is used for derived values — flag complex expressions in templates
- Verify watchers clean up side effects (return a cleanup function or use \`onScopeDispose\`)
- Flag mutation of \`shallowRef\` inner properties without \`triggerRef()\` — it silently fails

### Component Communication
- Verify props use TypeScript generics: \`defineProps<T>()\` not \`defineProps({ ... })\` for type safety
- Verify emits are typed: \`defineEmits<{ event: [payload] }>()\`
- Flag direct prop mutation — emit an event and let the parent update
- Flag use of \`getCurrentInstance()\` to access parent — use events or provide/inject
- Verify \`provide()\` / \`inject()\` uses typed \`InjectionKey<T>\`
- Verify \`defineModel()\` is used for v-model bindings (Vue 3.4+) instead of manual prop + emit

### Composable Quality
- Verify composables follow the \`use\` prefix convention
- Verify composables return a plain object of refs — not a reactive object
- Check that composable inputs accept refs/getters via \`toValue()\` for flexibility
- Verify event listeners and timers are cleaned up in \`onUnmounted\` or \`onScopeDispose\`
- Flag composables that call composables outside synchronous setup context

### Pinia Store Patterns
- Verify Pinia stores use actions for mutations — flag direct state modification from components
- Verify \`storeToRefs()\` is used when destructuring store state/getters
- Flag circular store dependencies — extract shared logic into composables

### Style Guide Priorities
- Flag \`v-if\` and \`v-for\` on the same element (Priority A)
- Flag missing \`:key\` on \`v-for\` loops (Priority A)
- Flag element selectors in scoped styles — prefer class selectors (Priority D performance)
- Verify multi-attribute elements use one attribute per line (Priority B)
- Check for single-word component names (Priority A — conflicts with HTML elements)

### Performance
- Flag deep reactive objects passed to large lists — suggest \`shallowRef\`
- Flag \`markRaw\` missing on third-party class instances stored in reactive state
- Check for missing lazy loading on route-level components`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['vue-component-generator', 'vue-composable-generator'],
        prompt: `## Vue.js Testing

### Component Testing with Vue Test Utils
- Use Vue Test Utils (\`@vue/test-utils\`) with \`mount\` for integration tests, \`shallowMount\` when isolating a component from children
- Use Vitest as the test runner — it shares Vite's config and is the recommended default for Vue 3

### What to Test
- Rendering: verify correct DOM output for given props
- User interactions: \`await wrapper.find('button').trigger('click')\`, then assert DOM or emitted events
- Emitted events: \`expect(wrapper.emitted('select')).toEqual([[userId]])\`
- Props reactivity: \`await wrapper.setProps({ ... })\` then assert updated output
- Slots: pass slot content via \`mount(Comp, { slots: { default: '<p>content</p>' } })\`
- Async behavior: \`await nextTick()\` or \`await flushPromises()\` after state changes

### Composable Testing
- Test composables by wrapping in a test component or using a helper:
\`\`\`typescript
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

function withSetup<T>(composable: () => T) {
  let result!: T
  mount(defineComponent({
    setup() {
      result = composable()
      return () => null
    },
  }))
  return result
}

const { x, y } = withSetup(() => useMouse())
\`\`\`

### Pinia Store Testing
- Use \`createTestingPinia\` from \`@pinia/testing\` for component tests
- Use \`setActivePinia(createPinia())\` for isolated store unit tests
- Verify actions, getters, and state transitions independently

### Mock Patterns
- Mock Vue Router: \`createRouter({ history: createMemoryHistory(), routes })\`
- Mock API calls: use MSW or vi.mock for fetch/axios
- Provide injection keys: \`mount(Comp, { global: { provide: { [ThemeKey]: ref('light') } } })\`

### Example Structure
\`\`\`typescript
describe('TodoList', () => {
  it('should render all todo items', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [{ id: '1', text: 'Buy milk', isActive: true }] },
    })
    expect(wrapper.findAll('[data-testid="todo-item"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Buy milk')
  })

  it('should emit delete when remove button is clicked', async () => {
    const wrapper = mount(TodoList, {
      props: { todos: [{ id: '1', text: 'Buy milk', isActive: true }] },
    })
    await wrapper.find('[data-testid="remove-btn"]').trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['1']])
  })
})
\`\`\``,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['vue-component-generator', 'vue-composable-generator'],
        prompt: `## Vue.js Refactoring Patterns

### Options API to Composition API Migration
- Replace \`data()\` with \`ref()\` / \`reactive()\`
- Replace \`computed: { ... }\` with \`computed(() => ...)\`
- Replace \`methods: { ... }\` with plain functions in \`<script setup>\`
- Replace \`watch: { ... }\` with \`watch()\` / \`watchEffect()\`
- Replace \`mounted()\`, \`unmounted()\` with \`onMounted()\`, \`onUnmounted()\`
- Replace \`mixins\` with composables — each mixin becomes a \`use*\` function
- Replace \`this.$emit\` with \`const emit = defineEmits<T>()\`

### Extract Composable
- When the same \`ref\` + \`watch\`/\`watchEffect\` + \`onUnmounted\` pattern appears in 2+ components, extract into a composable
- When component logic exceeds 80 lines and has distinct concerns, split into multiple composables

### Pinia Migration from Vuex
- Replace \`state\` with \`ref()\`
- Replace \`getters\` with \`computed()\`
- Replace \`mutations\` + \`actions\` with plain functions (Pinia has no mutations concept)
- Replace \`mapState\` / \`mapActions\` with \`storeToRefs()\` + direct method access

### Reactive Simplification
- Replace \`reactive()\` + \`toRefs()\` with multiple \`ref()\` values when properties are independent
- Replace manual prop + emit v-model with \`defineModel()\` (Vue 3.4+)
- Replace \`this.$parent\` access with \`provide/inject\` or events`,
      },
    ],
    skills: [
      {
        name: 'vue-component-generator',
        description: 'Generate Vue 3 SFC components with Composition API and TypeScript',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Vue Component Generator

When generating a Vue 3 component, produce the following files:

## Component File (\`ComponentName.vue\`)
1. \`<script setup lang="ts">\` section with:
   - TypeScript interface for props (with JSDoc on non-obvious fields)
   - \`defineProps<Props>()\` with \`withDefaults()\` for optional defaults
   - \`defineEmits<{ ... }>()\` with typed payloads
   - \`defineModel()\` if the component supports v-model
   - Reactive state with \`ref()\` and derived state with \`computed()\`
   - Event handlers named \`handle*\` (e.g., \`handleSubmit\`, \`handleSelect\`)
   - Composable calls at the top, before other logic
2. \`<template>\` section with:
   - Semantic HTML elements
   - Multi-attribute elements on separate lines
   - \`:key\` on all \`v-for\` loops
   - No \`v-if\` on the same element as \`v-for\`
   - PascalCase for child component usage
3. \`<style scoped>\` section with:
   - Class selectors (never element selectors)
   - \`v-bind()\` for dynamic values from state

## Test File (\`ComponentName.test.ts\`)
1. Import mount from @vue/test-utils
2. Test rendering with required props (happy path)
3. Test user interactions (trigger events, assert emitted events)
4. Test conditional rendering (loading, error, empty states)
5. Test slot content rendering

## Composable (if reusable logic is involved)
1. \`use*.ts\` file with typed input/output
2. Cleanup in \`onUnmounted\` or \`onScopeDispose\`
3. Return plain object of refs

## Conventions
- All files colocated in the same feature directory
- Multi-word component name (Priority A essential rule)
- PascalCase filename matching the component name
`,
      },
      {
        name: 'vue-composable-generator',
        description: 'Generate Vue 3 composables with proper conventions',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Vue Composable Generator

When generating a composable, follow these rules:

## File: \`use<Name>.ts\`
1. Name starts with \`use\` + PascalCase describing the concrete purpose
2. Accept flexible input: \`MaybeRefOrGetter<T>\` + \`toValue()\` for reactive parameters
3. Return a plain object of refs (not a reactive object) for destructurable reactivity
4. Include JSDoc documenting purpose, parameters, and return value
5. Handle cleanup in \`onUnmounted()\` or \`onScopeDispose()\`
6. Use \`watchEffect()\` or \`watch()\` for reactive side effects

## File: \`use<Name>.test.ts\`
1. Use a withSetup helper or mount a test component that calls the composable
2. Test initial state
3. Test reactive updates (change input, verify output)
4. Test cleanup on scope disposal
5. Test edge cases (null input, empty data, error conditions)

## Patterns to Apply
- For data fetching: return \`{ data, error, isLoading }\`
- For event listeners: setup in onMounted, cleanup in onUnmounted
- For timers/intervals: cleanup in onScopeDispose
- For localStorage: sync with a watcher, handle JSON parse errors
- For media queries: use matchMedia with proper listener cleanup
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/v-for=/.test(c)){const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/v-for=/.test(lines[i])&&/v-if=/.test(lines[i]))console.log(\'WARNING: v-for and v-if on the same element at line \'+(i+1)+\' — use a computed property or <template> wrapper (Vue Style Guide Priority A)\')}}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/v-for=/.test(c)){const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/v-for=/.test(lines[i])&&!/:key=/.test(lines[i])&&!/\\.vue/.test(lines[i])){const next=lines[i+1]||\'\';if(!/:key=/.test(next))console.log(\'WARNING: v-for without :key at line \'+(i+1)+\' — always provide a stable unique key (Vue Style Guide Priority A)\')}}}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/<style(?!.*scoped)(?!.*module)\\s*>/.test(c)&&!/<style.*scoped/.test(c)&&!/<style.*module/.test(c))console.log(\'WARNING: <style> without scoped or module attribute — styles will leak globally (Vue Style Guide Priority A)\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/<script[^>]*>/.test(c)&&!/<script[^>]*setup/.test(c)&&/export default/.test(c))console.log(\'WARNING: Options API detected — use <script setup> with Composition API for new Vue 3 components\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
    externalTools: [
      {
        type: 'eslint',
        filePath: '.eslintrc.json',
        config: {
          extends: [
            'plugin:vue/vue3-recommended',
            'plugin:vue-scoped-css/vue3-recommended',
          ],
          plugins: ['vue'],
          rules: {
            'vue/multi-word-component-names': 'error',
            'vue/no-v-for-template-key-on-child': 'error',
            'vue/no-use-v-if-with-v-for': 'error',
            'vue/require-v-for-key': 'error',
            'vue/no-mutating-props': 'error',
            'vue/require-default-prop': 'warn',
            'vue/require-prop-types': 'error',
            'vue/component-definition-name-casing': ['error', 'PascalCase'],
            'vue/component-name-in-template-casing': ['error', 'PascalCase'],
            'vue/define-emits-declaration': ['error', 'type-based'],
            'vue/define-props-declaration': ['error', 'type-based'],
            'vue/no-required-prop-with-default': 'error',
            'vue/prefer-define-options': 'error',
            'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
            'vue/html-self-closing': ['error', {
              html: { void: 'always', normal: 'always', component: 'always' },
            }],
            'vue/max-attributes-per-line': ['error', { singleline: 3, multiline: 1 }],
            'vue/no-template-shadow': 'error',
            'vue/this-in-template': ['error', 'never'],
          },
          parser: 'vue-eslint-parser',
          parserOptions: {
            parser: '@typescript-eslint/parser',
            ecmaVersion: 'latest',
            sourceType: 'module',
          },
        },
        mergeStrategy: 'create-only',
      },
      {
        type: 'editorconfig',
        filePath: 'vite.config.ts',
        config: {
          plugins: ['@vitejs/plugin-vue'],
          resolve: {
            alias: { '@': './src' },
          },
          server: {
            port: 5173,
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
