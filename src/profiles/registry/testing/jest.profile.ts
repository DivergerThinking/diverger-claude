import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const jestProfile: Profile = {
  id: 'testing/jest',
  name: 'Jest',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['jest'],
  contributions: {
    claudeMd: [
      {
        heading: 'Jest Testing Conventions',
        order: 30,
        content: `## Jest Testing Conventions

- Organize tests with \`describe\` blocks mirroring the module structure
- Use clear test names: \`it('should return user when valid ID is provided')\`
- Follow Arrange-Act-Assert (AAA) pattern in every test
- Use \`beforeEach\` for shared setup, avoid \`beforeAll\` unless needed for expensive operations
- Prefer \`jest.fn()\` for simple mocks, \`jest.spyOn()\` when preserving original implementation matters
- Use \`jest.mock()\` at module level for dependency injection
- Leverage snapshot testing for UI components and serializable output - update snapshots intentionally
- Configure coverage thresholds in jest config to enforce minimum coverage
- Use \`jest.useFakeTimers()\` for time-dependent tests
- Group related tests with \`describe\` nesting but avoid deeply nested structures (max 3 levels)`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx jest:*)',
          'Bash(jest:*)',
          'Bash(npm test:*)',
          'Bash(yarn test:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/jest-conventions.md',
        governance: 'mandatory',
        description: 'Jest testing conventions and best practices',
        content: `# Jest Testing Conventions

## Test Structure
- Place tests in \`__tests__/\` directories or colocate as \`*.test.ts\` / \`*.spec.ts\`
- Mirror source directory structure in test directories
- One test file per source module
- Use \`describe\` blocks to group related tests by function or behavior

## Mocking
- Mock external dependencies at module level with \`jest.mock()\`
- Use \`jest.spyOn()\` for partial mocks that preserve original behavior
- Reset mocks in \`afterEach\` or use \`jest.restoreAllMocks()\` / \`clearAllMocks()\`
- Prefer dependency injection over module mocking when possible
- Type mock return values correctly to catch mismatches

## Snapshots
- Use snapshots for UI components and complex serializable output
- Review snapshot changes carefully in code reviews
- Keep snapshots small and focused - avoid snapshotting entire pages
- Use \`toMatchInlineSnapshot()\` for small, readable snapshots
- Update snapshots intentionally with \`--updateSnapshot\`, never blindly

## Coverage
- Enforce coverage thresholds: branches >= 80%, functions >= 80%, lines >= 80%
- Focus on meaningful coverage, not just line count
- Cover edge cases, error paths, and boundary conditions
- Use \`/* istanbul ignore next */\` sparingly and with justification

## Patterns
- Use \`test.each\` / \`it.each\` for parameterized tests
- Use \`jest.useFakeTimers()\` for time-dependent logic
- Use \`waitFor\` from testing-library for async UI tests
- Avoid testing implementation details - test behavior and outcomes
- Use custom matchers for domain-specific assertions
`,
      },
    ],
    agents: [
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Jest-Specific Testing
- Use \`describe\` and \`it\` blocks with descriptive names
- Mock dependencies with \`jest.mock()\` and \`jest.spyOn()\`
- Use \`jest.fn()\` for creating mock functions with type safety
- Leverage \`test.each\` for parameterized test cases
- Use snapshot testing for serializable output
- Configure \`beforeEach\`/\`afterEach\` for proper test isolation
- Use \`jest.useFakeTimers()\` for time-sensitive tests
- Assert with \`expect().toEqual()\`, \`toMatchObject()\`, \`toThrow()\``,
      },
    ],
  },
};
