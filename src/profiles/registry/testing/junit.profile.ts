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
        order: 3030,
        content: `## JUnit Testing Conventions

### Test Structure & Organization
- Use JUnit 5 (Jupiter) APIs exclusively — never use JUnit 4 annotations (\`org.junit.Test\`, \`@RunWith\`) or runners
- Place tests in \`src/test/java/\` mirroring the \`src/main/java/\` package structure — one test class per source class
- Use \`@DisplayName\` on every test method and \`@Nested\` class for human-readable descriptions in test reports
- Use \`@Nested\` inner classes to group related test scenarios hierarchically by method or behavior — max 2 levels of nesting
- Follow the Given-When-Then or Arrange-Act-Assert (AAA) pattern in every test — clearly separate setup, execution, and verification
- Use \`@Test\` from \`org.junit.jupiter.api.Test\`, never from \`org.junit.Test\`
- Use \`@Disabled("JIRA-123: reason")\` instead of commenting out tests — always include a ticket reference

### Assertions & AssertJ
- Prefer AssertJ fluent assertions over JUnit's built-in assertions for readability and discoverability
- Use \`assertThat(result).isEqualTo(expected)\` for equality, \`assertThat(list).hasSize(3).contains(item)\` for collections
- Use \`assertThatThrownBy(() -> ...)\` for exception assertions with type and message verification
- Use \`SoftAssertions.assertSoftly(softly -> { ... })\` for grouped assertions that should all be evaluated without stopping at the first failure
- Use \`assertThat(optional).isPresent().hasValue(expected)\` for Optional assertions
- Use \`assertThat(result).extracting("field1", "field2")\` for object property extraction
- Use \`assertAll()\` from JUnit only when AssertJ SoftAssertions is not available

### Parameterized Tests
- Use \`@ParameterizedTest\` with descriptive \`name\` attribute instead of duplicating test methods
- Use \`@ValueSource\` for single-argument tests with primitives or strings
- Use \`@CsvSource\` for multi-argument tests with inline tabular data
- Use \`@MethodSource\` for complex argument generation — method must be static and return \`Stream<Arguments>\`
- Use \`@EnumSource\` for testing all or filtered enum values
- Use \`@NullAndEmptySource\` combined with \`@ValueSource\` for null/empty edge cases
- Use \`@ArgumentsSource\` with custom \`ArgumentsProvider\` for reusable complex argument generation

### Lifecycle & Extensions
- Use \`@BeforeEach\` / \`@AfterEach\` for per-test setup and teardown — keep setup minimal and test-specific
- Use \`@BeforeAll\` / \`@AfterAll\` only for expensive shared resources (database connections, containers)
- Use \`@ExtendWith(MockitoExtension.class)\` for Mockito integration — never call \`MockitoAnnotations.openMocks()\` manually
- Use \`@TempDir\` for temporary file system operations — JUnit handles creation and cleanup automatically
- Use \`@Timeout(value = 5, unit = TimeUnit.SECONDS)\` to prevent hanging tests
- Avoid \`@TestInstance(Lifecycle.PER_CLASS)\` unless sharing expensive resources — default per-method is safer
- Use \`@Tag("slow")\`, \`@Tag("integration")\` for test categorization and selective execution

### Mocking with Mockito
- Annotate test class with \`@ExtendWith(MockitoExtension.class)\` — this initializes \`@Mock\`, \`@Spy\`, and \`@InjectMocks\` automatically
- Use \`@Mock\` for dependencies and \`@InjectMocks\` for the system under test — prefer constructor injection in production code
- Use \`when(mock.method()).thenReturn(value)\` for stubbing — use \`thenThrow()\` for error simulation
- Use BDDMockito \`given(...).willReturn(...)\` style for BDD-oriented tests
- Use \`verify(mock).method(args)\` for interaction verification — avoid over-verification of implementation details
- Use \`ArgumentCaptor<T>\` to capture and assert on method arguments passed to mocks
- Use \`verifyNoMoreInteractions(mock)\` sparingly — only when exhaustive interaction checking is needed
- Use strict stubbing (default in Mockito 5+) — use \`lenient()\` only when justified with a comment

### Common Anti-Patterns to Avoid
- Testing implementation details (private methods, internal state) instead of observable behavior
- Tests that depend on execution order or share mutable state — each test must be independent
- Multiple unrelated assertions in a single test without \`SoftAssertions\` — split into separate tests
- Using \`Thread.sleep()\` in tests — use \`@Timeout\`, \`Awaitility\`, or \`CountDownLatch\` instead
- Over-mocking: if you mock everything, you test nothing — mock only external boundaries
- Catching exceptions manually instead of using \`assertThatThrownBy()\` or \`assertThrows()\``,
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
        governance: 'mandatory',
        description:
          'JUnit 5 testing conventions and best practices — mandatory rules for test structure, assertions, mocking, and lifecycle management',
        content: `# JUnit 5 Testing Conventions

## Test Structure
- Use \`@Test\` from \`org.junit.jupiter.api\`, never from \`org.junit.Test\` (JUnit 4)
- Use \`@DisplayName\` on every test method and \`@Nested\` class for clear test reports
- Use \`@Nested\` inner classes to group tests by method under test or scenario
- Follow Given-When-Then / Arrange-Act-Assert pattern in every test method
- One test class per production class — mirror the package structure in \`src/test/java/\`
- Use descriptive test method names: \`shouldReturnUserWhenValidIdIsProvided()\`

## Assertions with AssertJ
- Prefer AssertJ fluent assertions for all new tests:
  \`\`\`java
  assertThat(result).isEqualTo(expected);
  assertThat(users).hasSize(3).extracting("name").contains("Alice", "Bob");
  assertThatThrownBy(() -> service.process(null))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("must not be null");
  \`\`\`
- Use \`SoftAssertions.assertSoftly()\` for grouped assertions that should all evaluate:
  \`\`\`java
  SoftAssertions.assertSoftly(softly -> {
      softly.assertThat(user.getName()).isEqualTo("Alice");
      softly.assertThat(user.getAge()).isEqualTo(30);
      softly.assertThat(user.isActive()).isTrue();
  });
  \`\`\`
- Use \`assertThat(optional).isPresent().hasValue(expected)\` for Optional assertions
- Use \`assertThat(result).satisfies(r -> { ... })\` for complex multi-field assertions
- Use \`as("description")\` BEFORE the assertion to label assertions in failure messages

## JUnit Built-in Assertions (when AssertJ is not available)
- Use \`assertAll()\` for grouped assertions that should all be evaluated
- Use \`assertThrows(ExceptionType.class, () -> ...)\` with message verification
- Use \`assertTimeout(Duration.ofSeconds(5), () -> ...)\` for performance bounds
- Use \`assertDoesNotThrow(() -> ...)\` to verify no exception is thrown

## Lifecycle Management
- Use \`@BeforeEach\` for common per-test setup — keep it minimal and focused
- Use \`@AfterEach\` for cleanup: closing resources, resetting external state
- Use \`@BeforeAll\` / \`@AfterAll\` only for expensive one-time resources (Testcontainers, embedded servers)
- Use \`@TempDir Path tempDir\` for temporary filesystem operations — auto-cleaned after test
- Use \`@Timeout\` to prevent hanging tests — configure default with \`junit.jupiter.execution.timeout.default\`
- Avoid \`@TestInstance(Lifecycle.PER_CLASS)\` unless sharing expensive resources across methods

## Parameterized Tests
- Use \`@ParameterizedTest(name = "{index}: {0} should produce {1}")\` with descriptive name attribute
- Use \`@ValueSource\` for single-argument primitive/string tests
- Use \`@CsvSource\` for multi-argument inline tabular data
- Use \`@MethodSource("provideArguments")\` for complex argument generation — method must be static
- Use \`@EnumSource\` for testing all or subset of enum values
- Use \`@NullAndEmptySource\` for null and empty edge cases
- Use \`@ArgumentsSource(CustomProvider.class)\` for reusable argument providers across tests

## Mocking with Mockito
- Always use \`@ExtendWith(MockitoExtension.class)\` — never call \`MockitoAnnotations.openMocks()\` manually
- Use \`@Mock\` for dependencies, \`@InjectMocks\` for the subject under test
- Prefer constructor injection in production code — it works best with Mockito
- Use \`@Spy\` for partial mocks when you need real behavior for some methods
- Verify interactions with \`verify(mock)\` — avoid verifying implementation details
- Use \`ArgumentCaptor<T>\` with \`@Captor\` annotation to capture and assert on arguments:
  \`\`\`java
  @Captor ArgumentCaptor<Order> orderCaptor;

  verify(repository).save(orderCaptor.capture());
  assertThat(orderCaptor.getValue().getStatus()).isEqualTo(Status.COMPLETED);
  \`\`\`
- Use BDDMockito (\`given/willReturn\`) for BDD-style tests for consistency with Given-When-Then
- Use strict stubbing (default) — only use \`lenient()\` when justified with a code comment
- Never stub methods that are not called — strict stubbing will flag this as an error

## Test Tags & Filtering
- Use \`@Tag("unit")\`, \`@Tag("integration")\`, \`@Tag("slow")\` for test categorization
- Create custom composed annotations for frequently used tag combinations:
  \`\`\`java
  @Target(ElementType.METHOD)
  @Retention(RetentionPolicy.RUNTIME)
  @Tag("integration")
  @Test
  public @interface IntegrationTest {}
  \`\`\`
- Configure tag-based filtering in Maven Surefire/Failsafe or Gradle test tasks
`,
      },
      {
        path: 'testing/junit-project-structure.md',
        governance: 'recommended',
        description:
          'JUnit 5 project structure and configuration recommendations for Maven and Gradle',
        content: `# JUnit 5 Project Structure & Configuration

## Directory Layout
\`\`\`
src/
  main/java/          # Production code
  test/java/          # Unit tests (mirror main package structure)
  test/resources/     # Test fixtures, data files
\`\`\`

## Maven Configuration (pom.xml)
\`\`\`xml
<dependencies>
  <!-- JUnit 5 Jupiter API and Engine -->
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.2</version>
    <scope>test</scope>
  </dependency>
  <!-- AssertJ for fluent assertions -->
  <dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.25.3</version>
    <scope>test</scope>
  </dependency>
  <!-- Mockito with JUnit 5 extension -->
  <dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
  </dependency>
</dependencies>

<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-surefire-plugin</artifactId>
      <version>3.2.5</version>
      <configuration>
        <groups>unit</groups>
        <excludedGroups>slow</excludedGroups>
      </configuration>
    </plugin>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-failsafe-plugin</artifactId>
      <version>3.2.5</version>
      <configuration>
        <groups>integration</groups>
      </configuration>
    </plugin>
  </plugins>
</build>
\`\`\`

## Gradle Configuration (build.gradle.kts)
\`\`\`kotlin
dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
    testImplementation("org.assertj:assertj-core:3.25.3")
    testImplementation("org.mockito:mockito-junit-jupiter:5.11.0")
}

tasks.test {
    useJUnitPlatform {
        includeTags("unit")
        excludeTags("slow")
    }
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = true
    }
}

// Integration tests as a separate task
tasks.register<Test>("integrationTest") {
    useJUnitPlatform {
        includeTags("integration")
    }
}
\`\`\`

## JUnit Platform Configuration
Create \`src/test/resources/junit-platform.properties\`:
\`\`\`properties
# Parallel execution
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
junit.jupiter.execution.parallel.mode.classes.default=concurrent

# Timeout defaults
junit.jupiter.execution.timeout.default=10s
junit.jupiter.execution.timeout.testable.method.default=5s

# Display name generator
junit.jupiter.displayname.generator.default=\\
    org.junit.jupiter.api.DisplayNameGenerator$ReplaceUnderscores
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## JUnit 5-Specific Review Checklist
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "import\\s+org\\.junit\\.Test;|import\\s+org\\.junit\\.Before;|import\\s+org\\.junit\\.After;|import\\s+org\\.junit\\.BeforeClass;|import\\s+org\\.junit\\.AfterClass;|@RunWith\\(" "$CLAUDE_FILE_PATH" | head -5 | grep -q "." && echo "HOOK_EXIT:1:JUnit 4 imports or annotations detected — migrate to JUnit 5 Jupiter (org.junit.jupiter.api)" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "assertEquals\\(|assertTrue\\(|assertFalse\\(|assertNull\\(|assertNotNull\\(" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: JUnit built-in assertions detected — prefer AssertJ fluent assertions (assertThat) for better readability" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "MockitoAnnotations\\.openMocks|MockitoAnnotations\\.initMocks" "$CLAUDE_FILE_PATH" | head -1 | grep -q "." && echo "HOOK_EXIT:0:Warning: Manual Mockito initialization detected — use @ExtendWith(MockitoExtension.class) instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "Test\\.java$" && grep -nE "Thread\\.sleep\\(" "$CLAUDE_FILE_PATH" | head -1 | grep -q "." && echo "HOOK_EXIT:0:Warning: Thread.sleep() detected in test — use @Timeout, Awaitility, or CountDownLatch instead" || true',
            timeout: 10,
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
