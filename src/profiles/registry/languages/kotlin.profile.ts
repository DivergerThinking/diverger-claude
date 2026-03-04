import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const kotlinProfile: Profile = {
  id: 'languages/kotlin',
  name: 'Kotlin',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['kotlin'],
  contributions: {
    claudeMd: [{
      heading: 'Kotlin Conventions',
      order: 10,
      content: `## Kotlin Conventions

Kotlin-idiomatic code. Null safety, data classes, coroutines for async.

**Detailed rules:** see \`.claude/rules/kotlin/\` directory.

**Key rules:**
- Use \`data class\` for DTOs, \`sealed class\`/\`sealed interface\` for sum types
- Leverage null safety: \`?.\`, \`?:\`, \`let\` — avoid \`!!\` (non-null assertion)
- Coroutines with structured concurrency — use \`viewModelScope\`/\`lifecycleScope\`
- Extension functions for utility, scope functions (\`let\`, \`apply\`, \`run\`) judiciously`,
    }],
    settings: {
      permissions: {
        allow: [
          'Bash(gradle:*)',
          'Bash(gradlew:*)',
          'Bash(./gradlew:*)',
          'Bash(kotlinc:*)',
          'Bash(kotlin:*)',
          'Bash(ktlint:*)',
          'Bash(detekt:*)',
          'Bash(ksp:*)',
        ],
      },
    },
    rules: [
      {
        path: 'kotlin/style-and-null-safety.md',
        paths: ['**/*.kt', '**/*.kts'],
        governance: 'mandatory',
        description: 'Kotlin naming conventions, null safety, and idiomatic patterns from official coding conventions',
        content: `# Kotlin Style & Null Safety

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Packages | lowercase, no underscores | \`org.example.network\` |
| Classes, objects | PascalCase (nouns) | \`UserRepository\`, \`ConnectionPool\` |
| Functions | camelCase (verbs) | \`findById()\`, \`processPayment()\` |
| Properties, locals | camelCase | \`activeUserCount\`, \`retryDelay\` |
| Constants | SCREAMING_SNAKE_CASE | \`MAX_CONNECTIONS\`, \`DEFAULT_PORT\` |
| Backing properties | underscore prefix | \`_items\` exposed as \`items\` |

## Null Safety

- NEVER use \`!!\` (non-null assertion) — use \`?.\`, \`?:\`, \`requireNotNull()\`, or \`checkNotNull()\`
- Use safe calls (\`?.\`) and elvis (\`?:\`) for null handling
- Use \`?.let { }\` for nullable transformations
- Use \`lateinit\` only for framework-injected properties guaranteed to be initialized
- Explicitly type Java interop values — never let compiler infer platform types (\`String!\`)

## Sealed Types & Data Classes

- Use \`sealed interface\`/\`sealed class\` for state machines and exhaustive branching
- Use \`data class\` for DTOs with \`val\` properties — no business logic, no \`var\`
- Use \`copy()\` for non-destructive mutation of data classes
- Compiler enforces exhaustiveness in \`when\` on sealed types — no \`else\` needed

## When Expressions

- Use \`when\` expressions instead of if-else chains for multi-branch logic
- Use range matching: \`in 200..299\`, guard conditions, and type checks
- Prefer exhaustive \`when\` on enums/sealed types — avoid unnecessary \`else\`

## Scope Functions

| Function | Ref | Returns | Use case |
|----------|-----|---------|----------|
| \`let\` | \`it\` | Lambda result | Nullable transforms, scoping |
| \`apply\` | \`this\` | Object | Configuration (builder-style) |
| \`also\` | \`it\` | Object | Side effects (logging) |
| \`run\` | \`this\` | Lambda result | Config + compute |
| \`with\` | \`this\` | Lambda result | Grouping calls |

- Never nest scope functions more than 2 levels
- Prefer \`val\` over \`var\` — mutable state must be justified
- Use immutable collections (\`List\`, \`Map\`, \`Set\`) in public API
`,
      },
      {
        path: 'kotlin/coroutines-and-flow.md',
        paths: ['**/*.kt', '**/*.kts'],
        governance: 'mandatory',
        description: 'Kotlin coroutines structured concurrency, Flow patterns, and error handling',
        content: `# Kotlin Coroutines & Flow Best Practices

## Structured Concurrency

- NEVER use \`GlobalScope\` — always launch within a lifecycle-bound scope
- Use \`viewModelScope\`/\`lifecycleScope\` on Android, custom \`CoroutineScope\` elsewhere
- Use \`SupervisorJob\` when child failures should not cancel siblings
- Cancel scopes when their lifecycle ends (\`scope.cancel()\` in \`close()\`/\`onDestroy()\`)

## Dispatchers

- \`Dispatchers.Main\`: UI updates
- \`Dispatchers.IO\`: network, file I/O, database
- \`Dispatchers.Default\`: CPU-intensive computation
- Inject dispatchers as constructor parameters for testability
- Never call blocking APIs inside coroutines without \`withContext(Dispatchers.IO)\`

## Error Handling

- Use try/catch within coroutines for expected errors (network, parsing)
- Use \`CoroutineExceptionHandler\` for uncaught errors in root coroutines
- Use \`runCatching\` / \`Result<T>\` for functional error handling
- \`launch\`: propagates exceptions automatically to parent
- \`async\`: defers exceptions to \`.await()\` call

## Flow Patterns

- Use \`flow { }\` for cold streams, \`StateFlow\` for observable state, \`SharedFlow\` for events
- Use \`flowOn()\` to change upstream context — NEVER \`withContext\` inside \`flow { }\`
- Collect flows in lifecycle-aware manner: \`repeatOnLifecycle\` on Android
- Use \`catch\` operator for upstream error handling
- Use \`buffer()\`/\`conflate()\`/\`collectLatest\` for backpressure management
- Expose \`StateFlow\`/\`SharedFlow\` as read-only via \`.asStateFlow()\`/\`.asSharedFlow()\`
`,
      },
      {
        path: 'kotlin/project-structure-and-security.md',
        paths: ['**/*.kt', '**/*.kts'],
        governance: 'recommended',
        description: 'Kotlin project structure, Gradle conventions, and security patterns',
        content: `# Kotlin Project Structure & Security

## Project Structure

- Standard Gradle layout: \`src/main/kotlin/\`, \`src/test/kotlin/\`, \`src/main/resources/\`
- Thin entry point — wire dependencies, delegate to domain/service layer
- Organize by domain: \`domain/\`, \`api/\`, \`infra/\`, \`config/\`
- Multi-module: \`app/\`, \`core/\` (shared models), \`data/\`, \`features/\`

## Gradle Conventions (Kotlin DSL)

- Use version catalog (\`gradle/libs.versions.toml\`) for centralized dependency management
- Pin JDK version: \`kotlin { jvmToolchain(21) }\`
- Use \`alias(libs.plugins.kotlin.jvm)\` for plugin declarations
- Use \`useJUnitPlatform()\` in test tasks

## Security

- NEVER use string concatenation/interpolation for SQL — use parameterized queries
- NEVER use \`ObjectInputStream\` for untrusted data — use kotlinx.serialization or Moshi
- Use \`SecureRandom\` for cryptographic randomness — not \`kotlin.random\`
- Validate all external input with \`require()\` / \`check()\` at entry points
- Never hardcode API keys, passwords, or secrets in source code
- Use environment variables or secret managers for credentials
- Never log sensitive data — passwords, tokens, PII
- Mark sensitive fields with \`@Transient\` to prevent serialization
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Kotlin-Specific Review Checklist

### Null Safety
- [ ] No \`!!\` (non-null assertion) usage — suggest \`?.\`, \`?:\`, \`requireNotNull()\`, or \`checkNotNull()\`
- [ ] Platform types from Java interop are explicitly typed in public API (no inferred \`String!\`)
- [ ] Nullable Boolean checked with \`== true\` / \`== false\`, not bare \`if (value)\`
- [ ] \`lateinit\` used only for framework-injected properties that are guaranteed to be initialized

### Idiomatic Kotlin
- [ ] \`data class\` used for DTOs/value objects — no business logic beyond computed \`val\`
- [ ] \`sealed class\`/\`sealed interface\` used for state machines and result types
- [ ] \`when\` expressions exhaustive for sealed types — no unnecessary \`else\` branch
- [ ] Default parameters preferred over function overloads
- [ ] Named arguments used for calls with multiple same-type or Boolean parameters
- [ ] Expression body (\`= expr\`) used for single-expression functions
- [ ] Scope functions used idiomatically — not nested more than 2 levels
- [ ] No Java-style patterns: \`static\` methods (use companion object or top-level), \`Builder\` (use named params), \`switch\` (use \`when\`)
- [ ] \`val\` preferred over \`var\` — mutable state justified with a comment
- [ ] Immutable collections (\`List\`, \`Map\`, \`Set\`) in public API — \`MutableList\` only internally

### Coroutines
- [ ] No \`GlobalScope\` usage — coroutines launched within a lifecycle-bound scope
- [ ] No blocking calls (\`Thread.sleep\`, blocking I/O) inside coroutines — use \`withContext(Dispatchers.IO)\` or \`delay()\`
- [ ] Dispatchers injected as constructor parameters for testability
- [ ] \`suspend\` functions do not call blocking APIs without dispatcher switch
- [ ] Flow collected in lifecycle-aware manner (\`repeatOnLifecycle\` on Android)
- [ ] No \`withContext\` inside \`flow { }\` — use \`flowOn()\` instead
- [ ] \`SupervisorJob\` used when child failures should not cascade

### Code Quality
- [ ] Functions under 30 lines — extract if longer
- [ ] No magic numbers — use named constants
- [ ] Trailing commas in multi-line declarations
- [ ] KDoc present on all public members (classes, functions, properties)
- [ ] Explicit return types on public functions (not inferred)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['kotlin-gradle-helper', 'kotlin-coroutine-debug'],
        prompt: `## Kotlin Testing Patterns

### Framework & Assertions
- Use JUnit 5 as test runner with \`kotlin-test\` assertion functions
- Use \`assertIs<Type>()\`, \`assertEquals()\`, \`assertNull()\` from kotlin-test
- Use \`assertThrows<ExceptionType> { }\` for verifying exceptions
- Use MockK for mocking — not Mockito (\`every { mock.method() } returns value\`)
- Use \`@Nested\` inner classes to group related test cases

### Coroutine Testing
- Use \`kotlinx-coroutines-test\` with \`runTest { }\` for all coroutine tests
- Use \`TestDispatcher\` (\`StandardTestDispatcher\` or \`UnconfinedTestDispatcher\`) for deterministic testing
- Inject \`TestDispatcher\` into classes that accept dispatchers
- Use \`advanceTimeBy()\` and \`advanceUntilIdle()\` for time-dependent tests
- Test timeout behavior with \`withTimeout\` inside \`runTest\`

### Flow Testing
- Use Turbine library (\`app.cash.turbine\`) for Flow testing
- Use \`flow.test { }\` to assert emissions, completion, and errors
- Verify StateFlow initial value, updates, and final state
- Test Flow error handling: verify \`catch\` operators and error emissions

### Test Naming & Structure
\`\`\`kotlin
class OrderServiceTest {

    @Nested
    inner class \`when processing a valid order\` {
        @Test
        fun \`should calculate total with tax\`() = runTest {
            // Arrange
            val order = Order(items = listOf(Item(price = 100.0)))
            val service = OrderService(TestCoroutineDispatcher())

            // Act
            val result = service.processOrder(order)

            // Assert
            assertEquals(110.0, result.total) // 10% tax
        }
    }

    @Nested
    inner class \`when order has no items\` {
        @Test
        fun \`should throw ValidationException\`() = runTest {
            val service = OrderService(TestCoroutineDispatcher())
            assertThrows<ValidationException> {
                service.processOrder(Order(items = emptyList()))
            }
        }
    }
}
\`\`\`

### MockK Patterns
\`\`\`kotlin
@Test
fun \`should notify user on successful payment\`() = runTest {
    val notifier = mockk<NotificationService>()
    coEvery { notifier.sendEmail(any(), any()) } just runs

    val service = PaymentService(notifier, UnconfinedTestDispatcher())
    service.processPayment(payment)

    coVerify(exactly = 1) { notifier.sendEmail(payment.userEmail, any()) }
}
\`\`\``,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Kotlin-Specific Security Review

### Injection Vulnerabilities
- [ ] No string concatenation or string templates in SQL queries — use parameterized queries
- [ ] No string interpolation in shell commands — use ProcessBuilder with arg lists
- [ ] No \`Runtime.exec()\` with unsanitized user input
- [ ] All user input validated with \`require()\` / \`check()\` at entry points

### Serialization Safety
- [ ] No \`java.io.ObjectInputStream\` for untrusted data — use kotlinx.serialization or Moshi
- [ ] \`@Serializable\` data classes define explicit schemas (no \`Any\` fields)
- [ ] Sensitive fields marked \`@Transient\` to prevent serialization
- [ ] JSON parsing uses strict mode — no lenient parsing of untrusted input

### Coroutine Safety
- [ ] No unhandled exceptions in launched coroutines (use \`CoroutineExceptionHandler\` or try/catch)
- [ ] Cancellation properly handled — no resource leaks in \`finally\` blocks
- [ ] \`withTimeout\` used for external calls to prevent hanging coroutines
- [ ] Mutex used instead of \`synchronized\` in coroutine contexts

### Dependency Security
- [ ] Dependencies pinned in version catalog (\`libs.versions.toml\`)
- [ ] No snapshot or floating versions in production builds
- [ ] \`./gradlew dependencyCheckAnalyze\` (OWASP Dependency Check) or similar audit tool configured
- [ ] Gradle wrapper JAR verified (\`gradle-wrapper.jar\` SHA-256 checked)`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['kotlin-gradle-helper'],
        prompt: `## Kotlin-Specific Refactoring Patterns

### Java to Kotlin Idioms
- Convert POJOs to \`data class\` with \`val\` properties
- Replace \`static\` methods with companion object functions or top-level functions
- Convert null-check chains (\`if (x != null)\`) to safe calls (\`x?.method()\`) and elvis (\`?:\`)
- Replace Builder pattern with named parameters and default values
- Convert \`switch\` statements to \`when\` expressions
- Replace anonymous inner classes with lambdas or SAM conversions
- Convert Java Streams to Kotlin collection operations (\`map\`, \`filter\`, \`fold\`)
- Replace \`synchronized\` blocks with \`Mutex\` in coroutine contexts
- Replace callbacks with \`suspend\` functions and \`callbackFlow\`
- Convert \`AsyncTask\` or Thread-based code to coroutines

### Modern Kotlin Patterns
- Replace \`LiveData\` with \`StateFlow\` / \`SharedFlow\`
- Replace \`sealed class\` with \`sealed interface\` when no shared state is needed
- Replace manual factory methods with \`companion object\` factory functions
- Replace \`if (x != null) { ... }\` with \`x?.let { ... }\` when appropriate
- Replace multiple overloads with default parameter values
- Replace \`object : Interface { ... }\` with lambda when SAM conversion applies
- Extract repetitive coroutine patterns into reusable extension functions`,
      },
    ],
    skills: [
      {
        name: 'kotlin-gradle-helper',
        description: 'Gradle commands, dependency management, and build workflows for Kotlin projects',
        content: `# Kotlin Gradle Helper Skill

## Build & Check
- \`./gradlew build\` — compile, test, and assemble
- \`./gradlew build -x test\` — compile and assemble without running tests
- \`./gradlew compileKotlin\` — compile Kotlin sources only (fast check)
- \`./gradlew check\` — run all verification tasks (tests, linters)
- \`./gradlew clean build\` — clean build from scratch

## Testing
- \`./gradlew test\` — run all tests
- \`./gradlew test --tests "com.example.UserServiceTest"\` — run specific test class
- \`./gradlew test --tests "*UserServiceTest.should calculate*"\` — run tests matching pattern
- \`./gradlew test --info\` — verbose test output with logging
- \`./gradlew test --rerun\` — force rerun even if up-to-date
- \`./gradlew jacocoTestReport\` — generate code coverage report

## Linting & Formatting
- \`./gradlew ktlintCheck\` — check Kotlin code style
- \`./gradlew ktlintFormat\` — auto-fix style issues
- \`./gradlew detekt\` — run static analysis (code smells, complexity)
- \`./gradlew detektBaseline\` — generate baseline for existing issues

## Dependency Management
- \`./gradlew dependencies\` — full dependency tree
- \`./gradlew dependencies --configuration runtimeClasspath\` — runtime deps only
- \`./gradlew dependencyUpdates\` — check for newer versions (gradle-versions-plugin)
- \`./gradlew dependencyCheckAnalyze\` — OWASP vulnerability check
- Version catalog: edit \`gradle/libs.versions.toml\` for centralized version management

## Multi-Module
- \`./gradlew :module:test\` — test a specific module
- \`./gradlew :module:dependencies\` — deps for a specific module
- \`./gradlew projects\` — list all modules in the build

## Useful Flags
- \`--parallel\` — parallel module compilation
- \`--build-cache\` — enable build caching
- \`--scan\` — generate build scan for performance analysis
- \`-Dorg.gradle.jvmargs="-Xmx4g"\` — increase Gradle JVM memory
`,
      },
      {
        name: 'kotlin-coroutine-debug',
        description: 'Kotlin coroutine debugging, profiling, and diagnostics',
        content: `# Kotlin Coroutine Debug Skill

## Enable Coroutine Debug Agent
Add JVM arg to enable coroutine stack traces and names:
\`\`\`
-Dkotlinx.coroutines.debug
\`\`\`

Or in build.gradle.kts:
\`\`\`kotlin
tasks.test {
    jvmArgs("-Dkotlinx.coroutines.debug")
}
\`\`\`

## Name Coroutines for Debugging
\`\`\`kotlin
launch(CoroutineName("user-sync")) {
    // Stack traces will show "user-sync" instead of anonymous coroutine
}
\`\`\`

## Logging with Coroutine Context
\`\`\`kotlin
import org.slf4j.MDC
import kotlinx.coroutines.slf4j.MDCContext

// Propagate MDC (logging context) into coroutines
withContext(MDCContext()) {
    MDC.put("requestId", requestId)
    logger.info("Processing request") // requestId visible in logs
}
\`\`\`

## Detecting Blocking Calls
Enable blocking call detection in debug/test:
\`\`\`
-Dkotlinx.coroutines.debug
\`\`\`

In tests, use \`Dispatchers.setMain(testDispatcher)\` and verify no
blocking calls occur on the main dispatcher.

## Flow Debugging
\`\`\`kotlin
// Add onEach for visibility into flow emissions
repository.observeUpdates()
    .onEach { update -> logger.debug("Flow emission: $update") }
    .onCompletion { cause -> logger.debug("Flow completed: $cause") }
    .catch { e -> logger.error("Flow error", e) }
    .collect { update -> process(update) }
\`\`\`

## Memory Leak Detection
- Use LeakCanary (\`com.squareup.leakcanary:leakcanary-android\`) for Android
- Check that all CoroutineScopes are cancelled when their owner is destroyed
- Verify StateFlow collectors are lifecycle-aware (use \`repeatOnLifecycle\`)

## Common Coroutine Issues
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| UI freezes | Blocking call on Main dispatcher | Move to \`withContext(Dispatchers.IO)\` |
| Memory leak | Flow collected without lifecycle awareness | Use \`repeatOnLifecycle\` |
| Silent failures | Unhandled exception in \`launch\` | Add \`CoroutineExceptionHandler\` or try/catch |
| Test hangs | \`runBlocking\` instead of \`runTest\` | Use \`runTest { }\` from coroutines-test |
| Stale data | StateFlow not updating | Check that \`.value =\` assignment happens on correct scope |
| Race condition | Shared mutable state without synchronization | Use \`Mutex\` or \`StateFlow.update { }\` |
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "\\!\\!([^=]|$)" "$FILE_PATH" | head -5 | grep -q "." && { echo "Warning: Non-null assertion (!!) detected — prefer safe calls (?.), elvis (?:), or requireNotNull()" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for non-null assertion (!!) usage',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "GlobalScope\\." "$FILE_PATH" | head -5 | grep -q "." && { echo "GlobalScope usage detected — use a lifecycle-bound CoroutineScope instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for GlobalScope usage',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "\\bRuntime\\.getRuntime\\(\\)\\.exec\\b|\\bProcessBuilder\\(.*\\$" "$FILE_PATH" | head -3 | grep -q "." && { echo "Warning: Process execution detected — verify no unsanitized user input reaches the command" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for process execution patterns',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}") && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "ObjectInputStream|readObject\\(\\)" "$FILE_PATH" | head -3 | grep -q "." && { echo "Unsafe deserialization detected (ObjectInputStream) — use kotlinx.serialization or Moshi instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for unsafe deserialization',
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'ktlint',
        filePath: '.editorconfig',
        config: {
          '[*.{kt,kts}]': {
            ktlint_code_style: 'kotlin_official',
            indent_size: 4,
            indent_style: 'space',
            max_line_length: 120,
            insert_final_newline: true,
            trim_trailing_whitespace: true,
          },
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
