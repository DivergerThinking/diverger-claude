import type { Profile, HookScriptDefinition } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';
import { makeNodeCheckScript } from '../../hook-script-templates.js';

function buildReactHookScripts(): HookScriptDefinition[] {
  return [
    {
      filename: 'react-effect-cleanup.sh',
      isPreToolUse: false,
      content: makeNodeCheckScript({
        filename: 'react-effect-cleanup.sh',
        nodeScript: `const f=process.argv[1]||'';if(!f.endsWith('.tsx')&&!f.endsWith('.jsx'))process.exit(0);const c=require('fs').readFileSync(f,'utf8');if(/useEffect\\s*\\(/.test(c)&&/(subscribe|addEventListener|setInterval|setTimeout|on\\()/.test(c)&&!/return\\s*(\\(\\)\\s*=>|function)/.test(c)){process.stderr.write('useEffect with subscription/timer but no cleanup return detected');process.exit(1)}`,
        message: 'Warning: useEffect missing cleanup for subscription/timer — add a cleanup return',
        exitCode: 2,
      }),
    },
    {
      filename: 'react-a11y-click.sh',
      isPreToolUse: false,
      content: makeNodeCheckScript({
        filename: 'react-a11y-click.sh',
        nodeScript: `const f=process.argv[1]||'';if(!f.endsWith('.tsx')&&!f.endsWith('.jsx'))process.exit(0);const c=require('fs').readFileSync(f,'utf8');const lines=c.split('\\n');let found=false;for(let i=0;i<lines.length;i++){if(/<div\\s[^>]*onClick/.test(lines[i])&&!/role=/.test(lines[i])){process.stderr.write('<div onClick> at line '+(i+1)+' — use <button> or add role + tabIndex + keyboard handler\\n');found=true}}if(found)process.exit(1)`,
        message: 'Warning: <div onClick> without accessibility attributes found',
        exitCode: 2,
      }),
    },
    {
      filename: 'react-effect-chains.sh',
      isPreToolUse: false,
      content: makeNodeCheckScript({
        filename: 'react-effect-chains.sh',
        nodeScript: `const f=process.argv[1]||'';if(!f.endsWith('.tsx')&&!f.endsWith('.jsx'))process.exit(0);const c=require('fs').readFileSync(f,'utf8');const m=c.match(/useEffect\\s*\\(\\s*\\(\\)\\s*=>\\s*\\{[^}]*setState[^}]*\\}\\s*,\\s*\\[[^\\]]*\\]\\s*\\)/g);if(m&&m.length>=3){process.stderr.write(m.length+' useEffect+setState chains — consolidate into event handlers or useReducer');process.exit(1)}`,
        message: 'Warning: multiple useEffect+setState chains detected — consider consolidating',
        exitCode: 2,
      }),
    },
  ];
}

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

Server Components by default (React 19+). Minimal \`useEffect\` — derive state, use event handlers.

**Detailed rules:** see \`.claude/rules/react/\` directory.

**Key rules:**
- One component per file (<120 lines), composition over prop drilling
- Rules of Hooks are non-negotiable — no conditional hooks, complete dependency arrays
- Avoid useEffect for: derived state, user events, data transforms — use event handlers or useMemo
- Test with Testing Library: query by role/label, test behavior not implementation`,
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
        paths: ['**/*.tsx', '**/*.jsx'],
        governance: 'mandatory',
        description: 'Rules of Hooks, effect discipline, and avoiding unnecessary effects',
        content: `# React Hooks & Effects

## Rules of Hooks (non-negotiable)
- Only call hooks at the top level of a component or custom hook
- Never call hooks inside loops, conditions, nested functions, try/catch blocks, or after early returns
- Custom hooks must start with \`use\` prefix followed by a capital letter
- Always include all reactive values in dependency arrays — enable \`eslint-plugin-react-hooks\`

## When NOT to Use useEffect
- **Deriving values** — compute inline during render, not via state+effect
- **Expensive computations** — use \`useMemo\`, not effect+setState
- **Resetting state on identity change** — use \`key\` prop to force remount
- **Reacting to user events** — call from event handlers, not effects watching state
- **Notifying parents** — call parent callback in the same handler that sets state

## Legitimate Uses of useEffect
- Subscribing to external stores (prefer \`useSyncExternalStore\`)
- WebSockets, EventSource, third-party widget libraries
- DOM event listeners not managed by React
- Browser APIs (IntersectionObserver, ResizeObserver, MediaQuery)
- Data fetching on mount/dependency change (always include cleanup for race conditions)

## Effect Cleanup
- Every effect that acquires a resource MUST return a cleanup function
- Use AbortController for fetch, cancelled flags for async chains
- Clear timers, remove event listeners, close connections

For detailed examples and reference, invoke: /react-hooks-guide
`,
      },
      {
        path: 'react/component-architecture.md',
        paths: ['**/*.tsx', '**/*.jsx'],
        governance: 'mandatory',
        description: 'React component design, composition, and state architecture patterns',
        content: `# React Component Architecture

## Component Design
- One exported component per file, filename matches component name (\`UserProfile.tsx\`)
- Props interface named \`ComponentNameProps\`, declared immediately before component
- Destructure props in function signature; keep components under 120 lines
- Use semantic HTML with proper ARIA attributes; event handlers named \`handleEventName\`

## Composition Over Prop Drilling
- When data crosses >2 component levels, use context or composition (children pattern)
- Never drill props through intermediate components that do not use them

## Custom Hooks
- Name: \`useDescriptiveAction\` — \`useAuth\`, \`useDebounce\`, \`usePagination\`
- One concrete purpose per hook; avoid generic lifecycle wrappers (\`useMount\`)
- Return descriptively named objects for complex returns, not positional arrays
- Document with JSDoc when behavior is non-obvious

## State Colocation Rules
1. Computable from props/state? → Derive inline or \`useMemo\`
2. Used by single component? → Local \`useState\`
3. Shared between siblings? → Lift to nearest common parent
4. Shared across distant components? → Context (low-frequency) or state library (high-frequency)
5. Survives navigation? → URL params, localStorage, or global store

## List Rendering
- Always use stable, unique \`key\` from data identity — never array index on dynamic lists
- Extract list items into own component when they have non-trivial logic

## Naming Conventions
| Concept | Pattern | Example |
|---------|---------|---------|
| Component file | PascalCase.tsx | \`UserProfile.tsx\` |
| Hook file | camelCase.ts | \`useAuth.ts\` |
| Props interface | ComponentNameProps | \`UserProfileProps\` |
| Event handler | handleEventName | \`handleSubmit\` |
| Event prop | onEventName | \`onSubmit\` |
| Context | NameContext / useName | \`AuthContext\` / \`useAuth\` |

For detailed examples and reference, invoke: /react-patterns-guide
`,
      },
      {
        path: 'react/performance.md',
        paths: ['**/*.tsx', '**/*.jsx'],
        governance: 'recommended',
        description: 'React performance optimization patterns and anti-patterns',
        content: `# React Performance

## Memoization — Profile Before Optimizing
- Do NOT apply memoization speculatively — measure first with React DevTools Profiler
- **React.memo**: use when component renders often with same props or renders expensive sub-trees
- **useMemo**: use when computation is measurably expensive (>1ms) or result is prop to memoized child
- **useCallback**: use when callback is dependency of child's effect/memo or passed to React.memo'd child

## Avoiding Unnecessary Re-renders
- Move state down — if only a sub-tree needs the state, colocate it there
- Extract expensive children into own components that receive stable props
- Split context providers by update frequency — never put everything in one context
- Avoid inline object/array literals in JSX props (creates new reference every render)

## Code Splitting
- Use \`React.lazy\` + \`Suspense\` for route-level code splitting
- Use dynamic \`import()\` for heavy third-party libraries loaded on demand

## Virtualization
- For lists >100 items, use windowing (\`react-window\`, \`@tanstack/react-virtual\`)
- Never render thousands of DOM nodes — virtualize or paginate

## Transitions
- \`useTransition\` to mark expensive state updates as non-urgent
- \`useDeferredValue\` to defer rendering of filtered/search results during typing

For detailed examples and reference, invoke: /react-performance-guide
`,
      },
    ],
    agents: [
      {
        name: 'react-reviewer',
        type: 'define',
        model: 'sonnet',
        description: 'Reviews React code for hooks compliance, effect discipline, and component quality',
        prompt: `You are a React code reviewer. Reference concrete line numbers.

## Checklist
1. **Hooks**: Rules of Hooks (no conditional/loop hooks), complete dependency arrays, no disabled exhaustive-deps without justification
2. **Effects**: no useEffect for derived values/user events/parent notifications, cleanup for subscriptions/timers, AbortController for fetches
3. **Components**: proper \`key\` (no index), no DOM manipulation (use refs), <120 lines, no prop drilling >2 levels
4. **State**: colocated near usage, context only for low-frequency cross-tree, useReducer for related transitions
5. **Performance**: no speculative memo/useMemo/useCallback, no inline object literals in JSX props
6. **A11y**: semantic HTML (\`<button>\` not \`<div onClick>\`), keyboard handlers, focus management, meaningful alt text

## Output: CRITICAL | WARNING | SUGGESTION | POSITIVE — explain WHY.

For detailed rules, invoke: /react-hooks-guide`,
        skills: ['react-component-generator', 'react-hook-generator', 'react-hooks-guide'],
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## React Testing
- React Testing Library: query by role/label/text, never test internal state or hook counts
- Test: interactions, conditional rendering, form behavior, list rendering, custom hooks via renderHook
- Async: use waitFor/findBy*, mock network with MSW, wrap providers in test wrappers`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['react-component-generator'],
        prompt: `## React Refactoring Patterns
- Extract components >120 lines, repeated JSX, complex conditionals
- Extract custom hooks for repeated useState+useEffect patterns
- Eliminate effects: derive inline/useMemo, move to event handlers, use useSyncExternalStore, use key pattern
- Simplify state: useReducer for related transitions, push state down, composition over prop drilling`,
      },
    ],
    skills: [
      {
        name: 'react-component-generator',
        description: 'Generate React components following project conventions and best practices',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
      {
        name: 'react-hooks-guide',
        description: 'Detailed reference for React hooks rules, effect discipline, and avoiding unnecessary effects',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# React Hooks & Effects — Detailed Reference

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
        name: 'react-patterns-guide',
        description: 'Detailed reference for React component design, composition, and state architecture',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# React Component Architecture — Detailed Reference

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
        name: 'react-performance-guide',
        description: 'Detailed reference for React performance optimization patterns',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# React Performance — Detailed Reference

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
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'bash .claude/hooks/react-effect-cleanup.sh',
          timeout: 5,
          statusMessage: 'Checking useEffect cleanup...',
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'bash .claude/hooks/react-a11y-click.sh',
          timeout: 5,
          statusMessage: 'Checking accessibility...',
        }],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [{
          type: 'command',
          command: 'bash .claude/hooks/react-effect-chains.sh',
          timeout: 5,
          statusMessage: 'Checking effect chains...',
        }],
      },
    ],
    hookScripts: buildReactHookScripts(),
    externalTools: [
      {
        type: 'eslint',
        filePath: '.eslintrc.json',
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
