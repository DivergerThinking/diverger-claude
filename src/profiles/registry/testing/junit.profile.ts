import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const junitProfile: Profile = {
  id: 'testing/junit',
  name: 'JUnit',
  layer: PROFILE_LAYERS.TESTING,
  technologyIds: ['junit'],
  contributions: {
    claudeMd: [
      {
        heading: 'JUnit Testing Conventions',
        order: 30,
        content: `## JUnit Testing Conventions

- Use JUnit 5 (Jupiter) APIs - avoid JUnit 4 annotations and runners
- Use \`@DisplayName\` for human-readable test descriptions
- Use \`@Nested\` classes to group related test scenarios hierarchically
- Use \`@ParameterizedTest\` with sources (\`@ValueSource\`, \`@CsvSource\`, \`@MethodSource\`) for data-driven tests
- Prefer AssertJ fluent assertions over JUnit's built-in assertions for readability
- Use \`@BeforeEach\` / \`@AfterEach\` for per-test setup/teardown
- Use \`@ExtendWith\` for test lifecycle extensions (e.g., MockitoExtension)
- Use Mockito \`@Mock\` and \`@InjectMocks\` for dependency mocking
- Follow the Given-When-Then naming pattern for test methods
- Use \`assertThrows\` for exception testing with message verification`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(mvn test:*)',
          'Bash(mvn verify:*)',
          'Bash(gradle test:*)',
          'Bash(./gradlew test:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/junit-conventions.md',
        governance: 'mandatory',
        description: 'JUnit 5 testing conventions and best practices',
        content: `# JUnit 5 Testing Conventions

## JUnit 5 Patterns
- Use \`@Test\` from \`org.junit.jupiter.api\`, not \`org.junit.Test\`
- Use \`@DisplayName\` on every test method and nested class
- Use \`@Nested\` to organize tests by scenario or method under test
- Avoid \`@TestInstance(Lifecycle.PER_CLASS)\` unless sharing expensive resources

## Assertions
- Prefer AssertJ for fluent, readable assertions: \`assertThat(result).isEqualTo(expected)\`
- Use \`assertAll\` for grouped assertions that should all be evaluated
- Use \`assertThrows\` for verifying exceptions with type and message checks
- Use \`assertTimeout\` for performance-sensitive assertions
- Avoid multiple unrelated assertions in a single test

## Lifecycle
- Use \`@BeforeEach\` for common test setup
- Use \`@AfterEach\` for cleanup (closing resources, resetting state)
- Use \`@BeforeAll\` / \`@AfterAll\` only for expensive shared resources
- Use \`@TempDir\` for temporary file system operations
- Use \`@Timeout\` to prevent hanging tests

## Parameterized Tests
- Use \`@ParameterizedTest\` with descriptive \`name\` attribute
- Use \`@ValueSource\` for single-argument tests
- Use \`@CsvSource\` for multi-argument tests with inline data
- Use \`@MethodSource\` for complex argument generation
- Use \`@EnumSource\` for testing all enum values
- Use \`@NullAndEmptySource\` for null/empty edge cases

## Mocking
- Use Mockito with \`@ExtendWith(MockitoExtension.class)\`
- Use \`@Mock\` for dependencies and \`@InjectMocks\` for the subject under test
- Verify interactions with \`verify()\` - avoid over-verification
- Use \`ArgumentCaptor\` to capture and assert on method arguments
- Prefer \`lenient()\` stubs only when necessary
`,
      },
    ],
    agents: [
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## JUnit 5-Specific Testing
- Use \`@DisplayName\` for descriptive test names
- Use \`@Nested\` classes to group related test scenarios
- Use \`@ParameterizedTest\` with appropriate sources for data-driven tests
- Use Mockito with \`@ExtendWith(MockitoExtension.class)\`
- Use AssertJ for fluent assertions: \`assertThat(...).isEqualTo(...)\`
- Use \`assertThrows\` with type and message verification
- Use \`@BeforeEach\` for test setup, \`@TempDir\` for file tests
- Follow Given-When-Then pattern in test method names`,
      },
    ],
  },
};
