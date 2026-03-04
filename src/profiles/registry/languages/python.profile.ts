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

## Naming Conventions (PEP 8)

| Element | Convention | Example |
|---------|-----------|---------|
| Variables, functions | snake_case | \`user_count\`, \`get_active_users()\` |
| Constants | UPPER_SNAKE_CASE | \`MAX_RETRIES\`, \`DEFAULT_TIMEOUT\` |
| Classes | PascalCase | \`UserService\`, \`HTTPClient\` |
| Type variables | PascalCase, short | \`T\`, \`KT\`, \`VT\`, \`ResponseT\` |
| Private attributes | single leading underscore | \`_internal_cache\` |
| Module-level dunder | double underscore both sides | \`__all__\`, \`__version__\` |

## Type Hints (PEP 484 / PEP 604)

- Every function must have parameter types AND return type annotated
- Use \`-> None\` explicitly for functions that return nothing
- Use \`from __future__ import annotations\` for forward reference support
- Use \`X | None\` instead of \`Optional[X]\`, \`X | Y\` instead of \`Union[X, Y]\`
- Use \`collections.abc\` types (\`Sequence\`, \`Mapping\`) over \`typing\` equivalents
- Use \`TypeAlias\` for complex type aliases, \`TypedDict\` for typed dictionaries

## Docstrings (PEP 257)

- Every public module, class, and function must have a docstring
- Use triple double quotes (\`"""..."""\`), Google-style or NumPy-style consistently
- One-line docstrings on same line; multi-line: summary, blank line, details
- Include Args, Returns, Raises sections for public functions

## Error Handling

- Catch specific exception types — never bare \`except:\` or \`except Exception:\` without re-raising
- Define custom exceptions inheriting from a project-level base exception
- Include context in error messages: what failed, which input, what state
- Use \`raise ... from err\` to preserve the exception chain
- Use \`logging\` module — never \`print()\` in production code

## Project Structure

- Use src layout (\`src/mypackage/\`) with \`pyproject.toml\` (PEP 621)
- Define \`__all__\` in \`__init__.py\` for explicit public API
- Separate concerns: models, services, repositories, API in distinct modules
- Keep \`__init__.py\` files minimal — no business logic

## Security

- NEVER use \`eval()\`, \`exec()\`, \`compile()\` with untrusted input
- NEVER use \`pickle\` to deserialize untrusted data — use JSON or Protobuf
- NEVER use \`os.system()\` or \`subprocess.run(shell=True)\` with user input
- Use \`subprocess.run()\` with a list of args (not shell string)
- Use \`secrets\` module for cryptographic randomness — not \`random\`
- Use \`hashlib\` with \`sha256\`+ — never \`md5\` or \`sha1\` for security
- Use \`defusedxml\` for XML parsing to prevent XXE attacks
- Use parameterized queries — never f-string or \`%\` formatting for SQL
`,
      },
      {
        path: 'python/typing-and-patterns.md',
        paths: ['**/*.py'],
        governance: 'recommended',
        description: 'Advanced Python type hints, protocols, and modern patterns',
        content: `# Python Type Hints & Modern Patterns

## Type Checking Configuration

- Enable strict mode in mypy (\`strict = true\`) or pyright (\`typeCheckingMode = "strict"\`)
- Use \`disallow_untyped_defs\`, \`warn_return_any\`, \`warn_unreachable\` in mypy
- Add \`[[tool.mypy.overrides]]\` for third-party libs missing type stubs

## Advanced Type Patterns

- **Protocol**: Use for structural subtyping (duck typing with safety). Prefer over ABC when only interface matters
- **TypeVar**: Use for generic functions: \`T = TypeVar("T")\`
- **Overload**: Use \`@overload\` to express multiple call signatures for the same function
- **TypedDict**: Use for typed dictionaries with known keys (replaces \`Dict[str, Any]\`)
- **Literal**: Use for constrained string/int values: \`Literal["DEBUG", "INFO"]\`
- **Final**: Use for immutable bindings: \`MAX_CONNECTIONS: Final = 100\`
- **Unpack + TypedDict**: Use for typed \`**kwargs\` (PEP 692, Python 3.12+)

## Dataclasses vs Pydantic

- Use \`@dataclass(frozen=True, slots=True)\` for internal immutable data
- Use \`@dataclass(slots=True)\` with \`field(default_factory=...)\` for mutable containers
- Use Pydantic \`BaseModel\` for external data that needs validation (API input, config files)
- Use \`field_validator\` for custom validation logic on Pydantic models

## Context Managers

- Use \`with\` / \`async with\` for all resource management (files, connections, locks)
- Use \`@contextmanager\` / \`@asynccontextmanager\` for custom context managers
- Any object needing deterministic cleanup should be a context manager

## Dependency Injection

- Use \`Protocol\` to define service interfaces for dependency injection
- Accept dependencies as constructor parameters — not global state
- Inject \`Protocol\`-typed abstractions, not concrete implementations

## Performance Patterns

- Use generators (\`yield\`) for large data — process one item at a time, constant memory
- Use \`@dataclass(slots=True)\` or manual \`__slots__\` for memory-efficient classes
- Use \`functools.lru_cache\` / \`functools.cache\` for memoization of pure functions
- Use \`collections.abc\` types for function signatures (\`Sequence\`, \`Mapping\`, \`Iterable\`)
`,
      },
      {
        path: 'python/async-patterns.md',
        paths: ['**/*.py'],
        governance: 'recommended',
        description: 'Python async/await patterns and structured concurrency',
        content: `# Python Async Patterns

## Structured Concurrency (Python 3.11+)

- Use \`asyncio.TaskGroup\` for concurrent tasks — all complete or all cancel on first exception
- Prefer \`TaskGroup\` over \`asyncio.gather\` for safer error propagation
- Never use bare \`create_task()\` without tracking the task reference

## Async Context Managers

- Use \`@asynccontextmanager\` for async resource management (connections, sessions)
- Always \`await conn.close()\` in \`finally\` blocks
- Use \`async with\` for all async resources

## Blocking Code in Async Context

- NEVER call blocking I/O (file reads, \`time.sleep\`, sync HTTP) inside async functions
- Offload blocking I/O to thread pool: \`await asyncio.to_thread(blocking_func)\`
- Use \`run_in_executor\` for more control over the thread pool

## Timeout and Cancellation

- Use \`async with asyncio.timeout(seconds):\` for clean timeout handling (Python 3.11+)
- Handle \`TimeoutError\` explicitly at the caller
- Respect cancellation — check \`asyncio.current_task().cancelled()\` in long loops

## Anti-Patterns

- Never block the event loop with synchronous I/O
- Never use \`asyncio.gather\` without understanding \`return_exceptions\` behavior
- Never mix completion callbacks and async/await in the same API layer
- Never ignore the return value of \`create_task()\` — store it to prevent GC
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
        name: 'python-typing-guide',
        description: 'Detailed reference for Python type hints, protocols, generics, and advanced type patterns',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Python Type Hints — Detailed Reference

## Why This Matters
Type hints catch bugs at development time, serve as executable documentation,
and enable IDE autocompletion. These patterns follow PEP 484, PEP 604, PEP 612,
PEP 681, PEP 692, and the mypy/pyright documentation.

---

## Modern Syntax (Python 3.10+)

### Use union syntax instead of Optional/Union
\\\`\\\`\\\`python
# Correct: modern syntax
def find_user(user_id: str) -> User | None:
    ...

def parse_value(raw: str) -> int | float | str:
    ...
\\\`\\\`\\\`

\\\`\\\`\\\`python
# Anti-Pattern: deprecated typing imports
from typing import Optional, Union

def find_user(user_id: str) -> Optional[User]:  # Use User | None
    ...

def parse_value(raw: str) -> Union[int, float, str]:  # Use int | float | str
    ...
\\\`\\\`\\\`

---

## Protocol — Structural Subtyping (Duck Typing with Safety)

Use Protocol when you need interface-like behavior without inheritance:

\\\`\\\`\\\`python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Serializable(Protocol):
    def to_dict(self) -> dict[str, Any]: ...
    def from_dict(cls, data: dict[str, Any]) -> Self: ...

# Any class with these methods satisfies Serializable — no inheritance needed
class User:
    def to_dict(self) -> dict[str, Any]:
        return {"name": self.name, "email": self.email}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        return cls(name=data["name"], email=data["email"])

def save(entity: Serializable) -> None:
    data = entity.to_dict()  # Type-safe — mypy knows to_dict exists
    ...
\\\`\\\`\\\`

### When to use Protocol vs ABC
- **Protocol**: when you want structural subtyping (duck typing) — no inheritance required
- **ABC**: when you want to enforce implementation via inheritance and share base logic

---

## TypedDict — Typed Dictionaries

Use TypedDict for dictionaries with known keys (replaces Dict[str, Any]):

\\\`\\\`\\\`python
from typing import TypedDict, NotRequired

class UserProfile(TypedDict):
    name: str
    email: str
    age: int
    bio: NotRequired[str]  # Optional key

def create_profile(data: UserProfile) -> None:
    name = data["name"]  # Type-safe: str
    bio = data.get("bio", "")  # Type-safe: str
\\\`\\\`\\\`

---

## Generics

### TypeVar for generic functions
\\\`\\\`\\\`python
from typing import TypeVar

T = TypeVar("T")

def first(items: Sequence[T]) -> T | None:
    return items[0] if items else None

# Usage: first([1, 2, 3]) returns int | None
#        first(["a", "b"]) returns str | None
\\\`\\\`\\\`

### Generic classes (Python 3.12+ syntax)
\\\`\\\`\\\`python
# Python 3.12+: native syntax
class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

# Pre-3.12: TypeVar syntax
from typing import Generic, TypeVar
T = TypeVar("T")

class Stack(Generic[T]):
    ...
\\\`\\\`\\\`

### Bounded TypeVar
\\\`\\\`\\\`python
from typing import TypeVar

Numeric = TypeVar("Numeric", int, float)

def add(a: Numeric, b: Numeric) -> Numeric:
    return a + b
\\\`\\\`\\\`

---

## Overload — Multiple Call Signatures

\\\`\\\`\\\`python
from typing import overload, Literal

@overload
def fetch(url: str, *, as_json: Literal[True]) -> dict: ...
@overload
def fetch(url: str, *, as_json: Literal[False] = ...) -> str: ...

def fetch(url: str, *, as_json: bool = False) -> dict | str:
    response = httpx.get(url)
    if as_json:
        return response.json()
    return response.text
\\\`\\\`\\\`

---

## Literal, Final, and NewType

\\\`\\\`\\\`python
from typing import Literal, Final, NewType

# Literal: constrained values
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]

def set_level(level: LogLevel) -> None: ...
set_level("DEBUG")  # OK
set_level("TRACE")  # Type error

# Final: immutable bindings
MAX_RETRIES: Final = 3

# NewType: distinct types for domain concepts
UserId = NewType("UserId", str)
OrderId = NewType("OrderId", str)

def get_user(user_id: UserId) -> User: ...
get_user(UserId("abc"))   # OK
get_user(OrderId("xyz"))  # Type error — different type
\\\`\\\`\\\`

---

## ParamSpec and Concatenate (PEP 612)

For decorators that preserve the original function's signature:

\\\`\\\`\\\`python
from typing import ParamSpec, Callable, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

def retry(max_attempts: int = 3) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == max_attempts - 1:
                        raise
            raise RuntimeError("unreachable")
        return wrapper
    return decorator

@retry(max_attempts=3)
def fetch_data(url: str, timeout: int = 30) -> dict:
    ...
# fetch_data preserves its original signature for type checkers
\\\`\\\`\\\`

---

## Type Narrowing

\\\`\\\`\\\`python
from typing import TypeGuard

def is_string_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(item, str) for item in val)

def process(items: list[object]) -> None:
    if is_string_list(items):
        # Type checker now knows items is list[str]
        print(", ".join(items))
\\\`\\\`\\\`
`,
      },
      {
        name: 'python-async-guide',
        description: 'Detailed reference for Python async/await patterns, TaskGroup, and structured concurrency',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Python Async Patterns — Detailed Reference

## Why This Matters
Async Python unlocks massive I/O concurrency, but incorrect usage causes
event loop blocking, resource leaks, and subtle bugs. These patterns follow
the asyncio documentation, PEP 654 (ExceptionGroup), and Python 3.11+ best practices.

---

## TaskGroup — Structured Concurrency (Python 3.11+)

TaskGroup is the preferred pattern for concurrent tasks. All tasks complete or all cancel on first exception.

### Correct
\\\`\\\`\\\`python
async def fetch_all(urls: list[str]) -> list[Response]:
    results: list[Response] = [None] * len(urls)  # type: ignore[list-item]

    async with asyncio.TaskGroup() as tg:
        for i, url in enumerate(urls):
            async def fetch(idx: int = i, u: str = url) -> None:
                results[idx] = await http_get(u)
            tg.create_task(fetch())

    return results
\\\`\\\`\\\`

### Anti-Pattern: gather without error handling
\\\`\\\`\\\`python
# BAD: if one task fails, results are mixed with exceptions
results = await asyncio.gather(*tasks, return_exceptions=True)
# You must manually check each result for exceptions — easy to forget
\\\`\\\`\\\`

---

## Blocking Code in Async Context

NEVER call blocking I/O inside async functions — it freezes the entire event loop.

### Correct: offload to thread pool
\\\`\\\`\\\`python
import asyncio

async def read_file(path: str) -> str:
    # Offload blocking file I/O to a thread
    return await asyncio.to_thread(Path(path).read_text)

async def cpu_intensive(data: bytes) -> bytes:
    # Offload CPU-bound work to a thread
    return await asyncio.to_thread(compress, data)
\\\`\\\`\\\`

### Anti-Pattern: blocking the event loop
\\\`\\\`\\\`python
async def read_file(path: str) -> str:
    # BAD: blocks the entire event loop while reading
    return Path(path).read_text()

async def wait() -> None:
    # BAD: blocks the event loop — use asyncio.sleep instead
    time.sleep(5)
\\\`\\\`\\\`

---

## Timeout and Cancellation

### asyncio.timeout (Python 3.11+)
\\\`\\\`\\\`python
async def fetch_with_timeout(url: str) -> Response:
    async with asyncio.timeout(10):
        return await http_get(url)
    # Raises TimeoutError if 10 seconds exceeded
\\\`\\\`\\\`

### Cancellation-aware loops
\\\`\\\`\\\`python
async def process_queue(queue: asyncio.Queue[Job]) -> None:
    while True:
        try:
            job = await asyncio.wait_for(queue.get(), timeout=30)
            await process(job)
        except asyncio.TimeoutError:
            continue  # No job in 30s, check again
        except asyncio.CancelledError:
            # Clean up before exiting
            logger.info("Worker cancelled, draining queue")
            raise  # Always re-raise CancelledError
\\\`\\\`\\\`

---

## Async Context Managers

\\\`\\\`\\\`python
from contextlib import asynccontextmanager

@asynccontextmanager
async def db_connection(dsn: str):
    conn = await asyncpg.connect(dsn)
    try:
        yield conn
    finally:
        await conn.close()

# Usage
async def query_users() -> list[User]:
    async with db_connection(DATABASE_URL) as conn:
        rows = await conn.fetch("SELECT * FROM users")
        return [User(**row) for row in rows]
\\\`\\\`\\\`

---

## Async Generators

\\\`\\\`\\\`python
async def paginate(url: str) -> AsyncIterator[list[dict]]:
    """Yield pages of results from a paginated API."""
    next_url: str | None = url
    while next_url:
        response = await http_get(next_url)
        data = response.json()
        yield data["results"]
        next_url = data.get("next")

# Usage
async for page in paginate("/api/users"):
    for user in page:
        await process_user(user)
\\\`\\\`\\\`

---

## Semaphore — Concurrency Limiting

\\\`\\\`\\\`python
async def fetch_all_limited(urls: list[str], max_concurrent: int = 10) -> list[Response]:
    semaphore = asyncio.Semaphore(max_concurrent)
    results: list[Response] = []

    async def fetch(url: str) -> Response:
        async with semaphore:
            return await http_get(url)

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch(url)) for url in urls]

    return [task.result() for task in tasks]
\\\`\\\`\\\`

---

## Event and Queue Patterns

### asyncio.Event — signaling between coroutines
\\\`\\\`\\\`python
ready = asyncio.Event()

async def producer():
    await setup()
    ready.set()  # Signal that setup is complete

async def consumer():
    await ready.wait()  # Block until producer signals
    await do_work()
\\\`\\\`\\\`

### asyncio.Queue — producer/consumer
\\\`\\\`\\\`python
async def producer(queue: asyncio.Queue[Job]) -> None:
    for job in generate_jobs():
        await queue.put(job)
    await queue.put(None)  # Sentinel to signal done

async def consumer(queue: asyncio.Queue[Job | None]) -> None:
    while True:
        job = await queue.get()
        if job is None:
            break
        await process(job)
        queue.task_done()
\\\`\\\`\\\`

---

## Common Anti-Patterns

1. **Fire-and-forget tasks**: Always store task references — GC can collect unfinished tasks
\\\`\\\`\\\`python
# BAD
asyncio.create_task(send_email(user))  # Task may be garbage collected

# CORRECT
background_tasks: set[asyncio.Task] = set()
task = asyncio.create_task(send_email(user))
background_tasks.add(task)
task.add_done_callback(background_tasks.discard)
\\\`\\\`\\\`

2. **Mixing sync and async**: Never call \\\`asyncio.run()\\\` from inside an async function
3. **Ignoring CancelledError**: Always re-raise it after cleanup
`,
      },
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "^(import pickle|from pickle import|eval\\(|exec\\(|os\\.system\\(|__import__\\()" "$FILE_PATH" && { echo "Dangerous Python pattern detected (pickle/eval/exec/os.system) — use safe alternatives" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for dangerous Python patterns',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "(yaml\\.load\\(|yaml\\.unsafe_load\\()" "$FILE_PATH" && { echo "Unsafe YAML loading detected — use yaml.safe_load() instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for unsafe YAML loading',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "subprocess\\.(run|call|Popen)\\(.*shell\\s*=\\s*True" "$FILE_PATH" && { echo "Warning: subprocess with shell=True detected — verify no user input reaches the command" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for subprocess shell=True usage',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -cE "^def [a-zA-Z_]+\\([^)]*\\)\\s*:" "$FILE_PATH" | grep -qvE "^0$" && grep -nE "^def [a-zA-Z_]+\\([^)]*\\)\\s*:" "$FILE_PATH" && { echo "Warning: function(s) without return type annotation detected — add -> ReturnType" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for missing return type annotations',
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
