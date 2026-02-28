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
        heading: 'Vitest Testing Conventions',
        order: 30,
        content: `## Vitest Testing Conventions

- Leverage native ESM support - no need for module transformation workarounds
- Use Vitest's built-in \`vi.fn()\`, \`vi.spyOn()\`, and \`vi.mock()\` instead of Jest equivalents
- Enable in-source testing with \`if (import.meta.vitest)\` for utility functions
- Use \`vitest bench\` for performance benchmarks alongside unit tests
- Leverage Vitest's snapshot support with inline snapshots for readability
- Use workspace configuration for monorepo projects
- Prefer \`vi.useFakeTimers()\` for timer-dependent tests
- Use Vitest UI mode (\`--ui\`) during development for visual feedback
- Configure \`pool: 'threads'\` or \`pool: 'forks'\` based on isolation needs
- Use type testing with \`expectTypeOf\` for compile-time type assertions`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx vitest:*)',
          'Bash(vitest:*)',
          'Bash(npm test:*)',
          'Bash(pnpm test:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/vitest-conventions.md',
        governance: 'mandatory',
        description: 'Vitest testing conventions and best practices',
        content: `# Vitest Testing Conventions

## Vitest-Specific Features
- Use native ESM imports without transformation overhead
- Use \`vi.mock()\` for module mocking with full TypeScript support
- Leverage \`vi.hoisted()\` for hoisted mock factories
- Use \`vi.stubEnv()\` and \`vi.unstubAllEnvs()\` for environment variable testing
- Use \`vi.stubGlobal()\` for global variable mocking

## In-Source Testing
- Use in-source testing for small utility functions: \`if (import.meta.vitest) { ... }\`
- Keep in-source tests focused on the function they colocate with
- Configure \`define\` in vitest config to strip in-source tests in production builds
- Reserve in-source testing for pure functions with simple inputs/outputs

## Benchmarks
- Use \`bench()\` to define performance benchmarks
- Place benchmark files in \`*.bench.ts\` files
- Compare implementations with benchmark groups using \`describe\`
- Set performance baselines and track regressions with \`vitest bench\`

## Configuration
- Use \`vitest.config.ts\` extending from \`vite.config.ts\` when applicable
- Configure workspace for monorepo setups
- Use \`pool: 'threads'\` for speed, \`pool: 'forks'\` for isolation
- Enable coverage with \`@vitest/coverage-v8\` or \`@vitest/coverage-istanbul\`

## Type Testing
- Use \`expectTypeOf\` for compile-time type assertions
- Place type tests in \`*.test-d.ts\` files
- Test generic function type inference
- Verify that type errors occur where expected with \`// @ts-expect-error\`
`,
      },
    ],
    agents: [
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Vitest-Specific Testing
- Use \`vi.fn()\`, \`vi.spyOn()\`, and \`vi.mock()\` for mocking
- Leverage in-source testing with \`import.meta.vitest\` for utility functions
- Use \`expectTypeOf\` for type-level assertions
- Write benchmarks with \`bench()\` for performance-critical code
- Use \`vi.useFakeTimers()\` for time-dependent tests
- Use \`vi.hoisted()\` for hoisted mock factories
- Configure test pools appropriately for isolation requirements`,
      },
    ],
  },
};
