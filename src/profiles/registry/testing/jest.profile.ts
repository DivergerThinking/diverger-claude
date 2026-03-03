import type { Profile, HookScriptDefinition } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';
import { makeFilePatternCheckScript } from '../../hook-script-templates.js';

function buildJestHookScripts(): HookScriptDefinition[] {
  return [
    {
      filename: 'jest-no-only.sh',
      isPreToolUse: false,
      content: makeFilePatternCheckScript({
        filename: 'jest-no-only.sh',
        pattern: '\\b(test\\.only|describe\\.only|fit|fdescribe)\\b',
        message: 'Focused test detected (.only) — remove before committing to avoid skipping other tests',
        exitCode: 2,
        fileExtensions: ['.test.ts', '.test.tsx', '.test.js', '.test.jsx', '.spec.ts', '.spec.tsx', '.spec.js', '.spec.jsx'],
      }),
    },
    {
      filename: 'jest-mock-hoisting.sh',
      isPreToolUse: false,
      content: `#!/bin/bash
# Warn on jest.mock() inside test blocks (not hoisted correctly)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then exit 0; fi
echo "$FILE_PATH" | grep -qE '\\.(test|spec)\\.(ts|tsx|js|jsx)$' || exit 0
grep -nE "jest\\.mock\\(" "$FILE_PATH" 2>/dev/null | while read line; do
  linenum=$(echo "$line" | cut -d: -f1)
  if [ "$linenum" -gt 1 ] && head -n "$linenum" "$FILE_PATH" | grep -qE "^\\s*(describe|it|test|beforeEach|afterEach|beforeAll|afterAll)\\("; then
    echo "Warning: jest.mock() call may be inside a test block (line $linenum) — jest.mock() must be at module level" >&2
    exit 2
  fi
done
exit 0
`,
    },
  ];
}

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
- Place tests in \`__tests__/\` or colocate as \`*.test.ts\` / \`*.spec.ts\`
- One test file per source module; mirror source directory structure
- Use \`describe\` blocks to group related tests by function or behavior
- Follow Arrange-Act-Assert (AAA) pattern in every test
- Use descriptive test names: \`it('should return user when valid ID is provided')\`

## Mocking Rules
- \`jest.mock()\` calls MUST be at module level — they are hoisted
- Use \`jest.spyOn()\` to track calls while preserving original implementation
- Use \`jest.fn()\` for standalone mock functions
- Use \`jest.requireActual()\` inside mock factories for partial mocks
- ALWAYS reset/restore mocks between tests (prefer \`restoreMocks: true\` in config)

## Async Testing
- Use \`async/await\` for async tests
- Use \`await expect(promise).resolves.toEqual(value)\` / \`.rejects.toThrow(ErrorType)\`
- Use \`expect.assertions(n)\` in callback-based async tests

## Snapshot Rules
- Use snapshots for UI components only — NOT for business logic
- Use property matchers for dynamic values (IDs, dates)
- Never run \`--updateSnapshot\` blindly — review every change

## Coverage Requirements
- Enforce thresholds: branches/functions/lines/statements >= 80%
- Focus on meaningful coverage — edge cases, error paths, boundary conditions

## Key Patterns
- \`test.each\` for parameterized tests; \`jest.useFakeTimers()\` for time-dependent logic
- \`beforeEach\` for shared setup; avoid testing implementation details
- Use \`test.todo()\` to document planned tests

For detailed examples and reference, invoke: /jest-conventions-guide
`,
      },
      {
        path: 'testing/jest-configuration.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx', '**/*.spec.ts', '**/*.spec.tsx'],
        governance: 'recommended',
        description: 'Jest configuration best practices and recommended settings',
        content: `# Jest Configuration Best Practices

## Recommended Configuration
Configure Jest via \`jest.config.ts\` at the project root with these key settings:
- \`testEnvironment\`: \`'node'\` (server/CLI) or \`'jsdom'\` (browser/React)
- \`testMatch\`: \`['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']\`
- \`testPathIgnorePatterns\`: exclude \`node_modules\`, \`dist\`, \`build\`
- \`transform\`: \`{ '^.+\\\\.tsx?$': 'ts-jest' }\` for TypeScript support
- \`restoreMocks: true\`, \`clearMocks: true\` for automatic mock cleanup
- \`coverageThreshold\`: branches/functions/lines/statements >= 80%
- \`maxWorkers: '50%'\` for balanced parallel execution

## Setup Files
- \`setupFiles\`: runs BEFORE test framework (polyfills, env vars)
- \`setupFilesAfterEnv\`: runs AFTER framework (custom matchers, global mocks)
- Register custom matchers in setup files, not in individual test files

## Multi-Project Configuration
- Use \`projects\` array for monorepos or distinct test environments (unit, integration)

## Environment-Specific Settings
- \`'jsdom'\` for DOM-dependent code; \`'node'\` for server-side/CLI
- Override per file with docblock: \`/** @jest-environment jsdom */\`

## Performance Tuning
- \`bail: 1\` in CI to fail fast after first test failure
- \`--changedSince\` in local dev for faster feedback
- \`workerIdleMemoryLimit\` to recycle memory-heavy workers

For detailed examples and reference, invoke: /jest-config-guide
`,
      },
    ],
    agents: [
      {
        name: 'test-reviewer',
        type: 'define',
        model: 'sonnet',
        description: 'Reviews Jest test code for correctness, isolation, and best practices',
        prompt: `You are a Jest test reviewer. Reference concrete line numbers.

## Checklist
1. **Mocking**: jest.mock() at module level (hoisted), restoreAllMocks in afterEach or config, spyOn when original needed
2. **Isolation**: no test interdependencies, no .only/.skip committed, fake timers restored
3. **Async**: async/await with resolves/rejects, expect.assertions(n) for callbacks
4. **Snapshots**: only for UI/serializable output, property matchers for dynamic values, reviewed updates
5. **Coverage**: thresholds configured, test.each for parameterized cases, AAA pattern
6. **Security**: no real credentials in fixtures, jest.mock for external APIs, no PII in snapshots

## Output: CRITICAL | WARNING | SUGGESTION | POSITIVE — explain WHY.`,
        skills: ['jest-test-generator'],
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Jest Test Writing
- describe/it blocks, descriptive names, AAA pattern, max 3 nesting levels
- jest.mock() at module level, jest.fn()/spyOn for mocks, test.each for parameterized cases
- async/await with resolves/rejects, jest.useFakeTimers(), proper matcher choice (toBe/toEqual/toMatchObject)`,
      },
      {
        name: 'security-reviewer',
        type: 'enrich',
        prompt: `## Jest Security Review
- No real credentials/PII in fixtures or snapshots
- jest.mock() for all external service calls — tests never hit production APIs
- Test env vars use dummy values, test output does not leak sensitive information`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Jest Test Refactoring
- Replace duplicated tests with test.each, extract shared setup to beforeEach
- Use config-level restoreMocks/clearMocks, convert snapshots <10 lines to inline
- Move reusable test utilities to shared helpers, convert callbacks to async/await`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Jest Migration
- Mocha/Chai → Jest: expect().toBe(), compatible describe/it
- Jasmine → Jest: jest.fn() replaces createSpy, manual mock objects
- Jest → Vitest: vi.fn()/vi.mock(), different hoisting behavior
- CommonJS → ESM: jest.unstable_mockModule()`,
      },
    ],
    skills: [
      {
        name: 'jest-test-generator',
        description: 'Generate comprehensive Jest test suites for TypeScript/JavaScript modules',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
      {
        name: 'jest-conventions-guide',
        description: 'Detailed reference for Jest testing conventions with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Jest Testing Conventions — Full Reference

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
  \\\`\\\`\\\`typescript
  jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    fetchData: jest.fn(),
  }));
  \\\`\\\`\\\`
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
        name: 'jest-config-guide',
        description: 'Detailed reference for Jest configuration best practices with examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Jest Configuration Best Practices — Full Reference

## Recommended Configuration
Configure Jest via \`jest.config.ts\` (or \`jest.config.js\`) at the project root:

\\\`\\\`\\\`typescript
import type { Config } from 'jest';

const config: Config = {
  // Test environment
  testEnvironment: 'node', // or 'jsdom' for browser-like environment

  // Test discovery
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

  // TypeScript support
  transform: { '^.+\\\\\\\\.tsx?$': 'ts-jest' },

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
\\\`\\\`\\\`

## Setup Files
- Use \`setupFiles\` for code that runs BEFORE the test framework is installed (polyfills, env vars)
- Use \`setupFilesAfterEnv\` for code that runs AFTER the framework (custom matchers, global mocks)
- Register custom matchers or extend expect in setup files, not in individual test files

## Multi-Project Configuration
Use \`projects\` for monorepos or distinct test environments:
\\\`\\\`\\\`typescript
projects: [
  { displayName: 'unit', testMatch: ['<rootDir>/tests/unit/**/*.test.ts'] },
  { displayName: 'integration', testMatch: ['<rootDir>/tests/integration/**/*.test.ts'] },
]
\\\`\\\`\\\`

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
    hooks: [
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/jest-no-only.sh',
            timeout: 10,
            statusMessage: 'Checking for focused tests...',
          },
        ],
      },
      {
        event: 'PostToolUse',
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'bash .claude/hooks/jest-mock-hoisting.sh',
            timeout: 10,
            statusMessage: 'Checking jest.mock() placement...',
          },
        ],
      },
    ],
    hookScripts: buildJestHookScripts(),
  },
};
