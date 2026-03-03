import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const fastapiProfile: Profile = {
  id: 'frameworks/fastapi',
  name: 'FastAPI',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['fastapi'],
  contributions: {
    claudeMd: [
      {
        heading: 'FastAPI Conventions',
        order: 20,
        content: `## FastAPI Conventions

Async-first Python API framework. Pydantic models for validation, dependency injection for shared logic.

**Detailed rules:** see \`.claude/rules/fastapi/\` directory.

**Key rules:**
- Pydantic models for all request/response schemas — never use raw dicts
- Dependency injection via \`Depends()\` for auth, DB sessions, and shared services
- Path operations organized by router (\`APIRouter\`), one domain per router file
- Background tasks for non-blocking operations, proper async DB drivers`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(uvicorn:*)',
          'Bash(fastapi:*)',
          'Bash(pip:*)',
          'Bash(pytest:*)',
          'Bash(alembic:*)',
          'Bash(gunicorn:*)',
        ],
      },
    },
    rules: [
      {
        path: 'fastapi/architecture.md',
        paths: ['**/*.py', 'app/**/*', 'routers/**/*'],
        governance: 'mandatory',
        description: 'FastAPI project structure, routing, and Pydantic patterns',
        content: `# FastAPI Architecture

## Project Structure
- \`app/main.py\` — FastAPI app creation, lifespan, middleware, router includes
- \`app/config.py\` — Pydantic BaseSettings + @lru_cache getter
- \`app/dependencies.py\` — Shared deps (auth, DB session, pagination)
- \`app/routers/\` — APIRouter per domain (users.py, items.py)
- \`app/schemas/\` — Pydantic models: Create, Update, Response per entity
- \`app/models/\` — SQLAlchemy/ORM models
- \`app/services/\` — Business logic, orchestrates repositories
- \`app/repositories/\` — Data access layer
- \`tests/conftest.py\` — Fixtures: TestClient, DB override, factories

## Application Factory and Lifespan
- Use \`lifespan\` async context manager (not deprecated \`on_event\`)
- Create app via factory function: \`create_app() -> FastAPI\`
- Configure CORSMiddleware with explicit origins (not "*" in production)
- Configure TrustedHostMiddleware with allowed hosts
- Include routers with versioned prefix (\`/api/v1\`)

## APIRouter Organization
- Set prefix, tags, and shared dependencies on each router
- Every path operation must have: response_model, status_code, summary
- Use \`Annotated[type, Depends(fn)]\` pattern for reusable dependency type aliases
- Use HTTPException with proper status codes for error cases (404, 403, 409)

## Pydantic Schemas
- Separate schemas: Create (with validation), Update (optional fields), Response (no internals)
- Use Field() with constraints (min_length, max_length, ge, le)
- Use @field_validator for custom validation (password strength, format checks)
- Response schemas: set \`model_config = {"from_attributes": True}\` for ORM compatibility
- Never expose internal fields (password, hash) in response schemas
`,
      },
      {
        path: 'fastapi/dependencies-and-settings.md',
        paths: ['**/*.py', 'app/**/*', 'routers/**/*'],
        governance: 'mandatory',
        description: 'FastAPI dependency injection, settings, and configuration patterns',
        content: `# FastAPI Dependencies & Settings

## Settings with Pydantic BaseSettings
- Use \`pydantic_settings.BaseSettings\` with \`SettingsConfigDict\` for env var loading
- Cache settings with \`@lru_cache\` on the getter function
- Create \`Annotated\` type alias: \`SettingsDep = Annotated[Settings, Depends(get_settings)]\`
- Never hardcode secrets or use insecure defaults — load from environment

## Database Session Dependency
- Use async generator (\`yield\`) for session lifecycle: create, yield, commit/rollback, close
- Create type alias: \`DbSession = Annotated[AsyncSession, Depends(get_db_session)]\`
- Always handle rollback on exceptions in the generator

## Authentication Dependencies
- Chain dependencies: oauth2_scheme -> get_current_user -> get_current_active_user
- Create type aliases: CurrentUser, ActiveUser for reuse across endpoints
- Raise HTTPException 401 with WWW-Authenticate header on invalid credentials
- Never mix auth logic into endpoint functions — use dependency injection

## Reusable Dependency Patterns
- Use \`Annotated[type, Depends(fn)]\` for all dependencies — create named type aliases
- Yield dependencies for resource cleanup (HTTP clients, file handles)
- Use \`app.dependency_overrides\` in tests to swap real deps with test doubles
- Always clear overrides in test teardown
`,
      },
      {
        path: 'fastapi/error-handling.md',
        paths: ['**/*.py', 'app/**/*', 'routers/**/*'],
        governance: 'mandatory',
        description: 'FastAPI error handling, exception handlers, and security patterns',
        content: `# FastAPI Error Handling & Security

## Custom Exception Hierarchy
- Create base AppError with detail and status_code, subclass for NotFoundError, ForbiddenError, ConflictError
- Register exception handlers: AppError, RequestValidationError, StarletteHTTPException
- Return consistent JSON shape: \`{"detail": "...", "type": "..."}\` for app errors
- Validation errors: return 422 with \`{"detail": "...", "errors": [...]}\`
- Never return 200 with error body — always use proper status codes
- Never expose internal error details to clients

## OAuth2 with JWT Security
- Use OAuth2PasswordBearer with tokenUrl for the login endpoint
- Hash passwords with bcrypt via passlib.context.CryptContext
- Create access tokens with expiration using python-jose jwt.encode
- Use generic error messages ("Invalid credentials") — never reveal which field failed
- Store JWT secret in Settings (env var) — never hardcode

## CORS and Middleware Security
- Middleware order matters: last added = outermost wrapper
- Configure CORSMiddleware with explicit origins — never \`"*"\` in production
- Add TrustedHostMiddleware with allowed_hosts list
- Add GZipMiddleware for response compression
- Set max_age on CORS for preflight caching
- Never combine \`allow_credentials=True\` with wildcard origins
`,
      },
      {
        path: 'fastapi/testing-deployment.md',
        paths: ['**/*.py', 'app/**/*', 'routers/**/*'],
        governance: 'recommended',
        description: 'FastAPI testing strategies and deployment patterns',
        content: `# FastAPI Testing & Deployment

## Testing with TestClient
- Use TestClient (sync) for most endpoint tests, httpx.AsyncClient for async tests
- Create fixtures that override dependencies via \`app.dependency_overrides\`
- Always clear overrides in fixture teardown (\`app.dependency_overrides.clear()\`)

## Test Coverage Checklist (per endpoint)
1. Success case: correct status code, response body matches schema
2. Validation errors (422): missing fields, invalid types, constraint violations
3. Authentication errors (401): missing, expired, or invalid token
4. Authorization errors (403): valid user but insufficient permissions
5. Not found (404): resource does not exist
6. Conflict (409): duplicate creation, stale update
7. Background tasks: mock and assert enqueued
8. Pydantic models: test validators and computed fields independently

## Deployment
- Production: Gunicorn with UvicornWorker class (\`-k uvicorn.workers.UvicornWorker\`)
- Simple: Uvicorn with \`--workers 4\` — never use \`fastapi dev\` in production
- Docker: non-root user, slim base image, \`--no-cache-dir\` for pip
- TLS termination via reverse proxy (Traefik, Caddy, Nginx) — not in the app
- Health check endpoint (\`/health\`) that verifies DB connectivity
- Structured JSON logging for observability
- Run Alembic \`upgrade head\` before app startup
- Environment-based settings — no hardcoded secrets
`,
      },
      {
        path: 'fastapi/websockets-advanced.md',
        paths: ['**/*.py', 'app/**/*', 'routers/**/*'],
        governance: 'recommended',
        description: 'FastAPI WebSocket patterns and advanced features',
        content: `# FastAPI WebSockets & Advanced Patterns

## WebSocket Endpoints
- Use ConnectionManager class to track active connections and broadcast messages
- Authenticate WebSocket connections via query parameter token using Depends
- Raise WebSocketException(code=WS_1008_POLICY_VIOLATION) on auth failure
- Handle WebSocketDisconnect to clean up connections
- Use \`websocket.accept()\` before any send/receive operations

## Background Tasks
- Use \`BackgroundTasks\` for fire-and-forget work (emails, notifications)
- Add tasks via \`background_tasks.add_task(fn, *args)\` — runs after response is sent
- For critical jobs, use a proper task queue (Celery, ARQ) instead

## Custom Response Types
- StreamingResponse for large data exports (CSV, file streaming)
- FileResponse for direct file downloads with Content-Disposition header
- EventSourceResponse (sse-starlette) for Server-Sent Events

## Database Migrations with Alembic
- \`alembic revision --autogenerate -m "description"\` after model changes
- \`alembic upgrade head\` to apply, \`alembic downgrade -1\` to rollback
- Always review auto-generated migrations before applying
- Write both upgrade() and downgrade() functions
- Never modify a migration applied to production — create a new one
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['fastapi-endpoint-generator', 'fastapi-crud-scaffold'],
        prompt: `## FastAPI-Specific Review
- Verify endpoints use \`async def\` for I/O-bound operations and \`def\` for CPU-bound
- Check that all request/response data uses Pydantic models with Field constraints — no raw dicts
- Verify separate schemas for create, update, and response — no internal fields leaked in responses
- Check \`response_model\` and explicit \`status_code\` on every path operation
- Verify \`Annotated[type, Depends(fn)]\` pattern used for dependency injection with reusable type aliases
- Check that DB sessions use \`yield\` dependencies with proper rollback and cleanup
- Verify authentication uses OAuth2PasswordBearer + JWT with expiration and bcrypt hashing
- Check CORS middleware uses explicit origins (not \`"*"\`) in production settings
- Verify \`TrustedHostMiddleware\` is configured
- Check that \`lifespan\` async context manager is used — not deprecated \`on_event\`
- Verify settings use Pydantic \`BaseSettings\` with \`@lru_cache\` — no hardcoded secrets
- Check custom exception handlers return consistent error response shapes
- Verify background tasks are used for non-critical work only — critical jobs use task queues
- Check OpenAPI metadata: summary, description, tags, and response documentation on endpoints
- Verify routers use \`prefix\`, \`tags\`, and shared \`dependencies\` properly`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['fastapi-endpoint-generator', 'fastapi-crud-scaffold'],
        prompt: `## FastAPI Testing
- Use \`TestClient\` from \`fastapi.testclient\` for synchronous endpoint tests
- Use \`httpx.AsyncClient\` with \`ASGITransport\` for async endpoint tests
- Override dependencies with \`app.dependency_overrides\` for mocking — always clear overrides in fixture teardown
- Test Pydantic models and validators independently with \`pytest.raises(ValidationError)\`
- Test each endpoint for: success, validation errors (422), auth errors (401), forbidden (403), not found (404), conflict (409)
- Test background tasks by mocking the task function and asserting it was called with correct args
- Test dependency chains: mock sub-dependencies to isolate the layer under test
- Test WebSocket endpoints: connection, message exchange, and disconnection handling
- Use \`pytest.fixture\` for TestClient, DB session overrides, and authenticated client helpers
- Verify OpenAPI schema generation matches expected structure via \`client.get("/openapi.json")\``,
      },
    ],
    skills: [
      {
        name: 'fastapi-endpoint-generator',
        description: 'Generate a complete FastAPI endpoint with router, schemas, service, tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# FastAPI Endpoint Generator

Generate a complete FastAPI endpoint with all layers:

## 1. Pydantic Schemas
- \`{Resource}Create\` with Field validation and custom validators
- \`{Resource}Update\` with all optional fields for partial updates
- \`{Resource}Response\` with \`model_config = {"from_attributes": True}\`
- No internal fields in response schema

## 2. APIRouter
- Router with \`prefix\`, \`tags\`, and shared auth dependency
- Path operation with \`response_model\`, \`status_code\`, \`summary\`, and \`description\`
- \`Annotated\` type aliases for dependencies (DbSession, CurrentUser)
- Proper HTTPException for error cases (404, 403, 409)

## 3. Service Layer
- Business logic method that receives schema + dependencies
- Raises domain exceptions (NotFoundError, ForbiddenError, ConflictError)
- Delegates data access to repository

## 4. Tests
- TestClient fixture with dependency overrides
- Test cases: success (200/201), validation error (422), not found (404), unauthorized (401)
- Pydantic model validation tests
`,
      },
      {
        name: 'fastapi-crud-scaffold',
        description: 'Scaffold a full CRUD resource for FastAPI with all layers',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# FastAPI CRUD Scaffold

Scaffold a complete CRUD resource with:

## Files to Generate
1. \`app/schemas/{resource}.py\` — Create, Update, Response, List schemas
2. \`app/routers/{resource}.py\` — APIRouter with GET (list + detail), POST, PUT/PATCH, DELETE
3. \`app/services/{resource}_service.py\` — Business logic with domain exceptions
4. \`app/repositories/{resource}_repo.py\` — Data access with async SQLAlchemy
5. \`app/models/{resource}.py\` — SQLAlchemy model
6. \`tests/test_{resource}.py\` — Full test suite for all endpoints
7. \`alembic/versions/{timestamp}_add_{resource}.py\` — Migration

## Patterns to Follow
- All endpoints use Annotated + Depends for injection
- List endpoint supports pagination via PaginationDep
- Detail endpoint returns 404 for missing resources
- Create returns 201 with Location header
- Update supports partial updates (PATCH semantics)
- Delete returns 204 No Content
- All write operations verify ownership (current_user.id == resource.owner_id)
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/on_event\\s*\\([\"\\x27](startup|shutdown)/.test(c))console.log(\'Warning: @app.on_event() is deprecated — use lifespan async context manager instead (see FastAPI docs)\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/allow_origins\\s*=\\s*\\[\\s*[\"\\x27]\\*[\"\\x27]/.test(c)&&!/test|conftest|fixture/.test(f.toLowerCase()))console.log(\'Warning: CORS allow_origins=[\\\"*\\\"] detected — use explicit origins in production\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const m=c.match(/@(app|router)\\.(get|post|put|delete|patch)\\([^)]*\\)[\\s\\S]*?async\\s+def\\s+\\w+[^:]+:/g);if(m){const no_rm=m.filter(x=>!/response_model/.test(x));if(no_rm.length>0)console.log(\'Warning: \'+no_rm.length+\' endpoint(s) missing response_model — add explicit response_model for type safety and OpenAPI docs\')}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
