import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const playwrightProfile: Profile = {
  id: 'testing/playwright',
  name: 'Playwright',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['playwright'],
  contributions: {
    claudeMd: [
      {
        heading: 'Playwright Testing Conventions',
        order: 30,
        content: `## Playwright Testing Conventions

- Use Page Object Model for maintainable and reusable test code
- Leverage Playwright's auto-waiting - avoid manual waits and sleeps
- Use \`expect(locator)\` web-first assertions that auto-retry
- Use test fixtures for setup, teardown, and shared context
- Run tests in parallel by default - ensure test isolation
- Use \`test.describe\` to group related tests
- Use \`data-testid\` attributes for reliable element selection
- Use \`page.route()\` for network mocking and interception
- Configure multiple projects in \`playwright.config.ts\` for cross-browser testing
- Use trace viewer (\`--trace on\`) for debugging test failures`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx playwright:*)',
          'Bash(playwright:*)',
          'Bash(npm run playwright:*)',
          'Bash(pnpm playwright:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/playwright-conventions.md',
        governance: 'mandatory',
        description: 'Playwright testing conventions and best practices',
        content: `# Playwright Testing Conventions

## Page Objects
- Create page object classes encapsulating page interactions
- Define locators as class properties, not inline in test methods
- Expose actions as methods: \`async login(user, password)\`
- Return new page objects for navigation actions
- Keep page objects focused on a single page or component

## Auto-Waiting
- Rely on Playwright's built-in auto-waiting for element interactions
- Never use \`page.waitForTimeout()\` - use actionable assertions instead
- Use \`expect(locator).toBeVisible()\` instead of manual waiting
- Use \`page.waitForResponse()\` or \`page.route()\` for network-dependent tests
- Use \`expect(locator).toHaveText()\` for content assertions with auto-retry

## Assertions
- Use web-first assertions: \`expect(locator).toBeVisible()\`, \`toHaveText()\`, \`toHaveValue()\`
- Use \`expect(page).toHaveURL()\` for navigation assertions
- Use \`expect(page).toHaveTitle()\` for page title verification
- Use \`toMatchSnapshot()\` for visual regression testing
- Use \`expect.poll()\` for custom retry logic on non-locator assertions

## Fixtures
- Use custom fixtures for shared setup (authentication, data seeding)
- Use \`test.extend()\` to create fixture-based test functions
- Use \`storageState\` for reusing authentication across tests
- Define worker-scoped fixtures for expensive shared resources
- Use fixture dependencies to compose complex setups

## Parallel Testing
- Design tests to be independent and parallelizable
- Use worker-scoped fixtures for shared expensive resources
- Use \`test.describe.configure({ mode: 'serial' })\` only when order matters
- Isolate test data per worker to avoid conflicts
- Configure \`fullyParallel: true\` in playwright config for maximum parallelism
`,
      },
      {
        path: 'testing/playwright-selectors.md',
        governance: 'recommended',
        description: 'Playwright selector best practices',
        content: `# Playwright Selector Best Practices

## Selector Priority
1. \`getByRole()\` - accessible role-based selectors (preferred)
2. \`getByText()\` - visible text content
3. \`getByLabel()\` - form label associations
4. \`getByTestId()\` - \`data-testid\` attributes
5. \`locator()\` with CSS - last resort for complex selectors

## Guidelines
- Prefer accessibility-oriented selectors for better test resilience
- Avoid XPath selectors - they are brittle and hard to maintain
- Avoid structural selectors (nth-child, descendant combinators)
- Use \`data-testid\` when semantic selectors are not practical
- Configure custom \`testIdAttribute\` in playwright config if needed
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Playwright-Specific Review
- Verify Page Object Model is used for page interactions, not inline locators
- Check that no explicit timeouts (waitForTimeout) are used - rely on auto-waiting
- Verify web-first assertions are used instead of manual checks
- Check selector priority: getByRole > getByText > getByLabel > getByTestId > CSS
- Verify tests are designed for parallel execution with no shared state
- Check that fixtures use proper scoping (test vs worker)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Playwright-Specific Testing
- Use Page Object Model for encapsulating page interactions
- Rely on auto-waiting - never use explicit timeouts
- Use web-first assertions: \`expect(locator).toBeVisible()\`, \`toHaveText()\`
- Use \`test.extend()\` for custom fixtures
- Use role-based selectors: \`getByRole()\`, \`getByText()\`, \`getByLabel()\`
- Use \`page.route()\` for network mocking
- Design tests for parallel execution with isolated state
- Use trace viewer for debugging failed tests`,
      },
    ],
  },
};
