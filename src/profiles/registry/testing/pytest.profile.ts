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
        order: 30,
        content: `## Pytest Testing Conventions

- Use fixtures for setup and teardown - prefer fixtures over \`setUp\`/\`tearDown\` methods
- Use \`@pytest.mark.parametrize\` for data-driven tests with multiple input combinations
- Organize shared fixtures in \`conftest.py\` at appropriate directory levels
- Use markers to categorize tests: \`@pytest.mark.slow\`, \`@pytest.mark.integration\`
- Prefer \`assert\` statements with descriptive messages over \`unittest\` assert methods
- Use \`pytest-mock\` (\`mocker\` fixture) for clean mocking patterns
- Use \`tmp_path\` fixture for temporary file operations
- Use \`capsys\` / \`caplog\` fixtures for capturing stdout and log output
- Configure pytest in \`pyproject.toml\` under \`[tool.pytest.ini_options]\`
- Use \`pytest-cov\` for coverage reporting with enforced thresholds`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(pytest:*)',
          'Bash(python -m pytest:*)',
          'Bash(python3 -m pytest:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/pytest-conventions.md',
        governance: 'mandatory',
        description: 'Pytest testing conventions and best practices',
        content: `# Pytest Testing Conventions

## Fixtures
- Define fixtures in \`conftest.py\` at the appropriate directory scope
- Use \`scope\` parameter wisely: \`function\` (default), \`class\`, \`module\`, \`session\`
- Prefer factory fixtures for creating test data with customizable parameters
- Use \`yield\` fixtures for setup/teardown patterns
- Avoid fixtures with side effects at \`session\` scope unless necessary
- Use \`autouse=True\` sparingly - only for truly universal setup

## Parametrize
- Use \`@pytest.mark.parametrize\` for testing multiple input/output combinations
- Provide descriptive \`ids\` for parametrized cases
- Stack multiple \`@pytest.mark.parametrize\` decorators for combinatorial testing
- Use \`pytest.param(..., marks=pytest.mark.xfail)\` for expected failures

## Conftest Organization
- Root \`conftest.py\`: shared fixtures, global hooks, and plugin configuration
- Package-level \`conftest.py\`: domain-specific fixtures
- Never import from \`conftest.py\` directly - pytest handles fixture injection
- Use \`conftest.py\` for custom markers registration

## Markers
- Register custom markers in \`pyproject.toml\` to avoid warnings
- Use \`@pytest.mark.slow\` for long-running tests
- Use \`@pytest.mark.integration\` for integration tests
- Use \`@pytest.mark.skipif\` for conditional test skipping
- Use \`@pytest.mark.xfail\` for known failures with expected resolution

## Plugins
- Use \`pytest-mock\` for clean mocking via the \`mocker\` fixture
- Use \`pytest-asyncio\` for async test support
- Use \`pytest-cov\` for coverage reporting
- Use \`pytest-xdist\` for parallel test execution
- Use \`pytest-randomly\` to detect order-dependent tests
`,
      },
      {
        path: 'testing/pytest-structure.md',
        governance: 'recommended',
        description: 'Pytest project structure recommendations',
        content: `# Pytest Project Structure

## Directory Layout
- Place tests in a top-level \`tests/\` directory mirroring \`src/\` structure
- Use \`test_*.py\` naming convention for test files
- Use \`Test*\` class naming for test classes (when grouping is needed)
- Use \`test_*\` function naming for test functions

## Test Organization
- Group related tests by module or feature
- Use classes only for logical grouping, not for shared state
- Keep test files focused - one test file per source module
- Use subdirectories for \`unit/\`, \`integration/\`, and \`e2e/\` separation
`,
      },
    ],
    agents: [
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Pytest-Specific Testing
- Use fixtures for test setup, defined in \`conftest.py\`
- Use \`@pytest.mark.parametrize\` for data-driven tests with descriptive ids
- Use \`mocker\` fixture from pytest-mock for mocking
- Use \`tmp_path\` for file system tests
- Use \`capsys\` for capturing stdout/stderr output
- Use appropriate markers: \`@pytest.mark.slow\`, \`@pytest.mark.integration\`
- Assert with plain \`assert\` statements with descriptive messages
- Use \`pytest.raises\` context manager for exception testing`,
      },
    ],
  },
};
