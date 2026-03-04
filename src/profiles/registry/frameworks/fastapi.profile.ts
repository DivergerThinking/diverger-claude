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
      {
        path: 'fastapi/security.md',
        paths: ['**/*.py', 'app/**/*', 'routers/**/*'],
        governance: 'mandatory',
        description: 'FastAPI security checklist: validation, CORS, auth, rate limiting, SQL injection, uploads',
        content: `# FastAPI Security Checklist

## Pydantic Validation as First Line of Defense
- Use Pydantic models with strict \`Field()\` constraints for ALL request input — never trust raw dicts
- Apply \`min_length\`, \`max_length\`, \`ge\`, \`le\`, \`regex\` on every string and numeric field
- Use \`@field_validator\` for format-specific checks (email, URL, phone, enum membership)
- Use \`Literal\` types or \`Enum\` for fields with fixed allowed values
- Use \`constr\`, \`conint\`, \`confloat\` constrained types for tighter validation
- Never pass raw query params or path params to database queries without Pydantic validation
- Response models must never expose internal fields (hashed_password, internal IDs, secrets)

## CORS Security
- Configure \`CORSMiddleware\` with explicit \`allow_origins\` list — never \`["*"]\` in production
- Never combine \`allow_credentials=True\` with wildcard origins — browsers reject this
- Restrict \`allow_methods\` to the HTTP methods your API actually uses
- Restrict \`allow_headers\` to the headers your frontend actually sends
- Set \`max_age\` (e.g. 600) to cache preflight responses

## Authentication Dependencies
- Use \`OAuth2PasswordBearer\` as the token extraction dependency
- Chain dependencies: \`oauth2_scheme\` -> \`get_current_user\` -> \`get_current_active_user\`
- Always raise HTTPException 401 with \`WWW-Authenticate: Bearer\` header on auth failure
- Use generic error messages ("Invalid credentials") — never reveal which field failed
- Store JWT secret in Pydantic \`BaseSettings\` from environment — never hardcode
- Set short token expiration (15-30 min) with refresh token strategy for longer sessions
- Hash passwords with bcrypt via \`passlib\` — never store plaintext

## Rate Limiting
- Use \`slowapi\` or custom middleware to rate-limit authentication endpoints (5-10 attempts / min)
- Apply general API rate limit (100-200 req / min per IP) to prevent abuse
- Return \`429 Too Many Requests\` with \`Retry-After\` header
- Use stricter limits on write endpoints (POST, PUT, DELETE) than read endpoints
- Consider per-user rate limits for authenticated endpoints

## SQL Injection Prevention
- Always use SQLAlchemy ORM or parameterized queries — never string interpolation for SQL
- Never use \`text()\` with f-strings or \`.format()\` — use bound parameters: \`text("SELECT * FROM users WHERE id = :id").bindparams(id=user_id)\`
- Use Pydantic-validated input before passing to any database query
- Use \`Enum\` types for fields that map to ORDER BY or column names — never accept raw column names from user input
- Audit any use of \`execute()\` or \`raw()\` for injection risk

## File Upload Security
- Validate file extension against an allowlist — never rely on client-reported MIME type
- Validate actual file content (magic bytes) matches expected type
- Enforce maximum file size with \`UploadFile\` size checks — reject before reading entire file
- Generate random filenames on server — never use client-provided filename for storage
- Store uploads outside the web root or in object storage (S3) — never in the app directory
- Scan uploaded files for malware if accepting user content
- Set \`Content-Disposition: attachment\` when serving user-uploaded files
- Never execute or interpret uploaded files (no eval, no import, no subprocess)
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
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## FastAPI-Specific Security Review
- [ ] All request input uses Pydantic models with \`Field()\` constraints — no raw dicts or unvalidated params
- [ ] Response models exclude internal fields (password hashes, internal IDs, secrets)
- [ ] \`CORSMiddleware\` configured with explicit \`allow_origins\` — never \`["*"]\` in production
- [ ] \`allow_credentials=True\` not combined with wildcard origins
- [ ] \`TrustedHostMiddleware\` configured with explicit \`allowed_hosts\`
- [ ] OAuth2PasswordBearer + JWT used for authentication with short token expiration
- [ ] Passwords hashed with bcrypt via \`passlib\` — no plaintext storage
- [ ] JWT secret loaded from environment via Pydantic \`BaseSettings\` — not hardcoded
- [ ] Auth failure returns generic message ("Invalid credentials") — never reveals which field failed
- [ ] HTTPException 401 includes \`WWW-Authenticate: Bearer\` header
- [ ] Rate limiting configured on auth endpoints (\`slowapi\` or custom middleware)
- [ ] No raw SQL with string interpolation — only SQLAlchemy ORM or parameterized \`text()\` with \`bindparams()\`
- [ ] No \`text()\` with f-strings or \`.format()\` — always use bound parameters
- [ ] File uploads validate extension (allowlist), content (magic bytes), and size before processing
- [ ] Uploaded files stored with server-generated filenames — never client-provided names
- [ ] Uploads stored outside web root or in object storage — not in app directory
- [ ] No \`eval()\`, \`exec()\`, or \`subprocess\` with user-controlled input
- [ ] \`lifespan\` async context manager used — not deprecated \`@app.on_event()\`
- [ ] Settings use Pydantic \`BaseSettings\` — no hardcoded secrets in source code
- [ ] Custom exception handlers return consistent error shape — no internal details leaked to clients`,
      },
    ],
    skills: [
      {
        name: 'fastapi-di-guide',
        description: 'Detailed reference for FastAPI dependency injection patterns and best practices',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# FastAPI Dependency Injection — Detailed Reference

## Depends() Basics
FastAPI's \`Depends()\` declares that a path operation needs a dependency. The dependency is a callable
(function or class) that FastAPI calls automatically and injects the return value as a parameter.

\\\`\\\`\\\`python
from fastapi import Depends, FastAPI

app = FastAPI()

def common_parameters(q: str | None = None, skip: int = 0, limit: int = 100):
    return {"q": q, "skip": skip, "limit": limit}

@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    return commons

# ANTI-PATTERN: calling the dependency manually — bypasses injection
@app.get("/items-bad/")
async def read_items_bad():
    commons = common_parameters(q="test", skip=0, limit=10)  # BAD: no injection
    return commons
\\\`\\\`\\\`

## Annotated Type Aliases (Modern Pattern)
Use \`Annotated\` to create reusable dependency type aliases — the recommended approach since FastAPI 0.95+.

\\\`\\\`\\\`python
from typing import Annotated
from fastapi import Depends

CommonsDep = Annotated[dict, Depends(common_parameters)]

@app.get("/items/")
async def read_items(commons: CommonsDep):
    return commons  # cleaner, reusable across endpoints
\\\`\\\`\\\`

## Class-Based Dependencies
Use classes when dependencies need initialization parameters or when state is useful.

\\\`\\\`\\\`python
class Paginator:
    def __init__(self, skip: int = 0, limit: int = 100):
        self.skip = skip
        self.limit = limit

PaginationDep = Annotated[Paginator, Depends()]  # Depends() without arg uses the class itself

@app.get("/items/")
async def list_items(pagination: PaginationDep):
    return items[pagination.skip : pagination.skip + pagination.limit]
\\\`\\\`\\\`

## Sub-Dependencies (Chaining)
Dependencies can depend on other dependencies, forming a chain that FastAPI resolves automatically.

\\\`\\\`\\\`python
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db_session),
) -> User:
    user = db.query(User).filter(User.token == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    return current_user

# Chain: oauth2_scheme -> get_current_user -> get_current_active_user
ActiveUserDep = Annotated[User, Depends(get_current_active_user)]
\\\`\\\`\\\`

## Yield Dependencies for Resource Management
Use \`yield\` to run setup code before and cleanup code after the request.
Code after \`yield\` executes during response teardown, even on errors.

\\\`\\\`\\\`python
# CORRECT: yield dependency with proper cleanup
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

DbSession = Annotated[AsyncSession, Depends(get_db_session)]

# CORRECT: yield for HTTP client lifecycle
async def get_http_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client

# ANTI-PATTERN: forgetting to handle errors in yield deps
async def bad_db_session():
    session = async_session_maker()
    yield session  # BAD: no commit, no rollback, no close
\\\`\\\`\\\`

## Overriding Dependencies in Tests
Use \`app.dependency_overrides\` to replace real dependencies with test doubles.

\\\`\\\`\\\`python
import pytest
from fastapi.testclient import TestClient

def get_fake_db():
    return FakeDatabase()

@pytest.fixture
def client(app):
    app.dependency_overrides[get_db_session] = get_fake_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()  # ALWAYS clear after tests

# ANTI-PATTERN: not clearing overrides — leaks into other tests
\\\`\\\`\\\`

## Dependency Caching (use_cache)
By default, FastAPI caches the dependency return value within a single request.
If two parameters depend on the same function, it is called only once.

\\\`\\\`\\\`python
# Called once per request, even if multiple params depend on it
def get_settings():
    return Settings()

@app.get("/info/")
async def info(
    settings_a: Settings = Depends(get_settings),  # first call — cached
    settings_b: Settings = Depends(get_settings),  # reuses cached value
):
    assert settings_a is settings_b  # True — same object

# To force re-evaluation per injection point:
@app.get("/multi/")
async def multi(
    val_a: str = Depends(get_random_value, use_cache=False),
    val_b: str = Depends(get_random_value, use_cache=False),
):
    pass  # val_a and val_b may differ — called twice
\\\`\\\`\\\`

## Security Dependencies (OAuth2PasswordBearer)
OAuth2PasswordBearer is a dependency that extracts and validates Bearer tokens.

\\\`\\\`\\\`python
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    payload = decode_jwt(token)
    user = await user_repo.get(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Login endpoint — receives form data, returns token
@router.post("/auth/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
\\\`\\\`\\\`

## Database Session Dependencies (Full Pattern)
Complete pattern for async database sessions with SQLAlchemy.

\\\`\\\`\\\`python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(settings.database_url, echo=False)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

DbSession = Annotated[AsyncSession, Depends(get_db)]

# Usage in endpoint — clean, no boilerplate
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: DbSession, current_user: ActiveUserDep):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
\\\`\\\`\\\`
`,
      },
      {
        name: 'fastapi-testing-guide',
        description: 'Detailed reference for FastAPI testing with pytest, TestClient, and httpx',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# FastAPI Testing — Detailed Reference

## TestClient Basics (Synchronous)
\`TestClient\` is built on \`httpx\` and runs the ASGI app synchronously for simple tests.

\\\`\\\`\\\`python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

def test_create_item():
    response = client.post(
        "/items/",
        json={"name": "Hammer", "price": 9.99},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Hammer"
    assert "id" in data
\\\`\\\`\\\`

## Async Testing with httpx.AsyncClient
For testing async endpoints or when you need async fixtures, use \`httpx.AsyncClient\` with \`ASGITransport\`.

\\\`\\\`\\\`python
import pytest
import httpx
from httpx import ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_read_items_async():
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/items/")
        assert response.status_code == 200

# Reusable async client fixture
@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.mark.anyio
async def test_with_fixture(async_client):
    response = await async_client.get("/items/")
    assert response.status_code == 200
\\\`\\\`\\\`

## Dependency Overriding for Tests
Override real dependencies (database, auth, external APIs) with test doubles.

\\\`\\\`\\\`python
from app.dependencies import get_db, get_current_user
from app.models import User

fake_user = User(id=1, email="test@example.com", is_active=True)

def override_get_current_user():
    return fake_user

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()  # CRITICAL: always clean up

# ANTI-PATTERN: not clearing overrides — pollutes other tests
# ANTI-PATTERN: overriding in module scope instead of fixture
\\\`\\\`\\\`

## Database Testing (SQLAlchemy Sessions)
Use a separate test database and rollback between tests for isolation.

\\\`\\\`\\\`python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.dependencies import get_db

# In-memory SQLite for fast tests
SQLALCHEMY_TEST_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
\\\`\\\`\\\`

## Testing File Uploads
Use the \`files\` parameter on the TestClient to simulate multipart form uploads.

\\\`\\\`\\\`python
def test_upload_file(client):
    response = client.post(
        "/upload/",
        files={"file": ("report.csv", b"col1,col2\\n1,2", "text/csv")},
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "report.csv"

def test_upload_multiple_files(client):
    files = [
        ("files", ("file1.txt", b"content1", "text/plain")),
        ("files", ("file2.txt", b"content2", "text/plain")),
    ]
    response = client.post("/upload-many/", files=files)
    assert response.status_code == 200
    assert len(response.json()["filenames"]) == 2

def test_upload_rejects_large_file(client):
    large_content = b"x" * (10 * 1024 * 1024 + 1)  # > 10MB
    response = client.post(
        "/upload/",
        files={"file": ("huge.bin", large_content, "application/octet-stream")},
    )
    assert response.status_code == 413  # or 422 depending on implementation
\\\`\\\`\\\`

## Testing WebSockets
Use the \`TestClient\` WebSocket context manager for WebSocket endpoint tests.

\\\`\\\`\\\`python
def test_websocket_echo(client):
    with client.websocket_connect("/ws") as websocket:
        websocket.send_text("hello")
        data = websocket.receive_text()
        assert data == "Message: hello"

def test_websocket_json(client):
    with client.websocket_connect("/ws/json") as websocket:
        websocket.send_json({"action": "ping"})
        response = websocket.receive_json()
        assert response["action"] == "pong"

def test_websocket_auth_rejected():
    client = TestClient(app)
    with pytest.raises(Exception):  # WebSocketDisconnect
        with client.websocket_connect("/ws?token=invalid") as websocket:
            websocket.receive_text()
\\\`\\\`\\\`

## Testing Background Tasks
Mock background tasks to verify they are enqueued without actually executing them.

\\\`\\\`\\\`python
from unittest.mock import patch, MagicMock

def test_create_user_sends_welcome_email(client):
    with patch("app.services.email.send_welcome_email") as mock_email:
        response = client.post(
            "/users/",
            json={"email": "new@example.com", "password": "secure123"},
        )
        assert response.status_code == 201
        mock_email.assert_called_once_with("new@example.com")

# Alternative: capture BackgroundTasks
def test_background_task_added(client):
    with patch("app.routers.users.BackgroundTasks.add_task") as mock_add:
        response = client.post("/users/", json={...})
        assert response.status_code == 201
        mock_add.assert_called_once()
\\\`\\\`\\\`

## Authentication Testing
Test both authenticated and unauthenticated flows with dependency overrides and headers.

\\\`\\\`\\\`python
@pytest.fixture
def auth_client(client):
    """Client with valid auth token."""
    token = create_test_token(user_id=1)
    client.headers["Authorization"] = f"Bearer {token}"
    return client

def test_protected_endpoint_requires_auth(client):
    response = client.get("/users/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_protected_endpoint_with_valid_token(auth_client):
    response = auth_client.get("/users/me")
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

def test_expired_token_rejected(client):
    expired_token = create_test_token(user_id=1, expires_delta=timedelta(seconds=-1))
    client.headers["Authorization"] = f"Bearer {expired_token}"
    response = client.get("/users/me")
    assert response.status_code == 401

def test_admin_only_endpoint_forbidden_for_regular_user(auth_client):
    response = auth_client.delete("/admin/users/999")
    assert response.status_code == 403
\\\`\\\`\\\`

## Conftest Fixture Organization
Organize reusable fixtures in \`conftest.py\` for clean test setup.

\\\`\\\`\\\`python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.dependencies import get_db

@pytest.fixture(scope="session")
def app():
    return create_app()

@pytest.fixture
def db_session():
    # ... test database setup ...
    yield session
    session.close()

@pytest.fixture
def client(app, db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def authenticated_client(client):
    token = create_test_token(user_id=1)
    client.headers["Authorization"] = f"Bearer {token}"
    return client
\\\`\\\`\\\`
`,
      },
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
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/on_event\\s*\\([\"\\x27](startup|shutdown)/.test(c))console.log(\'Warning: @app.on_event() is deprecated — use lifespan async context manager instead (see FastAPI docs)\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/allow_origins\\s*=\\s*\\[\\s*[\"\\x27]\\*[\"\\x27]/.test(c)&&!/test|conftest|fixture/.test(f.toLowerCase()))console.log(\'Warning: CORS allow_origins=[\\\"*\\\"] detected — use explicit origins in production\')" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const m=c.match(/@(app|router)\\.(get|post|put|delete|patch)\\([^)]*\\)[\\s\\S]*?async\\s+def\\s+\\w+[^:]+:/g);if(m){const no_rm=m.filter(x=>!/response_model/.test(x));if(no_rm.length>0)console.log(\'Warning: \'+no_rm.length+\' endpoint(s) missing response_model — add explicit response_model for type safety and OpenAPI docs\')}" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
