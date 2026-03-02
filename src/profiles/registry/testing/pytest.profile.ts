import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const pytestProfile: Profile = {
  id: 'testing/pytest',
  name: 'Pytest',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['pytest'],
  contributions: {
    claudeMd: [
      {
        heading: 'Pytest Testing Conventions',
        order: 3000,
        content: `## Pytest Testing Conventions

### Test Structure & Organization
- Place tests in a top-level \`tests/\` directory mirroring \`src/\` structure — one test file per source module
- Use \`test_*.py\` naming convention for test files and \`test_*\` for test functions
- Use classes (\`Test*\`) only for logical grouping — never for shared mutable state; prefer plain functions
- Use subdirectories for \`unit/\`, \`integration/\`, and \`e2e/\` separation with their own \`conftest.py\`
- Follow Arrange-Act-Assert (AAA) pattern in every test — clearly separate setup, execution, and verification
- Use descriptive test names: \`test_should_return_404_when_user_does_not_exist\`
- Use \`pytest.skip()\`, \`pytest.xfail()\`, or \`@pytest.mark.skip\` for planned but incomplete tests — never leave empty test bodies

### Fixtures
- Define shared fixtures in \`conftest.py\` at the appropriate directory level — pytest discovers them automatically, never import from conftest directly
- Use \`scope\` parameter wisely: \`function\` (default) for full isolation, \`class\`, \`module\`, \`package\`, \`session\` for expensive shared resources
- Use \`yield\` fixtures for setup/teardown: code before \`yield\` is setup, code after is teardown (runs even if test fails)
- Prefer factory fixtures (fixtures returning a callable) for creating test data with customizable parameters
- Use \`autouse=True\` sparingly — only for truly universal setup like resetting global state or database transactions
- Use \`request\` fixture to access test context: \`request.param\` for parametrized fixtures, \`request.node\` for test metadata
- Use \`@pytest.fixture(params=[...])\` to parametrize fixtures — all dependent tests run once per parameter value

### Built-in Fixtures
- \`tmp_path\` — \`pathlib.Path\` to a unique temporary directory per test (prefer over deprecated \`tmpdir\`)
- \`tmp_path_factory\` — session-scoped factory for creating temporary directories
- \`capsys\` — captures \`sys.stdout\` / \`sys.stderr\`; access via \`capsys.readouterr()\` returning \`(out, err)\`
- \`capfd\` — captures file descriptors 1 and 2 (includes subprocess output)
- \`caplog\` — captures log records; access \`.records\`, \`.text\`, \`.messages\`; use \`with caplog.at_level(logging.WARNING)\`
- \`monkeypatch\` — temporarily modifies attributes, dict items, env vars; methods: \`setattr\`, \`delattr\`, \`setitem\`, \`delitem\`, \`setenv\`, \`delenv\`, \`syspath_prepend\`, \`chdir\`
- \`recwarn\` — records warnings; use \`recwarn.pop(DeprecationWarning)\` to assert specific warnings
- \`request\` — provides information about the requesting test function and fixture parameters

### Parametrize
- Use \`@pytest.mark.parametrize("arg1,arg2", [(val1, val2), ...])\` for data-driven tests with multiple input/output combinations
- Provide descriptive \`ids\` for parametrized cases: \`@pytest.mark.parametrize("email,valid", [...], ids=["valid-email", "missing-at"])\`
- Stack multiple \`@pytest.mark.parametrize\` decorators for combinatorial (cross-product) testing
- Use \`pytest.param(..., marks=pytest.mark.xfail)\` to mark individual parametrized cases as expected failures
- Use \`pytest.param(..., id="descriptive-name")\` for individual case IDs within the argvalues list
- Use \`indirect=True\` to route parametrize values through a fixture before reaching the test

### Markers
- Register custom markers in \`pyproject.toml\` under \`[tool.pytest.ini_options] markers\` to avoid \`PytestUnknownMarkWarning\`
- \`@pytest.mark.skip(reason="...")\` — unconditionally skip a test with a reason
- \`@pytest.mark.skipif(condition, reason="...")\` — skip conditionally (e.g., platform, Python version, dependency availability)
- \`@pytest.mark.xfail(reason="...")\` — expect a failure; test passes if it fails, reports \`XPASS\` if it unexpectedly passes
- \`@pytest.mark.usefixtures("fixture_name")\` — apply fixtures to a test class without requesting them as parameters
- Use custom markers like \`@pytest.mark.slow\`, \`@pytest.mark.integration\` for selective test execution with \`-m\`
- Run marker expressions: \`pytest -m "not slow"\`, \`pytest -m "integration and not flaky"\`

### Assertions & Exception Testing
- Use plain \`assert\` statements — pytest rewrites them to show detailed failure context with introspection
- Add descriptive messages for complex assertions: \`assert result > 0, f"Expected positive result, got {result}"\`
- Use \`pytest.raises(ExceptionType)\` as context manager for exception testing; access \`.value\`, \`.type\`, \`.traceback\`
- Use \`match\` parameter for regex matching: \`with pytest.raises(ValueError, match=r"invalid.*email")\`
- Use \`pytest.warns(WarningType)\` to assert warnings are raised
- Use \`pytest.approx(expected, rel=1e-6)\` for floating-point comparisons — works with floats, sequences, dicts

### Async Testing
- Use \`pytest-asyncio\` plugin — decorate async tests with \`@pytest.mark.asyncio\` or set \`asyncio_mode = "auto"\` in config
- Use \`@pytest_asyncio.fixture\` for async fixtures (yields async resources)
- Configure the event loop scope: \`asyncio_default_fixture_loop_scope = "function"\` in \`pyproject.toml\`

### Mocking with pytest-mock
- Use the \`mocker\` fixture (from \`pytest-mock\`) for clean mocking — wraps \`unittest.mock\` with automatic cleanup
- \`mocker.patch("module.Class.method")\` — replaces target with MagicMock, auto-restored after test
- \`mocker.patch.object(obj, "method")\` — patches attribute on a live object
- \`mocker.spy(obj, "method")\` — wraps method to track calls while preserving original implementation
- \`mocker.MagicMock(spec=MyClass)\` — create spec-constrained mocks that error on non-existent attribute access
- \`mocker.patch.dict(os.environ, {"KEY": "value"})\` — temporarily modify dictionaries
- Prefer \`monkeypatch\` for simple attribute/env overrides; use \`mocker\` for call tracking and return value configuration

### Coverage & Plugins
- Use \`pytest-cov\` for coverage: \`pytest --cov=src --cov-report=term-missing --cov-report=html\`
- Enforce coverage thresholds: \`pytest --cov=src --cov-fail-under=80\`
- Use \`pytest-xdist\` for parallel execution: \`pytest -n auto\` distributes across CPU cores
- Use \`pytest-randomly\` to detect order-dependent tests by shuffling test execution order
- Use \`pytest-timeout\` to enforce time limits: \`@pytest.mark.timeout(10)\` or global \`timeout = 30\` in config
- Use \`# pragma: no cover\` sparingly with a justification comment for intentionally uncovered lines

### Configuration
- Configure pytest in \`pyproject.toml\` under \`[tool.pytest.ini_options]\` (preferred over \`pytest.ini\` or \`setup.cfg\`)
- Use \`addopts\` to set default CLI options: \`addopts = "-ra -q --strict-markers --strict-config"\`
- Use \`testpaths = ["tests"]\` to scope test discovery to the tests directory
- Use \`pythonpath = ["src"]\` to make source packages importable without installation
- Use \`filterwarnings\` to control warning behavior: \`filterwarnings = ["error", "ignore::DeprecationWarning:third_party_lib"]\`
- Use \`--strict-markers\` (via \`addopts\`) to error on unregistered markers, preventing typos

### Common Anti-Patterns to Avoid
- Using \`unittest.TestCase\` setUp/tearDown instead of pytest fixtures — fixtures are more flexible and composable
- Importing from \`conftest.py\` directly — pytest handles fixture injection automatically by name
- Tests that depend on execution order or share mutable global state — each test must be independent
- Over-mocking: mocking everything means you test nothing — mock only external boundaries (network, DB, filesystem)
- Using \`time.sleep()\` in tests — use \`monkeypatch\` to control time or mock the time-dependent calls
- Empty \`except\` blocks in test code — always assert the specific exception with \`pytest.raises\`
- Using \`assert True\` or \`assert result\` without checking the actual value — assert specific expected outcomes`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(pytest:*)',
          'Bash(python -m pytest:*)',
          'Bash(python3 -m pytest:*)',
          'Bash(pytest --cov:*)',
          'Bash(pytest -x:*)',
          'Bash(pytest -k:*)',
          'Bash(pytest -m:*)',
          'Bash(pytest -n:*)',
          'Bash(pytest --lf:*)',
          'Bash(pytest --ff:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/pytest-conventions.md',
        governance: 'mandatory',
        description: 'Pytest testing conventions and best practices — mandatory rules for fixtures, assertions, mocking, parametrize, and test structure',
        content: `# Pytest Testing Conventions

## Test Structure
- Place tests in a top-level \`tests/\` directory mirroring \`src/\` structure
- Use \`test_*.py\` for test files and \`test_*\` for test functions
- Use \`Test*\` classes only for logical grouping — never for shared mutable state
- Follow Arrange-Act-Assert (AAA) pattern in every test
- Use descriptive test names: \`test_should_raise_validation_error_when_email_is_empty\`
- Separate \`unit/\`, \`integration/\`, and \`e2e/\` tests into subdirectories

## Fixtures Rules
- Define shared fixtures in \`conftest.py\` — pytest discovers them automatically
- NEVER import from \`conftest.py\` directly — fixture injection is by name, not import
- Use the narrowest fixture scope that meets the need:
  - \`function\` (default): full isolation per test — preferred for unit tests
  - \`class\`: shared across a test class
  - \`module\`: shared across a test file
  - \`session\`: shared across the entire test run — use for expensive resources (DB connections, API clients)
- Use \`yield\` fixtures for setup/teardown patterns:
  \`\`\`python
  @pytest.fixture
  def db_connection():
      conn = create_connection()
      yield conn
      conn.close()
  \`\`\`
- Use factory fixtures to create test data with customizable parameters:
  \`\`\`python
  @pytest.fixture
  def make_user():
      def _make_user(name="test", role="viewer"):
          return User(name=name, role=role)
      return _make_user
  \`\`\`
- Use \`autouse=True\` only for truly universal setup (database rollback, global state reset)
- Use \`@pytest.fixture(params=[...])\` to parametrize fixtures — provides each param to all dependent tests

## Assertion Rules
- Use plain \`assert\` statements — pytest rewrites them for detailed introspection output
- Use \`pytest.raises(ExceptionType)\` as context manager for exception testing
- Use \`match\` parameter for regex: \`with pytest.raises(ValueError, match=r"invalid")\`
- Use \`pytest.approx()\` for floating-point comparisons: \`assert result == pytest.approx(3.14, rel=1e-3)\`
- Use \`pytest.warns(WarningType)\` to assert that specific warnings are raised
- Never use bare \`assert True\` or \`assert result\` — always assert specific expected values

## Mocking Rules
- Use the \`mocker\` fixture (pytest-mock) — it auto-restores all patches after each test
- \`mocker.patch("module.path.to.target")\` for replacing functions or classes with MagicMock
- \`mocker.patch.object(instance, "method")\` for patching specific object attributes
- \`mocker.spy(obj, "method")\` to track calls while preserving original implementation
- Use \`monkeypatch\` for simple attribute/env overrides without call tracking
- ALWAYS patch at the point of use (where the name is looked up), not where it is defined:
  \`\`\`python
  # If module_a.py does: from module_b import func
  # Patch in module_a, not module_b:
  mocker.patch("module_a.func")
  \`\`\`

## Parametrize Rules
- Use \`@pytest.mark.parametrize\` for data-driven tests — avoid duplicating test bodies
- Provide descriptive \`ids\` for readability: \`ids=["valid-email", "missing-at-symbol", "empty-string"]\`
- Use \`pytest.param(..., marks=pytest.mark.xfail)\` to mark individual cases as expected failures
- Stack multiple \`@pytest.mark.parametrize\` decorators for cross-product combinations

## Markers Rules
- Register ALL custom markers in \`pyproject.toml\` to avoid \`PytestUnknownMarkWarning\`
- Use \`--strict-markers\` in \`addopts\` to error on unregistered markers
- Use marker expressions for selective execution: \`pytest -m "not slow and not integration"\`

## Async Testing Rules
- Use \`pytest-asyncio\` for async test support
- Decorate async tests with \`@pytest.mark.asyncio\` or set \`asyncio_mode = "auto"\` in config
- Use \`@pytest_asyncio.fixture\` for async fixtures that need \`await\` or \`async with\`

## Coverage Requirements
- Enforce coverage thresholds: \`pytest --cov=src --cov-fail-under=80\`
- Focus on meaningful coverage: edge cases, error paths, boundary conditions — not just line count
- Use \`--cov-report=term-missing\` to identify uncovered lines
- Use \`# pragma: no cover\` only with a documented justification

## Anti-Patterns
- Using \`unittest.TestCase\` patterns (setUp/tearDown) — use pytest fixtures instead
- Tests that depend on execution order or share mutable state — each test runs independently
- Over-mocking: mock only external boundaries (network, DB, filesystem), not internal logic
- Using \`time.sleep()\` in tests — mock time-dependent code or use \`monkeypatch\`
- Empty except blocks — always use \`pytest.raises\` to assert specific exceptions
- Importing from conftest.py — let pytest handle fixture injection automatically
`,
      },
      {
        path: 'testing/pytest-configuration.md',
        governance: 'recommended',
        description: 'Pytest configuration best practices and recommended pyproject.toml settings',
        content: `# Pytest Configuration Best Practices

## Recommended pyproject.toml Configuration
\`\`\`toml
[tool.pytest.ini_options]
# Default CLI options: verbose summary, strict marker enforcement
addopts = "-ra -q --strict-markers --strict-config"

# Test discovery paths
testpaths = ["tests"]

# Make src/ importable without pip install
pythonpath = ["src"]

# Minimum Python version for compat
minversion = "7.0"

# Register custom markers
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests requiring external services",
    "e2e: marks end-to-end tests",
]

# Warning filters: treat warnings as errors except known third-party
filterwarnings = [
    "error",
    "ignore::DeprecationWarning:third_party_lib.*",
]

# Async mode for pytest-asyncio
asyncio_mode = "auto"
\`\`\`

## Coverage Configuration (pyproject.toml)
\`\`\`toml
[tool.coverage.run]
source = ["src"]
branch = true
omit = ["tests/*", "*/migrations/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.:",
    "@overload",
]
\`\`\`

## conftest.py Organization
- Root \`conftest.py\`: shared fixtures, global hooks, plugin configuration, custom markers
- Package-level \`conftest.py\`: domain-specific fixtures scoped to that test subdirectory
- Fixtures in child conftest.py can override parent fixtures by using the same name
- Use conftest.py for \`pytest_configure\` hooks and custom assertion helpers

## Parallel Execution (pytest-xdist)
- \`pytest -n auto\` — distribute tests across all CPU cores
- \`pytest -n 4\` — use exactly 4 workers
- Ensure tests are fully isolated — no shared files, databases, or ports without proper scoping
- Use \`tmp_path\` instead of hardcoded paths to avoid worker conflicts
- Use \`worker_id\` fixture from xdist to create unique resources per worker

## Performance Tips
- Use \`--lf\` (last failed) to re-run only tests that failed in the previous run
- Use \`--ff\` (failed first) to run failing tests first, then the rest
- Use \`-x\` to stop after first failure for fast feedback during development
- Use \`-k "expression"\` to run only tests matching a name pattern
- Use \`pytest-timeout\` with \`timeout = 30\` to prevent hanging tests
- Use \`--co\` (collect only) to verify test discovery without running tests
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Pytest-Specific Review Checklist
- Verify pytest fixtures are used instead of unittest setUp/tearDown patterns
- Check that \`conftest.py\` is never imported directly — fixtures are injected by name
- Verify fixture scopes are appropriate: \`function\` for unit tests, wider scopes only for expensive shared resources
- Check that \`yield\` fixtures properly clean up resources in the teardown section (after yield)
- Verify \`@pytest.mark.parametrize\` is used for data-driven tests instead of duplicated test bodies
- Check parametrize \`ids\` are provided for readability in test output
- Verify mocks are patched at the point of use, not where the target is defined
- Check that \`mocker\` fixture (pytest-mock) is used rather than manual \`unittest.mock.patch\` decorators
- Verify all custom markers are registered in \`pyproject.toml\` to avoid PytestUnknownMarkWarning
- Check that \`--strict-markers\` is enabled in \`addopts\` to catch marker typos
- Verify async tests use \`@pytest.mark.asyncio\` or that \`asyncio_mode = "auto"\` is configured
- Check that tests do not depend on execution order — each test must be independently runnable
- Verify \`tmp_path\` is used instead of hardcoded temporary paths or deprecated \`tmpdir\`
- Check for proper use of \`pytest.raises\` with \`match\` parameter for exception message validation
- Verify no \`time.sleep()\` in tests — mock time-dependent code instead
- Check that factory fixtures are used for test data creation rather than complex inline setup`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Pytest-Specific Test Writing Guidelines
- Structure tests with plain functions (\`test_*\`) or \`Test*\` classes for logical grouping — prefer functions
- Use descriptive names: \`test_should_raise_value_error_when_amount_is_negative\`
- Follow AAA pattern: arrange fixtures and test data, act by calling the function, assert with plain \`assert\`
- Define fixtures in \`conftest.py\` at the appropriate directory scope — use \`yield\` for setup/teardown
- Create factory fixtures for generating test data with customizable parameters
- Use \`@pytest.mark.parametrize("input,expected", [...])\` for data-driven tests with descriptive \`ids\`
- Stack multiple parametrize decorators for cross-product testing of independent parameters
- Mock external dependencies with \`mocker.patch("module.target")\` — patch at the point of use
- Use \`mocker.spy(obj, "method")\` to track calls while preserving real behavior
- Use built-in fixtures: \`tmp_path\` for files, \`capsys\` for stdout, \`caplog\` for logs, \`monkeypatch\` for env vars
- Test exceptions with \`with pytest.raises(TypeError, match=r"expected pattern")\`
- Test warnings with \`with pytest.warns(DeprecationWarning)\`
- Use \`pytest.approx()\` for floating-point comparisons: \`assert 0.1 + 0.2 == pytest.approx(0.3)\`
- Use \`pytest.param(..., marks=pytest.mark.xfail(reason="known bug #123"))\` for expected failures
- Decorate async tests with \`@pytest.mark.asyncio\` and use \`async def test_*\` signatures
- Avoid testing implementation details — test observable behavior and outcomes`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Pytest Security Review
- Verify test fixtures and factory data do not contain real credentials, API keys, or PII
- Check that \`conftest.py\` does not import or expose production secrets or real connection strings
- Verify \`monkeypatch.setenv\` or \`mocker.patch.dict(os.environ)\` uses dummy values, not real credentials
- Check that \`mocker.patch\` or \`monkeypatch\` stubs external service calls — tests must never hit real production APIs
- Verify temporary files created with \`tmp_path\` do not contain sensitive data that persists after test runs
- Check that test output (captured stdout/stderr, log records) does not leak sensitive information
- Verify test configuration does not reference production endpoints or real database connection strings
- Check that \`conftest.py\` fixtures at session scope do not create insecure network listeners or open ports`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Pytest Test Refactoring Guidance
- Replace duplicated test logic with \`@pytest.mark.parametrize\` — extract varying inputs and expected outputs
- Convert unittest setUp/tearDown patterns to pytest \`yield\` fixtures in \`conftest.py\`
- Replace inline test data construction with factory fixtures that return callables
- Extract shared assertions into custom helper functions or pytest plugins (\`conftest.py\`)
- Replace manual \`unittest.mock.patch\` decorators with \`mocker\` fixture for automatic cleanup
- Replace \`monkeypatch.setattr\` for call tracking with \`mocker.spy\` when you need to assert call arguments
- Move fixtures used across multiple test files from local scope to the nearest common \`conftest.py\`
- Replace \`tmpdir\` (deprecated py.path) with \`tmp_path\` (pathlib.Path) across all test files
- Consolidate scattered marker registrations into \`pyproject.toml\` under \`[tool.pytest.ini_options]\`
- Replace complex conditional test skipping with \`@pytest.mark.skipif\` or \`pytest.importorskip\``,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## Pytest Migration Guidance
- When migrating from unittest: replace \`TestCase\` classes with plain test functions, \`setUp/tearDown\` with \`yield\` fixtures, \`self.assertEqual\` with plain \`assert ==\`
- When migrating from nose: replace \`@with_setup\` with fixtures, \`@attr\` with \`@pytest.mark\`, generator tests with \`@pytest.mark.parametrize\`
- unittest to pytest assertion mapping: \`assertEqual(a, b)\` -> \`assert a == b\`, \`assertTrue(x)\` -> \`assert x\`, \`assertRaises(E)\` -> \`pytest.raises(E)\`, \`assertIn(a, b)\` -> \`assert a in b\`
- When upgrading pytest versions: check changelog for deprecated features, update \`tmpdir\` to \`tmp_path\`, update async fixtures to use \`@pytest_asyncio.fixture\`
- When migrating from pytest-mock to standard unittest.mock: replace \`mocker.patch\` with \`@mock.patch\` decorator — but prefer keeping pytest-mock for automatic cleanup
- Verify all registered markers are valid and remove stale marker registrations from config
- When adopting pytest-asyncio: add \`asyncio_mode = "auto"\` to avoid decorating every async test individually`,
      },
    ],
    skills: [
      {
        name: 'pytest-test-generator',
        description: 'Generate comprehensive pytest test suites for Python modules',
        content: `# Pytest Test Generator

## Purpose
Generate comprehensive, well-structured pytest test suites for Python modules following official pytest conventions and best practices.

## Process

### 1. Analyze the Source Module
- Identify all public functions, classes, and their signatures (parameters, return types, exceptions)
- Map external dependencies that need mocking (network, database, filesystem, third-party APIs)
- Identify edge cases: None inputs, empty collections, boundary values, invalid types, error conditions
- Check for async functions that need \`@pytest.mark.asyncio\`

### 2. Set Up Test File and Fixtures
\`\`\`python
"""Tests for module_name."""
import pytest
from module_name import function_under_test


@pytest.fixture
def sample_data():
    """Provide standard test data."""
    return {"key": "value", "count": 42}


@pytest.fixture
def make_entity():
    """Factory fixture for creating test entities with defaults."""
    def _make(name="default", active=True, **overrides):
        return Entity(name=name, active=active, **overrides)
    return _make
\`\`\`

### 3. Write Tests in This Order
1. **Happy path**: valid inputs produce expected outputs
2. **Edge cases**: empty input, None, boundary values, max/min, single element
3. **Error cases**: invalid input, exceptions, rejected promises
4. **Integration scenarios**: interaction between mocked dependencies and real logic

### 4. Test Templates

#### Basic Test
\`\`\`python
def test_should_calculate_total_with_tax(sample_data):
    # Arrange
    items = [{"price": 10.0}, {"price": 20.0}]

    # Act
    result = calculate_total(items, tax_rate=0.1)

    # Assert
    assert result == pytest.approx(33.0)
\`\`\`

#### Parametrized Test
\`\`\`python
@pytest.mark.parametrize(
    "email,is_valid",
    [
        pytest.param("user@example.com", True, id="valid-email"),
        pytest.param("no-at-sign", False, id="missing-at-symbol"),
        pytest.param("", False, id="empty-string"),
        pytest.param("user@.com", False, id="missing-domain"),
    ],
)
def test_should_validate_email(email, is_valid):
    assert validate_email(email) == is_valid
\`\`\`

#### Exception Test
\`\`\`python
def test_should_raise_value_error_for_negative_amount():
    with pytest.raises(ValueError, match=r"amount must be positive"):
        process_payment(amount=-10)
\`\`\`

#### Mock Test
\`\`\`python
def test_should_fetch_user_from_api(mocker):
    # Arrange
    mock_response = {"id": 1, "name": "Alice"}
    mocker.patch("app.services.api_client.get", return_value=mock_response)

    # Act
    user = get_user(user_id=1)

    # Assert
    assert user.name == "Alice"
    app.services.api_client.get.assert_called_once_with("/users/1")
\`\`\`

#### Async Test
\`\`\`python
@pytest.mark.asyncio
async def test_should_fetch_data_concurrently(mocker):
    mocker.patch("app.client.fetch", return_value={"data": "ok"})

    results = await fetch_all_data(ids=[1, 2, 3])

    assert len(results) == 3
\`\`\`

#### Fixture with Teardown
\`\`\`python
@pytest.fixture
def temp_database(tmp_path):
    """Create a temporary SQLite database for testing."""
    db_path = tmp_path / "test.db"
    conn = sqlite3.connect(str(db_path))
    conn.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)")
    yield conn
    conn.close()
\`\`\`

## Quality Checklist
- [ ] Every public function has at least one test
- [ ] Happy path, edge cases, and error cases are covered
- [ ] External dependencies are mocked with \`mocker\` or \`monkeypatch\`
- [ ] Factory fixtures are used for test data creation
- [ ] Test names describe the expected behavior and condition
- [ ] No test depends on another test's state or execution order
- [ ] Parametrize is used where input/output combinations vary
- [ ] All custom markers are registered in \`pyproject.toml\`
- [ ] Async tests are properly decorated with \`@pytest.mark.asyncio\`
- [ ] \`tmp_path\` is used for temporary file operations
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "test_.*\\.py$" && grep -cE "\\b(pytest\\.mark\\.only|@only)\\b" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:1:Focused test marker detected — remove before committing to avoid skipping other tests" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "test_.*\\.py$" && grep -cE "\\btime\\.sleep\\(" "$CLAUDE_FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && echo "HOOK_EXIT:0:Warning: time.sleep() detected in test file — consider using monkeypatch or mocking time-dependent code instead" || true',
            timeout: 10,
          },
        ],
      },
    ],
  },
};
