import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const expressProfile: Profile = {
  id: 'frameworks/express',
  name: 'Express',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['express'],
  contributions: {
    claudeMd: [
      {
        heading: 'Express Conventions',
        order: 20,
        content: `## Express Conventions

- Organize routes by resource/domain in separate router files
- Use the middleware chain pattern - keep middleware functions focused and composable
- Always use an error-handling middleware as the last middleware in the stack
- Validate all request input (params, query, body) before processing
- Use \`express.json()\` and \`express.urlencoded()\` for body parsing
- Set security headers with \`helmet\` middleware
- Use rate limiting for public-facing endpoints
- Use async/await with proper error forwarding to the error handler
- Never send stack traces or internal errors to clients in production
- Use environment-based configuration - never hardcode secrets
- Structure the app: routes -> controllers -> services -> data access
- Use HTTP status codes correctly and consistently`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(node:*)',
          'Bash(npx nodemon:*)',
          'Bash(npm run dev:*)',
          'Bash(npm run start:*)',
        ],
      },
    },
    rules: [
      {
        path: 'express/middleware-patterns.md',
        governance: 'mandatory',
        description: 'Express middleware and error handling patterns',
        content: `# Express Middleware Patterns

## Middleware Organization
- Apply global middleware in the main app file (CORS, helmet, body parsing, logging)
- Use route-specific middleware for auth, validation, and rate limiting
- Order middleware carefully: security -> parsing -> auth -> routes -> error handling
- Keep middleware functions small and single-purpose

## Error Handling
- Create a centralized error-handling middleware with four parameters: \`(err, req, res, next)\`
- Define custom error classes with HTTP status codes (e.g., NotFoundError, ValidationError)
- Always call \`next(error)\` in async route handlers to forward errors
- Use an async wrapper or express-async-errors to catch rejected promises
- Never send raw error objects or stack traces in production responses
- Log errors with context (request ID, user ID, route) for debugging

## Request Validation
- Validate request body, params, and query using a schema library (Joi, Zod, express-validator)
- Create reusable validation middleware per endpoint
- Return 400 with clear validation error messages
- Sanitize input to prevent injection attacks

## Security Middleware
- Use \`helmet\` for security headers (CSP, HSTS, X-Frame-Options)
- Implement CORS with specific allowed origins - never use wildcard in production
- Use rate limiting on authentication and public endpoints
- Parse and verify JWT tokens in authentication middleware
- Implement CSRF protection for cookie-based sessions
`,
      },
      {
        path: 'express/route-organization.md',
        governance: 'recommended',
        description: 'Express route organization and structure',
        content: `# Express Route Organization

## Project Structure
- \`/routes\` - Route definitions grouped by resource
- \`/controllers\` - Request handling logic
- \`/services\` - Business logic (framework-agnostic)
- \`/middleware\` - Custom middleware functions
- \`/validators\` - Request validation schemas
- \`/errors\` - Custom error classes

## Route Patterns
- Group routes by resource: \`/api/users\`, \`/api/products\`
- Use Express Router for each resource group
- Keep route files thin - delegate to controllers
- Use consistent URL patterns: plural nouns, kebab-case

## Controller Pattern
- Controllers extract data from request, call services, send response
- Never put business logic in controllers
- Always return consistent response shapes
- Handle both success and error responses

## Service Layer
- Services contain all business logic
- Services are framework-agnostic (no req/res objects)
- Services throw typed errors that controllers map to HTTP responses
- Services manage transactions and data consistency
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Express-Specific Review
- Verify all async route handlers properly forward errors to the error handler
- Check for a centralized error-handling middleware with the correct 4-parameter signature
- Verify security headers are set (helmet or manual)
- Check for input validation on all endpoints receiving user data
- Verify CORS configuration is restrictive (no wildcard in production)
- Check that sensitive data is not leaked in error responses
- Verify middleware ordering: security -> parsing -> auth -> routes -> errors
- Check for rate limiting on authentication endpoints
- Verify proper separation: routes -> controllers -> services
- Check for proper HTTP status code usage`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Express Testing
- Use supertest for HTTP-level integration tests
- Test each route: success cases, validation errors, auth failures, server errors
- Test middleware in isolation by creating minimal Express apps
- Test error handling middleware with various error types
- Mock service layer dependencies, not HTTP internals
- Test authentication middleware with valid, invalid, and missing tokens
- Verify correct HTTP status codes and response shapes
- Test rate limiting behavior with repeated requests`,
      },
    ],
  },
};
