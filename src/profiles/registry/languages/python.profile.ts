import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const pythonProfile: Profile = {
  id: 'languages/python',
  name: 'Python',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['python'],
  contributions: {
    claudeMd: [
      {
        heading: 'Python Conventions',
        order: 10,
        content: `## Python Conventions

PEP 8 style, type hints mandatory (PEP 484/604). Prefer pathlib, f-strings, dataclasses.

**Detailed rules:** see \`.claude/rules/python/\` directory.

**Key rules:**
- Type hints on all public functions, \`from __future__ import annotations\` for forward refs
- Use \`@dataclass\` or Pydantic for structured data, \`Enum\` for fixed sets
- Async with \`asyncio\` — never block the event loop, use \`async for\`/\`async with\`
- Organize imports: stdlib → third-party → local, use \`isort\` and \`ruff\``,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(python:*)',
          'Bash(python3:*)',
          'Bash(pip:*)',
          'Bash(pip3:*)',
          'Bash(uv:*)',
          'Bash(pytest:*)',
          'Bash(mypy:*)',
          'Bash(pyright:*)',
          'Bash(ruff:*)',
          'Bash(poetry:*)',
          'Bash(pdm:*)',
          'Bash(hatch:*)',
        ],
      },
    },
    rules: [
      {
        path: 'python/conventions.md',
        paths: ['**/*.py'],
        governance: 'mandatory',
        description: 'Python coding conventions aligned with PEP 8, PEP 484, PEP 257',
        content: `# Python Coding Conventions

## Why This Matters
Python's philosophy ("Readability counts", "Explicit is better than implicit") demands
consistent style and strong typing. These conventions are derived from PEP 8, PEP 484,
PEP 257, and community-established best practices enforced by Ruff and mypy.

---

## Naming Conventions (PEP 8)

| Element | Convention | Example |
|---------|-----------|---------|
| Variables, functions | snake_case | \`user_count\`, \`get_active_users()\` |
| Constants | UPPER_SNAKE_CASE | \`MAX_RETRIES\`, \`DEFAULT_TIMEOUT\` |
| Classes | PascalCase | \`UserService\`, \`HTTPClient\` |
| Type variables | PascalCase, short | \`T\`, \`KT\`, \`VT\`, \`ResponseT\` |
| Private attributes | single leading underscore | \`_internal_cache\` |
| Name-mangled attributes | double leading underscore | \`__private\` (rarely needed) |
| Module-level dunder | double underscore both sides | \`__all__\`, \`__version__\` |

### Correct
\`\`\`python
MAX_RETRY_COUNT = 3
DEFAULT_TIMEOUT_SECONDS = 30

class UserRepository:
    def __init__(self, db_session: Session) -> None:
        self._session = db_session

    def find_by_email(self, email: str) -> User | None:
        return self._session.query(User).filter_by(email=email).first()
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: inconsistent naming, no type hints, magic numbers
maxRetry = 3  # camelCase instead of snake_case
class userRepo:  # lowercase class name
    def find(self, e):  # single-letter param, no return type
        return self.s.query(User).filter_by(email=e).first()
\`\`\`

---

## Type Hints (PEP 484 / PEP 604 / PEP 695)

### Mandatory Annotations
- Every function must have parameter types AND return type annotated
- Use \`-> None\` explicitly for functions that return nothing
- Use \`from __future__ import annotations\` for forward reference support and modern syntax

### Correct
\`\`\`python
from __future__ import annotations
from collections.abc import Sequence
from typing import TypeAlias

UserId: TypeAlias = int
UserMap: TypeAlias = dict[str, User]

def get_active_users(
    users: Sequence[User],
    min_activity: int = 10,
) -> list[User]:
    return [u for u in users if u.activity_count >= min_activity]

def find_user(user_id: UserId) -> User | None:
    """Return user if found, None otherwise."""
    ...

async def fetch_data(url: str, *, timeout: float = 30.0) -> dict[str, Any]:
    ...
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: missing annotations, using deprecated typing constructs
from typing import Optional, List, Dict, Union

def get_active_users(users, min_activity=10):  # no type hints
    return [u for u in users if u.activity_count >= min_activity]

def find_user(user_id) -> Optional[User]:  # use X | None instead
    ...

def process(data: Union[str, bytes]):  # use str | bytes instead
    ...
\`\`\`

---

## Docstrings (PEP 257)

### Rules
- Every public module, class, and function must have a docstring
- Use triple double quotes (\`"""..."""\`)
- One-line docstrings: opening and closing quotes on the same line
- Multi-line docstrings: summary line, blank line, then details
- Use Google-style or NumPy-style docstring format consistently within a project

### Correct
\`\`\`python
def calculate_discount(
    order: Order,
    coupon: Coupon | None = None,
) -> Decimal:
    """Calculate the total discount for an order.

    Applies the base discount rate from the order's tier, then
    layers any coupon discount on top. Discounts do not stack
    beyond the maximum allowed by policy.

    Args:
        order: The order to calculate discount for.
        coupon: Optional coupon to apply.

    Returns:
        The discount amount as a Decimal, never negative.

    Raises:
        ValueError: If the order has no items.
    """
    ...
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: restates the function signature, missing structure
def calculate_discount(order, coupon=None):
    '''this function calculates discount'''  # single quotes, no structure, no types
    ...
\`\`\`

---

## Error Handling

### Rules
- Catch specific exception types — never bare \`except:\` or \`except Exception:\` without re-raising
- Define custom exception classes inheriting from a project-level base exception
- Include context in error messages: what failed, which input, what state
- Use \`raise ... from err\` to preserve the exception chain
- Use \`logging\` module for errors — never \`print()\` in production code
- Use \`contextlib.suppress()\` only for truly ignorable exceptions

### Correct
\`\`\`python
class UserNotFoundError(AppError):
    """Raised when a user lookup fails."""
    def __init__(self, user_id: int) -> None:
        super().__init__(f"User {user_id} not found")
        self.user_id = user_id

async def get_user(user_id: int) -> User:
    try:
        user = await user_repo.find_by_id(user_id)
    except DatabaseError as err:
        logger.error("Failed to fetch user %d: %s", user_id, err)
        raise UserNotFoundError(user_id) from err
    if user is None:
        raise UserNotFoundError(user_id)
    return user
\`\`\`

### Anti-Pattern
\`\`\`python
# Bad: bare except, swallowed error, print instead of logging
def get_user(user_id):
    try:
        return user_repo.find_by_id(user_id)
    except:  # catches everything including KeyboardInterrupt
        print("error")  # no context, swallowed, uses print
        return None  # caller has no idea what went wrong
\`\`\`

---

## Project Structure

### Recommended Layout
\`\`\`
project/
  pyproject.toml          # Project metadata, dependencies, tool config
  src/
    mypackage/
      __init__.py
      models/             # Domain models (dataclasses, Pydantic)
      services/           # Business logic
      repositories/       # Data access
      api/                # API routes/endpoints
      utils/              # Shared utilities
      exceptions.py       # Custom exceptions
      config.py           # Configuration loading
  tests/
    conftest.py           # Shared fixtures
    unit/                 # Unit tests mirroring src/ structure
    integration/          # Integration tests
\`\`\`

### Rules
- Use the src layout (\`src/mypackage/\`) — prevents accidental imports of the development version
- Put all project metadata, dependencies, and tool config in \`pyproject.toml\` (PEP 621)
- Use \`__init__.py\` to control public API — define \`__all__\` for explicit exports
- Separate concerns: models, services, repositories, API handlers in distinct modules
- Keep \`__init__.py\` files minimal — no business logic

---

## Security

### Python-Specific Vulnerabilities
- NEVER use \`eval()\`, \`exec()\`, or \`compile()\` with untrusted input
- NEVER use \`pickle\` to deserialize untrusted data — use JSON, MessagePack, or Protobuf
- NEVER use \`os.system()\` or \`subprocess.run(shell=True)\` with user input
- Use \`subprocess.run()\` with a list of args (not a shell string) for command execution
- Use \`secrets\` module for cryptographic randomness — not \`random\`
- Use \`hashlib\` with \`sha256\` or \`sha3_256\` — never \`md5\` or \`sha1\` for security
- Validate and sanitize all external input — URL params, form data, file uploads
- Use \`defusedxml\` for XML parsing to prevent XXE attacks
- Use parameterized queries — never f-string or \`%\` formatting for SQL

### Correct
\`\`\`python
import subprocess
import secrets

# Safe: argument list, no shell=True
result = subprocess.run(
    ["git", "log", "--oneline", "-n", "10"],
    capture_output=True, text=True, check=True,
)

# Safe: cryptographic randomness
token = secrets.token_urlsafe(32)
\`\`\`

### Anti-Pattern
\`\`\`python
import os
import random

# Dangerous: shell injection via user input
os.system(f"git log --oneline -n {user_input}")

# Dangerous: predictable randomness for security token
token = ''.join(random.choices('abcdef0123456789', k=32))
\`\`\`
`,
      },
      {
        path: 'python/typing-and-patterns.md',
        paths: ['**/*.py'],
        governance: 'recommended',
        description: 'Advanced Python type hints, protocols, and modern patterns',
        content: `# Python Type Hints & Modern Patterns

## Why This Matters
Python's type system enables catching bugs at development time, improving code
navigation, and making refactoring safe. Combined with mypy/pyright, it provides
TypeScript-level safety while retaining Python's expressiveness.

---

## Type Checking Configuration

### mypy (pyproject.toml)
\`\`\`toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unreachable = true
disallow_untyped_defs = true
disallow_any_explicit = false
no_implicit_reexport = true

[[tool.mypy.overrides]]
module = "third_party_lib.*"
ignore_missing_imports = true
\`\`\`

### pyright (pyproject.toml)
\`\`\`toml
[tool.pyright]
pythonVersion = "3.12"
typeCheckingMode = "strict"
reportMissingTypeStubs = "warning"
\`\`\`

---

## Advanced Type Patterns

### Protocol — Structural Subtyping
Use \`Protocol\` for duck typing with type safety. Prefer over ABC when you only
care about the interface, not the inheritance chain.

\`\`\`python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Renderable(Protocol):
    def render(self) -> str: ...

class HtmlWidget:
    def render(self) -> str:
        return "<div>widget</div>"

def display(item: Renderable) -> None:
    print(item.render())

# HtmlWidget satisfies Renderable without inheriting from it
display(HtmlWidget())  # OK
\`\`\`

### TypeVar — Generic Functions
\`\`\`python
from typing import TypeVar
from collections.abc import Sequence

T = TypeVar("T")

def first(items: Sequence[T]) -> T | None:
    return items[0] if items else None
\`\`\`

### Overload — Multiple Signatures
\`\`\`python
from typing import overload

@overload
def parse(data: str) -> dict[str, Any]: ...
@overload
def parse(data: bytes) -> dict[str, Any]: ...

def parse(data: str | bytes) -> dict[str, Any]:
    if isinstance(data, bytes):
        data = data.decode("utf-8")
    return json.loads(data)
\`\`\`

### TypedDict — Typed Dictionaries
\`\`\`python
from typing import TypedDict, NotRequired

class UserPayload(TypedDict):
    name: str
    email: str
    age: NotRequired[int]

def create_user(payload: UserPayload) -> User:
    ...
\`\`\`

### Literal — Constrained Values
\`\`\`python
from typing import Literal

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

def configure_logging(level: LogLevel) -> None:
    ...
\`\`\`

### Final — Immutable Bindings
\`\`\`python
from typing import Final

MAX_CONNECTIONS: Final = 100
API_VERSION: Final[str] = "v2"
\`\`\`

---

## Dataclasses vs Pydantic

### Use \`@dataclass\` for Internal Data
\`\`\`python
from dataclasses import dataclass, field

@dataclass(frozen=True, slots=True)
class Coordinate:
    latitude: float
    longitude: float

@dataclass(slots=True)
class UserConfig:
    name: str
    max_retries: int = 3
    tags: list[str] = field(default_factory=list)
\`\`\`

### Use Pydantic for External Data / Validation
\`\`\`python
from pydantic import BaseModel, Field, field_validator

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str
    age: int = Field(ge=0, le=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v.lower()
\`\`\`

---

## Context Managers

### When to Use
- File I/O, database connections, network sockets, locks, temporary resources
- Any object that needs deterministic cleanup

### Custom Context Manager
\`\`\`python
from contextlib import contextmanager
from typing import Generator

@contextmanager
def database_transaction(session: Session) -> Generator[Session, None, None]:
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Usage
with database_transaction(get_session()) as session:
    session.add(new_user)
\`\`\`

---

## Dependency Injection Pattern
\`\`\`python
from typing import Protocol

class EmailSender(Protocol):
    async def send(self, to: str, subject: str, body: str) -> None: ...

class UserService:
    def __init__(self, repo: UserRepository, email: EmailSender) -> None:
        self._repo = repo
        self._email = email

    async def register(self, name: str, email: str) -> User:
        user = await self._repo.create(name=name, email=email)
        await self._email.send(
            to=email,
            subject="Welcome",
            body=f"Hello {name}!",
        )
        return user
\`\`\`

---

## Performance Patterns

### Use Generators for Large Data
\`\`\`python
# Good: processes one line at a time, constant memory
def read_large_csv(path: Path) -> Generator[dict[str, str], None, None]:
    with path.open() as f:
        reader = csv.DictReader(f)
        yield from reader

# Bad: loads entire file into memory
def read_large_csv_bad(path: Path) -> list[dict[str, str]]:
    with path.open() as f:
        return list(csv.DictReader(f))
\`\`\`

### Use \`__slots__\` for Memory-Efficient Classes
\`\`\`python
# Good: ~40% less memory per instance
@dataclass(slots=True)
class Point:
    x: float
    y: float

# Or manually for non-dataclass
class Connection:
    __slots__ = ("host", "port", "_socket")
    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port
\`\`\`

### Use \`functools.lru_cache\` / \`functools.cache\` for Memoization
\`\`\`python
from functools import lru_cache

@lru_cache(maxsize=256)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
\`\`\`
`,
      },
      {
        path: 'python/async-patterns.md',
        paths: ['**/*.py'],
        governance: 'recommended',
        description: 'Python async/await patterns and structured concurrency',
        content: `# Python Async Patterns

## Why This Matters
Modern Python applications (web APIs, data pipelines, CLI tools) benefit from
async I/O for throughput. Incorrect async patterns cause subtle bugs: event loop
blocking, resource leaks, and race conditions.

---

## Structured Concurrency (Python 3.11+)

### Correct: TaskGroup
\`\`\`python
import asyncio

async def fetch_all_users(user_ids: list[int]) -> list[User]:
    results: list[User] = []

    async with asyncio.TaskGroup() as tg:
        for uid in user_ids:
            tg.create_task(fetch_user(uid))

    # All tasks complete or all are cancelled on first exception
    return results
\`\`\`

### Anti-Pattern: Unstructured gather
\`\`\`python
# Bad: exceptions in one task don't cancel others, harder to reason about
results = await asyncio.gather(*[fetch_user(uid) for uid in user_ids])
# If one task raises, behavior depends on return_exceptions flag — error-prone
\`\`\`

---

## Async Context Managers
\`\`\`python
from contextlib import asynccontextmanager
from typing import AsyncGenerator

@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[Connection, None]:
    conn = await create_connection()
    try:
        yield conn
    finally:
        await conn.close()

async def query_users() -> list[User]:
    async with get_db_connection() as conn:
        return await conn.fetch_all("SELECT * FROM users")
\`\`\`

---

## Blocking Code in Async Context
\`\`\`python
import asyncio
from pathlib import Path

# Correct: offload blocking I/O to thread pool
async def read_config(path: Path) -> str:
    return await asyncio.to_thread(path.read_text)

# Anti-pattern: blocking the event loop
async def read_config_bad(path: Path) -> str:
    return path.read_text()  # blocks the entire event loop
\`\`\`

---

## Timeout Pattern
\`\`\`python
async def fetch_with_timeout(url: str) -> Response:
    async with asyncio.timeout(30):
        return await http_client.get(url)
    # Raises TimeoutError after 30 seconds — clean cancellation
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['python-debug', 'python-project-scaffold'],
        prompt: `## Python-Specific Review Checklist
- [ ] All functions have complete type annotations (params + return type)
- [ ] \`from __future__ import annotations\` is present at the top of each module
- [ ] No bare \`except:\` or \`except Exception:\` without re-raise — catch specific types
- [ ] Error messages include context (what failed, which input)
- [ ] \`raise ... from err\` used to preserve exception chains
- [ ] No \`print()\` calls — use \`logging\` module for output
- [ ] No mutable default arguments (\`def f(items=[]):\`) — use \`None\` + assignment
- [ ] \`pathlib.Path\` used instead of \`os.path\` for file operations
- [ ] Context managers (\`with\`) used for all resource management (files, connections, locks)
- [ ] No deprecated typing imports (\`Optional\`, \`Union\`, \`List\`, \`Dict\`) — use modern syntax
- [ ] No \`eval()\`, \`exec()\`, \`pickle.loads()\` with untrusted data
- [ ] No \`subprocess.run(shell=True)\` with user-controlled input
- [ ] No \`os.system()\` calls — use \`subprocess.run()\` with arg list
- [ ] \`secrets\` module used for security tokens — not \`random\`
- [ ] Imports organized: stdlib -> third-party -> local, each group separated
- [ ] No wildcard imports (\`from x import *\`)
- [ ] f-strings used for string formatting — not \`%\` or \`+\` concatenation
- [ ] Docstrings present on all public functions, classes, and modules (PEP 257)
- [ ] \`__all__\` defined in \`__init__.py\` files for explicit public API`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Python Testing (pytest)
- Use pytest as the test runner — not unittest directly
- Use fixtures (\`@pytest.fixture\`) for setup/teardown and dependency injection
- Use \`conftest.py\` for shared fixtures — scoped appropriately (function, module, session)
- Use \`@pytest.mark.parametrize\` for testing multiple input/output combinations
- Use \`pytest.raises(ExceptionType, match="pattern")\` for error case testing
- Mock external dependencies with \`unittest.mock.patch\` or \`pytest-mock\` (\`mocker\` fixture)
- Use \`pytest-asyncio\` with \`@pytest.mark.asyncio\` for async function tests
- Use \`tmp_path\` fixture (built-in) for filesystem tests — never write to real paths
- Use \`monkeypatch\` fixture to override env vars, attributes, or dict items
- Name test functions descriptively: \`test_find_user_returns_none_when_not_found\`
- Test file location mirrors source: \`src/mypackage/service.py\` -> \`tests/unit/test_service.py\`
- Aim for Arrange-Act-Assert (AAA) pattern in every test
- Use \`freezegun\` or \`time-machine\` for time-dependent tests — never rely on real clock
- Use \`factory_boy\` or custom factories for complex test data — avoid hardcoded dicts`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Python-Specific Security Review
- [ ] No \`eval()\`, \`exec()\`, or \`compile()\` with any externally-influenced input
- [ ] No \`pickle.load()\` / \`pickle.loads()\` on untrusted data — use JSON, msgpack, or protobuf
- [ ] No \`yaml.load()\` without \`Loader=yaml.SafeLoader\` — always use \`yaml.safe_load()\`
- [ ] No \`subprocess.run(shell=True)\` or \`os.system()\` with user input — shell injection risk
- [ ] No \`random\` module for security-sensitive operations — use \`secrets\` module
- [ ] No \`md5\` or \`sha1\` for password hashing — use \`bcrypt\`, \`argon2\`, or \`scrypt\`
- [ ] No f-string or \`%\` formatting in SQL queries — use parameterized queries exclusively
- [ ] No \`xml.etree\` for untrusted XML — use \`defusedxml\` to prevent XXE
- [ ] No hardcoded secrets, API keys, or passwords in source code
- [ ] \`tempfile.mkstemp()\` or \`tempfile.NamedTemporaryFile()\` used instead of predictable temp paths
- [ ] File paths from user input validated and sandboxed (\`Path.resolve()\` + prefix check)
- [ ] Deserialization boundaries validate and sanitize all external data
- [ ] JWT tokens verified with proper algorithm constraints (no \`algorithms=["none"]\`)
- [ ] SSRF protection: validate URLs before making outbound requests`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['python-debug', 'python-project-scaffold'],
        prompt: `## Python-Specific Refactoring Patterns
- Replace manual dict construction with \`@dataclass\` or Pydantic \`BaseModel\`
- Replace \`os.path\` calls with \`pathlib.Path\` equivalents
- Replace \`Optional[X]\` / \`Union[X, Y]\` with \`X | None\` / \`X | Y\` syntax
- Replace bare string literals used as enums with \`enum.StrEnum\`
- Replace nested try/except chains with custom exception hierarchy + \`raise from\`
- Replace \`threading\` usage with \`asyncio\` when the workload is I/O-bound
- Replace manual resource cleanup with context managers (\`@contextmanager\`)
- Replace repeated isinstance checks with \`@singledispatch\` or \`match\`/\`case\` (Python 3.10+)
- Replace \`Dict[str, Any]\` return types with \`TypedDict\` for known schemas
- Replace class-based singletons with module-level instances or \`functools.cache\`
- Replace \`**kwargs: Any\` with \`TypedDict\` + \`Unpack\` (PEP 692, Python 3.12+)
- Move from setup.py/setup.cfg to \`pyproject.toml\` (PEP 621)`,
      },
    ],
    skills: [
      {
        name: 'python-debug',
        description: 'Python debugging workflows: breakpoints, pdb, debugpy, profiling',
        content: `# Python Debug Skill

## Interactive Debugging with pdb

### Setting Breakpoints
- Insert \`breakpoint()\` (Python 3.7+) at any point in code
- Or use \`import pdb; pdb.set_trace()\` for older versions
- Set \`PYTHONBREAKPOINT=0\` to disable all breakpoints in production

### Essential pdb Commands
| Command | Action |
|---------|--------|
| \`n\` (next) | Execute next line (step over) |
| \`s\` (step) | Step into function call |
| \`c\` (continue) | Continue to next breakpoint |
| \`r\` (return) | Continue until current function returns |
| \`p expr\` | Print expression value |
| \`pp expr\` | Pretty-print expression |
| \`l\` | List source around current line |
| \`ll\` | List entire current function |
| \`w\` | Print stack trace |
| \`u\` / \`d\` | Move up/down in stack frames |
| \`b file:line\` | Set breakpoint at location |
| \`condition N expr\` | Make breakpoint N conditional |

### Post-Mortem Debugging
- Run \`python -m pdb script.py\` to auto-enter debugger on crash
- In IPython/Jupyter, use \`%debug\` after an exception
- Use \`pdb.pm()\` in code after catching an exception

## Remote Debugging with debugpy (VS Code)
\`\`\`python
import debugpy
debugpy.listen(("0.0.0.0", 5678))
print("Waiting for debugger...")
debugpy.wait_for_client()
\`\`\`
Then attach VS Code with a "Python: Remote Attach" launch configuration.

## Profiling
- Use \`python -m cProfile -s cumtime script.py\` for CPU profiling
- Use \`py-spy top --pid PID\` for live profiling without code changes
- Use \`memray\` for memory profiling: \`python -m memray run script.py\`
- Use \`line_profiler\` with \`@profile\` decorator for line-by-line timing
- Use \`tracemalloc\` (stdlib) for tracking memory allocations
`,
      },
      {
        name: 'python-project-scaffold',
        description: 'Scaffold a new Python package with modern tooling (pyproject.toml, src layout, Ruff, mypy)',
        content: `# Python Project Scaffold Skill

## Scaffold Steps

### 1. Create Directory Structure
\`\`\`
project-name/
  pyproject.toml
  README.md
  src/
    package_name/
      __init__.py
      py.typed           # PEP 561 marker for type stubs
  tests/
    __init__.py
    conftest.py
    unit/
      __init__.py
    integration/
      __init__.py
\`\`\`

### 2. Minimal pyproject.toml
\`\`\`toml
[project]
name = "package-name"
version = "0.1.0"
description = "Short description"
requires-python = ">=3.11"
dependencies = []

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "pytest-asyncio>=0.23",
    "mypy>=1.10",
    "ruff>=0.4",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "A", "C4", "SIM", "TCH", "RUF"]

[tool.mypy]
python_version = "3.11"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
\`\`\`

### 3. Initial __init__.py
\`\`\`python
"""Package short description."""

from __future__ import annotations

__all__: list[str] = []
\`\`\`

### 4. conftest.py
\`\`\`python
"""Shared test fixtures."""

from __future__ import annotations

import pytest
\`\`\`

### 5. Install in Development Mode
\`\`\`bash
# With pip
pip install -e ".[dev]"

# With uv (faster)
uv pip install -e ".[dev]"
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
            command:
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.py$" && grep -nE "^(import pickle|from pickle import|eval\\(|exec\\(|os\\.system\\(|__import__\\()" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:1:Dangerous Python pattern detected (pickle/eval/exec/os.system) — use safe alternatives" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.py$" && grep -nE "(yaml\\.load\\(|yaml\\.unsafe_load\\()" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:1:Unsafe YAML loading detected — use yaml.safe_load() instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.py$" && grep -nE "subprocess\\.(run|call|Popen)\\(.*shell\\s*=\\s*True" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:0:Warning: subprocess with shell=True detected — verify no user input reaches the command" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.py$" && grep -cE "^def [a-zA-Z_]+\\([^)]*\\)\\s*:" "$CLAUDE_FILE_PATH" | grep -qvE "^0$" && grep -nE "^def [a-zA-Z_]+\\([^)]*\\)\\s*:" "$CLAUDE_FILE_PATH" && echo "HOOK_EXIT:0:Warning: function(s) without return type annotation detected — add -> ReturnType" || true',
            timeout: 10,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'ruff',
        filePath: 'pyproject.toml',
        mergeStrategy: 'create-only',
        config: {
          '[tool.ruff]': {
            'line-length': 88,
            'target-version': 'py311',
          },
          '[tool.ruff.lint]': {
            select: [
              'E',    // pycodestyle errors
              'F',    // pyflakes
              'W',    // pycodestyle warnings
              'I',    // isort
              'N',    // pep8-naming
              'UP',   // pyupgrade
              'B',    // bugbear
              'A',    // flake8-builtins
              'C4',   // flake8-comprehensions
              'SIM',  // flake8-simplify
              'TCH',  // flake8-type-checking
              'RUF',  // ruff-specific rules
              'S',    // flake8-bandit (security)
              'PT',   // flake8-pytest-style
              'RET',  // flake8-return
              'ARG',  // flake8-unused-arguments
              'PTH',  // flake8-use-pathlib
            ],
            ignore: [
              'E501',   // line too long (handled by formatter)
              'S101',   // assert used (valid in tests)
            ],
          },
          '[tool.ruff.lint.isort]': {
            'known-first-party': [],
          },
          '[tool.ruff.lint.per-file-ignores]': {
            '"tests/**/*.py"': ['S101', 'ARG'],
          },
          '[tool.ruff.format]': {
            'quote-style': 'double',
            'indent-style': 'space',
          },
        },
      },
    ],
  },
};
