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

- Use async endpoint functions (\`async def\`) for I/O-bound operations
- Define all request and response schemas with Pydantic models
- Use FastAPI's dependency injection system for shared logic (auth, DB sessions, config)
- Organize routes with APIRouter - one router per domain/resource
- Use path operation decorators with explicit response models and status codes
- Leverage automatic OpenAPI/Swagger documentation - keep it accurate
- Use background tasks for non-blocking work (emails, notifications)
- Apply middleware for cross-cutting concerns (CORS, logging, timing)
- Use HTTPException for error responses with proper status codes
- Use lifespan events for startup/shutdown logic (DB connections, caches)
- Validate all input via Pydantic - never trust raw request data
- Use Annotated types with Depends for clean dependency injection`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(uvicorn:*)',
          'Bash(pip:*)',
          'Bash(pytest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'fastapi/architecture.md',
        governance: 'mandatory',
        description: 'FastAPI architecture and Pydantic patterns',
        content: `# FastAPI Architecture

## Project Structure
- \`/app\` - Main application package
- \`/app/routers\` - APIRouter modules grouped by resource
- \`/app/models\` - Pydantic schemas and ORM models
- \`/app/dependencies\` - Dependency injection functions
- \`/app/services\` - Business logic layer
- \`/app/core\` - Configuration, security, and shared utilities

## Endpoint Patterns
- Use \`async def\` for endpoints performing I/O (database, HTTP calls, file I/O)
- Use \`def\` (sync) for CPU-bound endpoints - FastAPI runs them in a threadpool
- Always specify \`response_model\` for type-safe, documented responses
- Use explicit \`status_code\` for creation (201), deletion (204), etc.
- Use \`Path()\`, \`Query()\`, \`Body()\` for parameter metadata and validation

## Pydantic Models
- Create separate schemas for create, update, and response (e.g., UserCreate, UserUpdate, UserResponse)
- Use \`model_config\` with \`from_attributes = True\` for ORM integration
- Use \`Field()\` for validation constraints (min_length, max_length, ge, le, pattern)
- Use custom validators with \`@field_validator\` and \`@model_validator\`
- Never expose internal fields (password hashes, internal IDs) in response models

## Dependency Injection
- Use \`Depends()\` for reusable dependencies (DB sessions, auth, pagination)
- Use \`Annotated[type, Depends(fn)]\` for clean type annotations
- Chain dependencies: a dependency can depend on other dependencies
- Use \`yield\` dependencies for resources requiring cleanup (DB sessions, file handles)
- Apply dependencies at router or app level for global concerns

## Background Tasks
- Use \`BackgroundTasks\` for fire-and-forget operations
- Background tasks run after the response is sent
- For heavy or critical background work, use Celery or a task queue instead
- Log background task failures - they will not propagate to the client

## Error Handling
- Use \`HTTPException\` with appropriate status codes and detail messages
- Create custom exception handlers for domain-specific errors
- Return consistent error response shapes across all endpoints
- Never expose internal stack traces or system details in error responses
`,
      },
      {
        path: 'fastapi/openapi.md',
        governance: 'recommended',
        description: 'FastAPI OpenAPI documentation best practices',
        content: `# FastAPI OpenAPI Documentation

## Endpoint Documentation
- Add \`summary\` and \`description\` to path operations
- Use \`tags\` to group related endpoints in the Swagger UI
- Document all possible responses with \`responses\` parameter
- Add examples to Pydantic models using \`model_config\` or \`Field(examples=[...])\`

## Schema Documentation
- Add docstrings to Pydantic models - they appear in the OpenAPI schema
- Use \`Field(description=...)\` for individual field documentation
- Mark optional fields with \`Optional[]\` or default values
- Document enum values with descriptive names

## Security Documentation
- Use FastAPI security utilities (\`OAuth2PasswordBearer\`, \`APIKeyHeader\`)
- Security schemes appear automatically in the Swagger UI
- Document which endpoints require authentication
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## FastAPI-Specific Review
- Verify endpoints use \`async def\` for I/O-bound operations
- Check that all request/response data uses Pydantic models - no raw dicts
- Verify dependency injection is used for shared concerns (auth, DB, config)
- Check that response_model is specified to prevent leaking internal fields
- Verify proper error handling with HTTPException and custom exception handlers
- Check for proper input validation via Pydantic Field constraints
- Verify background tasks are used appropriately (not for critical operations)
- Check CORS middleware configuration for production
- Verify OpenAPI documentation is accurate and complete
- Check for proper lifespan management of resources (DB connections, caches)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## FastAPI Testing
- Use \`TestClient\` from Starlette for synchronous endpoint tests
- Use \`httpx.AsyncClient\` with \`ASGITransport\` for async endpoint tests
- Override dependencies with \`app.dependency_overrides\` for mocking
- Test Pydantic models independently for validation logic
- Test each endpoint: success, validation errors (422), auth errors (401/403), not found (404)
- Test background tasks by mocking and verifying they are enqueued
- Verify OpenAPI schema generation matches expected structure
- Test dependency injection chains with mocked sub-dependencies`,
      },
    ],
  },
};
