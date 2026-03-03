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
        heading: 'Jest Conventions',
        order: 30,
        content: `## Jest Conventions

Full-featured test runner. Built-in mocking, snapshot testing, code coverage.

**Detailed rules:** see \`.claude/rules/jest/\` directory.

**Key rules:**
- AAA pattern, \`describe\`/\`it\` blocks with clear behavioral descriptions
- \`jest.fn()\`/\`jest.spyOn()\` for mocks, \`jest.mock()\` at module level
- Prefer \`toEqual\`/\`toStrictEqual\` over \`toBe\` for objects
- Avoid snapshot overuse — use for UI components, not logic`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx jest:*)',
          'Bash(jest:*)',
          'Bash(npm test:*)',
          'Bash(npm run test:*)',
          'Bash(yarn test:*)',
          'Bash(pnpm test:*)',
          'Bash(npx jest --coverage:*)',
          'Bash(npx jest --watch:*)',
          'Bash(npx jest --updateSnapshot:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/jest-conventions.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx', '**/*.spec.ts', '**/*.spec.tsx'],
        governance: 'mandatory',
        description: 'Jest testing conventions and best practices — mandatory rules for test structure, mocking, assertions, and coverage',
        content: `# Jest Testing Conventions

## Test Structure
- Place tests in \`__tests__/\` directories or colocate as \`*.test.ts\` / \`*.spec.ts\`
- Mirror source directory structure in test directories
- One test file per source module
- Use \`describe\` blocks to group related tests by function or behavior
- Follow Arrange-Act-Assert (AAA) pattern in every test
- Use descriptive test names: \`it('should return user when valid ID is provided')\`

## Mocking Rules
- \`jest.mock()\` calls MUST be at module level — they are hoisted to the top of the file
- Use \`jest.spyOn()\` when you need to track calls but preserve the original implementation
- Use \`jest.fn()\` for creating standalone mock functions
- Use \`jest.requireActual()\` inside mock factories for partial mocks:
  \`\`\`typescript
  jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    fetchData: jest.fn(),
  }));
  \`\`\`
- ALWAYS reset or restore mocks between tests:
  - \`jest.clearAllMocks()\` — clears call history, keeps implementation
  - \`jest.resetAllMocks()\` — clears history AND removes mock implementation
  - \`jest.restoreAllMocks()\` — restores original implementation for spies
- Prefer \`restoreMocks: true\` in jest config for automatic restoration

## Async Testing
- Use \`async/await\` for async tests — return the promise or use await
- Use \`await expect(promise).resolves.toEqual(value)\` for resolved promises
- Use \`await expect(promise).rejects.toThrow(ErrorType)\` for rejected promises
- Use \`expect.assertions(n)\` in callback-based async tests to ensure all assertions run
- Set appropriate timeouts for long-running async operations with test-level timeout parameter

## Snapshot Rules
- Use snapshots for UI components and serializable output — NOT for business logic
- Use property matchers for dynamic values (IDs, dates, timestamps)
- Review ALL snapshot changes in code reviews before accepting
- Never run \`--updateSnapshot\` blindly — understand every change
- Prefer \`toMatchInlineSnapshot()\` for small snapshots (under 10 lines)
- Enforce maximum snapshot size with linting rules

## Coverage Requirements
- Enforce global coverage thresholds: branches >= 80%, functions >= 80%, lines >= 80%, statements >= 80%
- Focus on meaningful coverage — edge cases, error paths, boundary conditions
- Use \`collectCoverageFrom\` to target source files and exclude generated/config files
- Use coverage ignore comments (\`/* istanbul ignore next */\`) only with documented justification

## Patterns to Follow
- Use \`test.each\` / \`it.each\` for parameterized tests with multiple input/output combinations
- Use \`jest.useFakeTimers()\` for time-dependent logic — always restore with \`jest.useRealTimers()\`
- Use \`beforeEach\` for shared setup — avoid \`beforeAll\` unless truly needed for expensive one-time operations
- Avoid testing implementation details — test behavior and observable outcomes
- Use custom matchers (\`expect.extend()\`) for domain-specific assertions
- Use \`test.todo()\` to document planned tests
`,
      },
      {
        path: 'testing/jest-configuration.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx', '**/*.spec.ts', '**/*.spec.tsx'],
        governance: 'recommended',
        description: 'Jest configuration best practices and recommended settings',
        content: `# Jest Configuration Best Practices

## Recommended Configuration
Configure Jest via \`jest.config.ts\` (or \`jest.config.js\`) at the project root:

\`\`\`typescript
import type { Config } from 'jest';

const config: Config = {
  // Test environment
  testEnvironment: 'node', // or 'jsdom' for browser-like environment

  // Test discovery
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

  // TypeScript support
  transform: { '^.+\\\\.tsx?$': 'ts-jest' },

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Mock management
  restoreMocks: true,
  clearMocks: true,

  // Coverage
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  coverageReporters: ['text', 'lcov', 'json-summary'],

  // Performance
  maxWorkers: '50%',
  bail: 1, // stop after first failure in CI
};

export default config;
\`\`\`

## Setup Files
- Use \`setupFiles\` for code that runs BEFORE the test framework is installed (polyfills, env vars)
- Use \`setupFilesAfterEnv\` for code that runs AFTER the framework (custom matchers, global mocks)
- Register custom matchers or extend expect in setup files, not in individual test files

## Multi-Project Configuration
Use \`projects\` for monorepos or distinct test environments:
\`\`\`typescript
projects: [
  { displayName: 'unit', testMatch: ['<rootDir>/tests/unit/**/*.test.ts'] },
  { displayName: 'integration', testMatch: ['<rootDir>/tests/integration/**/*.test.ts'] },
]
\`\`\`

## Environment-Specific Settings
- Use \`testEnvironment: 'jsdom'\` for DOM-dependent code (React components, browser APIs)
- Use \`testEnvironment: 'node'\` for server-side, CLI, and library code
- Use \`testEnvironmentOptions\` to configure jsdom (url, html, userAgent)
- Override environment per file with docblock: \`/** @jest-environment jsdom */\`

## Performance Tuning
- Set \`maxWorkers: '50%'\` to balance parallel execution with system load
- Use \`bail: 1\` in CI to fail fast after first test failure
- Use \`--changedSince\` or \`--onlyChanged\` in local development for faster feedback
- Set \`workerIdleMemoryLimit\` to recycle workers that consume too much memory
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Jest-Specific Review Checklist
Available skills: jest-test-generator
- Verify mocks are properly managed: check for \`jest.restoreAllMocks()\` in \`afterEach\` or \`restoreMocks: true\` in config
- Verify \`jest.mock()\` calls are at module level, not inside test functions (they are hoisted by Jest)
- Check that \`test.each\` / \`it.each\` is used for parameterized cases instead of duplicated test bodies
- Verify snapshot updates are intentional and reviewed — flag any blindly regenerated snapshots
- Check that dynamic values in snapshots use property matchers (\`expect.any()\`, \`expect.anything()\`)
- Verify proper async test handling: \`async/await\`, \`resolves/rejects\`, or \`expect.assertions(n)\` for callbacks
- Check for test interdependencies — each test must run independently in any order
- Verify coverage thresholds are configured and enforced in jest config (\`coverageThreshold\`)
- Check that \`jest.spyOn()\` is used when original implementation matters (not \`jest.fn()\` replacement)
- Verify no \`test.only\` or \`describe.only\` is left in committed code
- Check that fake timers are restored in \`afterEach\` with \`jest.useRealTimers()\`
- Verify tests follow AAA pattern: clearly separated Arrange, Act, Assert sections`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Jest-Specific Test Writing Guidelines
Available skills: jest-test-generator
- Structure tests with \`describe\` and \`it\`/\`test\` blocks — group by function or behavior, max 3 nesting levels
- Use descriptive names: \`it('should throw ValidationError when email is empty')\`
- Follow AAA pattern: arrange test data and mocks, act by calling the function, assert with expect matchers
- Mock external dependencies with \`jest.mock()\` at module level — use \`jest.requireActual()\` for partial mocks
- Create mock functions with \`jest.fn()\` — use \`.mockReturnValue()\`, \`.mockResolvedValue()\`, \`.mockImplementation()\`
- Use \`jest.spyOn(object, 'method')\` to track calls while preserving real behavior
- Leverage \`test.each\` for parameterized test cases with multiple input/output combinations
- Test async code with \`async/await\` — use \`resolves\`/\`rejects\` matchers for promise assertions
- Use snapshot testing for UI components and serializable output — use property matchers for dynamic values
- Use \`jest.useFakeTimers()\` and \`jest.advanceTimersByTime(ms)\` for time-dependent logic
- Assert with appropriate matchers: \`toBe()\` for primitives, \`toEqual()\` for deep equality, \`toMatchObject()\` for partial match, \`toThrow()\` for errors
- Use asymmetric matchers: \`expect.any(Number)\`, \`expect.objectContaining()\`, \`expect.arrayContaining()\`
- Use \`expect.assertions(n)\` in callback-based async tests to verify all assertions ran
- Configure \`beforeEach\`/\`afterEach\` for proper test isolation — reset mocks and restore timers`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Jest Security Review
- Verify test fixtures and mock data do not contain real credentials, API keys, or PII
- Check that test setup files do not import or expose production secrets
- Verify \`jest.mock()\` is used to stub external service calls — tests must never hit real production APIs
- Check that test environment variables use dummy values, not real credentials
- Verify snapshot files do not contain sensitive data (tokens, keys, internal URLs)
- Check that test output (console logs, coverage reports) does not leak sensitive information
- Verify \`testEnvironmentOptions.url\` does not reference production endpoints`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Jest Test Refactoring Guidance
Available skills: jest-test-generator
- Replace duplicated test logic with \`test.each\` parameterized tests
- Extract shared test setup into \`beforeEach\` blocks or shared helper functions
- Replace manual mock management with config-level \`restoreMocks: true\` / \`clearMocks: true\`
- Convert large external snapshot files to \`toMatchInlineSnapshot()\` when under 10 lines
- Replace \`jest.fn().mockImplementation()\` with more specific mocking: \`.mockReturnValue()\`, \`.mockResolvedValue()\`
- Move reusable test utilities (factories, custom matchers) into shared test helpers
- Convert callback-based async tests to \`async/await\` with \`resolves\`/\`rejects\`
- Consolidate scattered \`jest.mock()\` calls into \`setupFilesAfterEnv\` when used across many test files`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Jest Migration Guidance
- When migrating from Mocha/Chai: replace \`expect().to.equal()\` with \`expect().toBe()\`, \`describe\`/\`it\` syntax is compatible
- When migrating from Jasmine: most APIs are compatible — replace \`jasmine.createSpy()\` with \`jest.fn()\`, \`jasmine.createSpyObj()\` with manual mock objects
- When migrating to Vitest: most Jest APIs are compatible — replace \`jest.fn()\` with \`vi.fn()\`, \`jest.mock()\` with \`vi.mock()\`, update config from jest.config to vitest.config
- Check that all \`jest.mock()\` factories use proper hoisting behavior — Vitest handles hoisting differently
- Update TypeScript types: replace \`@types/jest\` with \`@jest/globals\` imports for stricter typing
- Verify test environment compatibility when upgrading Jest major versions (jsdom version changes, ESM support)
- When migrating from CommonJS to ESM: use \`jest.unstable_mockModule()\` for ESM module mocking`,
      },
    ],
    skills: [
      {
        name: 'jest-test-generator',
        description: 'Generate comprehensive Jest test suites for TypeScript/JavaScript modules',
        content: `# Jest Test Generator

## Purpose
Generate comprehensive, well-structured Jest test suites for TypeScript/JavaScript modules following best practices.

## Process

### 1. Analyze the Source Module
- Identify all exported functions, classes, and constants
- Map function signatures: parameters, return types, and thrown exceptions
- Identify external dependencies that need mocking
- Identify edge cases: null/undefined inputs, empty collections, boundary values, error conditions

### 2. Set Up Test File Structure
\`\`\`typescript
import { functionUnderTest } from '../module';

// Mock external dependencies at module level
jest.mock('../external-dependency', () => ({
  ...jest.requireActual('../external-dependency'),
  externalFn: jest.fn(),
}));

describe('functionUnderTest', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  // Tests organized by behavior
});
\`\`\`

### 3. Write Tests in This Order
1. **Happy path**: valid inputs produce expected outputs
2. **Edge cases**: empty input, null/undefined, boundary values, max/min
3. **Error cases**: invalid input, thrown exceptions, rejected promises
4. **Integration scenarios**: interaction between mocked dependencies and real logic

### 4. Test Template
\`\`\`typescript
it('should [expected behavior] when [condition]', () => {
  // Arrange
  const input = createTestInput();
  mockDependency.mockReturnValue(expectedReturn);

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toEqual(expectedOutput);
  expect(mockDependency).toHaveBeenCalledWith(expectedArgs);
});
\`\`\`

### 5. Parameterized Test Template
\`\`\`typescript
test.each([
  { input: 'valid@email.com', expected: true, scenario: 'valid email' },
  { input: 'no-at-sign', expected: false, scenario: 'missing @ symbol' },
  { input: '', expected: false, scenario: 'empty string' },
])('should return $expected for $scenario', ({ input, expected }) => {
  expect(validateEmail(input)).toBe(expected);
});
\`\`\`

### 6. Async Test Template
\`\`\`typescript
it('should fetch user data successfully', async () => {
  // Arrange
  const mockUser = { id: 1, name: 'Test User' };
  mockApi.getUser.mockResolvedValue(mockUser);

  // Act
  const result = await getUserProfile(1);

  // Assert
  expect(result).toEqual(mockUser);
  expect(mockApi.getUser).toHaveBeenCalledWith(1);
});

it('should throw NotFoundError when user does not exist', async () => {
  mockApi.getUser.mockRejectedValue(new NotFoundError('User not found'));

  await expect(getUserProfile(999)).rejects.toThrow(NotFoundError);
});
\`\`\`

## Quality Checklist
- [ ] Every exported function has at least one test
- [ ] Happy path, edge cases, and error cases are covered
- [ ] External dependencies are mocked at module level
- [ ] Mocks are restored in afterEach
- [ ] Test names describe the expected behavior and condition
- [ ] No test depends on another test's state or execution order
- [ ] Parameterized tests used where input/output combinations vary
- [ ] Async tests properly use async/await with resolves/rejects
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.(test|spec)\\.(ts|tsx|js|jsx)$" && grep -cE "\\b(test\\.only|describe\\.only|fit|fdescribe)\\b" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:1:Focused test detected (.only) — remove before committing to avoid skipping other tests" || true',
            timeout: 10,
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.(test|spec)\\.(ts|tsx|js|jsx)$" && grep -nE "jest\\.mock\\(" "$CLAUDE_FILE_PATH" | while read line; do linenum=$(echo "$line" | cut -d: -f1); if [ "$linenum" -gt 1 ] && head -n "$linenum" "$CLAUDE_FILE_PATH" | grep -qE "^\\s*(describe|it|test|beforeEach|afterEach|beforeAll|afterAll)\\("; then echo "HOOK_EXIT:0:Warning: jest.mock() call may be inside a test block (line $linenum) — jest.mock() must be at module level to be hoisted correctly"; break; fi; done 2>/dev/null || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
