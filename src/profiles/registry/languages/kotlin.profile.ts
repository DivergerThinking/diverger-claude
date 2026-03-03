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

## Why This Matters
Kotlin's design emphasizes safety, conciseness, and interoperability. These rules are derived
from the official Kotlin Coding Conventions and eliminate the most common sources of bugs:
NullPointerException, non-exhaustive branching, and Java-isms that ignore Kotlin idioms.

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Packages | lowercase, no underscores | \`org.example.network\` |
| Classes, objects | PascalCase (nouns) | \`UserRepository\`, \`ConnectionPool\` |
| Interfaces | PascalCase (adjectives or nouns) | \`Serializable\`, \`EventListener\` |
| Functions | camelCase (verbs) | \`findById()\`, \`processPayment()\` |
| Properties, locals | camelCase | \`activeUserCount\`, \`retryDelay\` |
| Constants | SCREAMING_SNAKE_CASE | \`MAX_CONNECTIONS\`, \`DEFAULT_PORT\` |
| Enum entries | SCREAMING_SNAKE_CASE or PascalCase | \`PENDING\`, \`InProgress\` |
| Type parameters | single uppercase letter or short PascalCase | \`T\`, \`K\`, \`V\`, \`ResponseT\` |
| Backing properties | underscore prefix | \`_items\` exposed as \`items\` |

### Correct
\`\`\`kotlin
const val MAX_RETRY_COUNT = 3
val DEFAULT_TIMEOUT = 30.seconds

class OrderRepository(
    private val database: Database,
) {
    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders.asStateFlow()

    suspend fun findByCustomerId(customerId: CustomerId): List<Order> {
        return database.query("SELECT * FROM orders WHERE customer_id = ?", customerId.value)
    }
}
\`\`\`

### Anti-Pattern
\`\`\`kotlin
// Bad: Java-style naming, no type safety, meaningless names
val max_retry = 3  // snake_case for non-constant
class order_repo {   // lowercase with underscore
    fun get(id: Any): Any? { // generic names, Any type
        return db.query("SELECT * FROM orders WHERE id = " + id) // SQL injection
    }
}
\`\`\`

---

## Null Safety

### Never Use !! (Non-Null Assertion)
The \`!!\` operator defeats Kotlin's null safety and throws NPE at runtime.

\`\`\`kotlin
// Anti-pattern: crashes at runtime if user is null
val name = repository.findUser(id)!!.name

// Correct: safe call + elvis with meaningful fallback
val name = repository.findUser(id)?.name
    ?: throw UserNotFoundException("User $id not found")

// Correct: requireNotNull with context for preconditions
val user = requireNotNull(repository.findUser(id)) {
    "User $id must exist at this point — data integrity violation"
}
\`\`\`

### Use Safe Calls and Elvis Operator
\`\`\`kotlin
// Correct: chained safe calls with fallback
val city = user?.address?.city ?: "Unknown"

// Correct: nullable transformation with let
user?.let { activeUser ->
    notificationService.sendWelcome(activeUser.email)
}

// Correct: early return with elvis
fun processOrder(order: Order?) {
    val validOrder = order ?: return
    // proceed with non-null validOrder
}
\`\`\`

### Prefer lateinit for DI-Injected Properties
\`\`\`kotlin
// Correct: lateinit for framework-injected fields
class UserController {
    @Inject
    lateinit var userService: UserService
}

// Anti-pattern: nullable type for something that is always initialized
class UserController {
    @Inject
    var userService: UserService? = null  // forces ?. everywhere
}
\`\`\`

### Platform Type Safety
\`\`\`kotlin
// Correct: explicitly declare types from Java interop
val userName: String = javaApi.getUserName()   // fails fast if null
val email: String? = javaApi.getEmail()        // handles nullable gracefully

// Anti-pattern: let compiler infer platform type (String!)
val userName = javaApi.getUserName()  // type is String! — unsafe
\`\`\`

---

## Sealed Types for State Machines

\`\`\`kotlin
// Correct: sealed interface for UI state (no shared mutable state)
sealed interface UiState {
    data object Loading : UiState
    data class Success(val data: List<Item>) : UiState
    data class Error(val message: String, val cause: Throwable? = null) : UiState
}

// Correct: exhaustive when — compiler enforces all branches
fun render(state: UiState) = when (state) {
    is UiState.Loading -> showSpinner()
    is UiState.Success -> showItems(state.data)
    is UiState.Error -> showError(state.message)
    // No else needed — compiler verifies exhaustiveness
}
\`\`\`

---

## Data Classes

\`\`\`kotlin
// Correct: immutable DTO with copy() for modifications
data class UserProfile(
    val id: UserId,
    val name: String,
    val email: String,
    val tier: UserTier = UserTier.FREE,
)

val updated = profile.copy(tier = UserTier.PREMIUM)

// Anti-pattern: mutable data class with logic
data class UserProfile(
    var id: Long,        // mutable — breaks hashCode/equals stability
    var name: String,
) {
    fun validate() { }   // business logic does not belong in data class
}
\`\`\`

---

## When Expressions Over If-Else Chains

\`\`\`kotlin
// Correct: when as expression with exhaustive matching
val discount = when (customer.tier) {
    Tier.PLATINUM -> 0.30
    Tier.GOLD -> 0.20
    Tier.SILVER -> 0.10
    Tier.FREE -> 0.0
}

// Correct: when with range and guard conditions
fun classifyHttpStatus(code: Int): String = when (code) {
    in 200..299 -> "Success"
    in 300..399 -> "Redirect"
    in 400..499 -> "Client Error"
    in 500..599 -> "Server Error"
    else -> "Unknown ($code)"
}

// Anti-pattern: long if-else chain
val discount = if (tier == Tier.PLATINUM) 0.30
    else if (tier == Tier.GOLD) 0.20
    else if (tier == Tier.SILVER) 0.10
    else 0.0
\`\`\`

---

## Scope Functions

| Function | Object ref | Return value | Use case |
|----------|-----------|-------------|----------|
| \`let\` | \`it\` | Lambda result | Nullable transformations, scoping |
| \`run\` | \`this\` | Lambda result | Object configuration + compute result |
| \`with\` | \`this\` | Lambda result | Grouping calls on an object |
| \`apply\` | \`this\` | Object itself | Object configuration (builder-style) |
| \`also\` | \`it\` | Object itself | Side effects (logging, validation) |

\`\`\`kotlin
// Correct: apply for object configuration
val connection = Connection().apply {
    host = "localhost"
    port = 8080
    timeout = 30.seconds
}

// Correct: let for nullable transformation
val length = name?.let { it.trim().length } ?: 0

// Correct: also for side effects
val user = userRepository.findById(id).also {
    logger.info("Fetched user: \${it.name}")
}

// Anti-pattern: deeply nested scope functions
obj.let { a ->
    a.run {
        also { b ->
            b.apply { /* unreadable */ }
        }
    }
}
\`\`\`
`,
      },
      {
        path: 'kotlin/coroutines-and-flow.md',
        paths: ['**/*.kt', '**/*.kts'],
        governance: 'mandatory',
        description: 'Kotlin coroutines structured concurrency, Flow patterns, and error handling',
        content: `# Kotlin Coroutines & Flow Best Practices

## Why This Matters
Coroutines are Kotlin's foundation for asynchronous programming. Incorrect usage causes
resource leaks, silent failures, and untestable code. These rules enforce structured
concurrency and safe error propagation as defined in the official Coroutines Guide.

---

## Structured Concurrency

### Always Use a CoroutineScope — Never GlobalScope
\`\`\`kotlin
// Anti-pattern: GlobalScope breaks structured concurrency
GlobalScope.launch {
    fetchData() // leaked coroutine — no lifecycle, no cancellation
}

// Correct: scoped to a lifecycle
class UserViewModel : ViewModel() {
    fun loadUsers() {
        viewModelScope.launch {
            val users = userRepository.getAll()
            _uiState.value = UiState.Success(users)
        }
    }
}

// Correct: custom scope with SupervisorJob
class OrderService(
    private val scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default),
) {
    fun processAsync(order: Order) {
        scope.launch { process(order) }
    }

    fun shutdown() {
        scope.cancel()
    }
}
\`\`\`

### Use SupervisorJob When Children Must Be Independent
\`\`\`kotlin
// Correct: one failed child does not cancel siblings
supervisorScope {
    launch { fetchUserProfile(userId) }    // failure here
    launch { fetchUserOrders(userId) }     // still runs
    launch { fetchRecommendations(userId) } // still runs
}

// Anti-pattern: coroutineScope cancels everything on first failure
coroutineScope {
    launch { fetchUserProfile(userId) }    // failure here
    launch { fetchUserOrders(userId) }     // CANCELLED
    launch { fetchRecommendations(userId) } // CANCELLED
}
\`\`\`

### Cancel Scopes When Their Lifecycle Ends
\`\`\`kotlin
class WebSocketManager : Closeable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun connect(url: String) {
        scope.launch { /* ... */ }
    }

    override fun close() {
        scope.cancel() // cancel all coroutines on cleanup
    }
}
\`\`\`

---

## Dispatchers

| Dispatcher | Use case |
|-----------|----------|
| \`Dispatchers.Main\` | UI updates, lightweight UI logic |
| \`Dispatchers.IO\` | Network calls, file I/O, database queries |
| \`Dispatchers.Default\` | CPU-intensive work (sorting, parsing, computation) |

### Inject Dispatchers for Testability
\`\`\`kotlin
// Correct: injectable dispatcher
class DataProcessor(
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
) {
    suspend fun loadAndParse(path: String): Config = withContext(ioDispatcher) {
        val raw = File(path).readText()
        parseConfig(raw)
    }
}

// Anti-pattern: hardcoded dispatcher — cannot test without real I/O
class DataProcessor {
    suspend fun loadAndParse(path: String): Config = withContext(Dispatchers.IO) {
        val raw = File(path).readText()
        parseConfig(raw)
    }
}
\`\`\`

### Never Block the Coroutine Dispatcher
\`\`\`kotlin
// Anti-pattern: blocking call inside coroutine
suspend fun readFile(path: String): String {
    return File(path).readText() // blocks the dispatcher thread
}

// Correct: use withContext(Dispatchers.IO) for blocking I/O
suspend fun readFile(path: String): String = withContext(Dispatchers.IO) {
    File(path).readText()
}
\`\`\`

---

## Coroutine Error Handling

### Use try/catch Within Coroutines for Expected Errors
\`\`\`kotlin
viewModelScope.launch {
    _uiState.value = UiState.Loading
    try {
        val users = userRepository.getAll()
        _uiState.value = UiState.Success(users)
    } catch (e: HttpException) {
        _uiState.value = UiState.Error("Server error: \${e.code()}")
    } catch (e: IOException) {
        _uiState.value = UiState.Error("Network error — check your connection")
    }
}
\`\`\`

### Use CoroutineExceptionHandler for Uncaught Errors in Root Coroutines
\`\`\`kotlin
val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
    logger.error("Unhandled coroutine exception", throwable)
    crashReporter.report(throwable)
}

val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default + exceptionHandler)
\`\`\`

### Use runCatching / Result<T> for Functional Error Handling
\`\`\`kotlin
suspend fun fetchUser(id: UserId): Result<User> = runCatching {
    api.getUser(id.value)
}

// Caller
fetchUser(id)
    .onSuccess { user -> showProfile(user) }
    .onFailure { error -> showError(error.message ?: "Unknown error") }
\`\`\`

### launch vs async Exception Behavior
\`\`\`kotlin
// launch: propagates exceptions automatically (uncaught → crashes parent)
scope.launch {
    throw IOException("Connection lost") // propagated to parent/handler
}

// async: defers exception to .await() call
val deferred = scope.async {
    throw IOException("Connection lost") // nothing happens yet
}
try {
    deferred.await() // exception thrown HERE
} catch (e: IOException) {
    handleError(e)
}
\`\`\`

---

## Flow Patterns

### Cold Flows — Use flow { } for Streams
\`\`\`kotlin
fun observePrices(symbol: String): Flow<Price> = flow {
    while (currentCoroutineContext().isActive) {
        val price = api.getLatestPrice(symbol)
        emit(price)
        delay(1.seconds)
    }
}
\`\`\`

### StateFlow for Observable State (Replaces LiveData)
\`\`\`kotlin
class SearchViewModel : ViewModel() {
    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    private val _results = MutableStateFlow<List<Item>>(emptyList())
    val results: StateFlow<List<Item>> = _results.asStateFlow()

    init {
        _query
            .debounce(300.milliseconds)
            .filter { it.length >= 2 }
            .flatMapLatest { query -> searchRepository.search(query) }
            .onEach { _results.value = it }
            .launchIn(viewModelScope)
    }
}
\`\`\`

### SharedFlow for Events (One-Shot Signals)
\`\`\`kotlin
class EventBus {
    private val _events = MutableSharedFlow<AppEvent>()
    val events: SharedFlow<AppEvent> = _events.asSharedFlow()

    suspend fun emit(event: AppEvent) {
        _events.emit(event)
    }
}
\`\`\`

### Use flowOn() — Never withContext Inside flow { }
\`\`\`kotlin
// Correct: flowOn changes upstream context
fun loadItems(): Flow<Item> = flow {
    val items = database.queryAll()
    items.forEach { emit(it) }
}.flowOn(Dispatchers.IO)

// Anti-pattern: withContext inside flow violates context preservation
fun loadItems(): Flow<Item> = flow {
    withContext(Dispatchers.IO) {  // IllegalStateException!
        val items = database.queryAll()
        items.forEach { emit(it) }
    }
}
\`\`\`

### Collect Flows in Lifecycle-Aware Manner
\`\`\`kotlin
// Correct: repeatOnLifecycle for safe collection in Android
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state ->
            render(state)
        }
    }
}
\`\`\`

### Error Handling in Flows
\`\`\`kotlin
// Correct: catch operator for upstream errors
repository.observeUpdates()
    .map { parseUpdate(it) }
    .catch { e ->
        logger.error("Stream error", e)
        emit(FallbackUpdate)
    }
    .onCompletion { cause ->
        if (cause != null) logger.warn("Flow completed with error", cause)
    }
    .collect { update -> applyUpdate(update) }
\`\`\`

### Buffering and Conflation
\`\`\`kotlin
// buffer: decouple fast emitter from slow collector
sensorReadings()
    .buffer()
    .collect { reading -> processSlowly(reading) }

// conflate: skip intermediate values when collector is slow
locationUpdates()
    .conflate()
    .collect { location -> updateMap(location) }

// collectLatest: cancel previous collection on new value
searchQuery
    .collectLatest { query ->
        val results = search(query) // cancelled if new query arrives
        showResults(results)
    }
\`\`\`
`,
      },
      {
        path: 'kotlin/project-structure-and-security.md',
        paths: ['**/*.kt', '**/*.kts'],
        governance: 'recommended',
        description: 'Kotlin project structure, Gradle conventions, and security patterns',
        content: `# Kotlin Project Structure & Security

## Why This Matters
Consistent project structure reduces cognitive load and onboarding time. Security
rules prevent the most common Kotlin/JVM vulnerabilities: injection, deserialization,
and leaked credentials.

---

## Project Structure

### Standard Gradle Layout
\`\`\`
project/
  build.gradle.kts          # Build configuration (Kotlin DSL)
  settings.gradle.kts       # Project and module settings
  gradle.properties          # Build properties
  gradle/
    libs.versions.toml       # Version catalog (centralized dependencies)
  src/
    main/
      kotlin/
        com/example/
          Application.kt     # Entry point (thin — wire deps, delegate)
          config/             # Configuration classes
          domain/             # Domain models, business logic
            model/
            service/
            repository/
          api/                # API layer (controllers, routes)
          infra/              # Infrastructure (database, HTTP clients)
      resources/
        application.yaml     # Runtime configuration
    test/
      kotlin/
        com/example/
          domain/             # Unit tests mirroring src/ structure
          api/                # Integration tests
      resources/
        application-test.yaml
\`\`\`

### Module Organization for Multi-Module Projects
\`\`\`
project/
  settings.gradle.kts
  gradle/libs.versions.toml
  app/                       # Application module (entry point)
    build.gradle.kts
  core/                      # Shared domain models and interfaces
    build.gradle.kts
  data/                      # Data layer (repositories, data sources)
    build.gradle.kts
  features/
    user/                    # Feature module
      build.gradle.kts
    order/
      build.gradle.kts
\`\`\`

---

## Gradle Conventions (Kotlin DSL)

### Version Catalog (gradle/libs.versions.toml)
\`\`\`toml
[versions]
kotlin = "2.1.0"
coroutines = "1.10.2"
ktor = "3.0.0"

[libraries]
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutines" }
ktor-server-core = { module = "io.ktor:ktor-server-core", version.ref = "ktor" }

[plugins]
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
\`\`\`

### build.gradle.kts Best Practices
\`\`\`kotlin
plugins {
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    jvmToolchain(21)  // Pin JDK version
}

dependencies {
    implementation(libs.kotlinx.coroutines.core)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}
\`\`\`

---

## Kotlin-Specific Security

### Never Use String Concatenation for Queries
\`\`\`kotlin
// Anti-pattern: SQL injection vulnerability
fun findUser(name: String): User? {
    val sql = "SELECT * FROM users WHERE name = '$name'"
    return db.query(sql).firstOrNull()
}

// Correct: parameterized query
fun findUser(name: String): User? {
    return db.query("SELECT * FROM users WHERE name = ?", name).firstOrNull()
}
\`\`\`

### Avoid Unsafe Deserialization
\`\`\`kotlin
// Anti-pattern: Java serialization with untrusted data
val obj = ObjectInputStream(untrustedStream).readObject()

// Correct: use kotlinx.serialization with explicit schema
@Serializable
data class UserPayload(val name: String, val email: String)

val user = Json.decodeFromString<UserPayload>(jsonString)
\`\`\`

### Secure Random Generation
\`\`\`kotlin
// Anti-pattern: predictable randomness
val token = (1..32).map { ('a'..'z').random() }.joinToString("")

// Correct: cryptographic randomness
import java.security.SecureRandom
import java.util.Base64

val token = ByteArray(32).also { SecureRandom().nextBytes(it) }
    .let { Base64.getUrlEncoder().withoutPadding().encodeToString(it) }
\`\`\`

### Validate External Input
\`\`\`kotlin
// Correct: validate and constrain all external input
fun createUser(request: CreateUserRequest): User {
    require(request.name.isNotBlank()) { "Name must not be blank" }
    require(request.email.contains("@")) { "Invalid email format" }
    require(request.age in 0..150) { "Age must be between 0 and 150" }
    return userRepository.create(request)
}
\`\`\`

### Credential Safety
- Never hardcode API keys, passwords, or secrets in source code
- Use environment variables or secret managers (Vault, AWS Secrets Manager)
- Never log sensitive data — passwords, tokens, PII
- Use \`@Transient\` or \`@kotlinx.serialization.Transient\` to exclude sensitive fields from serialization
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "\\!\\!([^=]|$)" "$CLAUDE_FILE_PATH" | head -5 | grep -q "." && echo "HOOK_EXIT:0:Warning: Non-null assertion (!!) detected — prefer safe calls (?.), elvis (?:), or requireNotNull()" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "GlobalScope\\." "$CLAUDE_FILE_PATH" | head -5 | grep -q "." && echo "HOOK_EXIT:1:GlobalScope usage detected — use a lifecycle-bound CoroutineScope instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "\\bRuntime\\.getRuntime\\(\\)\\.exec\\b|\\bProcessBuilder\\(.*\\$" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: Process execution detected — verify no unsanitized user input reaches the command" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.kt$|\\.kts$" && grep -nE "ObjectInputStream|readObject\\(\\)" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:1:Unsafe deserialization detected (ObjectInputStream) — use kotlinx.serialization or Moshi instead" || true',
            timeout: 10,
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
