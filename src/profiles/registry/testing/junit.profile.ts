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
        heading: 'JUnit 5 Conventions',
        order: 30,
        content: `## JUnit 5 Conventions

Modern Java testing platform. Jupiter API with extensions, parameterized tests, nested tests.

**Detailed rules:** see \`.claude/rules/junit/\` directory.

**Key rules:**
- \`@DisplayName\` for readable test names, nested \`@Nested\` classes for grouping
- \`@ParameterizedTest\` with \`@ValueSource\`/\`@MethodSource\` for data-driven tests
- AssertJ for fluent assertions, Mockito for mocking with \`@ExtendWith(MockitoExtension.class)\`
- Test lifecycle: \`@BeforeEach\` for setup, \`@AfterEach\` for cleanup — no shared state`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(mvn test:*)',
          'Bash(mvn verify:*)',
          'Bash(mvn -pl * test:*)',
          'Bash(gradle test:*)',
          'Bash(./gradlew test:*)',
          'Bash(./gradlew :*:test:*)',
          'Bash(mvn -Dtest=*:*)',
          'Bash(gradle test --tests *:*)',
        ],
      },
    },
    rules: [
      {
        path: 'testing/junit-conventions.md',
        paths: ['**/*Test.java', '**/*Tests.java', 'src/test/**/*.java'],
        governance: 'mandatory',
        description:
          'JUnit 5 testing conventions and best practices — mandatory rules for test structure, assertions, mocking, and lifecycle management',
        content: `# JUnit 5 Testing Conventions

## Test Structure
- Use \`@Test\` from \`org.junit.jupiter.api\`, never from \`org.junit.Test\` (JUnit 4)
- Use \`@DisplayName\` on every test method and \`@Nested\` class for clear test reports
- Use \`@Nested\` inner classes to group tests by method under test or scenario
- Follow Arrange-Act-Assert pattern — one test class per production class
- Use descriptive method names: \`shouldReturnUserWhenValidIdIsProvided()\`

## Assertions
- Prefer AssertJ fluent assertions: \`assertThat(result).isEqualTo(expected)\`
- Use \`SoftAssertions.assertSoftly()\` for grouped assertions that should all evaluate
- Use \`assertThatThrownBy(() -> ...)\` for exception testing with type and message checks
- Use \`as("description")\` before assertions for meaningful failure messages
- When AssertJ unavailable: use \`assertAll()\`, \`assertThrows()\`, \`assertTimeout()\`

## Lifecycle Management
- Use \`@BeforeEach\` for per-test setup, \`@AfterEach\` for cleanup
- Use \`@BeforeAll\`/\`@AfterAll\` only for expensive one-time resources
- Use \`@TempDir\` for filesystem operations, \`@Timeout\` to prevent hangs
- Avoid \`@TestInstance(PER_CLASS)\` unless sharing expensive resources

## Parameterized Tests
- Use \`@ParameterizedTest\` with descriptive \`name\` attribute
- Use \`@ValueSource\` for single-argument, \`@CsvSource\` for multi-argument
- Use \`@MethodSource\` for complex argument generation (static method)
- Use \`@EnumSource\` for enum values, \`@NullAndEmptySource\` for edge cases

## Mocking with Mockito
- Always use \`@ExtendWith(MockitoExtension.class)\` — never \`MockitoAnnotations.openMocks()\`
- Use \`@Mock\` for dependencies, \`@InjectMocks\` for subject under test
- Use \`@Captor\` with \`ArgumentCaptor\` to capture and assert on arguments
- Use strict stubbing (default) — only \`lenient()\` when justified with comment
- Verify only meaningful interactions — avoid verifying implementation details

## Test Tags & Filtering
- Use \`@Tag("unit")\`, \`@Tag("integration")\`, \`@Tag("slow")\` for categorization
- Create custom composed annotations for frequent tag combinations
- Configure tag-based filtering in Maven Surefire/Failsafe or Gradle test tasks
`,
      },
      {
        path: 'testing/junit-project-structure.md',
        paths: ['**/*Test.java', '**/*Tests.java', 'src/test/**/*.java'],
        governance: 'recommended',
        description:
          'JUnit 5 project structure and configuration recommendations for Maven and Gradle',
        content: `# JUnit 5 Project Structure & Configuration

## Directory Layout
- \`src/main/java/\` — production code
- \`src/test/java/\` — unit tests (mirror main package structure)
- \`src/test/resources/\` — test fixtures and data files

## Maven Configuration
- Add \`junit-jupiter\`, \`assertj-core\`, \`mockito-junit-jupiter\` as test dependencies
- Configure \`maven-surefire-plugin\` (3.2+) with tag-based groups: \`<groups>unit</groups>\`
- Configure \`maven-failsafe-plugin\` for integration tests: \`<groups>integration</groups>\`

## Gradle Configuration
- Add same test dependencies with \`testImplementation\`
- Configure \`tasks.test\` with \`useJUnitPlatform { includeTags("unit"); excludeTags("slow") }\`
- Register separate \`integrationTest\` task with \`includeTags("integration")\`
- Enable test logging: \`events("passed", "skipped", "failed")\`

## JUnit Platform Properties
- Create \`src/test/resources/junit-platform.properties\` for shared configuration
- Enable parallel execution: \`junit.jupiter.execution.parallel.enabled=true\`
- Set default timeout: \`junit.jupiter.execution.timeout.default=10s\`
- Configure display name generator for readable test names
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## JUnit 5-Specific Review Checklist
Available skills: junit-test-generator
- Verify JUnit 5 annotations are used exclusively — flag any \`org.junit.Test\`, \`@RunWith\`, or \`@Rule\` from JUnit 4
- Check that \`@DisplayName\` is present on all test methods and \`@Nested\` classes for readable test reports
- Verify \`@Nested\` classes are used for logical grouping of test scenarios by method or behavior
- Check that AssertJ fluent assertions are preferred: \`assertThat(...).isEqualTo(...)\` instead of \`assertEquals()\`
- Verify \`SoftAssertions.assertSoftly()\` is used when multiple assertions need to all evaluate (not stop at first failure)
- Verify \`assertThatThrownBy()\` is used for exception testing — flag manual try-catch-fail patterns
- Check that \`@ParameterizedTest\` is used instead of duplicated test methods with different inputs
- Verify \`@ExtendWith(MockitoExtension.class)\` is used — flag any \`MockitoAnnotations.openMocks()\` calls
- Check that Mockito \`verify()\` is not over-used — verify only meaningful interactions, not implementation details
- Verify \`@BeforeEach\` setup does not contain test-specific logic — it should be shared setup only
- Check that \`@TempDir\` is used for file system tests instead of manual temp directory management
- Verify no \`Thread.sleep()\` calls in tests — suggest \`@Timeout\`, \`Awaitility\`, or \`CountDownLatch\` instead
- Check that each test is independent — no shared mutable state, no execution order dependency
- Verify test method names follow Given-When-Then or should-when pattern for clarity
- Check that \`@Tag\` annotations are used for test categorization (unit, integration, slow)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## JUnit 5-Specific Test Writing Guidelines
Available skills: junit-test-generator
- Structure tests with \`@Nested\` inner classes grouped by method under test or scenario
- Use \`@DisplayName\` on every test method and \`@Nested\` class for human-readable descriptions
- Follow Given-When-Then pattern: set up preconditions, execute the action, verify the outcome
- Use AssertJ fluent assertions: \`assertThat(result).isEqualTo(expected)\`, \`assertThat(list).hasSize(3).contains(item)\`
- Use \`assertThatThrownBy(() -> service.process(null)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("must not be null")\`
- Use \`SoftAssertions.assertSoftly()\` when verifying multiple properties of a result object
- Use \`@ParameterizedTest\` with \`@CsvSource\`, \`@MethodSource\`, or \`@ValueSource\` for data-driven tests
- Use \`@ExtendWith(MockitoExtension.class)\` with \`@Mock\` and \`@InjectMocks\` for dependency mocking
- Use \`ArgumentCaptor\` with \`@Captor\` to capture and verify arguments passed to mock methods
- Use \`@TempDir\` for file system tests, \`@Timeout\` for time-bound tests
- Use \`@Tag("integration")\` to categorize tests for selective execution
- Stub with \`when(mock.method()).thenReturn(value)\` or BDDMockito \`given(...).willReturn(...)\`
- Test happy path first, then edge cases (null, empty, boundary values), then error cases
- One logical assertion per test — use \`SoftAssertions\` only when verifying a single behavior with multiple properties`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## JUnit Security Review
- Verify test fixtures and mock data do not contain real credentials, API keys, database passwords, or PII
- Check that \`@BeforeAll\` / \`@BeforeEach\` setup does not import or expose production secrets or configurations
- Verify Mockito mocks are used to stub external service calls — tests must never hit real production APIs or databases
- Check that test resource files (\`src/test/resources/\`) do not contain real credentials or sensitive configuration
- Verify \`@TempDir\` is used for file operations to avoid writing to sensitive filesystem locations
- Check that test environment properties use dummy values, not real production credentials
- Verify test output (System.out, log statements) does not leak sensitive information from production configs
- Check that Testcontainers (if used) do not expose production database credentials in container configurations`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## JUnit Test Refactoring Guidance
Available skills: junit-test-generator
- Replace duplicated test logic with \`@ParameterizedTest\` using \`@CsvSource\` or \`@MethodSource\`
- Extract shared test setup into \`@BeforeEach\` methods — but keep setup minimal and shared-only
- Replace JUnit 4 annotations with Jupiter equivalents: \`@Before\` to \`@BeforeEach\`, \`@RunWith\` to \`@ExtendWith\`, \`@Rule\` to \`@ExtendWith\`
- Replace \`assertEquals(expected, actual)\` with AssertJ \`assertThat(actual).isEqualTo(expected)\` for readability
- Replace manual try-catch exception testing with \`assertThatThrownBy(() -> ...)\` from AssertJ
- Replace manual temp directory creation/cleanup with \`@TempDir\` injection
- Replace \`Thread.sleep()\` with \`Awaitility.await().atMost(Duration.ofSeconds(5)).until(() -> ...)\`
- Extract reusable test fixtures into helper methods or factory classes
- Convert flat test classes with many methods into \`@Nested\` class hierarchies grouped by behavior
- Replace \`MockitoAnnotations.openMocks(this)\` in \`@BeforeEach\` with \`@ExtendWith(MockitoExtension.class)\`
- Consolidate scattered mock setup into focused builder or factory methods`,
      },
      {
        name: 'migration-helper',
        type: 'enrich',
        prompt: `## JUnit Migration Guidance
- When migrating from JUnit 4 to JUnit 5: replace \`org.junit.Test\` with \`org.junit.jupiter.api.Test\`, \`@Before\`/\`@After\` with \`@BeforeEach\`/\`@AfterEach\`, \`@BeforeClass\`/\`@AfterClass\` with \`@BeforeAll\`/\`@AfterAll\`
- Replace \`@RunWith(MockitoJUnitRunner.class)\` with \`@ExtendWith(MockitoExtension.class)\`
- Replace \`@Rule\` and \`@ClassRule\` with \`@ExtendWith\` and corresponding extension implementations
- Replace \`@Rule ExpectedException\` with \`assertThrows()\` or AssertJ \`assertThatThrownBy()\`
- Replace \`@Rule TemporaryFolder\` with \`@TempDir\` annotation
- Replace \`@Parameterized\` runner with \`@ParameterizedTest\` and argument source annotations
- Replace \`@Category\` with \`@Tag\` for test filtering
- Use OpenRewrite recipe \`org.openrewrite.java.testing.junit5.JUnit5BestPractices\` for automated migration
- Verify all test methods are public (JUnit 5 allows package-private, but keep consistent)
- Update Maven Surefire plugin to 3.x+ for full JUnit 5 Platform support
- When upgrading Mockito 4 to 5: strict stubbing is now the default — fix unnecessary stubs or use \`lenient()\``,
      },
    ],
    skills: [
      {
        name: 'junit-test-generator',
        description:
          'Generate comprehensive JUnit 5 test classes with AssertJ assertions and Mockito mocking for Java classes',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# JUnit 5 Test Generator

## Purpose
Generate comprehensive, well-structured JUnit 5 test classes with AssertJ assertions and Mockito mocking following best practices.

## Process

### 1. Analyze the Source Class
- Identify all public methods: parameters, return types, thrown exceptions
- Map dependencies that need mocking (services, repositories, clients)
- Identify edge cases: null inputs, empty collections, boundary values, exception conditions
- Determine if the class uses constructor injection (preferred) or field injection

### 2. Set Up Test Class Structure
\`\`\`java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private OrderService orderService;

    @Captor
    private ArgumentCaptor<Order> orderCaptor;

    @Nested
    @DisplayName("placeOrder")
    class PlaceOrder {

        @Test
        @DisplayName("should create order when valid items are provided")
        void shouldCreateOrderWhenValidItemsProvided() {
            // Arrange
            var items = List.of(new Item("SKU-1", 2));
            when(paymentGateway.charge(anyDouble())).thenReturn(PaymentResult.success());

            // Act
            var result = orderService.placeOrder(items);

            // Assert
            assertThat(result.getStatus()).isEqualTo(Status.CONFIRMED);
            verify(orderRepository).save(orderCaptor.capture());
            assertThat(orderCaptor.getValue().getItems()).hasSize(1);
        }

        @Test
        @DisplayName("should throw IllegalArgumentException when items list is empty")
        void shouldThrowWhenItemsEmpty() {
            assertThatThrownBy(() -> orderService.placeOrder(List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least one item");
        }
    }
}
\`\`\`

### 3. Write Tests in This Order
1. **Happy path**: valid inputs produce expected outputs
2. **Edge cases**: empty input, null values, boundary values, max/min
3. **Error cases**: invalid input, thrown exceptions, dependency failures
4. **Interaction verification**: verify correct calls to mocked dependencies

### 4. Parameterized Test Template
\`\`\`java
@ParameterizedTest(name = "{0} should produce status {1}")
@CsvSource({
    "100.00, APPROVED",
    "0.01, APPROVED",
    "-1.00, REJECTED",
    "0.00, REJECTED"
})
@DisplayName("processPayment")
void shouldProduceCorrectStatus(double amount, String expectedStatus) {
    var result = paymentService.processPayment(amount);
    assertThat(result.getStatus()).isEqualTo(expectedStatus);
}
\`\`\`

### 5. Exception Test Template
\`\`\`java
@Test
@DisplayName("should throw NotFoundException when user does not exist")
void shouldThrowWhenUserNotFound() {
    when(userRepository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> userService.getUserById(999L))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("User 999 not found");

    verify(userRepository).findById(999L);
    verifyNoMoreInteractions(userRepository);
}
\`\`\`

### 6. SoftAssertions Template
\`\`\`java
@Test
@DisplayName("should return complete user profile with all fields populated")
void shouldReturnCompleteUserProfile() {
    when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

    var profile = userService.getProfile(1L);

    SoftAssertions.assertSoftly(softly -> {
        softly.assertThat(profile.getName()).isEqualTo("Alice");
        softly.assertThat(profile.getEmail()).isEqualTo("alice@example.com");
        softly.assertThat(profile.isActive()).isTrue();
        softly.assertThat(profile.getRoles()).containsExactly("USER", "ADMIN");
    });
}
\`\`\`

## Quality Checklist
- [ ] Every public method has at least one test
- [ ] Happy path, edge cases, and error cases are covered
- [ ] \`@DisplayName\` on every test method and \`@Nested\` class
- [ ] AssertJ assertions used throughout
- [ ] External dependencies mocked with \`@Mock\` / \`@InjectMocks\`
- [ ] \`@ParameterizedTest\` used where input/output combinations vary
- [ ] Exception tests use \`assertThatThrownBy()\` with type and message checks
- [ ] No test depends on another test's state or execution order
- [ ] Tests grouped with \`@Nested\` classes by method under test
- [ ] ArgumentCaptor used when verifying complex arguments
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "import\\s+org\\.junit\\.Test;|import\\s+org\\.junit\\.Before;|import\\s+org\\.junit\\.After;|import\\s+org\\.junit\\.BeforeClass;|import\\s+org\\.junit\\.AfterClass;|@RunWith\\(" "$FILE_PATH" | head -5 | grep -q "." && { echo "JUnit 4 imports or annotations detected — migrate to JUnit 5 Jupiter (org.junit.jupiter.api)" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for JUnit 4 imports in test files',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "assertEquals\\(|assertTrue\\(|assertFalse\\(|assertNull\\(|assertNotNull\\(" "$FILE_PATH" | head -3 | grep -q "." && { echo "Warning: JUnit built-in assertions detected — prefer AssertJ fluent assertions (assertThat) for better readability" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for JUnit built-in assertions vs AssertJ',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "MockitoAnnotations\\.openMocks|MockitoAnnotations\\.initMocks" "$FILE_PATH" | head -1 | grep -q "." && { echo "Warning: Manual Mockito initialization detected — use @ExtendWith(MockitoExtension.class) instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for manual Mockito initialization',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "Thread\\.sleep\\(" "$FILE_PATH" | head -1 | grep -q "." && { echo "Warning: Thread.sleep() detected in test — use @Timeout, Awaitility, or CountDownLatch instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for Thread.sleep() in JUnit tests',
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'checkstyle',
        filePath: 'config/checkstyle/checkstyle-test.xml',
        config: {
          description:
            'Checkstyle rules for JUnit 5 test files — enforces @DisplayName presence and prohibits JUnit 4 imports',
          rules: {
            AvoidStarImport: {
              severity: 'warning',
              excludes:
                'org.assertj.core.api.Assertions,org.mockito.Mockito,org.mockito.BDDMockito',
            },
            IllegalImport: {
              severity: 'error',
              illegalPkgs: 'org.junit.Test,org.junit.Before,org.junit.After',
              message:
                'Use JUnit 5 Jupiter imports (org.junit.jupiter.api) instead of JUnit 4',
            },
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
