import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const flaskProfile: Profile = {
  id: 'frameworks/flask',
  name: 'Flask',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['flask'],
  contributions: {
    claudeMd: [
      {
        heading: 'Flask Conventions',
        order: 20,
        content: `## Flask Conventions

- Use the application factory pattern with \`create_app()\` for flexible configuration
- Organize code with Blueprints - one Blueprint per domain/feature
- Use Flask extensions for common concerns (Flask-SQLAlchemy, Flask-Migrate, Flask-Login)
- Define configuration in classes (Development, Testing, Production) loaded via \`app.config.from_object()\`
- Use \`@app.errorhandler\` decorators for centralized error handling
- Validate all request input - never trust \`request.args\`, \`request.form\`, or \`request.json\` directly
- Use Flask's \`g\` object for request-scoped data (database connections, current user)
- Use environment variables for secrets and environment-specific configuration
- Structure the app: blueprints -> views -> services -> models
- Use Flask-CORS for cross-origin resource sharing configuration
- Use \`flask.jsonify()\` for JSON responses with proper content-type headers
- Register teardown functions for resource cleanup`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(pip:*)',
          'Bash(flask:*)',
          'Bash(pytest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'flask/architecture.md',
        governance: 'mandatory',
        description: 'Flask application factory and Blueprint patterns',
        content: `# Flask Architecture

## Application Factory
- Use \`create_app()\` factory function in \`app/__init__.py\`
- Initialize extensions outside the factory, bind them inside with \`ext.init_app(app)\`
- Load configuration from environment-specific config classes
- Register Blueprints, error handlers, and CLI commands inside the factory

## Project Structure
- \`/app\` - Main application package
- \`/app/__init__.py\` - Application factory
- \`/app/models/\` - SQLAlchemy models
- \`/app/views/\` or \`/app/routes/\` - Blueprint route handlers
- \`/app/services/\` - Business logic layer
- \`/app/templates/\` - Jinja2 templates (if server-rendered)
- \`/app/static/\` - Static assets
- \`/config.py\` - Configuration classes
- \`/migrations/\` - Alembic/Flask-Migrate migrations

## Blueprints
- Create one Blueprint per feature or domain area
- Keep Blueprints self-contained with their own templates, static files, and error handlers
- Register Blueprints with URL prefixes: \`app.register_blueprint(users_bp, url_prefix='/users')\`
- Use Blueprint-level before_request and after_request hooks for scoped middleware

## Error Handling
- Register global error handlers with \`@app.errorhandler()\` for HTTP errors
- Create custom exception classes for domain-specific errors
- Return consistent JSON error responses for API endpoints
- Log errors with context for debugging
- Never expose stack traces or internal details in production responses

## Database Patterns
- Use Flask-SQLAlchemy for ORM integration
- Use Flask-Migrate (Alembic) for schema migrations
- Open and close database sessions per request using teardown hooks
- Use scoped sessions for thread safety
- Define relationships with \`db.relationship()\` and explicit \`backref\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Flask-Specific Review
- Verify the application factory pattern is used with \`create_app()\`
- Check that Blueprints are used for route organization - no monolithic app files
- Verify all request input is validated before use
- Check for proper error handling with \`@app.errorhandler\` decorators
- Verify database sessions are properly managed and cleaned up
- Check that secrets are loaded from environment variables, not hardcoded
- Verify Flask-Migrate is used for database schema changes
- Check for proper use of \`g\` object for request-scoped data
- Verify CORS is configured appropriately for production
- Check that debug mode is disabled in production configuration`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Flask Testing
- Use \`app.test_client()\` for HTTP-level integration tests
- Use the application factory to create test-specific app instances
- Use \`pytest\` fixtures for app, client, and database setup
- Test each route: success cases, validation errors, auth failures, not found
- Use \`app.test_request_context()\` for testing code that requires request context
- Mock external services and database calls in unit tests
- Test error handlers return correct status codes and response shapes
- Verify database transactions are rolled back between tests`,
      },
    ],
  },
};
