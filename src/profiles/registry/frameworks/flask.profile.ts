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

Micro-framework with explicit setup. Application factory pattern, Blueprints for modularity.

**Detailed rules:** see \`.claude/rules/flask/\` directory.

**Key rules:**
- Application factory (\`create_app()\`) with config from environment, not hardcoded
- Blueprints for feature grouping, one per domain area
- Request validation at the boundary (marshmallow, pydantic, or WTForms)
- Error handlers registered on app, return JSON for APIs, HTML for web`,
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
          'Bash(gunicorn:*)',
          'Bash(celery:*)',
          'Bash(flask-migrate:*)',
          'Bash(alembic:*)',
        ],
      },
    },
    rules: [
      {
        path: 'flask/architecture.md',
        paths: ['**/*.py', 'app/**/*'],
        governance: 'mandatory',
        description: 'Flask application factory, Blueprints, and project structure',
        content: `# Flask Architecture

## Application Factory
- Use \`create_app(config_class)\` factory function — never a global \`app = Flask(__name__)\`
- Instantiate extensions at module level without app (\`db = SQLAlchemy()\`), bind inside factory with \`ext.init_app(app)\`
- Load config with \`app.config.from_object(config_class)\` + \`app.config.from_prefixed_env()\` for env overrides
- Register Blueprints, error handlers, and CLI commands inside the factory
- Deferred extension binding avoids circular imports and enables testing with different configs

## Configuration Classes
- Use class-based config with inheritance: BaseConfig -> DevelopmentConfig / TestingConfig / ProductionConfig
- Load secrets from environment variables (\`os.environ["SECRET_KEY"]\`) — never hardcode
- TestingConfig: \`TESTING=True\`, \`WTF_CSRF_ENABLED=False\`, in-memory SQLite
- ProductionConfig: \`SESSION_COOKIE_SECURE=True\`, \`SESSION_COOKIE_SAMESITE="Strict"\`

## Project Structure
- \`config.py\` — Configuration classes
- \`wsgi.py\` — WSGI entry point: \`app = create_app()\`
- \`app/__init__.py\` — Application factory
- \`app/extensions.py\` — Extension instances (db, migrate, login_manager)
- \`app/errors.py\` — Global error handlers
- \`app/models/\` — SQLAlchemy models
- \`app/views/\` — Blueprint modules (one per domain)
- \`app/services/\` — Business logic (framework-agnostic)
- \`app/schemas/\` — Marshmallow/Pydantic schemas
- \`tests/conftest.py\` — Shared pytest fixtures (app, client, db)

## Blueprints
- One Blueprint per feature domain — self-contained with own error handlers and \`before_request\` hooks
- Register with \`app.register_blueprint(bp, url_prefix="/...")\` inside factory
- Use \`current_app\` inside request context — never import \`app\` directly at module level
- Keep route handlers thin — delegate to services for business logic

## Database Patterns
- Use Flask-SQLAlchemy's \`db.session\` (request-scoped automatically)
- Use Flask-Migrate for all schema changes — never modify production DB manually
- Define relationships with explicit \`back_populates\` (not implicit \`backref\`)
- Keep models thin — business logic belongs in services, not in model methods
- Use \`url_for()\` for URL generation — never hardcode paths
`,
      },
      {
        path: 'flask/security.md',
        paths: ['**/*.py', 'app/**/*'],
        governance: 'mandatory',
        description: 'Flask security: CSRF, sessions, secrets, and deployment hardening',
        content: `# Flask Security Best Practices

## CSRF Protection
- For server-rendered forms: use Flask-WTF (\`FlaskForm\`) with \`{{ form.hidden_tag() }}\` in templates
- For JSON APIs: use token-based auth (JWT, API keys) — CSRF tokens not needed for stateless auth
- If using sessions for API auth, send CSRF token via custom \`X-CSRFToken\` header

## Session Security
- \`SECRET_KEY\`: strong, random (>= 32 bytes), loaded from environment — never hardcoded
- \`SESSION_COOKIE_SECURE=True\` (HTTPS only), \`SESSION_COOKIE_HTTPONLY=True\` (no JS access)
- \`SESSION_COOKIE_SAMESITE="Lax"\` or \`"Strict"\` for CSRF mitigation
- For sensitive data, use Flask-Session with Redis/DB backend — default sessions are signed client-side cookies
- Never store PII, tokens, or secrets in client-side session cookies

## Input Validation
- Validate all request input (\`request.json\`, \`request.form\`, \`request.args\`) before use
- Use Marshmallow schemas or Pydantic models for structured validation
- Return 422 with field-level errors on validation failure
- Never trust raw request data — always check for missing fields and invalid formats

## Blueprint-Level Security
- Isolate admin routes with \`@admin_bp.before_request\` requiring admin role
- Rate-limit authentication endpoints independently (e.g., 5 per minute with Flask-Limiter)
- Use generic error messages for auth failures ("Invalid credentials")

## Deployment Hardening
- \`FLASK_DEBUG=0\` and \`TESTING=False\` in production
- WSGI server (Gunicorn/uWSGI/Waitress) — never \`flask run\` in production
- Apply \`ProxyFix\` middleware when behind a reverse proxy (nginx/Apache)
- CORS restricted to specific origins — never \`"*"\` in production
- Security headers: CSP, HSTS, X-Content-Type-Options
- Static files served by reverse proxy, not Flask
`,
      },
      {
        path: 'flask/patterns.md',
        paths: ['**/*.py', 'app/**/*'],
        governance: 'recommended',
        description: 'Flask patterns: view decorators, Celery background tasks, streaming, error handling',
        content: `# Flask Patterns

## View Decorators
- Use \`functools.wraps\` to preserve function metadata in all decorators
- Stack decorators with \`@route\` outermost
- \`login_required\`: check \`g.current_user\`, return 401 for JSON or redirect for HTML
- \`role_required(role)\`: check user roles, abort(403) on insufficient permissions
- Custom caching decorators: use \`cache.get()/cache.set()\` with request-based keys

## Background Tasks with Celery
- Integrate via application factory: create \`FlaskTask\` subclass that wraps \`run()\` in \`app.app_context()\`
- Use \`@shared_task\` decorator (not \`@celery_app.task\`) for factory-compatible tasks
- Pass simple, serializable args to tasks (IDs, strings) — never ORM objects
- Call with \`.delay()\` for fire-and-forget from route handlers
- Configure via \`app.config["CELERY"]\` dictionary

## Error Responses
- Register centralized error handlers on the app via \`register_error_handlers(app)\`
- Handle \`HTTPException\`: return JSON for API routes, default HTML for web routes
- Handle 422: return structured validation errors with \`{"error": ..., "details": ...}\`
- Handle 500: log the real error server-side, return generic "An unexpected error occurred"
- Consistent JSON shape: \`{"error": "...", "message": "...", "status": code}\`
- Never expose internal error details, stack traces, or file paths

## Streaming & Templates
- Use \`Response(stream_with_context(generate()), mimetype=...)\` for large data exports
- Use \`yield_per()\` for memory-efficient database iteration in generators
- Jinja2 template inheritance: base template with \`{% block %}\` slots, child templates extend
- Use \`get_flashed_messages(with_categories=true)\` for flash message rendering
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Flask-Specific Review
- Verify \`create_app()\` factory pattern is used — no global \`app = Flask(__name__)\` at module level
- Check extensions use deferred binding: instantiated at module level, bound with \`ext.init_app(app)\` inside factory
- Verify Blueprints are used for route organization — no monolithic routes file
- Check \`current_app\` is used inside request context, not a direct module-level \`app\` import
- Verify all request input (\`request.args\`, \`request.form\`, \`request.json\`) is validated before use
- Check for proper error handling: \`@app.errorhandler\` registered, consistent JSON error shapes for APIs
- Verify database sessions are request-scoped (Flask-SQLAlchemy default) and cleaned up via teardown
- Check secrets loaded from environment variables — no hardcoded SECRET_KEY, DATABASE_URL, or credentials
- Verify Flask-Migrate is used for all schema changes — no manual ALTER TABLE
- Check CORS is configured with specific origins — no wildcard \`*\` in production
- Verify debug mode is disabled in production configuration (\`DEBUG=False\`)
- Check session cookies have SECURE, HTTPONLY, and SAMESITE flags set
- Verify CSRF protection is active for form submissions (Flask-WTF)
- Check that \`url_for()\` is used for URL generation — no hardcoded paths
- Verify development server is NOT used in production — Gunicorn/uWSGI/Waitress configured

**Available skills:** Use \`flask-blueprint-generator\` for Blueprint scaffolding, \`flask-migration-generator\` for database migrations.`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Flask Testing
- Create test-specific app instances via \`create_app("config.TestingConfig")\` in fixtures
- Use \`app.test_client()\` for HTTP-level integration tests
- Use \`app.test_cli_runner()\` for testing custom CLI commands
- Define fixtures in \`conftest.py\`: \`app\`, \`client\`, \`db_session\`, \`runner\`
- Set \`TESTING=True\` and \`WTF_CSRF_ENABLED=False\` in test config
- Use \`client.session_transaction()\` to pre-populate session for auth tests
- Use \`app.test_request_context()\` for testing code that needs request context outside HTTP
- Test each Blueprint route: success (200/201), validation errors (400/422), auth failures (401/403), not found (404)
- Test JSON endpoints with \`client.post("/path", json={...})\` and assert \`response.json\`
- Test form submissions with \`client.post("/path", data={...})\`
- Test redirects with \`follow_redirects=True\` and check \`response.history\`
- Use an in-memory SQLite database for test isolation (\`sqlite:///:memory:\`)
- Roll back database transactions between tests — never persist test data
- Override services with mocks via dependency injection or monkeypatch

**Available skills:** Use \`flask-blueprint-generator\` for Blueprint + test scaffolding, \`flask-migration-generator\` for migration management.`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Flask-Specific Security Review
- [ ] \`SECRET_KEY\` loaded from environment — not hardcoded, not the default \`"dev"\`
- [ ] \`SESSION_COOKIE_SECURE=True\` in production (requires HTTPS)
- [ ] \`SESSION_COOKIE_HTTPONLY=True\` to prevent XSS session theft
- [ ] \`SESSION_COOKIE_SAMESITE="Lax"\` or \`"Strict"\` to mitigate CSRF
- [ ] CSRF protection enabled for all POST/PUT/DELETE forms (Flask-WTF)
- [ ] \`DEBUG=False\` in production — interactive debugger disabled
- [ ] No \`app.run(debug=True)\` in production entry point
- [ ] \`ProxyFix\` middleware applied when behind reverse proxy (prevents IP spoofing)
- [ ] CORS restricted to specific origins — \`Access-Control-Allow-Origin\` is not \`*\`
- [ ] Static files served by nginx/Apache in production — not by Flask
- [ ] Input validation on all \`request.json\`, \`request.form\`, \`request.args\`
- [ ] File upload validation: check extension, size limit, content type
- [ ] SQL queries use ORM or parameterized statements — no f-string SQL
- [ ] Error responses do not expose stack traces, file paths, or config values
- [ ] Authentication routes are rate-limited to prevent brute force
- [ ] \`send_file()\` / \`send_from_directory()\` used for file serving — never open() + return

**Available skills:** Use \`flask-blueprint-generator\` for secure Blueprint scaffolding, \`flask-migration-generator\` for migration management.`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Flask-Specific Refactoring
- Extract monolithic \`app.py\` into application factory + Blueprints + services
- Move business logic out of route handlers into a services/ layer
- Replace global \`app\` imports with \`current_app\` proxy inside request context
- Replace \`app = Flask(__name__); db = SQLAlchemy(app)\` with deferred \`db = SQLAlchemy()\` + \`init_app()\`
- Replace inline SQL with Flask-SQLAlchemy ORM queries
- Replace manual \`dict\` serialization with Marshmallow schemas or Pydantic models
- Move configuration from \`app.config[...] = ...\` scattered calls to config classes
- Replace \`@app.route\` with Blueprint routes when file grows beyond 10 routes
- Extract repeated \`before_request\` logic into Blueprint-level hooks or decorators
- Replace \`print()\` debugging with \`app.logger\` or structured \`logging\` module
- Move test setup into \`conftest.py\` fixtures using the application factory

**Available skills:** Use \`flask-blueprint-generator\` for Blueprint refactoring, \`flask-migration-generator\` for migration management.`,
      },
    ],
    skills: [
      {
        name: 'flask-blueprint-generator',
        description: 'Generate Flask Blueprints with routes, validation, error handling, and tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Flask Blueprint Generator

## What It Generates
Given a resource name (e.g. "products"), generate a complete Blueprint with:

### 1. Blueprint Module
\`\`\`python
# app/views/{resource}.py
from flask import Blueprint, request, jsonify, abort
from app.services.{resource}_service import {Resource}Service
from app.schemas.{resource}_schema import (
    Create{Resource}Schema,
    Update{Resource}Schema,
    {Resource}ResponseSchema,
)

{resource}_bp = Blueprint("{resource}", __name__)

@{resource}_bp.route("/", methods=["GET"])
def list_{resource}s():
    items = {Resource}Service.list_all()
    return jsonify({Resource}ResponseSchema(many=True).dump(items))

@{resource}_bp.route("/", methods=["POST"])
def create_{resource}():
    schema = Create{Resource}Schema()
    data = schema.load(request.get_json())
    item = {Resource}Service.create(data)
    return jsonify({Resource}ResponseSchema().dump(item)), 201

@{resource}_bp.route("/<int:id>", methods=["GET"])
def get_{resource}(id: int):
    item = {Resource}Service.get_by_id(id)
    if not item:
        abort(404)
    return jsonify({Resource}ResponseSchema().dump(item))

@{resource}_bp.route("/<int:id>", methods=["PUT"])
def update_{resource}(id: int):
    schema = Update{Resource}Schema()
    data = schema.load(request.get_json())
    item = {Resource}Service.update(id, data)
    return jsonify({Resource}ResponseSchema().dump(item))

@{resource}_bp.route("/<int:id>", methods=["DELETE"])
def delete_{resource}(id: int):
    {Resource}Service.delete(id)
    return "", 204
\`\`\`

### 2. Service Layer (framework-agnostic business logic)
### 3. Marshmallow Schemas (validation + serialization)
### 4. SQLAlchemy Model
### 5. pytest Tests using app.test_client() with fixture-based setup

## Registration
\`\`\`python
# In create_app():
from app.views.{resource} import {resource}_bp
app.register_blueprint({resource}_bp, url_prefix="/{resource}s")
\`\`\`
`,
      },
      {
        name: 'flask-migration-generator',
        description: 'Generate and manage Flask-Migrate (Alembic) database migrations',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Flask-Migrate Migration Generator

## Initial Setup
\`\`\`bash
flask db init                    # Create migrations/ directory (one-time)
flask db migrate -m "description" # Auto-generate migration from model changes
flask db upgrade                 # Apply pending migrations
flask db downgrade               # Revert last migration
flask db history                 # Show migration history
flask db current                 # Show current database revision
\`\`\`

## Migration Best Practices
- Always review auto-generated migrations before applying — they can miss renames
- Write a descriptive message with \`-m\` for every migration
- Test migrations on a copy of production data before deploying
- Never edit migrations that have already been applied to shared environments
- Include both upgrade() and downgrade() functions in every migration
- For data migrations, write explicit SQL or use bulk_insert_mappings()

## Common Operations
\`\`\`python
# Add column with default value
op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default="true"))

# Create index
op.create_index("ix_users_email", "users", ["email"], unique=True)

# Rename column (not auto-detected)
op.alter_column("users", "name", new_column_name="full_name")
\`\`\`
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
            statusMessage: 'Checking for Flask debug mode enabled in code',
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null) && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "app\\.run\\(.*debug\\s*=\\s*True" "$FILE_PATH" && { echo "Flask debug mode enabled in code — use FLASK_DEBUG env var instead, never app.run(debug=True) in production" >&2; exit 2; } || exit 0',
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
            statusMessage: 'Checking for hardcoded SECRET_KEY in Flask code',
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null) && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "(SECRET_KEY|secret_key)\\s*=\\s*[\"\\x27][^\"\\x27]{0,20}[\"\\x27]" "$FILE_PATH" && { echo "Hardcoded SECRET_KEY detected — load from environment variable: os.environ[\\\"SECRET_KEY\\\"]" >&2; exit 2; } || exit 0',
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
            statusMessage: 'Checking for send_file() with user input in Flask code',
            command:
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null) && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "send_file\\(.*request\\." "$FILE_PATH" && { echo "Warning: send_file() with user input detected — verify path traversal protection, prefer send_from_directory()" >&2; exit 2; } || exit 0',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
