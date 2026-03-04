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
        heading: 'Playwright Conventions',
        order: 30,
        content: `## Playwright Conventions

Cross-browser E2E testing. Auto-waiting, web-first assertions, trace viewer.

**Detailed rules:** see \`.claude/rules/playwright/\` directory.

**Key rules:**
- Use locators: \`getByRole\`, \`getByLabel\`, \`getByTestId\` — never CSS selectors
- Web-first assertions (\`expect(locator).toBeVisible()\`) with auto-retry
- Page Object Model for complex flows, fixtures for shared setup
- Parallel execution by default — tests must be independent`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx playwright test:*)',
          'Bash(npx playwright codegen:*)',
          'Bash(npx playwright show-report:*)',
          'Bash(npx playwright show-trace:*)',
          'Bash(npx playwright install:*)',
          'Bash(npm run test:e2e:*)',
          'Bash(npm run playwright:*)',
          'Bash(pnpm playwright:*)',
          'Bash(pnpm test:e2e:*)',
          'Bash(yarn playwright:*)',
          'Bash(yarn test:e2e:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/playwright-conventions.md',
        paths: ['**/*.spec.ts', 'tests/**/*', 'e2e/**/*'],
        governance: 'mandatory',
        description:
          'Playwright testing conventions — mandatory rules for locators, assertions, fixtures, and parallel execution',
        content: `# Playwright Testing Conventions

## Locator Strategy (Priority Order)
1. \`page.getByRole()\` — ARIA role-based (most resilient)
2. \`page.getByLabel()\` — form labels
3. \`page.getByPlaceholder()\` / \`page.getByText()\` — visible content
4. \`page.getByTestId()\` — explicit \`data-testid\` contracts
5. \`page.locator('css=...')\` — CSS selectors (last resort)
- NEVER use XPath or CSS class selectors for test targeting
- Use \`.filter()\` to narrow scope; define reusable locators in Page Objects

## Auto-Waiting Rules
- NEVER use \`page.waitForTimeout()\` — always wrong in Playwright
- Rely on built-in auto-waiting; use web-first assertions (\`expect(locator).toBeVisible()\`)
- Use \`page.waitForURL()\` for navigation, \`page.waitForResponse(url)\` for API waits
- Use \`expect.poll()\` for custom retry logic on non-locator values

## Assertion Rules
- ALWAYS use web-first assertions — they auto-retry and are race-condition-free
- Use \`expect(page).toHaveURL()\`, \`toHaveTitle()\`; \`expect(response).toBeOK()\`
- Use \`expect.soft()\` for non-blocking multi-condition checks
- Use \`toHaveScreenshot({ maxDiffPixelRatio: 0.01 })\` for visual regression
- NEVER extract locator state manually — use web-first assertions directly

## Fixture Rules
- Use \`test.extend<T>()\` for custom fixtures with automatic teardown
- Use \`{ scope: 'worker' }\` for expensive shared resources
- Use \`storageState\` for auth reuse; create \`auth.setup.ts\` project for global auth
- Fixtures can depend on other fixtures for modular composition

## Parallel Execution
- Design EVERY test to be independent — no shared mutable state
- Use \`fullyParallel: true\` as default; serial mode only when genuinely needed
- Isolate test data per test with unique identifiers

## Network Mocking
- Use \`page.route()\` for interception — register BEFORE \`page.goto()\`
- \`route.fulfill({ json: mockData })\` for mocks, \`route.abort()\` for error paths
- Use HAR recording for complex multi-request scenarios
- NEVER call real external APIs in tests
`,
      },
      {
        path: 'testing/playwright-configuration.md',
        paths: ['**/*.spec.ts', 'tests/**/*', 'e2e/**/*'],
        governance: 'recommended',
        description:
          'Playwright configuration best practices for playwright.config.ts including projects, reporters, and CI settings',
        content: `# Playwright Configuration Best Practices

## playwright.config.ts Key Settings
- \`fullyParallel: true\`, \`forbidOnly: !!process.env.CI\`, \`retries: process.env.CI ? 2 : 0\`
- \`use.trace: 'on-first-retry'\`, \`screenshot: 'only-on-failure'\`, \`video: 'retain-on-failure'\`
- Configure \`baseURL\`, \`webServer\` for local dev, \`reporter\` (html locally, junit on CI)

## Project Organization
- Use a dedicated \`setup\` project for authentication before test projects
- Configure \`dependencies\` to ensure setup runs first
- Use \`devices\` presets for desktop and mobile viewports
- Group projects by browser engine and device type

## Timeouts
- Default test: 30s, assertion: 5s — override in config as needed
- Use \`test.setTimeout(ms)\` for individual slow tests
- Use \`test.slow()\` to triple timeout for known slow tests

## Reporters
- \`html\` for local dev, \`junit\` on CI, \`blob\` for sharded runs
- Use \`list\` for terminal output during runs

## CI Integration
- \`forbidOnly: true\` on CI; \`retries: 2\` for flakiness resilience
- \`trace: 'on-first-retry'\` for debugging without overhead on passing tests
- Upload HTML report and trace artifacts; use \`--shard=N/M\` for distribution

## Authentication Setup
- Create \`tests/auth.setup.ts\` that logs in and saves \`storageState\`
- Reference \`storageState\` in browser project configs with \`dependencies: ['setup']\`

## Visual Regression
- Use \`toHaveScreenshot()\` with \`maxDiffPixelRatio\` for threshold control
- Set \`animations: 'disabled'\` to stabilize comparisons
- Update baselines with \`--update-snapshots\` — review every change
- Store baselines in version control
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Playwright-Specific Review Checklist
Available skills: playwright-test-generator
- Verify locator strategy follows priority: getByRole > getByLabel > getByPlaceholder > getByText > getByTestId > CSS — flag any XPath or structural selectors
- Check that NO \`page.waitForTimeout()\` calls exist — this is always wrong in Playwright
- Verify all assertions use web-first \`expect(locator)\` methods, not manual state extraction like \`expect(await el.isVisible()).toBe(true)\`
- Check that \`page.route()\` is registered BEFORE \`page.goto()\` to intercept early requests
- Verify tests are designed for parallel execution: no shared mutable state, no order dependencies between tests
- Check fixture scoping: test-scoped for per-test resources, worker-scoped (with \`{ scope: 'worker' }\`) for expensive shared resources
- Verify \`storageState\` is used for authentication reuse instead of logging in via UI in every test
- Check that locators are defined in Page Object classes or fixture helpers — not constructed inline with raw strings
- Verify \`test.describe.configure({ mode: 'serial' })\` is used only when tests genuinely depend on execution order
- Check that \`test.only\` is not present in committed code — \`forbidOnly\` should catch this on CI
- Verify network mocks use \`route.fulfill()\` with realistic data, not empty or minimal stubs
- Check that trace configuration uses \`on-first-retry\` on CI to capture debugging data without overhead
- Verify visual regression tests use \`toHaveScreenshot()\` with appropriate threshold settings
- Check that test annotations (\`test.skip\`, \`test.fixme\`, \`test.slow\`) include a reason string explaining why`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Playwright-Specific Test Writing Guidelines
Available skills: playwright-test-generator
- Use role-based locators as the default: \`page.getByRole('button', { name: '...' })\`, \`page.getByLabel('...')\`
- Use web-first assertions exclusively: \`expect(locator).toBeVisible()\`, \`toHaveText()\`, \`toHaveValue()\`, \`toHaveURL()\`
- NEVER use \`page.waitForTimeout()\` — use \`page.waitForURL()\`, \`page.waitForResponse()\`, or web-first assertions
- Use \`test.step('description', async () => { ... })\` to label phases of complex test flows for trace readability
- Use \`test.extend<T>()\` for custom fixtures: provide typed setup, automatic teardown, and dependency injection
- Use \`page.route(urlPattern, handler)\` for network mocking — register before \`page.goto()\`
- Use \`route.fulfill({ json: data })\` for mocked responses, \`route.abort()\` for error simulation
- Use Page Object Model: encapsulate page interactions in classes with typed locators and action methods
- Use \`expect.soft()\` when checking multiple independent conditions that should all be reported
- Use \`expect.poll(async () => { ... })\` for custom retry logic on non-locator async values
- Design tests for parallel execution: each test creates its own data, no shared mutable state
- Use \`storageState\` for authentication — create setup projects that authenticate once and save state
- Use \`expect(page).toHaveScreenshot()\` for visual regression — configure threshold with \`maxDiffPixelRatio\`
- Tag tests with \`test('name @smoke', ...)\` and filter with \`--grep @smoke\` for selective execution
- Write API tests using the \`request\` fixture (APIRequestContext) for backend validation alongside UI tests`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Playwright Security Review
- Verify test fixtures and mock data do not contain real credentials, API keys, or PII
- Check that \`storageState\` files containing auth tokens are in \`.gitignore\` and not committed to version control
- Verify \`page.route()\` is used to mock external service calls — tests must NEVER hit real production APIs
- Check that test environment variables use dummy values, not real production credentials
- Verify \`baseURL\` in playwright config points to a local or staging URL, never production
- Check that screenshot and trace artifacts do not capture sensitive data (login tokens in URL, PII on screen)
- Verify \`webServer\` configuration starts a local instance, not a tunnel to production
- Check that HAR files used for mocking do not contain real authentication headers or session tokens
- Verify global setup scripts do not store real secrets in plaintext files on disk`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Playwright Test Refactoring Guidance
Available skills: playwright-test-generator
- Extract repeated locator patterns into Page Object Model classes with typed action methods
- Replace inline locator strings with named locator properties on page objects for reusability
- Convert \`beforeEach\` / \`beforeAll\` setup patterns into custom fixtures using \`test.extend<T>()\` for automatic teardown
- Replace raw \`page.route()\` mock setup with shared fixture helpers that provide consistent mock data
- Replace duplicated authentication flows with \`storageState\`-based setup projects
- Convert serial test suites to parallel by extracting shared state into per-test fixtures
- Replace \`page.waitForTimeout()\` with web-first assertions or event-based waits
- Extract common assertion sequences into custom fixture methods or test helper functions
- Replace manual locator.isVisible() checks with web-first expect(locator).toBeVisible()
- Consolidate multi-step test flows using \`test.step()\` for better trace viewer readability
- Move hardcoded test data into fixture factories or test data builders for maintainability`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Playwright Migration Guidance
- When migrating from Cypress: replace \`cy.get('[data-cy=...]')\` with \`page.getByTestId('...')\`, replace \`cy.intercept()\` with \`page.route()\`, replace \`cy.visit()\` with \`page.goto()\`
- When migrating from Cypress: replace \`cy.contains()\` with \`page.getByText()\` or \`page.getByRole()\`, replace custom commands with fixtures via \`test.extend()\`
- When migrating from Selenium/WebDriver: replace \`driver.findElement(By.css(...))\` with \`page.locator()\` or \`page.getByRole()\`, replace explicit waits with Playwright auto-waiting
- When migrating from Puppeteer: replace \`page.$(selector)\` with \`page.locator()\`, replace \`page.waitForSelector()\` with web-first assertions
- When upgrading Playwright major versions: check the official migration guide for breaking changes in locator APIs and config format
- Replace \`page.waitForSelector()\` with \`expect(locator).toBeVisible()\` — deprecated waiting pattern
- Update \`playwright.config.ts\` to use \`defineConfig()\` wrapper (introduced in recent versions)
- Migrate from \`toMatchSnapshot()\` (generic) to \`toHaveScreenshot()\` (purpose-built for visual regression)
- When adopting component testing: install \`@playwright/experimental-ct-react\` (or framework equivalent) and follow the official component testing guide`,
      },
    ],
    skills: [
      {
        name: 'playwright-test-generator',
        description:
          'Generate comprehensive Playwright end-to-end test suites with Page Object Model, fixtures, and proper locator strategy',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Playwright Test Generator

## Purpose
Generate well-structured Playwright end-to-end test suites following official best practices: role-based locators, web-first assertions, custom fixtures, Page Object Model, and network mocking.

## Process

### 1. Analyze the Page Under Test
- Identify key user interactions: forms, buttons, navigation, dynamic content
- Map user flows: login, CRUD operations, multi-step wizards
- Identify external API calls that need mocking
- Identify visual elements that benefit from screenshot regression testing

### 2. Create Page Object Model
\`\`\`typescript
import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
}
\`\`\`

### 3. Create Custom Fixtures
\`\`\`typescript
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login-page';

type TestFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
});

export { expect } from '@playwright/test';
\`\`\`

### 4. Write Tests
\`\`\`typescript
import { test, expect } from './fixtures';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ loginPage, page }) => {
    await test.step('Fill in credentials and submit', async () => {
      await loginPage.login('user@example.com', 'validpassword');
    });

    await test.step('Verify redirect to dashboard', async () => {
      await expect(page).toHaveURL(/\\/dashboard/);
      await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    });
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login('user@example.com', 'wrongpassword');
    await loginPage.expectError('Invalid email or password');
  });

  test('should validate required fields', async ({ loginPage, page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});
\`\`\`

### 5. Network Mocking Template
\`\`\`typescript
test('should display products from API', async ({ page }) => {
  // Arrange — mock API before navigation
  await page.route('**/api/products', (route) =>
    route.fulfill({
      json: [
        { id: 1, name: 'Widget', price: 9.99 },
        { id: 2, name: 'Gadget', price: 19.99 },
      ],
    })
  );

  // Act
  await page.goto('/products');

  // Assert
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByText('Widget')).toBeVisible();
  await expect(page.getByText('$19.99')).toBeVisible();
});
\`\`\`

### 6. API Testing Template
\`\`\`typescript
import { test, expect } from '@playwright/test';

test('should create and retrieve a product via API', async ({ request }) => {
  // Create
  const createResponse = await request.post('/api/products', {
    data: { name: 'New Product', price: 29.99 },
  });
  expect(createResponse.ok()).toBeTruthy();
  const product = await createResponse.json();
  expect(product.name).toBe('New Product');

  // Retrieve
  const getResponse = await request.get(\`/api/products/\${product.id}\`);
  expect(getResponse.ok()).toBeTruthy();
  const fetched = await getResponse.json();
  expect(fetched.price).toBe(29.99);
});
\`\`\`

## Quality Checklist
- [ ] Page Objects encapsulate all locators and page-specific actions
- [ ] Locators use role-based or label-based selectors (no XPath, no CSS classes)
- [ ] All assertions use web-first \`expect(locator)\` methods
- [ ] No \`page.waitForTimeout()\` anywhere in the test suite
- [ ] External APIs are mocked with \`page.route()\` — no real external calls
- [ ] Tests are independent — run in any order, produce same results
- [ ] Complex flows use \`test.step()\` for trace viewer readability
- [ ] Authentication uses \`storageState\` pattern, not per-test login flows
- [ ] Custom fixtures provide typed setup and automatic teardown
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.(spec|test)\\.(ts|tsx|js|jsx)$" && grep -cE "\\bpage\\.waitForTimeout\\(" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Anti-pattern: page.waitForTimeout() detected — use web-first assertions or event-based waits instead (see https://playwright.dev/docs/best-practices)" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for page.waitForTimeout() anti-pattern',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.(spec|test)\\.(ts|tsx|js|jsx)$" && grep -cE "\\b(test\\.only|describe\\.only)\\b" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Focused test detected (.only) — remove before committing to avoid skipping other tests" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for .only in Playwright specs',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.(spec|test)\\.(ts|tsx|js|jsx)$" && grep -nE "expect\\(await .+\\.(isVisible|isEnabled|isDisabled|isChecked|isHidden|isEditable|textContent|inputValue|getAttribute|innerText)\\(" "$FILE_PATH" | head -1 | grep -q "." && { echo "Warning: manual state extraction detected — use web-first assertions like expect(locator).toBeVisible() instead of expect(await locator.isVisible()).toBe(true)" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for manual state extraction in Playwright specs',
          },
        ],
      },
    ],
  },
};
