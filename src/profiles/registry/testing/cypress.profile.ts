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
        order: 30,
        content: `## Cypress Testing Conventions

- Use \`data-cy\` attributes for test selectors - never rely on CSS classes or element structure
- Organize tests by feature or user flow in the \`cypress/e2e/\` directory
- Use custom commands in \`cypress/support/commands.ts\` for reusable test actions
- Use \`cy.intercept()\` for network stubbing and waiting on API responses
- Leverage component testing (\`cypress/component/\`) for isolated UI component tests
- Avoid \`cy.wait()\` with arbitrary timeouts - use \`cy.intercept()\` aliases instead
- Use \`beforeEach\` for test setup including API seeding and authentication
- Keep tests independent - never rely on state from previous tests
- Use Cypress fixtures (\`cypress/fixtures/\`) for static test data
- Configure \`baseUrl\` in \`cypress.config.ts\` to avoid hardcoded URLs`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx cypress:*)',
          'Bash(cypress:*)',
          'Bash(npm run cy:*)',
          'Bash(yarn cy:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/cypress-conventions.md',
        governance: 'mandatory',
        description: 'Cypress testing conventions and best practices',
        content: `# Cypress Testing Conventions

## Component Testing
- Use \`cy.mount()\` to render components in isolation
- Test component behavior, not implementation details
- Provide required props and mock dependencies via component mounting options
- Use \`cy.intercept()\` to mock API calls within components
- Test all interactive states: default, hover, focus, disabled, error

## E2E Patterns
- Organize tests by user flow or feature area
- Use Page Object pattern or custom commands for reusable interactions
- Seed test data through API calls in \`beforeEach\`, not through UI
- Clean up test data in \`afterEach\` when tests create persistent state
- Test critical user journeys end-to-end, not every possible path
- Use \`cy.session()\` for caching authentication across tests

## Custom Commands
- Define custom commands in \`cypress/support/commands.ts\`
- Type custom commands properly with TypeScript declarations
- Keep commands focused on a single reusable action
- Prefix commands with domain context: \`cy.loginAs()\`, \`cy.createProject()\`
- Use command chaining that returns Cypress chainable for composability

## Intercepts
- Use \`cy.intercept()\` to stub network requests for consistent test data
- Alias intercepted requests with \`.as()\` and wait on them with \`cy.wait()\`
- Use \`routeHandler\` to conditionally modify responses
- Test error states by intercepting with error responses
- Verify request payloads in intercepted calls with \`cy.wait('@alias').its('request.body')\`

## Selectors
- Always use \`data-cy\` attributes: \`cy.get('[data-cy="submit-button"]')\`
- Never use CSS classes, element IDs, or structural selectors for testing
- Define selector constants for reuse across tests
- Use \`cy.contains()\` for text-based selection as a complement to \`data-cy\`
`,
      },
    ],
    agents: [
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Cypress-Specific Testing
- Use \`data-cy\` attributes for element selection
- Write custom commands for reusable test actions
- Use \`cy.intercept()\` for network request stubbing and waiting
- Use \`cy.mount()\` for component testing
- Seed test data via API in \`beforeEach\`, not through UI interactions
- Use \`cy.session()\` for authentication caching
- Avoid arbitrary \`cy.wait()\` - use intercept aliases instead
- Test both happy paths and error states for user flows`,
      },
    ],
  },
};
