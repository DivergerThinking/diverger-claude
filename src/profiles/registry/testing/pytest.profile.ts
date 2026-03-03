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
        heading: 'Pytest Conventions',
        order: 30,
        content: `## Pytest Conventions

Pythonic testing with fixtures, parametrize, and plugins. Convention over configuration.

**Detailed rules:** see \`.claude/rules/pytest/\` directory.

**Key rules:**
- Fixtures for setup/teardown, \`conftest.py\` for shared fixtures
- \`@pytest.mark.parametrize\` for data-driven tests
- Use \`pytest.raises\` for exception testing, \`tmp_path\` for file tests
- Naming: \`test_*.py\` files, \`test_*\` functions with descriptive names`,
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
        paths: ['**/test_*.py', '**/*_test.py', 'tests/**/*.py', 'conftest.py'],
        governance: 'mandatory',
        description: 'Pytest testing conventions and best practices — mandatory rules for fixtures, assertions, mocking, parametrize, and test structure',
        content: `# Pytest Testing Conventions

## Test Structure
- Place tests in \`tests/\` mirroring \`src/\` structure; separate \`unit/\`, \`integration/\`, \`e2e/\`
- Use \`test_*.py\` files, \`test_*\` functions, \`Test*\` classes only for logical grouping
- Follow Arrange-Act-Assert (AAA) pattern; use descriptive names

## Fixtures Rules
- Define shared fixtures in \`conftest.py\` — NEVER import from it directly
- Use narrowest fixture scope: \`function\` (default) for unit, \`session\` for expensive resources
- Use \`yield\` fixtures for setup/teardown; factory fixtures for customizable test data
- Use \`autouse=True\` only for universal setup; \`params=[...]\` for parametrized fixtures

## Assertion Rules
- Use plain \`assert\` — pytest rewrites for detailed introspection
- Use \`pytest.raises(ExType, match=r"...")\` for exceptions
- Use \`pytest.approx()\` for floats, \`pytest.warns()\` for warnings
- Never use bare \`assert True\` — always assert specific expected values

## Mocking Rules
- Use \`mocker\` fixture (pytest-mock) — auto-restores after each test
- \`mocker.patch("module.target")\` at the point of use, not where defined
- \`mocker.spy(obj, "method")\` to track calls while preserving behavior
- Use \`monkeypatch\` for simple attribute/env overrides without call tracking

## Parametrize Rules
- Use \`@pytest.mark.parametrize\` with descriptive \`ids\` — avoid duplicating test bodies
- Use \`pytest.param(..., marks=pytest.mark.xfail)\` for expected failures
- Stack multiple decorators for cross-product combinations

## Markers & Async
- Register ALL custom markers in \`pyproject.toml\`; use \`--strict-markers\`
- Use \`pytest-asyncio\` with \`@pytest.mark.asyncio\` or \`asyncio_mode = "auto"\`

## Coverage
- Enforce thresholds: \`pytest --cov=src --cov-fail-under=80\`
- Focus on meaningful coverage: edge cases, error paths, boundary conditions
- Use \`# pragma: no cover\` only with documented justification

## Anti-Patterns
- \`unittest.TestCase\` patterns — use pytest fixtures instead
- Tests that depend on execution order or share mutable state
- Over-mocking internal logic; using \`time.sleep()\` in tests
- Importing from conftest.py — let pytest handle fixture injection
`,
      },
      {
        path: 'testing/pytest-configuration.md',
        paths: ['**/test_*.py', '**/*_test.py', 'tests/**/*.py', 'conftest.py'],
        governance: 'recommended',
        description: 'Pytest configuration best practices and recommended pyproject.toml settings',
        content: `# Pytest Configuration Best Practices

## pyproject.toml — Key Settings
- \`addopts = "-ra -q --strict-markers --strict-config"\` for verbose summaries and strict markers
- \`testpaths = ["tests"]\`, \`pythonpath = ["src"]\`, \`minversion = "7.0"\`
- Register all custom markers under \`[tool.pytest.ini_options] markers = [...]\`
- Set \`filterwarnings = ["error", "ignore::DeprecationWarning:third_party_lib.*"]\`
- Set \`asyncio_mode = "auto"\` for pytest-asyncio

## Coverage Configuration
- \`[tool.coverage.run]\`: \`source = ["src"]\`, \`branch = true\`, \`omit = ["tests/*"]\`
- \`[tool.coverage.report]\`: \`fail_under = 80\`, \`show_missing = true\`
- Exclude lines: \`pragma: no cover\`, \`if TYPE_CHECKING:\`, \`if __name__ == "__main__":\`

## conftest.py Organization
- Root \`conftest.py\`: shared fixtures, global hooks, plugin configuration
- Package-level \`conftest.py\`: domain-specific fixtures for that test subdirectory
- Child conftest.py can override parent fixtures by using the same name

## Parallel Execution (pytest-xdist)
- \`pytest -n auto\` to distribute across CPU cores
- Ensure full test isolation — no shared files, databases, or ports
- Use \`tmp_path\` instead of hardcoded paths; \`worker_id\` for unique resources

## Performance Tips
- \`--lf\` (last failed), \`--ff\` (failed first), \`-x\` (stop at first failure)
- \`-k "expression"\` to filter by name; \`--co\` for collect-only
- Use \`pytest-timeout\` with \`timeout = 30\` to prevent hanging tests
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Pytest-Specific Review Checklist
Available skills: pytest-test-generator
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
Available skills: pytest-test-generator
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
Available skills: pytest-test-generator
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "test_.*\\.py$" && grep -cE "\\b(pytest\\.mark\\.only|@only)\\b" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Focused test marker detected — remove before committing to avoid skipping other tests" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for focused test markers in pytest files',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "test_.*\\.py$" && grep -cE "\\btime\\.sleep\\(" "$FILE_PATH" | grep -v "^0$" > /dev/null 2>&1 && { echo "Warning: time.sleep() detected in test file — consider using monkeypatch or mocking time-dependent code instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for time.sleep() in pytest files',
          },
        ],
      },
    ],
  },
};
