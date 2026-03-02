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

### Composition API & Script Setup
- Use \`<script setup>\` with TypeScript for all new components — it is the recommended default
- Use \`ref()\` as the primary reactive primitive for all state (primitives and objects)
- Use \`reactive()\` only when you need a plain object with no reassignment and no destructuring
- Use \`computed()\` for all derived state — never compute values inside templates
- Use \`watch()\` for side effects triggered by specific reactive source changes
- Use \`watchEffect()\` for effects with automatic dependency tracking
- Use \`toRefs()\` or \`toRef()\` when destructuring reactive objects to preserve reactivity
- Use \`shallowRef()\` for large immutable structures or external state (e.g., third-party class instances)
- Use \`defineModel()\` (Vue 3.4+) for two-way binding on custom components — replaces manual prop + emit pattern

### Component Communication
- Props down, events up: \`defineProps<T>()\` for input, \`defineEmits<T>()\` for output — always with TypeScript generics
- Never mutate props directly — emit an event and let the parent update
- Never use \`getCurrentInstance()\` to access parent internals — use events or provide/inject
- Use \`provide()\` / \`inject()\` with typed \`InjectionKey<T>\` for deep component tree data sharing
- Use Pinia stores for shared global state — avoid hand-rolled reactive singletons in large apps

### Composables
- Name composable functions with \`use\` prefix: \`useAuth\`, \`useFetch\`, \`useLocalStorage\`
- Return a plain object of refs (not a reactive object) — enables destructuring without losing reactivity
- Accept refs, getter functions, or plain values as input — normalize with \`toValue()\`
- Handle cleanup with \`onUnmounted()\` or \`onScopeDispose()\` — never leave event listeners or timers dangling
- Call composables only in \`<script setup>\`, \`setup()\`, or lifecycle hooks — always synchronously

### Single-File Component Structure
- Order sections consistently: \`<script setup>\`, \`<template>\`, \`<style scoped>\`
- Always use scoped styles or CSS Modules — never leak global styles from components
- Use CSS \`v-bind()\` for dynamic styles derived from component state
- Prefer class selectors over element selectors in scoped styles (element selectors are slow)

### Style Guide Priorities (from vuejs.org/style-guide)
- **Priority A (Essential)**: multi-word component names, detailed prop definitions, keyed v-for, never v-if with v-for on same element, scoped styles
- **Priority B (Strongly Recommended)**: PascalCase filenames, base component prefix (Base/App/V), full-word names, self-closing components, multi-attribute elements on multiple lines, simple template expressions
- **Priority C (Recommended)**: consistent SFC tag order, consistent attribute order

### Performance
- Use \`shallowRef()\` and \`shallowReactive()\` for large data sets where deep reactivity is wasteful
- Use \`markRaw()\` for third-party class instances that should never be proxied (maps, chart objects, editors)
- Use \`v-once\` for content that never changes after initial render
- Use \`v-memo\` to skip re-rendering of expensive sub-trees when dependencies are unchanged
- Lazy-load routes with \`defineAsyncComponent()\` or dynamic \`import()\` in Vue Router
- For lists exceeding 100 items, use virtual scrolling (vue-virtual-scroller or similar)

### Accessibility
- Use semantic HTML elements (\`<button>\`, \`<nav>\`, \`<main>\`, \`<form>\`)
- Provide \`aria-label\` on interactive elements without visible text
- Ensure keyboard accessibility on all interactive elements
- Manage focus correctly in modals, drawers, and Teleport-rendered content`,
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
        governance: 'mandatory',
        description: 'Vue 3 reactivity system, Composition API patterns, and composable conventions',
        content: `# Vue.js Reactivity & Composition API

## Reactivity Fundamentals

### ref() — Primary Reactive Primitive
Use \`ref()\` for all reactive state. It works with primitives and objects, and avoids
the pitfalls of \`reactive()\` (no reassignment, no destructuring issues).

\`\`\`vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const count = ref(0)
const user = ref<User | null>(null)

// Access with .value in script, auto-unwrapped in template
count.value++
</script>

<template>
  <p>{{ count }}</p> <!-- No .value needed in template -->
</template>
\`\`\`

### reactive() — Use Sparingly
Only use \`reactive()\` when you have a plain object that will never be reassigned
and never destructured.

\`\`\`typescript
// CORRECT: stable object, no reassignment
const formState = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

// WRONG: reassignment breaks reactivity
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // watchers on old proxy are now dead

// WRONG: destructuring breaks reactivity
const { count } = reactive({ count: 0 })
count++ // has no effect on the original
\`\`\`

### computed() — All Derived State
Move any non-trivial expression out of templates into computed properties.

\`\`\`vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const items = ref<CartItem[]>([])
const taxRate = ref(0.21)

// Split complex computations into simple, testable computed properties
const subtotal = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)
const tax = computed(() => subtotal.value * taxRate.value)
const total = computed(() => subtotal.value + tax.value)
</script>

<template>
  <!-- CORRECT: clean template using named computed values -->
  <p>Subtotal: {{ subtotal }}</p>
  <p>Tax: {{ tax }}</p>
  <p>Total: {{ total }}</p>

  <!-- WRONG: complex expression in template -->
  <!-- <p>{{ items.reduce((s, i) => s + i.price * i.quantity, 0) * (1 + taxRate) }}</p> -->
</template>
\`\`\`

### watch() vs watchEffect()
- Use \`watch()\` when you need the old and new value, or want to react to specific sources
- Use \`watchEffect()\` when you want automatic dependency tracking with no need for old values

\`\`\`typescript
import { ref, watch, watchEffect } from 'vue'

const query = ref('')
const page = ref(1)

// watch: explicit source, access old + new value
watch(query, (newQuery, oldQuery) => {
  if (newQuery !== oldQuery) {
    page.value = 1 // reset pagination when search changes
  }
})

// watchEffect: automatic dependency tracking
watchEffect(async () => {
  const results = await fetchResults(query.value, page.value)
  // triggers whenever query OR page changes
})
\`\`\`

### Preserving Reactivity
\`\`\`typescript
import { reactive, toRefs, toRef } from 'vue'

const state = reactive({ x: 0, y: 0 })

// WRONG: loses reactivity
const { x, y } = state

// CORRECT: toRefs preserves reactivity on destructured properties
const { x, y } = toRefs(state)

// CORRECT: toRef for a single property
const x = toRef(state, 'x')
\`\`\`

### Advanced Reactivity APIs
- \`shallowRef()\`: only \`.value\` assignment is reactive, not nested mutations — use for large immutable data
- \`triggerRef()\`: force effects to run after mutating a shallowRef's inner state
- \`customRef()\`: full control over dependency tracking — use for debounced refs
- \`markRaw()\`: mark an object as never-to-be-proxied — use for third-party class instances
- \`toRaw()\`: get the original object from a reactive proxy — use for serialization or passing to non-Vue code
- \`effectScope()\`: group effects for bulk disposal — use in composables that manage many watchers

\`\`\`typescript
import { customRef } from 'vue'

export function useDebouncedRef<T>(initialValue: T, delay = 300) {
  let timeout: ReturnType<typeof setTimeout>
  return customRef<T>((track, trigger) => {
    let value = initialValue
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      },
    }
  })
}
\`\`\`

---

## Composables

### Convention: Return Plain Object of Refs
\`\`\`typescript
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event: MouseEvent) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  // CORRECT: plain object of refs — destructurable without losing reactivity
  return { x, y }
}
\`\`\`

### Convention: Accept Flexible Inputs with toValue()
\`\`\`typescript
import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  watchEffect(async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(toValue(url))
      if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
      data.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      isLoading.value = false
    }
  })

  return { data, error, isLoading }
}

// Accepts ref, getter, or plain string
const { data } = useFetch(ref('/api/users'))
const { data } = useFetch(() => \`/api/users/\${props.id}\`)
const { data } = useFetch('/api/static-resource')
\`\`\`

### Cleanup with onScopeDispose
\`\`\`typescript
import { ref, onScopeDispose } from 'vue'

export function useInterval(callback: () => void, ms: number) {
  const isActive = ref(true)
  const id = setInterval(() => {
    if (isActive.value) callback()
  }, ms)

  // Works in both component and non-component scopes (effectScope)
  onScopeDispose(() => clearInterval(id))

  function stop() { isActive.value = false; clearInterval(id) }

  return { isActive, stop }
}
\`\`\`
`,
      },
      {
        path: 'vue/component-patterns.md',
        governance: 'mandatory',
        description: 'Vue.js component design, communication, and naming conventions',
        content: `# Vue.js Component Patterns

## Component Communication

### Props with TypeScript Generics
\`\`\`vue
<script setup lang="ts">
interface Props {
  /** User to display in the card */
  user: User
  /** Whether the card is visually highlighted */
  isHighlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHighlighted: false,
})
</script>
\`\`\`

### Typed Emits
\`\`\`vue
<script setup lang="ts">
const emit = defineEmits<{
  select: [userId: string]
  delete: [userId: string, reason?: string]
}>()

function handleSelect() {
  emit('select', props.user.id)
}
</script>
\`\`\`

### defineModel() for Two-Way Binding (Vue 3.4+)
\`\`\`vue
<!-- RangeSlider.vue -->
<script setup lang="ts">
const min = defineModel<number>('min', { required: true })
const max = defineModel<number>('max', { required: true })
</script>

<template>
  <input type="range" v-model.number="min" :max="max" />
  <input type="range" v-model.number="max" :min="min" />
</template>

<!-- Parent usage -->
<!-- <RangeSlider v-model:min="priceMin" v-model:max="priceMax" /> -->
\`\`\`

### Provide / Inject with InjectionKey
\`\`\`typescript
// keys.ts
import type { InjectionKey, Ref } from 'vue'

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')
\`\`\`

\`\`\`vue
<!-- Provider.vue -->
<script setup lang="ts">
import { provide, ref } from 'vue'
import { ThemeKey } from './keys'

const theme = ref<'light' | 'dark'>('light')
provide(ThemeKey, theme)
</script>
\`\`\`

\`\`\`vue
<!-- Consumer.vue (any depth) -->
<script setup lang="ts">
import { inject } from 'vue'
import { ThemeKey } from './keys'

// Typed automatically via InjectionKey
const theme = inject(ThemeKey)
if (!theme) throw new Error('ThemeKey not provided')
</script>
\`\`\`

---

## Naming Conventions (Priority A + B from official Style Guide)

### Files
| Concept | Convention | Example |
|---------|-----------|---------|
| Component file | PascalCase | \`UserProfile.vue\` |
| Base component | Prefix with Base/App/V | \`BaseButton.vue\`, \`AppHeader.vue\` |
| Singleton component | Prefix with The | \`TheNavbar.vue\`, \`TheSidebar.vue\` |
| Tightly coupled child | Parent name as prefix | \`TodoListItem.vue\`, \`TodoListItemButton.vue\` |
| Composable file | camelCase with use prefix | \`useAuth.ts\`, \`useFetch.ts\` |
| Store file | camelCase | \`user.store.ts\`, \`cart.store.ts\` |
| Test file | Same name + .test/.spec | \`UserProfile.test.ts\` |

### Components
- Always use multi-word names to avoid conflicts with HTML elements
- Use PascalCase in SFC templates: \`<UserProfile />\` (not \`<user-profile />\`)
- Use full words: \`StudentDashboardSettings\` not \`SdSettings\`
- Self-close components with no content: \`<BaseIcon />\`
- Place multiple attributes on separate lines:

\`\`\`vue
<!-- CORRECT -->
<UserCard
  :user="currentUser"
  :is-highlighted="isSelected"
  @select="handleSelect"
/>

<!-- WRONG: hard to read on one line -->
<UserCard :user="currentUser" :is-highlighted="isSelected" @select="handleSelect" />
\`\`\`

### Props and Events
- Props: camelCase in script, kebab-case in templates — be consistent within the project
- Events: kebab-case strings in \`defineEmits\`, e.g. \`'update:modelValue'\`

---

## Project Structure
\`\`\`
src/
  components/        # Reusable UI components
    base/            # Base/presentational components (BaseButton, BaseInput)
    layout/          # Layout components (TheNavbar, TheSidebar)
  composables/       # Composition functions (useAuth, useFetch)
  stores/            # Pinia stores (user.store.ts, cart.store.ts)
  views/ or pages/   # Route-level components
  router/            # Vue Router configuration
  types/             # Shared TypeScript types
  utils/             # Pure utility functions
  assets/            # Static assets (images, fonts)
\`\`\`

---

## v-for and v-if Rules (Priority A — Essential)

\`\`\`vue
<!-- CORRECT: always provide a stable, unique key with v-for -->
<ul>
  <li v-for="todo in todos" :key="todo.id">
    {{ todo.text }}
  </li>
</ul>

<!-- CORRECT: use computed property to filter, not v-if on same element -->
<script setup lang="ts">
const activeTodos = computed(() => todos.value.filter(t => t.isActive))
</script>
<template>
  <ul>
    <li v-for="todo in activeTodos" :key="todo.id">
      {{ todo.text }}
    </li>
  </ul>
</template>

<!-- WRONG: v-if and v-for on the same element -->
<!-- <li v-for="todo in todos" v-if="todo.isActive" :key="todo.id"> -->
\`\`\`

---

## Teleport, Suspense, and Async Components

\`\`\`vue
<!-- Teleport modals outside the component tree for correct stacking -->
<Teleport to="body">
  <div v-if="isModalOpen" class="modal-overlay" @keydown.escape="close">
    <dialog open class="modal-dialog" role="dialog" aria-modal="true">
      <slot />
    </dialog>
  </div>
</Teleport>
\`\`\`

\`\`\`vue
<!-- Suspense with async components -->
<Suspense>
  <template #default>
    <AsyncDashboard />
  </template>
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>
\`\`\`
`,
      },
      {
        path: 'vue/pinia-state-management.md',
        governance: 'recommended',
        description: 'Pinia store patterns, conventions, and anti-patterns',
        content: `# Pinia State Management

## Why Pinia
Pinia is the official Vue state management library, maintained by the Vue core team.
Use Pinia for any shared state that crosses component boundaries in medium-to-large apps.
Do NOT use Vuex in new projects — it is in maintenance mode.

## Setup Store Syntax (Recommended)
Use the Composition API style with \`defineStore\` — it aligns with \`<script setup>\` patterns.

\`\`\`typescript
// stores/cart.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // State — refs
  const items = ref<CartItem[]>([])
  const couponCode = ref<string | null>(null)

  // Getters — computed
  const itemCount = computed(() => items.value.length)
  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  const discount = computed(() => {
    if (couponCode.value === 'SAVE20') return subtotal.value * 0.2
    return 0
  })
  const total = computed(() => subtotal.value - discount.value)

  // Actions — functions
  function addItem(product: Product, quantity = 1) {
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      })
    }
  }

  function removeItem(productId: string) {
    items.value = items.value.filter(i => i.productId !== productId)
  }

  async function applyCoupon(code: string) {
    const valid = await validateCoupon(code)
    if (valid) couponCode.value = code
    return valid
  }

  function clearCart() {
    items.value = []
    couponCode.value = null
  }

  return {
    items, couponCode,
    itemCount, subtotal, discount, total,
    addItem, removeItem, applyCoupon, clearCart,
  }
})
\`\`\`

## Store Conventions
- **One store per domain concern**: \`useUserStore\`, \`useCartStore\`, \`useNotificationStore\`
- **Use actions for all mutations**: never modify store state directly from components
- **Use getters (computed) for derived state**: avoid duplicating computation across components
- **Keep stores thin**: business logic that does not need shared state belongs in composables, not stores
- **Avoid circular store dependencies**: if store A needs store B and vice versa, extract shared logic into a composable

## Usage in Components
\`\`\`vue
<script setup lang="ts">
import { useCartStore } from '@/stores/cart.store'
import { storeToRefs } from 'pinia'

const cartStore = useCartStore()

// Use storeToRefs for reactive destructuring of state/getters
const { items, total, itemCount } = storeToRefs(cartStore)

// Actions are plain functions — destructure directly
const { addItem, removeItem } = cartStore
</script>

<template>
  <p>{{ itemCount }} items — Total: {{ total }}</p>
</template>
\`\`\`

## Anti-Patterns

\`\`\`typescript
// WRONG: mutating store state directly from a component
const store = useCartStore()
store.items.push(newItem)          // bypasses action logic
store.couponCode = 'HACK'          // no validation

// CORRECT: use actions
store.addItem(product, 1)
await store.applyCoupon('SAVE20')
\`\`\`

\`\`\`typescript
// WRONG: destructuring state loses reactivity
const { items, total } = useCartStore()
// items and total are now plain values, not reactive

// CORRECT: use storeToRefs for state/getters
const { items, total } = storeToRefs(useCartStore())
\`\`\`

## Testing Pinia Stores
\`\`\`typescript
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart.store'

describe('CartStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should add item to cart', () => {
    const store = useCartStore()
    store.addItem({ id: '1', name: 'Widget', price: 10 })
    expect(store.items).toHaveLength(1)
    expect(store.subtotal).toBe(10)
  })

  it('should increment quantity for existing item', () => {
    const store = useCartStore()
    const product = { id: '1', name: 'Widget', price: 10 }
    store.addItem(product)
    store.addItem(product)
    expect(store.items).toHaveLength(1)
    expect(store.items[0].quantity).toBe(2)
  })
})
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
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
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/v-for=/.test(c)){const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/v-for=/.test(lines[i])&&/v-if=/.test(lines[i]))console.log(\'WARNING: v-for and v-if on the same element at line \'+(i+1)+\' — use a computed property or <template> wrapper (Vue Style Guide Priority A)\')}}" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/v-for=/.test(c)){const lines=c.split(\'\\n\');for(let i=0;i<lines.length;i++){if(/v-for=/.test(lines[i])&&!/:key=/.test(lines[i])&&!/\\.vue/.test(lines[i])){const next=lines[i+1]||\'\';if(!/:key=/.test(next))console.log(\'WARNING: v-for without :key at line \'+(i+1)+\' — always provide a stable unique key (Vue Style Guide Priority A)\')}}}" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/<style(?!.*scoped)(?!.*module)\\s*>/.test(c)&&!/<style.*scoped/.test(c)&&!/<style.*module/.test(c))console.log(\'WARNING: <style> without scoped or module attribute — styles will leak globally (Vue Style Guide Priority A)\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.vue\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/<script[^>]*>/.test(c)&&!/<script[^>]*setup/.test(c)&&/export default/.test(c))console.log(\'WARNING: Options API detected — use <script setup> with Composition API for new Vue 3 components\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
    externalTools: [
      {
        type: 'eslint',
        filePath: '.eslintrc.vue.json',
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
