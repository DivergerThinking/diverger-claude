import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const reactProfile: Profile = {
  id: 'frameworks/react',
  name: 'React',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['react'],
  contributions: {
    claudeMd: [
      {
        heading: 'React Conventions',
        order: 20,
        content: `## React Conventions

### Component Design
- Use functional components exclusively — no class components
- Keep components under 120 lines; extract sub-components when growing beyond that
- One component per file — the filename must match the component name in PascalCase
- Separate presentational components (UI) from container components (data/logic)
- Use composition via \`children\` and render props instead of deep prop drilling
- Use \`React.forwardRef\` when wrapping native DOM elements that consumers need to ref

### Hooks Discipline
- Follow the Rules of Hooks: only call hooks at the top level, only inside React functions or custom hooks
- Never call hooks inside conditions, loops, nested functions, try/catch, or after early returns
- Always include all reactive values in useEffect/useMemo/useCallback dependency arrays
- Use the exhaustive-deps ESLint rule — never suppress it without a documented justification
- Prefer \`useState\` for simple local state, \`useReducer\` for complex state transitions or related values
- Use \`useRef\` for values that must persist across renders without triggering re-renders (timers, DOM nodes, previous values)

### Avoiding Unnecessary Effects
- Derive values during rendering instead of syncing them with useEffect — if a value can be computed from props or state, compute it inline
- Use \`useMemo\` for expensive derived computations, not useEffect + setState
- Handle user interactions in event handlers, not in useEffect reacting to state changes
- Use \`key\` prop to reset component state on identity change instead of useEffect + setState
- Reserve useEffect exclusively for synchronization with external systems (subscriptions, DOM APIs, network)
- Always return a cleanup function from effects that set up subscriptions, timers, or event listeners

### State Architecture
- Colocate state as close as possible to where it is consumed
- Lift state up only when multiple siblings genuinely share the same data
- Use context for cross-cutting concerns (theme, locale, auth) — not as a general state manager
- For complex global client state, use a dedicated library (Zustand, Jotai, Redux Toolkit)
- Prefer controlled components for forms; use uncontrolled only for simple, non-validated inputs
- Batch related state updates in event handlers to avoid cascading re-renders

### Server Components (React 19+)
- Default to Server Components — add \`'use client'\` only when interactivity is required
- Keep \`'use client'\` boundaries as low in the component tree as possible
- Server Components can directly access databases and server-only APIs without exposing secrets
- Pass rendered JSX from Server Components as children/props to Client Components — never import Server Components inside Client Components
- Use \`async/await\` in Server Components for data fetching; use Suspense for streaming

### Performance
- Do not wrap every component in \`React.memo\` by default — profile with React DevTools first
- Use \`useMemo\` for computationally expensive derivations with stable dependency arrays
- Use \`useCallback\` only when passing callbacks to memoized children or as Effect dependencies
- Use \`useTransition\` to mark non-urgent state updates that can be interrupted
- Use \`useDeferredValue\` to defer rendering of expensive sub-trees during user input
- Use dynamic \`import()\` or \`React.lazy\` for code-splitting heavy components

### Accessibility
- Use semantic HTML elements (\`<button>\`, \`<nav>\`, \`<main>\`, \`<section>\`, \`<form>\`)
- Provide \`aria-label\` or \`aria-labelledby\` for interactive elements without visible text
- Ensure all interactive elements are keyboard accessible (focus, Enter, Escape)
- Manage focus correctly in modals, drawers, and dynamically revealed content
- Use \`role\` attributes only when no semantic HTML element fits the purpose
- Include alt text on all images; use \`alt=""\` for purely decorative images`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx react-scripts:*)',
          'Bash(npx vite:*)',
          'Bash(npx eslint:*)',
          'Bash(npx tsc:*)',
        ],
      },
    },
    rules: [
      {
        path: 'react/hooks-and-effects.md',
        governance: 'mandatory',
        description: 'Rules of Hooks, effect discipline, and avoiding unnecessary effects',
        content: `# React Hooks & Effects

## Rules of Hooks (non-negotiable)
- Only call hooks at the top level of a component or custom hook
- Never call hooks inside loops, conditions, nested functions, try/catch blocks, or after early returns
- Custom hooks must start with the \`use\` prefix followed by a capital letter
- Always include all reactive values (props, state, derived values) in dependency arrays
- Install and enable \`eslint-plugin-react-hooks\` with the exhaustive-deps rule

### Correct
\`\`\`tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchUser(userId).then((data) => {
      if (!cancelled) {
        setUser(data);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (isLoading) return <Spinner />;
  if (!user) return <NotFound />;
  return <ProfileCard user={user} />;
}
\`\`\`

### Anti-Pattern
\`\`\`tsx
function UserProfile({ userId }: { userId: string }) {
  // WRONG: hook called conditionally
  if (!userId) return null;
  const [user, setUser] = useState<User | null>(null);

  // WRONG: hook inside condition
  if (userId) {
    useEffect(() => { fetchUser(userId); }, [userId]);
  }
}
\`\`\`

## When NOT to Use useEffect

### 1. Deriving values — compute during render
\`\`\`tsx
// WRONG: redundant state + effect for derived value
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// CORRECT: compute inline
const fullName = firstName + ' ' + lastName;
\`\`\`

### 2. Expensive computations — use useMemo
\`\`\`tsx
// WRONG: effect + state for filtering
const [filtered, setFiltered] = useState<Todo[]>([]);
useEffect(() => {
  setFiltered(todos.filter((t) => t.status === filter));
}, [todos, filter]);

// CORRECT: useMemo
const filtered = useMemo(
  () => todos.filter((t) => t.status === filter),
  [todos, filter],
);
\`\`\`

### 3. Resetting state on identity change — use key
\`\`\`tsx
// WRONG: effect to reset comment on user change
useEffect(() => { setComment(''); }, [userId]);

// CORRECT: key forces full remount and state reset
<CommentForm key={userId} userId={userId} />
\`\`\`

### 4. Reacting to user events — use event handlers
\`\`\`tsx
// WRONG: effect reacting to state set by an event
useEffect(() => {
  if (submitted) {
    postForm(formData);
  }
}, [submitted, formData]);

// CORRECT: call directly from the handler
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  postForm(formData);
}
\`\`\`

### 5. Notifying parents — call in the handler
\`\`\`tsx
// WRONG: effect to notify parent of state change
useEffect(() => { onChange(value); }, [value, onChange]);

// CORRECT: notify in the same handler that sets state
function handleChange(next: string) {
  setValue(next);
  onChange(next);
}
\`\`\`

## Legitimate Uses of useEffect
- Subscribing to external stores (prefer \`useSyncExternalStore\` when possible)
- Connecting to WebSockets, EventSource, or third-party widget libraries
- Setting up and tearing down DOM event listeners not managed by React
- Synchronizing with browser APIs (IntersectionObserver, ResizeObserver, MediaQuery)
- Fetching data on mount or when dependencies change (always include a cleanup flag for race conditions)

## Effect Cleanup
Every effect that acquires a resource MUST return a cleanup function:

\`\`\`tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => setData(data))
    .catch((err) => {
      if (err.name !== 'AbortError') setError(err);
    });
  return () => controller.abort();
}, [url]);
\`\`\`
`,
      },
      {
        path: 'react/component-architecture.md',
        governance: 'mandatory',
        description: 'React component design, composition, and state architecture patterns',
        content: `# React Component Architecture

## Component Design
- One exported component per file, filename matches component name (\`UserProfile.tsx\`)
- Props interface named \`ComponentNameProps\` and declared immediately before the component
- Destructure props in the function signature for readability
- Keep components under 120 lines — extract sub-components or custom hooks when growing

### Correct
\`\`\`tsx
interface UserCardProps {
  user: User;
  onSelect: (userId: string) => void;
  isHighlighted?: boolean;
}

export function UserCard({ user, onSelect, isHighlighted = false }: UserCardProps) {
  function handleClick() {
    onSelect(user.id);
  }

  return (
    <article
      className={cn('user-card', { highlighted: isHighlighted })}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
      aria-label={\`Select \${user.name}\`}
    >
      <Avatar src={user.avatarUrl} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </article>
  );
}
\`\`\`

## Composition Over Prop Drilling
When data needs to cross more than 2 component levels, prefer composition:

\`\`\`tsx
// WRONG: drilling theme through 3+ levels
<App theme={theme}>
  <Layout theme={theme}>
    <Sidebar theme={theme}>
      <NavItem theme={theme} />

// CORRECT: composition via children
<ThemeProvider value={theme}>
  <Layout>
    <Sidebar>
      <NavItem /> {/* reads theme via useTheme() */}
\`\`\`

## Custom Hooks
- Name hooks \`useDescriptiveAction\` — \`useAuth\`, \`useDebounce\`, \`usePagination\`
- Each hook serves one concrete purpose — avoid generic lifecycle wrappers (\`useMount\`, \`useUpdateEffect\`)
- Return descriptively named values, not positional arrays for complex returns
- Document the hook's contract with JSDoc when it has non-obvious behavior

### Correct
\`\`\`tsx
/** Debounces a value by the given delay. Returns the debounced value. */
function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
\`\`\`

### Anti-Pattern
\`\`\`tsx
// WRONG: generic lifecycle wrapper — hides intent, suppresses lint warnings
function useMount(fn: () => void) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fn(); }, []);
}
\`\`\`

## State Colocation Rules
1. Can it be computed from existing props or state? → Derive it inline or with useMemo
2. Is it used by a single component? → Keep it local with useState
3. Is it shared between siblings? → Lift to the nearest common parent
4. Is it shared across distant components? → Use context (for low-frequency updates) or a state library (for high-frequency updates)
5. Does it need to survive navigation? → Use URL search params, localStorage, or a global store

## List Rendering
- Always provide a stable, unique \`key\` — never use array index for lists that reorder, insert, or delete
- Extract the list item into its own component when it has non-trivial logic

\`\`\`tsx
// CORRECT: stable key from data identity
{users.map((user) => (
  <UserCard key={user.id} user={user} onSelect={handleSelect} />
))}

// WRONG: index key on a dynamic list
{users.map((user, index) => (
  <UserCard key={index} user={user} onSelect={handleSelect} />
))}
\`\`\`

## Naming Conventions
| Concept | Pattern | Example |
|---------|---------|---------|
| Component file | PascalCase.tsx | \`UserProfile.tsx\` |
| Hook file | camelCase.ts | \`useAuth.ts\` |
| Utility file | camelCase.ts | \`formatDate.ts\` |
| Test file | *.test.tsx | \`UserProfile.test.tsx\` |
| Component name | PascalCase | \`UserProfile\` |
| Props interface | ComponentNameProps | \`UserProfileProps\` |
| Event handler | handleEventName | \`handleSubmit\` |
| Event prop | onEventName | \`onSubmit\` |
| Context | NameContext | \`AuthContext\` |
| Provider | NameProvider | \`AuthProvider\` |
| Context hook | useName | \`useAuth\` |
`,
      },
      {
        path: 'react/performance.md',
        governance: 'recommended',
        description: 'React performance optimization patterns and anti-patterns',
        content: `# React Performance

## Memoization — Profile Before Optimizing
Do NOT apply memoization speculatively. Measure first with React DevTools Profiler.

### When to use React.memo
- The component renders often with the same props (parent re-renders but child props are stable)
- The component renders expensive sub-trees (large lists, charts, SVG)

\`\`\`tsx
// Only memoize when profiling shows unnecessary re-renders
const ExpensiveList = React.memo(function ExpensiveList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});
\`\`\`

### When to use useMemo
- The computation is measurably expensive (>1ms in profiler)
- The result is passed as a prop to a memoized child

\`\`\`tsx
const sortedItems = useMemo(
  () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
  [items],
);
\`\`\`

### When to use useCallback
- The callback is a dependency of a child's useEffect or useMemo
- The callback is passed to a React.memo'd child

\`\`\`tsx
const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []);
\`\`\`

## Avoiding Unnecessary Re-renders
- Move state down — if only a sub-tree needs the state, put it there
- Extract the expensive child into its own component that receives stable props
- Split context providers: separate frequently-changing values from rarely-changing values

\`\`\`tsx
// WRONG: one context for everything causes all consumers to re-render
<AppContext.Provider value={{ user, theme, notifications }}>

// CORRECT: split by update frequency
<UserContext.Provider value={user}>
  <ThemeContext.Provider value={theme}>
    <NotificationContext.Provider value={notifications}>
\`\`\`

## Code Splitting
- Use \`React.lazy\` + \`Suspense\` for route-level code splitting
- Use dynamic \`import()\` for heavy third-party libraries loaded on demand

\`\`\`tsx
const AnalyticsDashboard = React.lazy(() => import('./AnalyticsDashboard'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
\`\`\`

## Virtualization
- For lists exceeding 100 items, use windowing (\`react-window\`, \`@tanstack/react-virtual\`)
- Never render thousands of DOM nodes — virtualize or paginate

## Transitions
- Use \`useTransition\` to mark expensive state updates as non-urgent
- Use \`useDeferredValue\` to defer rendering of search results or filtered lists during typing

\`\`\`tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => filterResults(deferredQuery), [deferredQuery]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ResultList results={results} />
    </>
  );
}
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## React-Specific Review

### Hooks Compliance
- Verify Rules of Hooks: no conditional hooks, no hooks after early returns, no hooks in loops or try/catch
- Check that all useEffect/useMemo/useCallback dependency arrays include every reactive value
- Flag any \`eslint-disable react-hooks/exhaustive-deps\` without a documented justification

### Effect Discipline
- Flag useEffect that derives values computable during render (should be inline or useMemo)
- Flag useEffect that reacts to user events (should be in event handlers)
- Flag useEffect used to notify parent of state changes (should call onChange in the handler)
- Flag chains of useEffect where one sets state consumed by another
- Verify every effect that sets up subscriptions, timers, or listeners returns a cleanup function
- Check data-fetching effects for race-condition protection (cleanup flag or AbortController)

### Component Quality
- Verify proper \`key\` usage in lists — no index keys for dynamic lists
- Check for direct DOM manipulation (document.getElementById, querySelector) instead of refs
- Check for prop drilling beyond 2 levels that should use composition or context
- Verify controlled vs uncontrolled form inputs are used consistently — no mixing
- Check that components stay under 120 lines; flag oversized components

### State Architecture
- Verify state is colocated as close to consumption as possible
- Flag state lifted higher than necessary
- Check for unnecessary context usage where prop passing suffices (1-2 levels)
- Flag React context used for high-frequency updates (should use a state library)

### Performance
- Flag React.memo / useMemo / useCallback without evidence of a measured performance problem
- Check for object/array literals created inline in JSX props (unstable references)
- Flag missing code splitting for heavy route-level components

### Accessibility
- Verify semantic HTML elements are used (\`<button>\` not \`<div onClick>\`)
- Check that all interactive elements have keyboard handlers and focus management
- Verify images have meaningful alt text (or empty alt for decorative)
- Check modals/drawers for focus trapping and Escape key handling`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## React Testing

### Testing Library Principles
- Use React Testing Library — test user behavior, not implementation details
- Query by role, label, or text first — use \`data-testid\` only when no accessible query works
- Never test internal state (useState values) or hook call counts

### What to Test
- User interactions: click, type, submit, keyboard navigation (Tab, Enter, Escape)
- Conditional rendering: loading states, error states, empty states, permission-gated UI
- Form behavior: validation messages, submit with valid/invalid data, field interactions
- List rendering: correct items, correct order, add/remove behavior
- Custom hooks: use \`renderHook\` from @testing-library/react for hooks with complex logic

### Async Patterns
- Use \`waitFor\` for assertions on async state changes — never use arbitrary delays
- Use \`findBy*\` queries (which combine getBy + waitFor) for elements that appear asynchronously
- Wrap manual state updates in \`act()\` only when not using Testing Library's built-in event helpers

### Mocking Strategy
- Mock network calls (fetch, axios) at the boundary — use MSW (Mock Service Worker) for realistic API mocking
- Provide test wrappers for context providers (theme, auth, router)
- Never mock internal React components to test their parent — test the composed behavior

### Example Structure
\`\`\`tsx
describe('UserProfile', () => {
  it('should display user name and email after loading', async () => {
    render(<UserProfile userId="123" />, { wrapper: TestProviders });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    const heading = await screen.findByRole('heading', { name: /jane doe/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should show error message when fetch fails', async () => {
    server.use(http.get('/api/users/:id', () => HttpResponse.error()));
    render(<UserProfile userId="123" />, { wrapper: TestProviders });

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load/i);
  });
});
\`\`\``,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## React Refactoring Patterns

### Component Extraction
- Extract when a component exceeds 120 lines or has more than one visual responsibility
- Extract repeated JSX patterns into a shared component with props
- Extract complex conditional rendering into dedicated components (\`EmptyState\`, \`ErrorView\`, \`LoadingSpinner\`)

### Hook Extraction
- Extract into a custom hook when the same useState + useEffect pattern appears in 2+ components
- Name the hook after its purpose, not its lifecycle (\`useOnlineStatus\` not \`useMount\`)
- Return an object with descriptive keys for complex hooks: \`{ data, isLoading, error, refetch }\`

### Effect Elimination
- Convert useEffect + setState into inline derivation or useMemo
- Convert useEffect-based event notifications into event handler calls
- Replace useEffect-based external store subscriptions with useSyncExternalStore
- Replace useEffect that resets state on prop change with the key pattern

### State Simplification
- Replace multiple related useState calls with a single useReducer when state transitions depend on each other
- Push state down to the component that uses it when parent does not need it
- Replace prop drilling with composition (children) before reaching for context`,
      },
    ],
    skills: [
      {
        name: 'react-component-generator',
        description: 'Generate React components following project conventions and best practices',
        content: `# React Component Generator

When generating a React component, produce the following files:

## Component File (\`ComponentName.tsx\`)
1. Props interface (\`ComponentNameProps\`) with JSDoc on non-obvious fields
2. Functional component with destructured props and default values
3. Semantic HTML markup with proper ARIA attributes
4. Event handlers named \`handleEventName\`
5. Hooks at the top, ordered: state hooks, context, refs, derived values, effects

## Test File (\`ComponentName.test.tsx\`)
1. Import render, screen, userEvent from testing library
2. Test rendering with required props (happy path)
3. Test user interactions (click, type, keyboard)
4. Test conditional rendering (loading, error, empty states)
5. Test accessibility (roles, labels, keyboard navigation)

## Custom Hook (if applicable — \`useHookName.ts\`)
1. Typed parameters and return value
2. Cleanup in useEffect if subscriptions or timers are used
3. Companion test file using \`renderHook\`

## Conventions
- CSS Modules (\`ComponentName.module.css\`) or styled-components based on project convention
- Storybook story (\`ComponentName.stories.tsx\`) if Storybook is present in the project
- All files colocated in the same feature directory
`,
      },
      {
        name: 'react-hook-generator',
        description: 'Generate custom React hooks with proper patterns',
        content: `# React Custom Hook Generator

When generating a custom hook, follow these rules:

## File: \`useHookName.ts\`
1. Name starts with \`use\` + capital letter describing the concrete purpose
2. Typed parameters — use an options object for 3+ parameters
3. Typed return value — use an object with descriptive keys for complex returns
4. Include JSDoc documenting purpose, parameters, and return value
5. Handle cleanup in useEffect (AbortController, clearTimeout, removeEventListener)
6. Include all reactive values in dependency arrays

## File: \`useHookName.test.ts\`
1. Use \`renderHook\` from \`@testing-library/react\`
2. Test initial state
3. Test state changes via \`act()\`
4. Test cleanup on unmount
5. Test re-renders with changed dependencies

## Patterns to Apply
- Prefer \`useSyncExternalStore\` over useEffect for external store subscriptions
- Use AbortController for fetch-based hooks to prevent race conditions
- Return \`{ data, isLoading, error }\` for data-fetching hooks
- Use generics when the hook is reusable across different data types
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.tsx\')&&!f.endsWith(\'.jsx\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/useEffect\\s*\\(/.test(c)&&/(subscribe|addEventListener|setInterval|setTimeout|on\\()/.test(c)&&!/return\\s*(\\(\\)\\s*=>|function)/.test(c))console.log(\'WARNING: useEffect with subscription/timer but no cleanup return detected — add a cleanup function to prevent memory leaks\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.tsx\')&&!f.endsWith(\'.jsx\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const lines=c.split(\'\\n\');let inComp=false;for(let i=0;i<lines.length;i++){if(/^(export\\s+)?(function|const)\\s+[A-Z]/.test(lines[i]))inComp=true;if(inComp&&/\\<div\\s[^>]*onClick/.test(lines[i])&&!/role=/.test(lines[i]))console.log(\'WARNING: <div onClick> at line \'+(i+1)+\' — use <button> or add role=button + tabIndex=0 + keyboard handler for accessibility\')}" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.tsx\')&&!f.endsWith(\'.jsx\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const m=c.match(/useEffect\\s*\\(\\s*\\(\\)\\s*=>\\s*\\{[^}]*setState[^}]*\\}\\s*,\\s*\\[[^\\]]*\\]\\s*\\)/g);if(m&&m.length>=3)console.log(\'WARNING: \'+m.length+\' useEffect+setState chains detected — consider consolidating into event handlers or useReducer\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
    externalTools: [
      {
        type: 'eslint',
        filePath: '.eslintrc.react.json',
        config: {
          extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended'],
          plugins: ['react', 'react-hooks', 'jsx-a11y'],
          rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/self-closing-comp': 'error',
            'react/jsx-no-target-blank': 'error',
            'react/jsx-key': ['error', { checkFragmentShorthand: true }],
            'react/no-array-index-key': 'warn',
            'react/no-unstable-nested-components': 'error',
            'jsx-a11y/anchor-is-valid': 'error',
            'jsx-a11y/click-events-have-key-events': 'error',
            'jsx-a11y/no-static-element-interactions': 'error',
          },
          settings: {
            react: { version: 'detect' },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
