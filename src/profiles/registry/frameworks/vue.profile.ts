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
      {
        path: 'vue/security.md',
        paths: ['**/*.vue', '**/*.ts'],
        governance: 'recommended',
        description: 'Vue.js security best practices: XSS prevention, CSRF protection, input sanitization, CSP compatibility',
        content: `# Vue.js Security

## XSS Prevention

### v-html Dangers
- \`v-html\` renders raw HTML — NEVER use with user-provided or untrusted content
- Vue template expressions ({{ }}) are safe — they auto-escape HTML entities
- If \`v-html\` is absolutely required, sanitize input with a library like \`DOMPurify\`

\`\`\`typescript
// SAFE: template interpolation auto-escapes
// {{ userInput }} — <script> becomes &lt;script&gt;

// DANGEROUS: v-html with unsanitized user content
// <div v-html="userComment" /> — XSS vector if userComment contains <script>

// SAFE: sanitize before using v-html
import DOMPurify from 'dompurify'
const safeHtml = computed(() => DOMPurify.sanitize(rawHtml.value))
// <div v-html="safeHtml" />
\`\`\`

### Dynamic Attributes
- Avoid dynamically binding \`href\`, \`src\`, or \`action\` with unsanitized user input
- Validate URLs against a whitelist of protocols (reject \`javascript:\`, \`data:\`)

\`\`\`typescript
// DANGEROUS: unvalidated href
// <a :href="userProvidedUrl"> — could be javascript:alert(1)

// SAFE: validate protocol
const safeUrl = computed(() => {
  const url = userUrl.value
  if (/^https?:\\/\\//.test(url)) return url
  return '#'
})
\`\`\`

## CSRF Protection for API Calls

- Include CSRF tokens in all state-changing requests (POST, PUT, DELETE)
- Read CSRF token from a cookie or meta tag — never embed in JavaScript bundles
- Configure axios/fetch interceptors to attach CSRF headers automatically

\`\`\`typescript
// Configure axios with CSRF token
import axios from 'axios'
axios.defaults.headers.common['X-CSRF-TOKEN'] =
  document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
axios.defaults.withCredentials = true
\`\`\`

## Input Sanitization

- Validate and sanitize all user input on the client AND server
- Use typed form validation libraries (e.g., Zod, Valibot, VeeValidate with Yup)
- Never pass raw user input to \`v-html\`, \`innerHTML\`, or \`document.write\`
- Escape user input before using in RegExp constructors

\`\`\`typescript
// DANGEROUS: user input in RegExp without escaping
const regex = new RegExp(userQuery) // userQuery could be "(.*)" — ReDoS risk

// SAFE: escape special characters
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')
}
const regex = new RegExp(escapeRegExp(userQuery))
\`\`\`

## Content Security Policy (CSP) Compatibility

- Avoid inline styles generated by Vue when CSP disallows \`style-src 'unsafe-inline'\`
  - Use CSS classes or CSS custom properties instead of dynamic \`:style\` bindings
  - Configure Vite to extract CSS rather than inject inline styles
- Vue 3 does NOT require \`unsafe-eval\` (unlike Vue 2 with full build)
  - Ensure you use the runtime-only build (default with Vite/vue-loader)
  - The full build that compiles templates in-browser requires \`unsafe-eval\`
- Use nonce-based CSP for script tags when SSR (Nuxt provides built-in support)

\`\`\`typescript
// vite.config.ts — extract CSS for CSP compliance
export default defineConfig({
  build: {
    cssCodeSplit: true, // separate CSS files instead of inline
  },
})
\`\`\`

## General Security Practices
- Keep Vue and all dependencies updated — security patches are frequent
- Never store secrets (API keys, tokens) in client-side code or .env files served to the browser
- Use \`rel="noopener noreferrer"\` on external links opened with \`target="_blank"\`
- Audit third-party Vue plugins before adding — prefer well-maintained, popular libraries
`,
      },
      {
        path: 'vue/performance.md',
        paths: ['**/*.vue', '**/*.ts', '**/*.tsx'],
        governance: 'recommended',
        description: 'Vue.js performance optimization: lazy routes, async components, virtual scrolling, computed vs methods, v-once/v-memo, key management',
        content: `# Vue.js Performance Optimization

## Lazy-Loaded Routes

- Route-level components must be lazy-loaded to enable code splitting
- Use dynamic \`import()\` in Vue Router route definitions
- Group related routes with magic comments for named chunks

\`\`\`typescript
// CORRECT: lazy-loaded routes
const routes = [
  {
    path: '/dashboard',
    component: () => import('./views/DashboardView.vue'),
  },
  {
    path: '/settings',
    component: () => import(/* webpackChunkName: "settings" */ './views/SettingsView.vue'),
  },
]

// ANTI-PATTERN: eager import of all route components
import DashboardView from './views/DashboardView.vue'
import SettingsView from './views/SettingsView.vue'
// All code bundled together — no code splitting
\`\`\`

## Async Components

- Use \`defineAsyncComponent\` for heavy components not needed on initial render
- Provide loading and error states for better UX

\`\`\`typescript
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent({
  loader: () => import('./components/HeavyChart.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorFallback,
  delay: 200,    // show loading after 200ms
  timeout: 10000, // error after 10s
})
\`\`\`

## Virtual Scrolling for Large Lists

- For lists with 100+ items, use virtual scrolling to render only visible items
- Libraries: \`vue-virtual-scroller\`, \`@tanstack/vue-virtual\`
- Never render thousands of DOM nodes — it causes jank and memory issues

\`\`\`html
<!-- CORRECT: virtual scroller for large lists -->
<RecycleScroller
  :items="largeList"
  :item-size="50"
  key-field="id"
  v-slot="{ item }"
>
  <ListItem :data="item" />
</RecycleScroller>

<!-- ANTI-PATTERN: rendering 10,000 items directly -->
<!-- <div v-for="item in tenThousandItems" :key="item.id">{{ item.name }}</div> -->
\`\`\`

## Computed vs Methods

- \`computed()\` caches results and only re-evaluates when dependencies change
- Methods (plain functions called in template) re-run on every render
- Use \`computed()\` for derived data, methods only for event handlers

\`\`\`typescript
// CORRECT: computed for expensive derived state — cached
const sortedItems = computed(() =>
  [...items.value].sort((a, b) => a.name.localeCompare(b.name))
)

// ANTI-PATTERN: method called in template — re-sorts on every render
function getSortedItems() {
  return [...items.value].sort((a, b) => a.name.localeCompare(b.name))
}
// Template: {{ getSortedItems() }} — recalculated on each render
\`\`\`

## v-once and v-memo

### v-once — Render Once, Skip All Future Updates
\`\`\`html
<!-- CORRECT: static content that never changes -->
<footer v-once>
  <p>Copyright 2024 MyApp. All rights reserved.</p>
</footer>

<!-- Use for: license text, static headers, terms of service -->
<!-- Do NOT use on content with reactive bindings you expect to update -->
\`\`\`

### v-memo — Skip Re-renders When Dependencies Haven't Changed
\`\`\`html
<!-- CORRECT: memoize expensive list item rendering -->
<div
  v-for="item in list"
  :key="item.id"
  v-memo="[item.id === selectedId, item.name]"
>
  <ExpensiveItemRenderer :item="item" :selected="item.id === selectedId" />
</div>

<!-- v-memo skips re-render of this div if [item.id === selectedId, item.name]
     haven't changed — useful for large lists with few changing items -->
\`\`\`

## Key Management in v-for

### Always Use Stable, Unique Keys
\`\`\`html
<!-- CORRECT: stable unique ID as key -->
<TodoItem v-for="todo in todos" :key="todo.id" :todo="todo" />

<!-- ANTI-PATTERN: array index as key — breaks transitions, reuses wrong DOM nodes -->
<TodoItem v-for="(todo, index) in todos" :key="index" :todo="todo" />

<!-- ANTI-PATTERN: non-unique key — unpredictable behavior -->
<TodoItem v-for="todo in todos" :key="todo.category" :todo="todo" />
\`\`\`

### Key Impacts on Component Reuse
\`\`\`html
<!-- Force re-creation of component when key changes (full lifecycle reset) -->
<UserProfile :key="userId" :user-id="userId" />
<!-- Useful when component has internal state that should reset on user switch -->

<!-- Without key: Vue patches the existing instance (cheaper, but state persists) -->
<UserProfile :user-id="userId" />
\`\`\`

## Additional Performance Tips

- Use \`shallowRef()\` for large immutable datasets (avoid deep Proxy traversal)
- Use \`markRaw()\` for non-reactive third-party instances (chart libs, map instances)
- Avoid deep watchers on large objects — watch specific properties instead
- Use \`<KeepAlive>\` to cache route-level components that are expensive to re-create
- Profile with Vue DevTools performance tab before optimizing — measure first
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
        name: 'vue-composition-guide',
        description: 'Detailed reference for Vue Composition API patterns: ref, reactive, computed, watchers, composables, provide/inject, lifecycle, template refs',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Vue Composition API — Detailed Reference

## ref vs reactive

### ref() — Primary Reactive Primitive
- Works with primitives AND objects
- Access via \`.value\` in script, auto-unwrapped in templates
- Can be reassigned freely (\`count.value = 5\`)
- Destructuring preserves reactivity (each ref is independent)

\\\`\\\`\\\`typescript
// CORRECT: ref for all reactive state
const count = ref(0)
const user = ref<User | null>(null)
count.value++
user.value = await fetchUser(id)
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: reactive for state that gets reassigned
const state = reactive({ user: null })
// This BREAKS reactivity — all existing watchers stop working:
// state = reactive({ user: newUser })
\\\`\\\`\\\`

### reactive() — When Appropriate
- Only for grouped object state that will never be reassigned
- Beware: destructuring loses reactivity

\\\`\\\`\\\`typescript
// CORRECT: reactive for grouped, non-reassigned state
const form = reactive({
  name: '',
  email: '',
  age: 0,
})
form.name = 'Alice' // fine — property mutation is reactive

// ANTI-PATTERN: destructuring reactive
const { name, email } = form // name and email are now plain strings, NOT reactive
\\\`\\\`\\\`

---

## Computed Properties

\\\`\\\`\\\`typescript
// CORRECT: computed for derived state — cached, only re-evaluates when deps change
const fullName = computed(() => \\\`\\\${firstName.value} \\\${lastName.value}\\\`)
const filteredItems = computed(() =>
  items.value.filter(item => item.status === filter.value)
)

// CORRECT: writable computed for two-way derived state
const fullName = computed({
  get: () => \\\`\\\${firstName.value} \\\${lastName.value}\\\`,
  set: (val: string) => {
    const [first, ...rest] = val.split(' ')
    firstName.value = first
    lastName.value = rest.join(' ')
  },
})
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: using methods instead of computed for derived state
// Methods re-run on every render; computed caches until deps change
function getFullName() {
  return \\\`\\\${firstName.value} \\\${lastName.value}\\\`
}
\\\`\\\`\\\`

---

## Watchers: watch vs watchEffect

### watch() — Explicit Sources
\\\`\\\`\\\`typescript
// CORRECT: watch specific source, access old and new values
watch(userId, async (newId, oldId) => {
  if (newId !== oldId) {
    user.value = await fetchUser(newId)
  }
})

// CORRECT: watch multiple sources
watch([firstName, lastName], ([newFirst, newLast]) => {
  fullName.value = \\\`\\\${newFirst} \\\${newLast}\\\`
})

// CORRECT: deep watch on reactive object
watch(
  () => form.address,
  (newAddr) => { validateAddress(newAddr) },
  { deep: true }
)
\\\`\\\`\\\`

### watchEffect() — Automatic Dependency Tracking
\\\`\\\`\\\`typescript
// CORRECT: watchEffect for auto-tracked side effects
watchEffect(() => {
  document.title = \\\`\\\${count.value} items\\\`
})

// CORRECT: cleanup function for async effects
watchEffect((onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  fetchData(query.value, { signal: controller.signal })
    .then(data => { result.value = data })
})
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: watch without cleanup for async operations
watch(searchQuery, async (query) => {
  // Race condition: if query changes fast, old responses may overwrite new ones
  result.value = await fetchResults(query)
})
\\\`\\\`\\\`

---

## Composables (Custom Hooks Equivalent)

\\\`\\\`\\\`typescript
// CORRECT: composable with flexible input, cleanup, and plain-object return
import { ref, watchEffect, onScopeDispose, toValue, type MaybeRefOrGetter } from 'vue'

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  watchEffect((onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())

    isLoading.value = true
    fetch(toValue(url), { signal: controller.signal })
      .then(res => res.json())
      .then(json => { data.value = json })
      .catch(err => { if (err.name !== 'AbortError') error.value = err })
      .finally(() => { isLoading.value = false })
  })

  return { data, error, isLoading } // plain object of refs
}
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: returning reactive object — breaks destructuring
export function useFetch(url: string) {
  const state = reactive({ data: null, error: null, isLoading: false })
  // ...
  return state // consumer doing { data } = useFetch() loses reactivity
}
\\\`\\\`\\\`

---

## Provide / Inject

\\\`\\\`\\\`typescript
// CORRECT: typed injection key for type safety
import { type InjectionKey, provide, inject, ref } from 'vue'

interface ThemeContext {
  theme: Ref<'light' | 'dark'>
  toggle: () => void
}

export const ThemeKey: InjectionKey<ThemeContext> = Symbol('theme')

// In parent component
const theme = ref<'light' | 'dark'>('light')
provide(ThemeKey, {
  theme,
  toggle: () => { theme.value = theme.value === 'light' ? 'dark' : 'light' },
})

// In child component
const themeCtx = inject(ThemeKey)
if (!themeCtx) throw new Error('ThemeKey not provided')
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: untyped string key — no type safety, easy typos
provide('theme', theme)
const t = inject('theme') // t is unknown
\\\`\\\`\\\`

---

## Lifecycle Hooks in setup

\\\`\\\`\\\`typescript
// CORRECT: lifecycle hooks inside <script setup>
import { onMounted, onUnmounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // cleanup before DOM removal
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: calling lifecycle hooks outside setup or composable
setTimeout(() => {
  onMounted(() => { /* ... */ }) // ERROR: must be called synchronously during setup
}, 100)
\\\`\\\`\\\`

---

## Template Refs

\\\`\\\`\\\`typescript
// CORRECT: typed template ref
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

// In template: <input ref="inputRef" />
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// CORRECT: component template ref with InstanceType
import MyComponent from './MyComponent.vue'
const compRef = ref<InstanceType<typeof MyComponent> | null>(null)

onMounted(() => {
  compRef.value?.exposedMethod()
})

// In template: <MyComponent ref="compRef" />
// MyComponent must use defineExpose({ exposedMethod })
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: accessing ref before mount
const inputRef = ref<HTMLInputElement | null>(null)
inputRef.value?.focus() // null — DOM not yet available during setup
\\\`\\\`\\\`
`,
      },
      {
        name: 'vue-reactivity-guide',
        description: 'Detailed reference for Vue reactivity system: Proxy internals, ref unwrapping, reactive limitations, toRefs, shallowRef, readonly, effectScope',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Vue Reactivity System — Detailed Reference

## How Reactivity Works (Proxy-Based)

Vue 3 uses JavaScript \`Proxy\` to intercept get/set operations on reactive objects.
When a reactive property is read during a render or effect, Vue tracks it as a dependency.
When that property is later set, Vue triggers all tracked effects to re-run.

\\\`\\\`\\\`typescript
// Under the hood (simplified):
// reactive({ count: 0 }) creates a Proxy that:
//   - On GET: tracks the current effect as a subscriber of "count"
//   - On SET: notifies all subscribers of "count" to re-run
// ref(0) wraps a value in { value: ... } and applies the same Proxy logic
\\\`\\\`\\\`

Key implications:
- Only property access on Proxy objects is tracked — plain variables are NOT reactive
- Replacing the entire reactive object breaks the Proxy connection
- \`ref()\` wraps primitives in an object so Proxy can intercept \`.value\`

---

## ref Unwrapping

### Automatic Unwrapping in Templates
\\\`\\\`\\\`typescript
// CORRECT: ref auto-unwraps in templates — no .value needed
const count = ref(0)
// Template: {{ count }} — NOT {{ count.value }}
\\\`\\\`\\\`

### Unwrapping in reactive()
\\\`\\\`\\\`typescript
// CORRECT: ref inside reactive auto-unwraps
const count = ref(0)
const state = reactive({ count })
state.count++ // no .value needed — ref unwraps inside reactive

// WARNING: ref does NOT unwrap inside reactive arrays or Map/Set
const list = reactive([ref(0)])
list[0].value // .value IS needed here — no auto-unwrap in arrays
\\\`\\\`\\\`

### Unwrapping in Composable Returns
\\\`\\\`\\\`typescript
// CORRECT: return plain object of refs — caller uses .value in script
function useCounter() {
  const count = ref(0)
  const increment = () => { count.value++ }
  return { count, increment }
}

const { count } = useCounter()
count.value // .value needed in script
// Template: {{ count }} — auto-unwrapped
\\\`\\\`\\\`

---

## reactive() Limitations

### Cannot Hold Primitives
\\\`\\\`\\\`typescript
// ANTI-PATTERN: reactive with primitive — TypeError
// const count = reactive(0) // ERROR: reactive() only accepts objects

// CORRECT: use ref for primitives
const count = ref(0)
\\\`\\\`\\\`

### Destructuring Loses Reactivity
\\\`\\\`\\\`typescript
// ANTI-PATTERN: destructuring reactive object
const state = reactive({ x: 1, y: 2 })
let { x, y } = state // x and y are now plain numbers — NOT reactive
x++ // does NOT update state.x

// CORRECT: use toRefs to maintain reactivity
const { x, y } = toRefs(state)
x.value++ // updates state.x reactively
\\\`\\\`\\\`

### Reassignment Breaks Reactivity
\\\`\\\`\\\`typescript
// ANTI-PATTERN: reassigning reactive variable
let state = reactive({ count: 0 })
watch(() => state.count, (n) => console.log(n))
state = reactive({ count: 1 }) // watcher above is now tracking the OLD object

// CORRECT: use ref for state that may be reassigned
const state = ref({ count: 0 })
state.value = { count: 1 } // watchers still work
\\\`\\\`\\\`

---

## toRefs / toRef Patterns

\\\`\\\`\\\`typescript
// CORRECT: toRefs for destructuring reactive object
const state = reactive({ name: 'Alice', age: 30 })
const { name, age } = toRefs(state)
// name and age are Ref<string> and Ref<number>, linked to state

// CORRECT: toRef for a single property
const nameRef = toRef(state, 'name')

// CORRECT: toRef with getter (Vue 3.3+)
const nameRef = toRef(() => props.name) // read-only ref from getter
\\\`\\\`\\\`

### Composable Props Pattern
\\\`\\\`\\\`typescript
// CORRECT: accept props reactively in composable
function useUserProfile(props: { userId: string }) {
  // toRef maintains reactivity to prop changes
  const userId = toRef(() => props.userId)

  watch(userId, async (id) => {
    profile.value = await fetchProfile(id)
  }, { immediate: true })
}
\\\`\\\`\\\`

---

## shallowRef / shallowReactive for Performance

### shallowRef — Only .value Assignment Triggers
\\\`\\\`\\\`typescript
// CORRECT: shallowRef for large data that is replaced, not mutated
const rows = shallowRef<TableRow[]>([])

// This triggers reactivity (new .value assignment):
rows.value = [...rows.value, newRow]

// This does NOT trigger reactivity (mutation without reassignment):
// rows.value.push(newRow) // silent — no reactive update
// Use triggerRef(rows) to force update after mutation if needed
\\\`\\\`\\\`

### shallowReactive — Only Top-Level Properties Are Reactive
\\\`\\\`\\\`typescript
// CORRECT: shallowReactive for config objects with nested non-reactive data
const config = shallowReactive({
  theme: 'dark',        // reactive
  chartOptions: { ... } // NOT deeply reactive
})
config.theme = 'light' // triggers update
// config.chartOptions.color = 'red' // does NOT trigger update
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: deep reactive on large third-party objects
const chart = reactive(hugeChartInstance) // Proxy wraps every nested property — slow
// CORRECT: markRaw or shallowRef
const chart = shallowRef(hugeChartInstance)
\\\`\\\`\\\`

---

## readonly

\\\`\\\`\\\`typescript
// CORRECT: readonly for state exposed to children — prevents mutation
const state = reactive({ count: 0 })
const readonlyState = readonly(state)

provide('state', readonlyState)
// Consumer: inject('state') — cannot mutate, changes propagate from parent

// CORRECT: readonly ref
const count = ref(0)
const readonlyCount = readonly(count)
// readonlyCount.value++ // TypeScript error + runtime warning
\\\`\\\`\\\`

### Protect Store State
\\\`\\\`\\\`typescript
// CORRECT: expose readonly state, mutable only through actions
export function useUserStore() {
  const _user = ref<User | null>(null)
  const user = readonly(_user)

  async function login(credentials: Credentials) {
    _user.value = await authApi.login(credentials)
  }

  return { user, login }
}
\\\`\\\`\\\`

---

## effectScope for Cleanup

\\\`\\\`\\\`typescript
// CORRECT: effectScope to group and dispose multiple effects
import { effectScope, watch, watchEffect, computed, onScopeDispose } from 'vue'

const scope = effectScope()

scope.run(() => {
  const doubled = computed(() => count.value * 2)
  watch(doubled, (val) => console.log(val))
  watchEffect(() => { document.title = \\\`Count: \\\${count.value}\\\` })

  onScopeDispose(() => {
    console.log('all effects in this scope cleaned up')
  })
})

// Later: dispose ALL effects in the scope at once
scope.stop()
\\\`\\\`\\\`

### Composable with effectScope
\\\`\\\`\\\`typescript
// CORRECT: effectScope in composables for deterministic cleanup
export function useFeatureFlags() {
  const scope = effectScope()
  const flags = ref<Record<string, boolean>>({})

  scope.run(() => {
    watchEffect((onCleanup) => {
      const unsubscribe = flagsService.subscribe((newFlags) => {
        flags.value = newFlags
      })
      onCleanup(unsubscribe)
    })
  })

  onScopeDispose(() => scope.stop())

  return { flags }
}
\\\`\\\`\\\`

\\\`\\\`\\\`typescript
// ANTI-PATTERN: manual cleanup of many watchers without effectScope
const stop1 = watch(a, () => { /* ... */ })
const stop2 = watch(b, () => { /* ... */ })
const stop3 = watchEffect(() => { /* ... */ })
onUnmounted(() => {
  stop1()
  stop2()
  stop3() // fragile — easy to forget one
})
\\\`\\\`\\\`

---

## Common Reactivity Pitfalls Summary

| Pitfall | Fix |
|---|---|
| Destructuring \`reactive()\` | Use \`toRefs()\` or switch to \`ref()\` |
| Reassigning \`reactive()\` | Use \`ref()\` instead |
| Mutating \`shallowRef\` internals | Reassign \`.value\` or call \`triggerRef()\` |
| Storing class instances in \`reactive\` | Use \`markRaw()\` or \`shallowRef()\` |
| Losing reactivity in composable return | Return plain object of refs, not \`reactive()\` |
| Nested ref in array/Map | Access with \`.value\` — no auto-unwrap in collections |
`,
      },
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
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/v-for=/.test(c)){const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/v-for=/.test(lines[i])&&/v-if=/.test(lines[i]))console.log(\'WARNING: v-for and v-if on the same element at line \'+(i+1)+\' — use a computed property or <template> wrapper (Vue Style Guide Priority A)\')}}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/v-for=/.test(c)){const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/v-for=/.test(lines[i])&&!/:key=/.test(lines[i])&&!/\\.vue/.test(lines[i])){const next=lines[i+1]||\'\';if(!/:key=/.test(next))console.log(\'WARNING: v-for without :key at line \'+(i+1)+\' — always provide a stable unique key (Vue Style Guide Priority A)\')}}}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/<style(?!.*scoped)(?!.*module)\\s*>/.test(c)&&!/<style.*scoped/.test(c)&&!/<style.*module/.test(c))console.log(\'WARNING: <style> without scoped or module attribute — styles will leak globally (Vue Style Guide Priority A)\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/<script[^>]*>/.test(c)&&!/<script[^>]*setup/.test(c)&&/export default/.test(c))console.log(\'WARNING: Options API detected — use <script setup> with Composition API for new Vue 3 components\')" -- "$FILE_PATH"',
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
