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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "^(import pickle|from pickle import|eval\\(|exec\\(|os\\.system\\(|__import__\\()" "$FILE_PATH" && { echo "Dangerous Python pattern detected (pickle/eval/exec/os.system) — use safe alternatives" >&2; exit 2; } || exit 0',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "(yaml\\.load\\(|yaml\\.unsafe_load\\()" "$FILE_PATH" && { echo "Unsafe YAML loading detected — use yaml.safe_load() instead" >&2; exit 2; } || exit 0',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -nE "subprocess\\.(run|call|Popen)\\(.*shell\\s*=\\s*True" "$FILE_PATH" && { echo "Warning: subprocess with shell=True detected — verify no user input reaches the command" >&2; exit 2; } || exit 0',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.py$" && grep -cE "^def [a-zA-Z_]+\\([^)]*\\)\\s*:" "$FILE_PATH" | grep -qvE "^0$" && grep -nE "^def [a-zA-Z_]+\\([^)]*\\)\\s*:" "$FILE_PATH" && { echo "Warning: function(s) without return type annotation detected — add -> ReturnType" >&2; exit 2; } || exit 0',
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
