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

- Use \`async def\` for endpoints performing I/O (database, HTTP calls, file I/O); use \`def\` for CPU-bound endpoints — FastAPI runs sync endpoints in a threadpool
- Define all request and response data with Pydantic models — never accept or return raw dicts
- Use separate Pydantic schemas per operation: \`UserCreate\`, \`UserUpdate\`, \`UserResponse\` — never expose internal fields (password hashes, internal IDs) in response models
- Use \`Annotated[type, Depends(fn)]\` for all dependency injection — create reusable type aliases for common dependencies
- Organize routes with \`APIRouter\` — one router per domain/resource with prefix, tags, and shared dependencies
- Specify \`response_model\` and explicit \`status_code\` on every path operation
- Use \`Path()\`, \`Query()\`, \`Body()\`, \`Header()\`, \`Cookie()\` for parameter metadata, validation, and OpenAPI documentation
- Use \`Field()\` with constraints (\`min_length\`, \`max_length\`, \`ge\`, \`le\`, \`pattern\`) on all Pydantic model fields
- Use \`lifespan\` async context manager for startup/shutdown logic (DB pools, caches, ML models) — not deprecated \`on_event\`
- Use \`BackgroundTasks\` for fire-and-forget work (emails, notifications) — use Celery/task queues for heavy or critical background processing
- Use \`HTTPException\` with proper status codes and detail messages for error responses — create custom exception handlers for domain errors
- Configure CORS, TrustedHost, and GZip middleware via \`app.add_middleware()\`
- Use Pydantic Settings (\`BaseSettings\`) with \`.env\` files for configuration — inject settings as a dependency with \`@lru_cache\`
- Keep OpenAPI documentation accurate: add \`summary\`, \`description\`, \`tags\`, \`responses\`, and model examples`,
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
        governance: 'mandatory',
        description: 'FastAPI project structure, routing, and Pydantic patterns',
        content: `# FastAPI Architecture

## Project Structure
\`\`\`
app/
  __init__.py
  main.py               # FastAPI app creation, lifespan, middleware, router includes
  config.py             # Pydantic BaseSettings + @lru_cache getter
  dependencies.py       # Shared dependencies (auth, DB session, pagination)
  exceptions.py         # Custom exception classes + exception handlers
  routers/
    __init__.py
    users.py            # APIRouter for /users
    items.py            # APIRouter for /items
  schemas/
    __init__.py
    users.py            # UserCreate, UserUpdate, UserResponse
    items.py            # ItemCreate, ItemUpdate, ItemResponse
    common.py           # PaginatedResponse, ErrorResponse
  models/
    __init__.py
    user.py             # SQLAlchemy/ORM model
    item.py
  services/
    __init__.py
    user_service.py     # Business logic, orchestrates repos
    item_service.py
  repositories/
    __init__.py
    user_repo.py        # Data access layer
    item_repo.py
tests/
  conftest.py           # Fixtures: TestClient, DB override, factory functions
  test_users.py
  test_items.py
\`\`\`

## Application Factory and Lifespan

### Correct
\`\`\`python
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.routers import users, items


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup: initialize DB pool, cache, ML model
    settings = get_settings()
    app.state.db_pool = await create_db_pool(settings.database_url)
    yield
    # Shutdown: cleanup resources
    await app.state.db_pool.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts,
    )
    app.include_router(users.router, prefix="/api/v1")
    app.include_router(items.router, prefix="/api/v1")
    return app

app = create_app()
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: using deprecated on_event, no middleware, no factory
app = FastAPI()

@app.on_event("startup")  # Deprecated — use lifespan instead
async def startup():
    app.state.db = await connect_db()

@app.get("/users/{user_id}")  # Route directly on app — no router organization
async def get_user(user_id: int):
    return db.query(f"SELECT * FROM users WHERE id = {user_id}")  # SQL injection!
\`\`\`

## APIRouter Organization

### Correct
\`\`\`python
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated

from app.dependencies import get_current_user, get_db_session
from app.schemas.items import ItemCreate, ItemResponse
from app.services.item_service import ItemService

router = APIRouter(
    prefix="/items",
    tags=["items"],
    dependencies=[Depends(get_current_user)],
    responses={401: {"description": "Not authenticated"}},
)

DbSession = Annotated[AsyncSession, Depends(get_db_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post(
    "/",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new item",
    description="Creates an item owned by the current user.",
)
async def create_item(
    item_in: ItemCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> ItemResponse:
    service = ItemService(db)
    return await service.create(item_in, owner=current_user)


@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Get item by ID",
)
async def get_item(
    item_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> ItemResponse:
    service = ItemService(db)
    item = await service.get_by_id(item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found",
        )
    return item
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: no prefix/tags, no response_model, no status_code, raw dicts
router = APIRouter()

@router.post("/items")
async def create_item(data: dict):  # No Pydantic model, no type safety
    return {"id": 1, **data, "password_hash": "abc123"}  # Leaks internal fields
\`\`\`

## Pydantic Schemas

### Correct
\`\`\`python
from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator


class UserBase(BaseModel):
    """Shared fields for all user schemas."""
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    """Schema for partial user updates."""
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=100)


class UserResponse(UserBase):
    """Schema returned to the client — never includes password."""
    id: int
    is_active: bool

    model_config = {"from_attributes": True}
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: single model for everything, exposes password, no validation
class User(BaseModel):
    id: int | None = None
    email: str                # No EmailStr validation
    full_name: str            # No length constraints
    password: str             # Exposed in response!
    password_hash: str        # Internal field leaked!
\`\`\`
`,
      },
      {
        path: 'fastapi/dependencies-and-settings.md',
        governance: 'mandatory',
        description: 'FastAPI dependency injection, settings, and configuration patterns',
        content: `# FastAPI Dependencies & Settings

## Dependency Injection with Annotated

### Correct
\`\`\`python
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.ext.asyncio import AsyncSession


# --- Settings ---
class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env."""
    app_name: str = "My API"
    app_version: str = "0.1.0"
    database_url: str
    redis_url: str = "redis://localhost:6379"
    secret_key: str
    access_token_expire_minutes: int = 30
    allowed_origins: list[str] = ["http://localhost:3000"]
    allowed_hosts: list[str] = ["*"]
    debug: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


SettingsDep = Annotated[Settings, Depends(get_settings)]


# --- Database Session ---
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


DbSession = Annotated[AsyncSession, Depends(get_db_session)]


# --- Authentication ---
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbSession,
    settings: SettingsDep,
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=["HS256"]
        )
        user_id: int | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_active_user(
    current_user: CurrentUser,
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


ActiveUser = Annotated[User, Depends(get_current_active_user)]


# --- Pagination ---
async def pagination_params(
    skip: int = Query(default=0, ge=0, description="Items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
) -> dict[str, int]:
    return {"skip": skip, "limit": limit}


PaginationDep = Annotated[dict[str, int], Depends(pagination_params)]
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: global settings object, no caching, no Annotated aliases, no cleanup
import os

DATABASE_URL = os.environ["DATABASE_URL"]  # Crashes if missing, no validation
SECRET_KEY = os.environ.get("SECRET_KEY", "changeme")  # Insecure default!

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # No rollback on error!

@app.get("/users/me")
async def get_me(db: Session = Depends(get_db)):  # No Annotated, no type alias
    # Auth logic mixed into endpoint — not reusable
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token, db)
    return user
\`\`\`

## Yield Dependencies for Resource Cleanup

### Correct
\`\`\`python
from collections.abc import AsyncGenerator
from typing import Annotated
from fastapi import Depends


async def get_http_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client


HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]


@router.get("/external-data")
async def fetch_external(client: HttpClient) -> dict:
    response = await client.get("https://api.example.com/data")
    response.raise_for_status()
    return response.json()
\`\`\`

## Testing Dependency Overrides

### Correct
\`\`\`python
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db_session, get_settings
from app.config import Settings


def get_settings_override() -> Settings:
    return Settings(
        database_url="sqlite+aiosqlite:///test.db",
        secret_key="test-secret-key",
        debug=True,
    )


app.dependency_overrides[get_settings] = get_settings_override
app.dependency_overrides[get_db_session] = get_test_db_session

client = TestClient(app)
\`\`\`
`,
      },
      {
        path: 'fastapi/error-handling.md',
        governance: 'mandatory',
        description: 'FastAPI error handling, exception handlers, and security patterns',
        content: `# FastAPI Error Handling & Security

## Custom Exception Hierarchy

### Correct
\`\`\`python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


# --- Domain Exceptions ---
class AppError(Exception):
    """Base exception for all application errors."""
    def __init__(self, detail: str, status_code: int = 500) -> None:
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: int | str) -> None:
        super().__init__(
            detail=f"{resource} with id '{resource_id}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Access denied") -> None:
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ConflictError(AppError):
    def __init__(self, detail: str) -> None:
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)


# --- Exception Handlers ---
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "type": type(exc).__name__},
    )


async def validation_error_handler(
    request: Request, exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
        },
    )


async def http_error_handler(
    request: Request, exc: StarletteHTTPException,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# --- Register in app factory ---
def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: inconsistent error shapes, no custom exceptions, leaking internals
@router.get("/items/{item_id}")
async def get_item(item_id: int, db: DbSession):
    try:
        item = await db.get(Item, item_id)
        if not item:
            return {"error": "not found"}  # Wrong: returns 200 with error body
        return item
    except Exception as e:
        return {"error": str(e)}  # Leaks internal error details, returns 200
\`\`\`

## Security Patterns

### OAuth2 with JWT — Correct
\`\`\`python
from datetime import datetime, timedelta, timezone

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Annotated


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenDep = Annotated[str, Depends(oauth2_scheme)]


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(
    data: dict,
    settings: Settings,
    expires_delta: timedelta | None = None,
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


@router.post("/auth/token")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
    settings: SettingsDep,
):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",  # Generic message — never "wrong password"
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        data={"sub": str(user.id)},
        settings=settings,
    )
    return {"access_token": token, "token_type": "bearer"}
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: hardcoded secret, no expiration, weak hashing, leaks info
SECRET = "my-secret"  # Hardcoded!

@router.post("/login")
async def login(username: str, password: str):  # No form/schema
    user = await db.query(User).filter_by(username=username).first()
    if not user:
        raise HTTPException(400, "User not found")  # Reveals user existence
    if user.password != password:  # Plaintext comparison!
        raise HTTPException(400, "Wrong password")  # Reveals which field is wrong
    token = jwt.encode({"user": username}, SECRET)  # No expiration!
    return {"token": token}
\`\`\`

## CORS and Middleware Security

### Correct
\`\`\`python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware


app = FastAPI()

# Order matters: last added = outermost wrapper
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["api.example.com", "*.example.com"],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.example.com"],  # Never "*" in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: allows everything, no trusted hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Any origin in production!
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,    # Credentials + wildcard origin = browser rejection
)
\`\`\`
`,
      },
      {
        path: 'fastapi/testing-deployment.md',
        governance: 'recommended',
        description: 'FastAPI testing strategies and deployment patterns',
        content: `# FastAPI Testing & Deployment

## Testing with TestClient

### Correct
\`\`\`python
import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.dependencies import get_db_session, get_current_user


# --- Sync Tests (TestClient) ---
@pytest.fixture
def client(db_session_override):
    app.dependency_overrides[get_db_session] = lambda: db_session_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_create_item(client: TestClient) -> None:
    response = client.post(
        "/api/v1/items/",
        json={"name": "Test Item", "price": 9.99},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Item"
    assert "id" in data


def test_create_item_validation_error(client: TestClient) -> None:
    response = client.post(
        "/api/v1/items/",
        json={"name": "", "price": -1},  # Invalid: empty name, negative price
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 422


def test_get_item_not_found(client: TestClient) -> None:
    response = client.get(
        "/api/v1/items/99999",
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.status_code == 404


def test_unauthorized_without_token(client: TestClient) -> None:
    response = client.get("/api/v1/items/1")
    assert response.status_code == 401


# --- Async Tests (httpx.AsyncClient) ---
@pytest.mark.asyncio
async def test_async_create_item(db_session_override) -> None:
    app.dependency_overrides[get_db_session] = lambda: db_session_override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/items/",
            json={"name": "Async Item", "price": 19.99},
            headers={"Authorization": "Bearer test-token"},
        )
    assert response.status_code == 201
    app.dependency_overrides.clear()
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: no fixtures, no cleanup, no edge case testing
def test_items():
    client = TestClient(app)
    r = client.post("/items", json={"name": "x"})
    assert r.status_code == 200  # Only happy path, wrong status for creation
\`\`\`

## Test Organization

### Test Coverage Checklist
For every endpoint, test:
1. **Success case**: correct status code, response body matches schema
2. **Validation errors (422)**: missing required fields, invalid types, constraint violations
3. **Authentication errors (401)**: missing token, expired token, invalid token
4. **Authorization errors (403)**: valid user but insufficient permissions
5. **Not found (404)**: resource does not exist
6. **Conflict (409)**: duplicate creation, stale update (optimistic locking)
7. **Background tasks**: verify they are enqueued (mock and assert call)
8. **Pydantic models**: test validators and computed fields independently

## Deployment

### Production Command — Correct
\`\`\`bash
# Uvicorn with workers (simple deployment)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Gunicorn with Uvicorn workers (recommended for production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# FastAPI CLI (development only)
fastapi dev app/main.py
\`\`\`

### Docker — Correct
\`\`\`dockerfile
FROM python:3.12-slim

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /code/app

# Non-root user for security
RUN adduser --disabled-password --no-create-home appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
\`\`\`

### Anti-Pattern
\`\`\`dockerfile
# Bad: runs as root, dev mode in production, no --workers
FROM python:3.12
COPY . /app
RUN pip install -r requirements.txt
CMD ["fastapi", "dev", "main.py"]  # Dev server in production!
\`\`\`

## Deployment Checklist
- TLS termination via reverse proxy (Traefik, Caddy, Nginx) — not in the app
- Multiple Uvicorn workers or Gunicorn with UvicornWorker class
- Non-root user in Docker containers
- Health check endpoint (\`/health\`) that verifies DB connectivity
- Structured logging (JSON format) for observability
- Environment-based settings — no hardcoded secrets
- Database migrations run before app startup (Alembic \`upgrade head\`)
- Process manager for automatic restarts (systemd, Docker restart policy, Kubernetes)
`,
      },
      {
        path: 'fastapi/websockets-advanced.md',
        governance: 'recommended',
        description: 'FastAPI WebSocket patterns and advanced features',
        content: `# FastAPI WebSockets & Advanced Patterns

## WebSocket Endpoints

### Correct
\`\`\`python
from fastapi import Depends, WebSocket, WebSocketDisconnect, WebSocketException, status
from typing import Annotated


class ConnectionManager:
    """Manages active WebSocket connections for broadcasting."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str) -> None:
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


async def ws_auth(
    websocket: WebSocket,
    token: str | None = Query(default=None),
) -> User:
    if token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    user = await verify_ws_token(token)
    if user is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    return user


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    user: Annotated[User, Depends(ws_auth)],
) -> None:
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{user.name}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"{user.name} left the room")
\`\`\`

## Background Tasks

### Correct
\`\`\`python
from fastapi import BackgroundTasks


async def send_welcome_email(email: str, name: str) -> None:
    """Fire-and-forget task — runs after response is sent."""
    await email_service.send(
        to=email,
        subject="Welcome!",
        body=f"Hello {name}, welcome to our platform.",
    )


@router.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: DbSession,
) -> UserResponse:
    user = await user_service.create(db, user_in)
    background_tasks.add_task(send_welcome_email, user.email, user.full_name)
    return user
\`\`\`

## Custom Response Types

### Correct
\`\`\`python
from fastapi.responses import StreamingResponse, FileResponse, RedirectResponse


@router.get("/reports/{report_id}/csv")
async def download_report(report_id: int, db: DbSession) -> StreamingResponse:
    rows = await report_service.generate_csv_rows(db, report_id)
    return StreamingResponse(
        content=rows,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.csv"},
    )


@router.get("/files/{file_id}")
async def download_file(file_id: int, db: DbSession) -> FileResponse:
    file_path = await file_service.get_path(db, file_id)
    return FileResponse(path=file_path, filename=file_path.name)
\`\`\`

## Server-Sent Events (SSE)

### Correct
\`\`\`python
from sse_starlette.sse import EventSourceResponse


@router.get("/events/stream")
async def event_stream(current_user: ActiveUser) -> EventSourceResponse:
    async def generate():
        async for event in event_bus.subscribe(user_id=current_user.id):
            yield {"event": event.type, "data": event.json()}

    return EventSourceResponse(generate())
\`\`\`

## Database Migrations with Alembic

### Commands
\`\`\`bash
# Initialize Alembic
alembic init alembic

# Create a migration after model changes
alembic revision --autogenerate -m "add users table"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
\`\`\`

### Rules
- Always review auto-generated migrations before applying
- Write both \`upgrade()\` and \`downgrade()\` functions
- Never modify a migration that has been applied to production — create a new one
- Run migrations as a separate step before starting the application
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
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
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/on_event\\s*\\([\"\\x27](startup|shutdown)/.test(c))console.log(\'Warning: @app.on_event() is deprecated — use lifespan async context manager instead (see FastAPI docs)\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/allow_origins\\s*=\\s*\\[\\s*[\"\\x27]\\*[\"\\x27]/.test(c)&&!/test|conftest|fixture/.test(f.toLowerCase()))console.log(\'Warning: CORS allow_origins=[\\\"*\\\"] detected — use explicit origins in production\')" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.py$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const m=c.match(/@(app|router)\\.(get|post|put|delete|patch)\\([^)]*\\)[\\s\\S]*?async\\s+def\\s+\\w+[^:]+:/g);if(m){const no_rm=m.filter(x=>!/response_model/.test(x));if(no_rm.length>0)console.log(\'Warning: \'+no_rm.length+\' endpoint(s) missing response_model — add explicit response_model for type safety and OpenAPI docs\')}" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
