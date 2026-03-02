import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const cypressProfile: Profile = {
  id: 'testing/cypress',
  name: 'Cypress',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['cypress'],
  contributions: {
    claudeMd: [
      {
        heading: 'Cypress Testing Conventions',
        order: 3010,
        content: `## Cypress Testing Conventions

### Test Structure & Organization
- Place E2E tests in \`cypress/e2e/\` organized by feature or user flow — one spec file per feature area
- Place component tests in \`cypress/component/\` colocated with or mirroring source directory structure
- Use \`describe\` blocks to group related tests by feature — max 2 levels of nesting
- Use descriptive \`it()\` names that state the user intent: \`it('should display error when submitting empty form')\`
- Use \`beforeEach\` for per-test setup (authentication, data seeding) — avoid \`before\` unless truly one-time
- Use \`afterEach\` only when tests create persistent external state that must be cleaned up
- Keep tests independent — never rely on state from previous tests; \`testIsolation\` is enabled by default since Cypress 12

### Selectors (Resilience Priority)
- Always use \`data-cy\` attributes for test-specific selectors: \`cy.get('[data-cy="submit-btn"]')\`
- Use \`cy.contains()\` for text-based selection as a complement when element text is stable and meaningful
- Use \`cy.findByRole()\`, \`cy.findByLabelText()\` if using \`@testing-library/cypress\` plugin
- Never use CSS classes, element IDs tied to styling, tag names, or structural selectors (nth-child, descendant chains) — they break on refactors
- Define selector constants or helper functions for reuse across tests and custom commands

### Network Requests & cy.intercept()
- Use \`cy.intercept()\` to stub HTTP responses for deterministic test data: \`cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers')\`
- Alias every intercepted route with \`.as()\` and wait on it with \`cy.wait('@getUsers')\` — never use \`cy.wait(ms)\` with arbitrary timeouts
- Use \`req.reply()\` for dynamic response stubbing, \`req.continue()\` to modify real responses, \`req.destroy()\` to simulate network errors
- Verify request payloads: \`cy.wait('@createUser').its('request.body').should('deep.include', { name: 'Alice' })\`
- Test error states by intercepting with status codes: \`cy.intercept('POST', '/api/login', { statusCode: 401, body: { error: 'Unauthorized' } })\`

### Retry-ability & Assertions
- Rely on Cypress built-in retry-ability — queries (\`cy.get\`, \`cy.find\`, \`cy.contains\`) automatically retry until timeout
- Use \`.should()\` assertions that auto-retry: \`cy.get('[data-cy="status"]').should('have.text', 'Active')\`
- Chain assertions with \`.and()\` for multiple checks on the same subject: \`.should('be.visible').and('contain', 'Success')\`
- Never use explicit \`cy.wait(ms)\` for timing — use \`cy.intercept()\` aliases or \`.should()\` with expected conditions
- Use \`cy.get(..., { timeout: 10000 })\` to increase timeout for slow operations instead of arbitrary waits

### Authentication & cy.session()
- Use \`cy.session()\` to cache and restore cookies, localStorage, and sessionStorage across tests
- Define login commands that wrap \`cy.session()\` for reusable authentication: \`cy.session(userId, () => { cy.loginViaApi(userId) })\`
- Use the \`validate\` callback in \`cy.session()\` to verify the cached session is still valid before reuse
- Seed test data through API calls in \`beforeEach\` using \`cy.request()\` — never seed through UI interactions

### Component Testing
- Use \`cy.mount()\` to render components in isolation within \`cypress/component/\` specs
- Provide required props, context providers, and router wrappers via mount options
- Customize \`cy.mount()\` in \`cypress/support/component.ts\` to include global providers automatically
- Use \`cy.intercept()\` within component tests to mock API calls the component makes
- Test interactive states: default, hover, focus, disabled, error, loading

### Custom Commands
- Define reusable commands in \`cypress/support/commands.ts\` — import them in \`cypress/support/e2e.ts\`
- Add TypeScript declarations in \`cypress/support/index.d.ts\` or \`cypress.d.ts\` for type safety
- Prefix commands with domain context: \`cy.loginAs()\`, \`cy.createProject()\`, \`cy.seedDatabase()\`
- Keep each command focused on one reusable action — do not make every helper a custom command
- Return Cypress chainable for composability — let calling code add its own assertions

### Configuration
- Set \`baseUrl\` in \`cypress.config.ts\` to avoid hardcoded URLs in \`cy.visit()\`
- Configure \`retries\` for CI resilience: \`retries: { runMode: 2, openMode: 0 }\`
- Use \`defaultCommandTimeout\` and \`requestTimeout\` instead of per-command overrides when possible
- Store static test data in \`cypress/fixtures/\` as JSON files — reference with \`cy.fixture()\` or \`{ fixture: 'file.json' }\`
- Use \`cypress.env.json\` or environment variables for environment-specific values — never hardcode URLs or credentials`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx cypress run:*)',
          'Bash(npx cypress open:*)',
          'Bash(npx cypress verify:*)',
          'Bash(npm run cypress:*)',
          'Bash(npm run cy:*)',
          'Bash(yarn cypress:*)',
          'Bash(yarn cy:*)',
          'Bash(pnpm cypress:*)',
          'Bash(pnpm cy:*)',
          'Bash(npx cypress run --spec:*)',
          'Bash(npx cypress run --component:*)',
          'Bash(npx cypress run --browser:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/cypress-conventions.md',
        governance: 'mandatory',
        description: 'Cypress testing conventions covering selectors, intercepts, custom commands, test isolation, and retry-ability',
        content: `# Cypress Testing Conventions

## Selector Strategy
- ALWAYS use \`data-cy\` attributes for element selection: \`cy.get('[data-cy="submit-button"]')\`
- Use \`cy.contains()\` as a complement when element text is stable and user-visible
- NEVER use CSS classes, IDs tied to styling, tag names, or structural selectors — they break when markup changes
- Define selector constants for shared use across tests and custom commands:
  \`\`\`typescript
  const SELECTORS = {
    submitButton: '[data-cy="submit-button"]',
    errorMessage: '[data-cy="error-message"]',
    userNameInput: '[data-cy="user-name-input"]',
  } as const;
  \`\`\`

## Network Interception
- Use \`cy.intercept()\` to stub all network requests for deterministic test data
- ALWAYS alias intercepted routes with \`.as()\` and wait with \`cy.wait('@alias')\`:
  \`\`\`typescript
  cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
  cy.visit('/users');
  cy.wait('@getUsers');
  \`\`\`
- Use \`req.reply()\` to dynamically control responses, \`req.continue()\` to intercept real responses
- Verify outgoing request payloads:
  \`\`\`typescript
  cy.wait('@createUser').its('request.body').should('deep.include', { email: 'test@example.com' });
  \`\`\`
- Test error states by intercepting with error responses:
  \`\`\`typescript
  cy.intercept('POST', '/api/checkout', { statusCode: 500, body: { error: 'Server error' } }).as('checkoutFail');
  \`\`\`
- NEVER use \`cy.wait(milliseconds)\` with arbitrary timeouts — always wait on intercept aliases or assertions

## Authentication & Session Caching
- Use \`cy.session()\` to cache authentication state across tests:
  \`\`\`typescript
  Cypress.Commands.add('loginAs', (username: string, password: string) => {
    cy.session([username, password], () => {
      cy.request('POST', '/api/auth/login', { username, password })
        .its('body.token')
        .then((token) => {
          window.localStorage.setItem('auth_token', token);
        });
    }, {
      validate() {
        cy.request({ url: '/api/me', failOnStatusCode: false }).its('status').should('eq', 200);
      },
    });
  });
  \`\`\`
- Seed test data through API calls (\`cy.request()\`) in \`beforeEach\`, never through UI interactions
- Use different session IDs per user to cache multiple user sessions in the same spec

## Custom Commands
- Define commands in \`cypress/support/commands.ts\` and import in \`cypress/support/e2e.ts\`
- ALWAYS add TypeScript type declarations for custom commands:
  \`\`\`typescript
  // cypress.d.ts
  declare namespace Cypress {
    interface Chainable {
      /** Login as a specific user via API and cache the session */
      loginAs(username: string, password: string): Chainable<void>;
      /** Get element by data-cy attribute */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
    }
  }
  \`\`\`
- Prefix commands with domain context: \`cy.loginAs()\`, \`cy.createProject()\`, \`cy.seedDatabase()\`
- Keep each command focused on one action — return Cypress chainable for composability
- Let calling code choose assertions — do not assert inside commands unless checking preconditions

## Test Isolation
- Keep \`testIsolation: true\` (the default since Cypress 12) — Cypress automatically clears cookies, localStorage, and sessionStorage before each test
- Never rely on state from a previous test — each \`it()\` block must be independently runnable
- Use \`cy.session()\` for authentication caching instead of sharing login state across tests
- Clean up external side effects (database records, file uploads) in \`afterEach\` when needed

## Component Testing
- Use \`cy.mount()\` to render components in isolation
- Test component behavior through user interactions, not implementation details
- Wrap \`cy.mount()\` with global providers (theme, router, store) in \`cypress/support/component.ts\`
- Use \`cy.intercept()\` within component tests for API calls the component makes
- Test all interactive states: default, hover, focus, disabled, error, loading, empty

## Retry-ability & Assertions
- Rely on built-in retry-ability: \`cy.get()\`, \`cy.find()\`, \`cy.contains()\` automatically retry until timeout
- Use \`.should()\` for auto-retrying assertions: \`cy.get('[data-cy="status"]').should('have.text', 'Active')\`
- Chain assertions with \`.and()\`: \`.should('be.visible').and('not.be.disabled')\`
- Use \`{ timeout: N }\` on specific commands for known-slow operations instead of global timeout increase
- Use \`cy.get().should('not.exist')\` to assert element removal — Cypress retries until true or timeout

## Patterns to Avoid
- \`cy.wait(2000)\` or any arbitrary numeric timeout — always use intercept aliases or assertions
- \`Cypress.config('defaultCommandTimeout', 30000)\` globally — fix the root cause of slow operations
- Conditional testing based on DOM state (\`if element exists, do X\`) — this leads to flaky tests
- Assigning Cypress command return values to variables: \`const el = cy.get()\` — use \`.then()\` instead
- Using \`cy.get().click({ force: true })\` to bypass visibility checks — fix the UI state instead
- Using \`test.only\` or \`describe.only\` in committed code — use only for local debugging
`,
      },
      {
        path: 'testing/cypress-configuration.md',
        governance: 'recommended',
        description: 'Cypress configuration best practices for cypress.config.ts and environment setup',
        content: `# Cypress Configuration Best Practices

## Recommended cypress.config.ts
\`\`\`typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  // E2E Testing Configuration
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 6000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    retries: {
      runMode: 2,   // retry failed tests in CI
      openMode: 0,  // no retries in interactive mode
    },
    video: false,               // disable video by default — enable in CI if needed
    screenshotOnRunFailure: true,
    testIsolation: true,        // default since Cypress 12
  },

  // Component Testing Configuration
  component: {
    devServer: {
      framework: 'react',       // or 'vue', 'angular', 'svelte'
      bundler: 'vite',          // or 'webpack'
    },
    specPattern: 'cypress/component/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});
\`\`\`

## Directory Structure
\`\`\`
cypress/
  e2e/                    # E2E test specs organized by feature
    auth/
      login.cy.ts
      registration.cy.ts
    dashboard/
      dashboard.cy.ts
  component/              # Component test specs
    Button.cy.tsx
    LoginForm.cy.tsx
  fixtures/               # Static test data (JSON)
    users.json
    products.json
  support/
    commands.ts           # Custom commands
    e2e.ts                # E2E support file (imports commands)
    component.ts          # Component support file (mount customization)
    index.d.ts            # TypeScript declarations for custom commands
cypress.config.ts         # Main configuration file
cypress.env.json          # Environment-specific variables (gitignored)
\`\`\`

## Environment Variables
- Store environment-specific values in \`cypress.env.json\` (gitignored) or CI environment variables
- Access in tests with \`Cypress.env('API_KEY')\`
- Never hardcode production URLs, API keys, or credentials in test files
- Use \`CYPRESS_\` prefix for system environment variables: \`CYPRESS_BASE_URL=https://staging.example.com\`

## CI Configuration
- Use \`--record\` flag to send results to Cypress Cloud for flaky test tracking
- Set \`--browser chrome\` (or \`electron\`) explicitly in CI for reproducibility
- Use \`--spec\` flag to run specific specs for faster feedback in PR checks
- Configure \`retries.runMode: 2\` to handle intermittent CI failures gracefully
- Separate E2E and component test CI jobs for faster parallel execution
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Cypress-Specific Review Checklist
- Verify \`data-cy\` attributes are used for selectors — flag any use of CSS classes, IDs, tag names, or structural selectors for test targeting
- Check that every \`cy.intercept()\` call uses \`.as()\` alias and corresponding \`cy.wait('@alias')\`
- Verify no \`cy.wait()\` with numeric millisecond values exists — all waits must use intercept aliases or assertion-based conditions
- Check that \`cy.session()\` is used for authentication caching instead of repeating login flows per test
- Verify custom commands in \`cypress/support/commands.ts\` have TypeScript declarations in a \`.d.ts\` file
- Check that tests do not depend on state from previous tests — each \`it()\` must be independently runnable
- Verify test data is seeded via \`cy.request()\` API calls in \`beforeEach\`, not through UI interactions
- Check that \`force: true\` is not used on click/type actions — it masks real visibility problems
- Verify \`cy.get()\` return values are not assigned to variables — use \`.then()\` for value extraction
- Check that component tests wrap \`cy.mount()\` with required providers and test multiple interactive states
- Verify fixtures in \`cypress/fixtures/\` are used for static test data instead of inline hardcoded objects
- Check that \`baseUrl\` is configured in \`cypress.config.ts\` — no hardcoded URLs in \`cy.visit()\`
- Verify no \`.only\` is left in committed test code (it.only, describe.only)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Cypress-Specific Test Writing Guidelines
- Use \`data-cy\` attributes for element selection — add them to source components when missing
- Stub network requests with \`cy.intercept()\` aliased with \`.as()\` and waited on with \`cy.wait('@alias')\`
- Use \`cy.session()\` for authentication caching — wrap login flow in a custom command using \`cy.session()\`
- Seed test data via \`cy.request()\` in \`beforeEach\` — never use UI interactions for setup
- Use \`cy.mount()\` for component tests with proper provider wrappers configured in support file
- Write assertions with \`.should()\` and \`.and()\` that leverage auto-retry: \`cy.get('[data-cy="msg"]').should('contain', 'Success')\`
- Test error states by intercepting with error status codes: \`cy.intercept('POST', url, { statusCode: 500 })\`
- Test loading states by delaying intercepted responses: \`cy.intercept('GET', url, (req) => req.reply({ delay: 1000, body: data }))\`
- Verify outgoing request payloads: \`cy.wait('@alias').its('request.body').should('deep.include', expected)\`
- Use fixtures from \`cypress/fixtures/\` for reusable test data
- Structure tests: describe by feature, it by user behavior — max 2 levels of describe nesting
- Use \`cy.get().should('not.exist')\` to verify element removal after actions
- Test both happy paths and error paths for every critical user flow`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Cypress Security Review
- Verify test fixtures and mock data in \`cypress/fixtures/\` do not contain real credentials, API keys, or PII
- Check that \`cypress.env.json\` is listed in \`.gitignore\` and does not contain production secrets
- Verify \`cy.request()\` calls in test setup do not use production API endpoints or real credentials
- Check that \`baseUrl\` in \`cypress.config.ts\` does not point to production environments
- Verify intercepted response stubs do not include real tokens, passwords, or internal URLs
- Check that Cypress screenshots and videos (if enabled) do not capture sensitive data on screen
- Verify environment variables accessed via \`Cypress.env()\` use test-safe values, not production secrets
- Check that custom commands for authentication use test-specific accounts, never real user credentials`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Cypress Test Refactoring Guidance
- Extract repeated selector strings into shared constant objects for DRY test code
- Replace inline login flows with \`cy.session()\`-backed custom commands for faster test execution
- Convert repeated \`cy.intercept()\` stubs used across multiple specs into shared helper functions
- Move common provider wrappers for \`cy.mount()\` into \`cypress/support/component.ts\` customization
- Replace \`cy.wait(ms)\` with intercept aliases or assertion-based waits
- Extract large inline fixture data into \`cypress/fixtures/\` JSON files
- Replace duplicated beforeEach setup across specs with custom commands
- Convert chained \`.then()\` pyramids into flatter command chains using custom commands
- Remove \`{ force: true }\` from click/type actions and fix the underlying UI visibility issue instead`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Cypress Migration Guidance
- When migrating from Selenium/WebDriver: replace explicit waits with Cypress auto-retry, replace page objects with custom commands or lightweight helpers, replace CSS selectors with data-cy attributes
- When migrating from Protractor (Angular): replace \`browser.get()\` with \`cy.visit()\`, replace \`element(by.css())\` with \`cy.get()\`, replace \`browser.sleep()\` with \`cy.intercept()\` aliases
- When migrating from Cypress 12 to 13+: verify \`testIsolation: true\` behavior, update deprecated \`cy.intercept()\` patterns, check for removed \`experimentalSessionAndOrigin\` flag
- When migrating to Playwright: replace \`cy.get()\` with \`page.locator()\`, replace \`cy.intercept()\` with \`page.route()\`, replace custom commands with page objects, replace \`cy.session()\` with \`storageState\`
- When migrating from \`cy.route()\` (deprecated) to \`cy.intercept()\`: update route matching syntax, use \`req.reply()\` instead of \`cy.route().as()\` response stubs
- Check Cypress changelog for breaking changes in major version upgrades: command behavior changes, config option renames, plugin API updates`,
      },
    ],
    skills: [
      {
        name: 'cypress-e2e-generator',
        description: 'Generate comprehensive Cypress E2E test suites for feature flows',
        content: `# Cypress E2E Test Generator

## Purpose
Generate well-structured Cypress E2E test suites that follow best practices for selectors, network stubbing, authentication, and test isolation.

## Process

### 1. Analyze the Feature Under Test
- Identify the critical user flows (happy path, error states, edge cases)
- Map all API endpoints the feature calls (for cy.intercept stubs)
- Identify elements that need \`data-cy\` attributes for selection
- Determine authentication requirements and test data needs

### 2. Set Up Test File Structure
\`\`\`typescript
import { SELECTORS } from '../support/selectors';

describe('Feature Name', () => {
  beforeEach(() => {
    // Authentication
    cy.loginAs('testuser', 'password');

    // Stub API responses
    cy.intercept('GET', '/api/resource', { fixture: 'resource.json' }).as('getResource');

    // Navigate to the page
    cy.visit('/feature-page');
    cy.wait('@getResource');
  });

  it('should display the feature correctly on load', () => {
    cy.get(SELECTORS.featureTitle).should('be.visible').and('contain', 'Expected Title');
  });
});
\`\`\`

### 3. Write Tests in This Order
1. **Page load / initial state**: verify the feature renders correctly
2. **Happy path interactions**: form submissions, button clicks, navigation
3. **Error states**: API failures, validation errors, network timeouts
4. **Edge cases**: empty data, boundary values, concurrent actions
5. **Loading states**: verify spinners/skeletons appear during async operations

### 4. Network Stubbing Template
\`\`\`typescript
// Success response from fixture
cy.intercept('GET', '/api/items', { fixture: 'items.json' }).as('getItems');

// Error response
cy.intercept('POST', '/api/items', { statusCode: 422, body: { errors: ['Name is required'] } }).as('createItemFail');

// Delayed response for loading state testing
cy.intercept('GET', '/api/items', (req) => {
  req.reply({ delay: 2000, fixture: 'items.json' });
}).as('getItemsSlow');

// Verify request payload
cy.get('[data-cy="submit-btn"]').click();
cy.wait('@createItem').its('request.body').should('deep.include', { name: 'New Item' });
\`\`\`

### 5. Authentication Template
\`\`\`typescript
// In cypress/support/commands.ts
Cypress.Commands.add('loginAs', (username: string, password: string) => {
  cy.session([username, password], () => {
    cy.request('POST', '/api/auth/login', { username, password });
  }, {
    validate() {
      cy.request({ url: '/api/me', failOnStatusCode: false }).its('status').should('eq', 200);
    },
  });
});
\`\`\`

## Quality Checklist
- [ ] All selectors use \`data-cy\` attributes
- [ ] Every API call is intercepted with \`cy.intercept()\` and aliased
- [ ] No \`cy.wait(ms)\` with numeric values — only intercept aliases
- [ ] Authentication uses \`cy.session()\` for caching
- [ ] Test data seeded via \`cy.request()\`, not UI interactions
- [ ] Both happy paths and error states are covered
- [ ] Tests are independent — no shared mutable state
- [ ] Assertions use \`.should()\` with auto-retry
- [ ] No \`{ force: true }\` on interactions
- [ ] Loading and empty states are tested where applicable
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.cy\\.(ts|tsx|js|jsx)$" && grep -cE "\\b(it\\.only|describe\\.only|context\\.only)\\b" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:1:Focused test detected (.only) in Cypress spec — remove before committing to avoid skipping other tests" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.cy\\.(ts|tsx|js|jsx)$" && grep -nE "cy\\.wait\\(\\s*[0-9]" "$CLAUDE_FILE_PATH" | head -1 | grep -q "." && echo "HOOK_EXIT:1:cy.wait() with numeric timeout detected in Cypress spec — use cy.intercept() aliases or .should() assertions instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.cy\\.(ts|tsx|js|jsx)$" && grep -nE "\\{\\s*force:\\s*true\\s*\\}" "$CLAUDE_FILE_PATH" | head -1 | grep -q "." && echo "HOOK_EXIT:0:Warning: { force: true } detected in Cypress spec — this masks real visibility issues, consider fixing the UI state instead" || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
