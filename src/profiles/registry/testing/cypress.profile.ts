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
        heading: 'Cypress Conventions',
        order: 30,
        content: `## Cypress Conventions

E2E and component testing. Automatic waiting, time-travel debugging.

**Detailed rules:** see \`.claude/rules/cypress/\` directory.

**Key rules:**
- Use \`data-cy\` attributes for selectors — never CSS classes or tag names
- Commands chain naturally — avoid unnecessary \`cy.wait()\`, let Cypress auto-retry
- Custom commands for repeated patterns, \`cy.intercept()\` for network stubs
- Keep tests independent — reset state in \`beforeEach\`, no test interdependence`,
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
        paths: ['cypress/**/*', '**/*.cy.ts', '**/*.cy.tsx'],
        governance: 'mandatory',
        description: 'Cypress testing conventions covering selectors, intercepts, custom commands, test isolation, and retry-ability',
        content: `# Cypress Testing Conventions

## Selector Strategy
- ALWAYS use \`data-cy\` attributes for element selection — never CSS classes, IDs, or tag names
- Use \`cy.contains()\` as a complement when element text is stable and user-visible
- Define selector constants for shared use across tests and custom commands

## Network Interception
- Use \`cy.intercept()\` to stub all network requests for deterministic test data
- ALWAYS alias intercepted routes with \`.as()\` and wait with \`cy.wait('@alias')\`
- Use \`req.reply()\` to dynamically control responses, \`req.continue()\` for real responses
- Verify outgoing request payloads via \`cy.wait('@alias').its('request.body')\`
- Test error states by intercepting with error status codes
- NEVER use \`cy.wait(milliseconds)\` with arbitrary timeouts

## Authentication & Session Caching
- Use \`cy.session()\` to cache authentication state across tests
- Seed test data via \`cy.request()\` in \`beforeEach\`, never through UI interactions
- Use different session IDs per user to cache multiple sessions in the same spec

## Custom Commands
- Define in \`cypress/support/commands.ts\`, import in \`cypress/support/e2e.ts\`
- ALWAYS add TypeScript type declarations in a \`.d.ts\` file
- Prefix with domain context: \`cy.loginAs()\`, \`cy.createProject()\`, \`cy.seedDatabase()\`
- Keep each command focused on one action — return chainable for composability

## Test Isolation
- Keep \`testIsolation: true\` (default since Cypress 12) — auto-clears cookies/storage per test
- Each \`it()\` block must be independently runnable — no shared state between tests
- Clean up external side effects (database records, file uploads) in \`afterEach\`

## Component Testing
- Use \`cy.mount()\` with global providers in \`cypress/support/component.ts\`
- Test behavior through user interactions, not implementation details
- Test all interactive states: default, hover, focus, disabled, error, loading, empty

## Retry-ability & Assertions
- Rely on built-in retry-ability — \`cy.get()\`, \`cy.find()\`, \`cy.contains()\` auto-retry
- Use \`.should()\` for auto-retrying assertions, chain with \`.and()\`
- Use \`{ timeout: N }\` on specific commands instead of global timeout increase
- Use \`cy.get().should('not.exist')\` to assert element removal
`,
      },
      {
        path: 'testing/cypress-configuration.md',
        paths: ['cypress/**/*', '**/*.cy.ts', '**/*.cy.tsx'],
        governance: 'recommended',
        description: 'Cypress configuration best practices for cypress.config.ts and environment setup',
        content: `# Cypress Configuration Best Practices

## cypress.config.ts
- Configure \`baseUrl\`, \`specPattern\`, \`supportFile\` for both E2E and component testing
- Set \`viewportWidth: 1280\`, \`viewportHeight: 720\` for consistent rendering
- Configure timeouts: \`defaultCommandTimeout: 6000\`, \`requestTimeout: 10000\`
- Set \`retries: { runMode: 2, openMode: 0 }\` for CI resilience
- Keep \`video: false\` by default — enable in CI if needed
- Keep \`testIsolation: true\` (default since Cypress 12)
- Configure component \`devServer\` with correct framework and bundler

## Directory Structure
- \`cypress/e2e/\` — E2E specs organized by feature
- \`cypress/component/\` — Component test specs
- \`cypress/fixtures/\` — Static test data (JSON)
- \`cypress/support/commands.ts\` — Custom commands
- \`cypress/support/e2e.ts\` — E2E support file (imports commands)
- \`cypress/support/component.ts\` — Component support (mount customization)
- \`cypress.env.json\` — Environment-specific variables (gitignored)

## Environment Variables
- Store values in \`cypress.env.json\` (gitignored) or CI environment variables
- Access with \`Cypress.env('KEY')\` — never hardcode production URLs or credentials
- Use \`CYPRESS_\` prefix for system environment variables

## CI Configuration
- Use \`--record\` flag for Cypress Cloud flaky test tracking
- Set \`--browser chrome\` explicitly in CI for reproducibility
- Use \`--spec\` flag to run specific specs for faster PR feedback
- Separate E2E and component test CI jobs for parallel execution
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Cypress-Specific Review Checklist
Available skills: cypress-e2e-generator
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
Available skills: cypress-e2e-generator
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
Available skills: cypress-e2e-generator
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.cy\\.(ts|tsx|js|jsx)$" && grep -cE "\\b(it\\.only|describe\\.only|context\\.only)\\b" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Focused test detected (.only) in Cypress spec — remove before committing to avoid skipping other tests" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for .only in Cypress specs',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.cy\\.(ts|tsx|js|jsx)$" && grep -nE "cy\\.wait\\(\\s*[0-9]" "$FILE_PATH" | head -1 | grep -q "." && { echo "cy.wait() with numeric timeout detected in Cypress spec — use cy.intercept() aliases or .should() assertions instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for cy.wait() with numeric timeout',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.cy\\.(ts|tsx|js|jsx)$" && grep -nE "\\{\\s*force:\\s*true\\s*\\}" "$FILE_PATH" | head -1 | grep -q "." && { echo "Warning: { force: true } detected in Cypress spec — this masks real visibility issues, consider fixing the UI state instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for { force: true } in Cypress specs',
          },
        ],
      },
    ],
  },
};
