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

- Use functional components exclusively - no class components
- Follow the Rules of Hooks: only call hooks at the top level, only in React functions
- Use custom hooks to extract reusable stateful logic (prefix with \`use\`)
- Prefer \`useState\` for local state, \`useReducer\` for complex state logic
- Use \`useMemo\` and \`useCallback\` only when there is a measurable performance benefit
- Avoid premature memoization - profile before optimizing with \`React.memo\`
- Colocate state as close to where it is used as possible
- Lift state up only when multiple siblings need the same data
- Use composition over prop drilling - leverage children and render props
- Always provide accessible markup: semantic HTML, ARIA attributes, keyboard navigation
- Use \`key\` prop correctly in lists - never use array index for dynamic lists
- Keep components small and focused on a single responsibility
- Separate presentation components from container/logic components`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx react-scripts:*)',
          'Bash(npx vite:*)',
        ],
      },
    },
    rules: [
      {
        path: 'react/component-patterns.md',
        governance: 'mandatory',
        description: 'React component patterns and hooks rules',
        content: `# React Component Patterns

## Hooks Rules
- Only call hooks at the top level of a component or custom hook
- Never call hooks inside loops, conditions, or nested functions
- Custom hooks must start with \`use\` prefix
- Always include all dependencies in useEffect/useMemo/useCallback dependency arrays
- Use the exhaustive-deps ESLint rule and never suppress it without justification

## Component Patterns
- Use functional components with hooks - no class components
- Keep components under 150 lines; extract sub-components when growing
- Use composition with \`children\` prop instead of deep prop drilling
- Use \`React.forwardRef\` when wrapping native elements
- Prefer controlled components over uncontrolled for forms

## State Management
- Colocate state near where it is consumed
- Use \`useState\` for simple local state
- Use \`useReducer\` for complex state transitions or related state values
- Lift state up only when siblings need to share it
- Use context sparingly - it is not a replacement for a state management library
- Consider external state managers (Zustand, Jotai) for global client state

## Memoization
- Do not wrap every component in \`React.memo\` by default
- Use \`useMemo\` for expensive computations with stable dependencies
- Use \`useCallback\` when passing callbacks to memoized children
- Profile with React DevTools before adding memoization

## Accessibility
- Use semantic HTML elements (\`button\`, \`nav\`, \`main\`, \`section\`)
- Provide \`aria-label\` or \`aria-labelledby\` for interactive elements without visible text
- Ensure all interactive elements are keyboard accessible
- Manage focus correctly in modals and dynamic content
- Use \`role\` attributes only when no semantic HTML element fits
`,
      },
      {
        path: 'react/naming.md',
        governance: 'recommended',
        description: 'React naming and file organization conventions',
        content: `# React Naming Conventions

## Files
- Component files: PascalCase matching the component name (\`UserProfile.tsx\`)
- Hook files: camelCase with \`use\` prefix (\`useAuth.ts\`)
- Utility files: camelCase (\`formatDate.ts\`)
- Test files: same name with \`.test.tsx\` suffix

## Components
- PascalCase for component names (\`UserProfile\`, \`NavBar\`)
- Props interfaces: \`ComponentNameProps\` (e.g., \`UserProfileProps\`)
- Event handlers: \`handleEventName\` (e.g., \`handleClick\`, \`handleSubmit\`)
- Event handler props: \`onEventName\` (e.g., \`onClick\`, \`onSubmit\`)

## Hooks
- Custom hook names: \`useDescriptiveAction\` (e.g., \`useAuth\`, \`useFetchUsers\`)
- Return values should be descriptive, not generic

## Context
- Context name: PascalCase + Context suffix (\`AuthContext\`)
- Provider name: PascalCase + Provider suffix (\`AuthProvider\`)
- Consumer hook: \`use\` + context name (\`useAuth\`)
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## React-Specific Review
- Verify Rules of Hooks compliance (no conditional hooks, correct dependency arrays)
- Check for unnecessary re-renders - missing or incorrect memoization
- Verify proper \`key\` usage in lists (no index keys for dynamic lists)
- Check for direct DOM manipulation instead of React patterns
- Verify accessible markup: semantic HTML, ARIA attributes, keyboard handling
- Check for proper cleanup in useEffect (event listeners, subscriptions, timers)
- Verify state colocation - is state lifted higher than necessary?
- Check for prop drilling that should use composition or context
- Verify controlled vs uncontrolled form components are used consistently
- Check for potential stale closures in hooks`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## React Testing
- Use React Testing Library - test user behavior, not implementation details
- Query by role, label, or text - avoid test IDs unless no accessible alternative
- Test user interactions: click, type, submit, keyboard navigation
- Test conditional rendering and loading/error/empty states
- Test custom hooks with \`renderHook\` from @testing-library/react
- Mock external dependencies (API calls, context providers) not internal components
- Wrap state updates in \`act()\` or use \`waitFor\` for async assertions
- Test accessibility: verify ARIA attributes, focus management, screen reader text`,
      },
    ],
  },
};
