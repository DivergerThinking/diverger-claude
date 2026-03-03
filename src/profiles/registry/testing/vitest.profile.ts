import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const vitestProfile: Profile = {
  id: 'testing/vitest',
  name: 'Vitest',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['vitest'],
  contributions: {
    claudeMd: [
      {
        heading: 'Vitest Conventions',
        order: 30,
        content: `## Vitest Conventions

Fast Vite-native test runner. ESM-first, in-source testing support.

**Detailed rules:** see \`.claude/rules/vitest/\` directory.

**Key rules:**
- Arrange-Act-Assert pattern, \`describe\`/\`it\` with descriptive names
- Co-locate tests: \`*.test.ts\` next to source or in \`__tests__/\` directory
- Use \`vi.fn()\`/\`vi.spyOn()\` for mocking, \`vi.mock()\` for module-level
- Snapshot tests only for serializable output — prefer explicit assertions`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx vitest:*)',
          'Bash(vitest:*)',
          'Bash(npm test:*)',
          'Bash(npm run test:*)',
          'Bash(pnpm test:*)',
          'Bash(pnpm run test:*)',
          'Bash(yarn test:*)',
          'Bash(yarn vitest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/vitest-conventions.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        governance: 'mandatory',
        description: 'Vitest testing conventions, mocking patterns, and best practices',
        content: `# Vitest Testing Conventions

## Test Structure
- Place tests in \`__tests__/\` directories or colocate as \`*.test.ts\` / \`*.spec.ts\`
- Mirror source directory structure in test directories
- One test file per source module
- Use \`describe\` blocks to group related tests by function or behavior
- Use \`test.each\` / \`it.each\` for parameterized tests instead of duplicating test cases

## Mocking Patterns
- Use \`vi.mock()\` at module level — never inside test functions
- Use \`vi.hoisted()\` for mock factory variables that need hoisting above \`vi.mock()\` calls
- Use \`vi.spyOn()\` for partial mocking that preserves original behavior
- Reset mocks in \`afterEach\` — use \`vi.restoreAllMocks()\` or \`vi.clearAllMocks()\`
- Use \`vi.stubEnv()\` for env vars, \`vi.stubGlobal()\` for globals — unstub in teardown
- Type mock return values correctly to catch type mismatches at compile time

## Timer & Async Mocking
- Use \`vi.useFakeTimers()\` for time-dependent tests, restore with \`vi.useRealTimers()\` in afterEach
- Advance timers with \`vi.advanceTimersByTime(ms)\` or \`vi.runAllTimers()\`
- Use \`vi.waitFor()\` for asserting on eventually-consistent async operations

## In-Source & Type Testing
- Use in-source testing (\`import.meta.vitest\`) only for small pure utility functions
- Configure \`define\` in vitest config to strip in-source tests from production builds
- Use \`expectTypeOf\` for compile-time type assertions in \`*.test-d.ts\` files

## Benchmarks
- Use \`bench()\` in \`*.bench.ts\` files, compare implementations with benchmark groups
- Set performance baselines and track regressions with \`vitest bench\`

## Coverage
- Enable coverage with \`@vitest/coverage-v8\` (preferred) or \`@vitest/coverage-istanbul\`
- Enforce thresholds: branches >= 80%, functions >= 80%, lines >= 80%
- Focus on meaningful coverage — behavior, edge cases, error paths
- Use \`/* v8 ignore next */\` sparingly and only with justification comment

## Configuration
- Use \`vitest.config.ts\` extending from \`vite.config.ts\` when Vite is the project bundler
- Configure workspace (\`vitest.workspace.ts\`) for monorepo setups
- Use \`pool: 'threads'\` for speed, \`pool: 'forks'\` for full process isolation
- Set \`globals: true\` only if the team prefers implicit imports (explicit recommended)
- Configure \`include\`/\`exclude\` patterns; use \`setupFiles\` for global test setup
`,
      },
      {
        path: 'testing/vitest-patterns.md',
        paths: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        governance: 'recommended',
        description: 'Vitest advanced patterns and anti-patterns to avoid',
        content: `# Vitest Advanced Patterns

## Snapshot Testing
- Use \`toMatchInlineSnapshot()\` for small, readable snapshots that live in the test file
- Use \`toMatchSnapshot()\` for larger serializable output stored in \`__snapshots__/\`
- Review snapshot changes carefully in code reviews — never blindly update
- Update snapshots intentionally with \`--update\` flag, not automatically
- Avoid snapshotting entire pages or large objects — keep snapshots small and focused
- Use \`toMatchFileSnapshot()\` for comparing against reference files

## Concurrent Testing
- Use \`describe.concurrent\` to run all tests in a describe block concurrently
- Use \`it.concurrent\` for individual tests that can safely run in parallel
- Ensure concurrent tests have no shared mutable state
- Avoid concurrent mode for tests that modify shared resources (files, databases, globals)

## Custom Matchers
- Extend Vitest with custom matchers using \`expect.extend()\` for domain-specific assertions
- Type custom matchers properly with module augmentation on \`Assertion\` interface
- Keep custom matchers focused and well-documented

## Test Filtering & Organization
- Use \`.only\` and \`.skip\` during development, never commit them to the repository
- Use \`--grep\` / \`-t\` to filter tests by name pattern from the CLI
- Use tags with \`describe\` naming conventions for logical grouping (e.g., "[unit]", "[integration]")

## Anti-Patterns to Avoid
- Calling \`vi.mock()\` inside a test function — always hoist to module level
- Testing implementation details (private internals, call counts) instead of observable behavior
- Over-mocking: if every dependency is mocked, the test verifies nothing meaningful
- Shared mutable state between tests — each test must be independently runnable
- Using \`.only\` or \`.skip\` in committed code — these bypass the test suite
- Snapshot tests for logic that should have explicit value assertions
- Arbitrary \`setTimeout\` in tests — use \`vi.useFakeTimers()\` or \`vi.waitFor()\` instead
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Vitest-Specific Review
Available skills: vitest-test-generator
- Verify mocks are properly reset in afterEach (vi.restoreAllMocks or vi.clearAllMocks)
- Check that vi.mock() calls are at module level, not inside test functions
- Verify vi.hoisted() is used for mock factory variables that need hoisting above vi.mock()
- Check for proper test isolation — no shared mutable state between tests
- Verify vi.stubEnv() and vi.stubGlobal() calls have corresponding unstub in afterEach
- Check that in-source tests (import.meta.vitest) are stripped in production via define config
- Verify type tests use expectTypeOf correctly in *.test-d.ts files
- Check test.each is used for parameterized cases instead of duplicated test blocks
- Verify no .only or .skip markers are committed to the repository
- Check that async tests properly await all assertions and operations
- Verify coverage thresholds are configured and enforced in vitest.config.ts
- Check that snapshot updates are intentional and reviewed, not blindly accepted`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Vitest-Specific Testing
Available skills: vitest-test-generator
- Use \`vi.fn()\` for creating type-safe mock functions
- Use \`vi.spyOn()\` when you need to observe calls while preserving original behavior
- Use \`vi.mock()\` at module level with \`vi.hoisted()\` for mock factory variables
- Use \`vi.stubEnv()\` for environment variables, \`vi.stubGlobal()\` for global mocking
- Use \`vi.useFakeTimers()\` for time-dependent tests, advance with \`vi.advanceTimersByTime()\`
- Leverage \`test.each\` / \`it.each\` for parameterized test cases
- Use \`expectTypeOf\` for type-level assertions in \`*.test-d.ts\` files
- Write benchmarks with \`bench()\` in \`*.bench.ts\` for performance-critical code
- Use in-source testing with \`import.meta.vitest\` only for small pure utility functions
- Use \`toMatchInlineSnapshot()\` for small readable snapshots
- Use \`vi.waitFor()\` for asserting on eventually-consistent async operations
- Configure test pools appropriately: threads for speed, forks for full isolation
- Use \`describe.concurrent\` when tests are independent and can run in parallel
- Always restore mocks in afterEach with vi.restoreAllMocks()`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Vitest-Specific Refactoring
Available skills: vitest-test-generator
- When refactoring, always run \`npx vitest run\` after each atomic change to verify no regressions
- Use \`npx vitest related src/changed-file.ts\` to run only tests affected by a refactored module
- Extract repeated test setup into beforeEach blocks or custom vi.fn() factories
- Replace duplicated test cases with test.each parameterized tests
- Consolidate scattered vi.mock() calls — group all module mocks at the top of the file
- Convert legacy Jest mocking patterns to Vitest equivalents (jest.fn -> vi.fn, jest.mock -> vi.mock)
- Use vi.hoisted() to clean up mock factory patterns that rely on variable hoisting
- Prefer vi.spyOn() over full vi.mock() when only partial observation is needed`,
      },
    ],
    skills: [
      {
        name: 'vitest-test-generator',
        description: 'Generate Vitest test files following project conventions and best practices',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Vitest Test Generator

When generating a Vitest test file, produce a complete test suite following these conventions:

## File Structure
1. Imports: vitest APIs (describe, it, expect, vi, beforeEach, afterEach), then the module under test
2. Mock declarations: vi.mock() calls at module level, vi.hoisted() for mock factories
3. describe block named after the module or function being tested
4. beforeEach: setup shared state, configure mocks
5. afterEach: vi.restoreAllMocks(), vi.unstubAllEnvs(), vi.unstubAllGlobals() as needed
6. Tests organized by method or behavior

## Test Coverage Requirements
For every function or module, generate tests for:
1. **Happy path**: valid inputs produce correct outputs
2. **Edge cases**: empty input, null/undefined, boundary values, max/min
3. **Error cases**: invalid input, thrown exceptions, rejected promises
4. **Async behavior**: resolved and rejected promises, timeouts

## Mocking Template
\`\`\`ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockDep } = vi.hoisted(() => ({
  mockDep: vi.fn(),
}));
vi.mock('./dependency', () => ({ myFunction: mockDep }));

import { functionUnderTest } from './module';

describe('functionUnderTest', () => {
  beforeEach(() => {
    mockDep.mockReturnValue('default');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle normal input correctly', () => {
    const result = functionUnderTest('input');
    expect(result).toBe('expected');
    expect(mockDep).toHaveBeenCalledWith('input');
  });

  it('should throw on invalid input', () => {
    expect(() => functionUnderTest('')).toThrow('Validation error');
  });
});
\`\`\`

## Parameterized Test Template
\`\`\`ts
it.each([
  { input: 'a', expected: 1, name: 'single char' },
  { input: 'abc', expected: 3, name: 'multiple chars' },
  { input: '', expected: 0, name: 'empty string' },
])('should return $expected for $name', ({ input, expected }) => {
  expect(getLength(input)).toBe(expected);
});
\`\`\`

## Timer Test Template
\`\`\`ts
it('should debounce calls', () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  debounce(callback, 300)();
  expect(callback).not.toHaveBeenCalled();
  vi.advanceTimersByTime(300);
  expect(callback).toHaveBeenCalledOnce();
  vi.useRealTimers();
});
\`\`\`
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.(test|spec)\\.(ts|tsx|js|jsx)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/\\.(only|skip)\\s*\\(/.test(c)&&!/\\/\\/.*\\.(only|skip)/.test(c))console.log(\'WARNING: .only or .skip detected in test file — remove before committing to avoid skipping tests in CI\')" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\'); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.(test|spec)\\.(ts|tsx|js|jsx)$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/vi\\.mock\\s*\\(/.test(c)&&!/vi\\.restoreAllMocks|vi\\.clearAllMocks|vi\\.resetAllMocks/.test(c))console.log(\'WARNING: vi.mock() used without vi.restoreAllMocks()/vi.clearAllMocks() in afterEach — mocks may leak between tests\')" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
  },
};
