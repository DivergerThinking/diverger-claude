import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const javaProfile: Profile = {
  id: 'languages/java',
  name: 'Java',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['java'],
  contributions: {
    claudeMd: [
      {
        heading: 'Java Conventions',
        order: 10,
        content: `## Java Conventions

Modern Java (17+) with strong typing, records, sealed classes, and pattern matching.

**Detailed rules:** see \`.claude/rules/java/\` directory.

**Key rules:**
- Use records for immutable data, sealed interfaces for sum types, Optional for nullable returns
- Follow standard naming: PascalCase classes, camelCase methods, UPPER_SNAKE constants
- Streams for collection processing, but prefer readability over chaining
- Handle exceptions with specific types — never catch generic \`Exception\` in business logic`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(javac:*)',
          'Bash(java:*)',
          'Bash(mvn:*)',
          'Bash(gradle:*)',
          'Bash(./gradlew:*)',
          'Bash(./mvnw:*)',
          'Bash(jshell:*)',
          'Bash(jpackage:*)',
        ],
      },
    },
    rules: [
      {
        path: 'java/conventions.md',
        paths: ['**/*.java'],
        governance: 'mandatory',
        description: 'Java coding conventions aligned with Google Java Style Guide and Oracle conventions',
        content: `# Java Conventions

## Naming (Google Java Style Guide)

- Classes/interfaces: PascalCase nouns — \`UserService\`, \`PaymentGateway\`
- Methods: camelCase verbs — \`getUserById()\`, \`calculateDiscount()\`, \`isValid()\`
- Variables/parameters: camelCase, descriptive — \`remainingRetries\`, not \`r\` or \`cnt\`
- Constants: SCREAMING_SNAKE_CASE for deeply immutable \`static final\` — \`MAX_RETRY_COUNT\`
- Packages: all lowercase, reverse domain, no underscores — \`com.example.auth.service\`
- Type parameters: single uppercase or descriptive — \`T\`, \`K\`, \`V\`, \`RequestT\`

## Source File Structure

- One top-level class per file, name matches class name
- Order: static fields -> instance fields -> constructors -> methods
- No wildcard imports (\`import java.util.*\` forbidden) — use explicit imports
- K&R braces (opening on same line), always required even for single-statement blocks

## Type Safety

- Use \`Optional<T>\` for nullable returns — never pass Optional as a parameter
- Use records for value objects/DTOs — free equals, hashCode, toString
- Use sealed classes/interfaces for closed type hierarchies with exhaustive switch
- Prefer immutable collections: \`List.of()\`, \`Map.of()\`, \`Set.of()\`, \`List.copyOf()\`
- Never use raw types — always parameterize generics

## Error Handling

- Checked exceptions for recoverable conditions, unchecked for programming errors
- Define custom exceptions with context fields for domain errors
- Never catch \`Exception\`/\`Throwable\` without re-throwing — catch specific types
- Always include root cause: \`new XException("msg", cause)\`
- Use try-with-resources for all \`AutoCloseable\` — never manual finally cleanup
- Never swallow exceptions with empty catch blocks

## Concurrency

- Prefer \`java.util.concurrent\` utilities over manual \`synchronized\`
- Use virtual threads (Java 21+) for I/O-bound workloads
- Use \`ExecutorService\` and \`CompletableFuture\` for structured async
- Use \`ConcurrentHashMap\` over \`Collections.synchronizedMap()\`
- Avoid shared mutable state — prefer immutable objects between threads
- Use \`AtomicReference\`/\`AtomicInteger\` for lock-free atomic operations
`,
      },
      {
        path: 'java/streams-and-collections.md',
        paths: ['**/*.java'],
        governance: 'recommended',
        description: 'Java Stream API patterns and collection best practices',
        content: `# Java Stream API & Collections

## Stream API Best Practices

- Use Streams for collection transformations — express intent more clearly than loops
- Use \`Stream.toList()\` (Java 16+) or \`Collectors.toUnmodifiableList()\` for immutable results
- No side effects inside Stream operations — streams are pure functional pipelines
- Use \`flatMap\` for nested collections, \`map\` for one-to-one transformations
- Prefer method references (\`User::getName\`) over lambdas when clearer
- Use \`Optional\` return from \`findFirst()\`/\`findAny()\` — never assume non-empty
- Avoid Streams for simple iterations — for-each is clearer for single operations

## Collection Factories (Java 9+)

- Use \`List.of()\`, \`Set.of()\`, \`Map.of()\` for small immutable collections
- Use \`List.copyOf()\`, \`Set.copyOf()\`, \`Map.copyOf()\` for defensive copies
- Return \`List.of()\` instead of null for empty collections
- Use \`Map.ofEntries(Map.entry(k, v), ...)\` for maps with more than 10 entries

## Project Structure

- Follow Maven standard layout (\`src/main/java\`, \`src/test/java\`, \`src/main/resources\`)
- One public class per file — name must match class name
- Group classes by feature/domain, not by technical layer
- Keep packages cohesive — minimize cross-package dependencies
- Use module-info.java (JPMS) for library projects to control encapsulation
`,
      },
      {
        path: 'java/security.md',
        paths: ['**/*.java'],
        governance: 'mandatory',
        description: 'Java security rules: OWASP, input validation, crypto, deserialization, secrets',
        content: `# Java Security Rules (OWASP + CERT Oracle)

## SQL Injection Prevention

- Use \`PreparedStatement\` or ORM parameterized queries for ALL SQL — never string concatenation
- Verify native queries in JPA/Hibernate use parameter binding (\`:param\` or \`?1\`)
- Flag any \`Statement.execute()\` or \`Statement.executeQuery()\` with concatenated strings

## Deserialization Safety

- Flag \`ObjectInputStream\` usage without allowlists — deserialization of untrusted data is critical
- Use JSON (Jackson/Gson) or Protocol Buffers instead of Java serialization
- If Java serialization is required, implement \`ObjectInputFilter\` to restrict allowed classes

## Command Injection

- Never use \`Runtime.exec()\` with unsanitized user input
- Use \`ProcessBuilder\` with argument lists (not a single command string)
- Validate and sanitize all external input before passing to system commands

## XML Security (XXE Prevention)

- Disable external entities in all XML parsers:
  - \`DocumentBuilderFactory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)\`
  - \`SAXParserFactory\`: disable external general and parameter entities
- Use \`JAXB\` or \`StAX\` with secure defaults for XML processing

## Secrets Management

- Never hardcode passwords, API keys, or crypto keys in source code
- Use environment variables, vault services, or encrypted config files
- Flag string literals that look like tokens, passwords, or connection strings

## Path Traversal

- Validate and canonicalize file paths from user input: \`Path.normalize().startsWith(baseDir)\`
- Never construct file paths by concatenating user input without validation
- Use \`java.nio.file.Path\` resolve/normalize — never string concatenation for paths

## Cryptography

- Forbidden: DES, 3DES, MD5, SHA-1 for security purposes
- Required: AES-256-GCM, SHA-256+, bcrypt/Argon2/scrypt for password hashing
- Use \`SecureRandom\` for all security-sensitive random values — never \`java.util.Random\`
- Never disable certificate validation or use TrustManagers that trust all certificates

## Logging Security

- Sanitize user input before passing to logging frameworks (prevent log injection)
- Never log: passwords, tokens, PII, credit card numbers, session IDs
- Use structured logging to avoid format string injection

## Resource Management

- Use try-with-resources for ALL \`AutoCloseable\` instances — prevent resource leaks
- Set timeouts on all network operations — prevent denial-of-service via slow connections
- Limit request body sizes and collection sizes from untrusted input
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Java-Specific Review
- Check for null returns where Optional should be used on public API boundaries
- Verify try-with-resources for all AutoCloseable instances (streams, connections, readers)
- Check for raw types and missing generics — flag any unparameterized collection usage
- Check for proper exception handling: no swallowed exceptions, no catching Throwable
- Verify exception wrapping includes root cause: new XException("msg", cause)
- Verify immutability: records for value objects, List.of()/Set.of() for constant collections
- Check for thread safety issues: shared mutable state, unsynchronized access
- Verify Stream API usage: no side effects in pipelines, no forEach for transformations
- Check for wildcard imports (import java.util.*) — must use explicit imports
- Verify Javadoc on all public classes, interfaces, and methods with @param/@return/@throws
- Check for deprecated APIs: use java.time instead of java.util.Date, use List.copyOf instead of Collections.unmodifiableList
- Verify naming follows Google Java Style Guide: PascalCase classes, camelCase methods, SCREAMING_SNAKE constants
- Flag instanceof chains that should be switch expressions with pattern matching (Java 21+)
- Check for magic numbers — must use named constants`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Java Testing
- Use JUnit 5 (Jupiter) with @DisplayName for human-readable test names
- Use @Nested classes to group related test scenarios by method or behavior
- Use @ParameterizedTest with @ValueSource, @CsvSource, @MethodSource for data-driven tests
- Use Mockito with @ExtendWith(MockitoExtension.class) for mocking
- Use AssertJ fluent assertions: assertThat(result).isEqualTo(expected)
- Test Optional return values for both present and empty cases
- Test exception messages and types with assertThatThrownBy() (AssertJ) or assertThrows (JUnit)
- Use @TempDir for filesystem-dependent tests
- Test thread-safety with concurrent test harnesses when applicable
- Test sealed type hierarchies exhaustively — cover all permitted subtypes
- Follow Given-When-Then pattern in test method names: givenX_whenY_thenZ`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['java-refactor'],
        prompt: `## Java-Specific Refactoring
- Convert POJOs to records when the class is a pure data carrier (only fields + accessors + equals/hashCode)
- Replace instanceof chains with switch expressions using pattern matching (Java 21+)
- Replace anonymous inner classes with lambdas for functional interfaces
- Replace verbose string concatenation with text blocks for multi-line strings (SQL, JSON, XML)
- Replace Collections.unmodifiableList() with List.copyOf() or List.of()
- Replace manual thread management with ExecutorService or virtual threads (Java 21+)
- Replace Date/Calendar with java.time API (LocalDate, Instant, ZonedDateTime)
- Replace StringBuffer with StringBuilder for non-concurrent contexts
- Extract complex stream pipelines into named private methods when they exceed 5 operations
- Replace imperative collection building loops with Stream.collect() pipelines`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Java Security Review (OWASP + CERT Oracle)
- Check for SQL injection: verify PreparedStatement or ORM parameterized queries — no string concatenation in SQL
- Check for deserialization vulnerabilities: flag ObjectInputStream usage without allowlists
- Verify no use of Runtime.exec() with unsanitized user input — use ProcessBuilder with argument lists
- Check for XML External Entity (XXE): verify DocumentBuilderFactory disables external entities
- Verify no hardcoded secrets: passwords, API keys, or crypto keys in source code
- Check for path traversal: validate and canonicalize file paths from user input
- Verify crypto: no DES, MD5, SHA-1 for security; use AES-256, SHA-256+, bcrypt/Argon2
- Check for insecure random: use SecureRandom, not java.util.Random, for security-sensitive operations
- Verify HTTPS/TLS: no disabled certificate validation, no TrustManager that trusts all
- Check for log injection: sanitize user input before passing to logging frameworks
- Verify sensitive data is not logged: passwords, tokens, PII, credit card numbers`,
      },
    ],
    skills: [
      {
        name: 'java-patterns-guide',
        description: 'Detailed reference for Java design patterns with modern Java examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Java Design Patterns — Detailed Reference

## Why This Matters
Design patterns in Java have evolved significantly with modern language features. Records,
sealed classes, and pattern matching make many classic Gang-of-Four patterns simpler and
more type-safe. This guide covers the most commonly needed patterns in contemporary Java
development with both correct usage and common anti-patterns.

---

## 1. Builder Pattern

Use when a class has more than 3-4 optional parameters. Prevents telescoping constructors.

\\\`\\\`\\\`java
// Correct: fluent builder with validation
public record HttpRequest(
    String url, String method, Map<String, String> headers, byte[] body, Duration timeout
) {
    public static Builder builder(String url) { return new Builder(url); }

    public static final class Builder {
        private final String url;
        private String method = "GET";
        private final Map<String, String> headers = new LinkedHashMap<>();
        private byte[] body;
        private Duration timeout = Duration.ofSeconds(30);

        private Builder(String url) { this.url = Objects.requireNonNull(url); }

        public Builder method(String method) { this.method = method; return this; }
        public Builder header(String key, String value) { headers.put(key, value); return this; }
        public Builder body(byte[] body) { this.body = body; return this; }
        public Builder timeout(Duration timeout) { this.timeout = timeout; return this; }

        public HttpRequest build() {
            if (body != null && "GET".equals(method)) {
                throw new IllegalStateException("GET requests cannot have a body");
            }
            return new HttpRequest(url, method, Map.copyOf(headers), body, timeout);
        }
    }
}

// Usage:
var request = HttpRequest.builder("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .body(jsonBytes)
    .timeout(Duration.ofSeconds(10))
    .build();
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: telescoping constructors
public HttpRequest(String url) { this(url, "GET"); }
public HttpRequest(String url, String method) { this(url, method, null); }
public HttpRequest(String url, String method, byte[] body) { this(url, method, body, null); }
// BAD: hard to read, easy to mix up parameter order
\\\`\\\`\\\`

---

## 2. Factory Pattern

Use when object creation logic is complex or you need to return different subtypes.

\\\`\\\`\\\`java
// Correct: sealed interface + factory method
public sealed interface Notification permits EmailNotification, SmsNotification, PushNotification {

    static Notification of(String type, String recipient, String message) {
        return switch (type.toLowerCase()) {
            case "email" -> new EmailNotification(recipient, message);
            case "sms"   -> new SmsNotification(recipient, message);
            case "push"  -> new PushNotification(recipient, message);
            default -> throw new IllegalArgumentException("Unknown notification type: " + type);
        };
    }
}

public record EmailNotification(String email, String message) implements Notification {}
public record SmsNotification(String phone, String message) implements Notification {}
public record PushNotification(String deviceId, String message) implements Notification {}
\\\`\\\`\\\`

---

## 3. Strategy Pattern

Use to select algorithms or behaviors at runtime. Modern Java uses functional interfaces.

\\\`\\\`\\\`java
// Correct: strategy as functional interface
@FunctionalInterface
public interface PricingStrategy {
    BigDecimal calculate(BigDecimal basePrice, int quantity);

    // Pre-defined strategies as static methods
    static PricingStrategy standard() { return (price, qty) -> price.multiply(BigDecimal.valueOf(qty)); }
    static PricingStrategy bulk(double discount) {
        return (price, qty) -> qty >= 10
            ? price.multiply(BigDecimal.valueOf(qty * (1 - discount)))
            : price.multiply(BigDecimal.valueOf(qty));
    }
}

// Usage:
var strategy = order.isBulk() ? PricingStrategy.bulk(0.15) : PricingStrategy.standard();
var total = strategy.calculate(unitPrice, quantity);
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: if/else chain instead of strategy
if (type.equals("standard")) { /* calculate */ }
else if (type.equals("bulk")) { /* calculate */ }
else if (type.equals("premium")) { /* calculate */ }
// BAD: violates Open-Closed Principle, hard to extend
\\\`\\\`\\\`

---

## 4. Observer Pattern

Modern Java prefers functional callbacks or reactive streams over classic Observer.

\\\`\\\`\\\`java
// Correct: type-safe event system with functional listeners
public class EventBus<E> {
    private final Map<Class<?>, List<Consumer<?>>> listeners = new ConcurrentHashMap<>();

    public <T extends E> void on(Class<T> eventType, Consumer<T> listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>()).add(listener);
    }

    @SuppressWarnings("unchecked")
    public <T extends E> void emit(T event) {
        var handlers = listeners.getOrDefault(event.getClass(), List.of());
        handlers.forEach(h -> ((Consumer<T>) h).accept(event));
    }
}
\\\`\\\`\\\`

---

## 5. Repository Pattern

Abstracts data access behind a clean interface.

\\\`\\\`\\\`java
// Correct: generic repository interface
public interface Repository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    T save(T entity);
    void deleteById(ID id);
    boolean existsById(ID id);
}

// Concrete implementation
public class JpaUserRepository implements Repository<User, Long> {
    private final EntityManager em;

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(em.find(User.class, id));
    }
    // ...
}
\\\`\\\`\\\`

---

## 6. DTO Mapping

\\\`\\\`\\\`java
// Correct: records as DTOs with explicit mapping
public record UserDto(String name, String email, String role) {
    public static UserDto from(User user) {
        return new UserDto(user.getName(), user.getEmail(), user.getRole().name());
    }

    public User toEntity() {
        return new User(name, email, Role.valueOf(role));
    }
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: exposing JPA entities directly in API responses
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) { return repo.findById(id).orElseThrow(); }
// BAD: leaks internal fields, lazy-loading proxies, circular references
\\\`\\\`\\\`

---

## 7. Optional Usage

\\\`\\\`\\\`java
// Correct: Optional for return values that may be absent
public Optional<User> findByEmail(String email) {
    return users.stream().filter(u -> u.email().equals(email)).findFirst();
}

// Correct: chaining Optional operations
String displayName = findByEmail(email)
    .map(User::displayName)
    .orElse("Anonymous");
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: Optional as parameter
public void sendEmail(Optional<String> cc) { ... }
// BAD: callers forced to wrap — use @Nullable or method overloads

// Anti-Pattern: Optional.get() without check
Optional<User> user = findByEmail(email);
String name = user.get(); // BAD: throws NoSuchElementException if empty
// Use orElseThrow(), orElse(), or ifPresent() instead
\\\`\\\`\\\`

---

## 8. Records (Java 16+)

\\\`\\\`\\\`java
// Correct: record with compact constructor validation
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount, "amount must not be null");
        Objects.requireNonNull(currency, "currency must not be null");
        if (amount.signum() < 0) throw new IllegalArgumentException("amount must be non-negative");
    }

    public Money add(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(amount.add(other.amount), currency);
    }
}
\\\`\\\`\\\`

---

## 9. Sealed Classes (Java 17+)

\\\`\\\`\\\`java
// Correct: algebraic data type with exhaustive pattern matching
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}
public record Circle(double radius) implements Shape {
    public double area() { return Math.PI * radius * radius; }
}
public record Rectangle(double width, double height) implements Shape {
    public double area() { return width * height; }
}
public record Triangle(double base, double height) implements Shape {
    public double area() { return 0.5 * base * height; }
}

// Exhaustive switch — compiler enforces all cases covered
String describe(Shape shape) {
    return switch (shape) {
        case Circle c    -> "Circle with radius " + c.radius();
        case Rectangle r -> "Rectangle " + r.width() + "x" + r.height();
        case Triangle t  -> "Triangle with base " + t.base();
        // No default needed — sealed type is exhaustive
    };
}
\\\`\\\`\\\`

---

## 10. Pattern Matching (Java 21+)

\\\`\\\`\\\`java
// Correct: pattern matching with guards
String format(Object obj) {
    return switch (obj) {
        case Integer i when i < 0     -> "negative: " + i;
        case Integer i                -> "positive: " + i;
        case String s when s.isBlank() -> "empty string";
        case String s                 -> "string: " + s;
        case List<?> l when l.isEmpty() -> "empty list";
        case List<?> l                -> "list of " + l.size();
        case null                     -> "null";
        default                       -> obj.getClass().getSimpleName();
    };
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: instanceof chain
if (obj instanceof Integer) { ... }
else if (obj instanceof String) { ... }
else if (obj instanceof List) { ... }
// BAD: verbose, error-prone, no exhaustiveness check
\\\`\\\`\\\`
`,
      },
      {
        name: 'java-concurrency-guide',
        description: 'Detailed reference for Java concurrency patterns with modern Java examples',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Java Concurrency — Detailed Reference

## Why This Matters
Concurrency bugs are among the hardest to find and reproduce — data races, deadlocks,
and visibility issues can lurk undetected for months. Modern Java (21+) introduces
virtual threads and structured concurrency that dramatically simplify concurrent
programming, but understanding the fundamentals is still essential.

---

## 1. Virtual Threads (Java 21+)

Virtual threads are lightweight threads managed by the JVM. Use them for I/O-bound work
— they scale to millions without the overhead of platform threads.

\\\`\\\`\\\`java
// Correct: virtual thread executor for I/O-bound tasks
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> futures = urls.stream()
        .map(url -> executor.submit(() -> fetchUrl(url)))
        .toList();

    List<String> results = futures.stream()
        .map(f -> {
            try { return f.get(); }
            catch (Exception e) { throw new RuntimeException(e); }
        })
        .toList();
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Correct: simple virtual thread creation
Thread.startVirtualThread(() -> {
    var result = callRemoteService();
    processResult(result);
});
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: pooling virtual threads
var pool = Executors.newFixedThreadPool(100); // BAD: don't pool virtual threads
// Virtual threads are cheap to create — use newVirtualThreadPerTaskExecutor()
// Pooling them defeats the purpose and limits scalability

// Anti-Pattern: CPU-bound work on virtual threads
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> computeHash(data)); // BAD: CPU-bound blocks the carrier thread
}
// Use platform threads (ForkJoinPool) for CPU-bound computation
\\\`\\\`\\\`

---

## 2. CompletableFuture

Composable async operations with chaining, combining, and error handling.

\\\`\\\`\\\`java
// Correct: chain async operations
CompletableFuture<OrderConfirmation> placeOrder(Order order) {
    return validateOrder(order)
        .thenCompose(valid -> reserveInventory(valid))
        .thenCompose(reserved -> chargePayment(reserved))
        .thenApply(payment -> new OrderConfirmation(order.id(), payment.transactionId()))
        .exceptionally(ex -> {
            log.error("Order failed: {}", order.id(), ex);
            throw new OrderFailedException(order.id(), ex);
        });
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Correct: combine multiple async results
CompletableFuture<Dashboard> loadDashboard(String userId) {
    var profileFuture = fetchProfile(userId);
    var ordersFuture = fetchRecentOrders(userId);
    var notificationsFuture = fetchNotifications(userId);

    return CompletableFuture.allOf(profileFuture, ordersFuture, notificationsFuture)
        .thenApply(v -> new Dashboard(
            profileFuture.join(),
            ordersFuture.join(),
            notificationsFuture.join()
        ));
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: blocking on CompletableFuture immediately
var result = someAsyncOperation().get(); // BAD: blocks the calling thread
// Use thenApply/thenCompose to stay async, or use virtual threads
\\\`\\\`\\\`

---

## 3. ExecutorService

\\\`\\\`\\\`java
// Correct: properly managed executor with try-with-resources (Java 19+)
try (var executor = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors())) {
    var futures = tasks.stream()
        .map(task -> executor.submit(task))
        .toList();
    // process futures...
} // auto-shutdown

// Correct: executor with timeout for graceful shutdown (pre-Java 19)
ExecutorService executor = Executors.newFixedThreadPool(4);
try {
    // submit tasks...
} finally {
    executor.shutdown();
    if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
        executor.shutdownNow();
    }
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: creating a new executor per request
void handleRequest(Request req) {
    var executor = Executors.newFixedThreadPool(4); // BAD: unbounded executor creation
    executor.submit(() -> process(req));
    // executor never shut down — resource leak
}
\\\`\\\`\\\`

---

## 4. synchronized vs ReentrantLock

\\\`\\\`\\\`java
// Correct: ReentrantLock with try-finally (preferred for complex locking)
private final ReentrantLock lock = new ReentrantLock();

public void transferFunds(Account from, Account to, BigDecimal amount) {
    lock.lock();
    try {
        from.debit(amount);
        to.credit(amount);
    } finally {
        lock.unlock(); // ALWAYS unlock in finally
    }
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Correct: tryLock to avoid deadlocks
if (lock.tryLock(5, TimeUnit.SECONDS)) {
    try {
        // critical section
    } finally {
        lock.unlock();
    }
} else {
    log.warn("Could not acquire lock within timeout");
    throw new TimeoutException("Lock acquisition timed out");
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Correct: simple synchronized for straightforward mutual exclusion
private final Object monitor = new Object();

public void increment() {
    synchronized (monitor) {
        count++;
    }
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: synchronized on "this" or class — exposes lock to external code
public synchronized void update() { ... } // BAD: external code can deadlock on 'this'
// Use a private final lock object instead

// Anti-Pattern: synchronized with virtual threads
synchronized (lock) {          // BAD: pins the carrier thread
    var result = callApi();    // virtual thread cannot unmount during I/O
}
// Use ReentrantLock with virtual threads instead
\\\`\\\`\\\`

---

## 5. ConcurrentHashMap

\\\`\\\`\\\`java
// Correct: atomic compute operations
ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();

// Atomic increment — no external synchronization needed
counters.computeIfAbsent(key, k -> new AtomicLong()).incrementAndGet();

// Atomic conditional update
counters.compute(key, (k, current) -> {
    if (current == null) return new AtomicLong(1);
    current.incrementAndGet();
    return current;
});
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: check-then-act without atomicity
if (!map.containsKey(key)) {  // BAD: race condition
    map.put(key, value);       // another thread may have inserted between check and put
}
// Use computeIfAbsent() or putIfAbsent() instead
\\\`\\\`\\\`

---

## 6. Atomic Variables

Lock-free thread-safe operations for simple values.

\\\`\\\`\\\`java
// Correct: AtomicReference for lock-free state transitions
private final AtomicReference<State> state = new AtomicReference<>(State.IDLE);

public boolean start() {
    return state.compareAndSet(State.IDLE, State.RUNNING); // atomic transition
}

public void stop() {
    state.set(State.STOPPED);
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Correct: AtomicInteger for counters
private final AtomicInteger requestCount = new AtomicInteger(0);

public void handleRequest() {
    int count = requestCount.incrementAndGet();
    log.info("Request #{}", count);
}
\\\`\\\`\\\`

\\\`\\\`\\\`java
// Anti-Pattern: volatile for compound operations
private volatile int count = 0;
count++; // BAD: not atomic — read-modify-write is 3 operations
// Use AtomicInteger.incrementAndGet() instead
\\\`\\\`\\\`

---

## 7. Structured Concurrency (Preview — JEP 453)

Structured concurrency ensures that child tasks complete before the parent scope exits,
and failures propagate correctly.

\\\`\\\`\\\`java
// Correct: structured concurrency with ShutdownOnFailure
Response handleRequest(Request request) throws Exception {
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        Subtask<User> userTask = scope.fork(() -> fetchUser(request.userId()));
        Subtask<List<Order>> ordersTask = scope.fork(() -> fetchOrders(request.userId()));

        scope.join();           // wait for both tasks
        scope.throwIfFailed();  // propagate any exception

        return new Response(userTask.get(), ordersTask.get());
    }
    // Both tasks are guaranteed to complete (or be cancelled) when scope exits
}
\\\`\\\`\\\`

---

## 8. Thread-Safe Patterns Summary

| Pattern | Use Case | Mechanism |
|---------|----------|-----------|
| Immutable objects (records) | Shared read-only data | No synchronization needed |
| AtomicReference/AtomicInteger | Simple counters, flags, CAS | Lock-free |
| ConcurrentHashMap | Shared key-value state | Segmented locking |
| ReentrantLock | Complex critical sections | Explicit lock/unlock |
| Virtual threads + I/O | High-concurrency I/O | JVM-managed scheduling |
| CompletableFuture | Async composition | Callback chains |
| StructuredTaskScope | Parent-child task lifecycle | Scope-based cancellation |

\\\`\\\`\\\`java
// Correct: immutable objects are inherently thread-safe
public record Config(String host, int port, Duration timeout) {}
// Records are final and immutable — safe to share across threads without synchronization

// Anti-Pattern: mutable shared state without protection
class Config {
    public String host; // BAD: mutable field, no synchronization
    public int port;
}
\\\`\\\`\\\`
`,
      },
      {
        name: 'java-refactor',
        description: 'Java modernization: records, sealed types, switch expressions, text blocks, virtual threads',
        content: `# Java Refactor Skill

## Records (Java 16+)
- Convert POJOs with only getters and equals/hashCode to records
- Use record components instead of private fields + constructor + getters
- Use compact canonical constructors for validation:
\`\`\`java
public record Email(String value) {
    public Email {
        Objects.requireNonNull(value, "email must not be null");
        if (!value.contains("@")) throw new IllegalArgumentException("invalid email: " + value);
    }
}
\`\`\`
- Records are implicitly final and cannot extend other classes
- Records can implement interfaces — use with sealed interfaces for algebraic types
- Use @JsonProperty or custom serializers when JSON field names differ from component names

## Sealed Types (Java 17+)
- Use sealed interfaces/classes to define closed type hierarchies:
\`\`\`java
public sealed interface Result<T> permits Success, Failure {
    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String error) implements Result<T> {}
}
\`\`\`
- The compiler enforces exhaustiveness in switch expressions over sealed types
- Use permits clause to list all allowed subtypes
- Subtypes must be final, sealed, or non-sealed

## Switch Expressions (Java 14+ / Pattern Matching Java 21+)
- Convert switch statements to switch expressions with arrow syntax
- Use yield for multi-line case blocks
- Leverage pattern matching in switch for type dispatch:
\`\`\`java
String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "positive int: " + i;
        case Integer i -> "non-positive int: " + i;
        case String s -> "string of length " + s.length();
        case null -> "null value";
        default -> "unknown: " + obj.getClass().getSimpleName();
    };
}
\`\`\`

## Text Blocks (Java 15+)
- Convert concatenated multi-line strings to text blocks:
\`\`\`java
String sql = """
        SELECT u.id, u.name, u.email
        FROM users u
        WHERE u.active = true
          AND u.created_at > ?
        ORDER BY u.name
        """;
\`\`\`
- Indent closing triple quotes to control leading whitespace stripping
- Use .formatted() for interpolation: \`"""Hello %s""".formatted(name)\`
- Use \\s for trailing spaces, \\n for explicit line breaks within text blocks

## Virtual Threads (Java 21+)
- Replace thread pools for I/O-bound work with virtual threads:
\`\`\`java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Result>> futures = tasks.stream()
        .map(task -> executor.submit(() -> process(task)))
        .toList();
    return futures.stream().map(Future::get).toList();
}
\`\`\`
- Do not use virtual threads for CPU-bound computation — use platform threads
- Avoid synchronized blocks with virtual threads — use ReentrantLock instead
- Virtual threads are cheap to create — no need to pool them

## java.time Migration
- Replace Date/Calendar/SimpleDateFormat with java.time equivalents:
  - \`java.util.Date\` -> \`Instant\` (timestamp) or \`LocalDate\` (date-only)
  - \`Calendar\` -> \`LocalDate\`, \`LocalDateTime\`, \`ZonedDateTime\`
  - \`SimpleDateFormat\` -> \`DateTimeFormatter\` (thread-safe, immutable)
`,
      },
      {
        name: 'java-debug',
        description: 'Java debugging, profiling, and diagnostic workflows',
        content: `# Java Debug & Profiling Skill

## JVM Debugging
- Remote debug: \`java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar app.jar\`
- Attach debugger from IDE to localhost:5005
- Use conditional breakpoints for specific scenarios (e.g., userId.equals("abc123"))
- Use \`jcmd <pid> Thread.print\` to dump all thread stacks without a debugger
- Use \`jcmd <pid> GC.heap_dump /path/dump.hprof\` for heap dumps

## JVM Diagnostic Commands
- \`jps\` — list running Java processes with PIDs
- \`jinfo <pid>\` — display JVM configuration (flags, system properties)
- \`jstack <pid>\` — thread dump for deadlock analysis
- \`jmap -histo <pid>\` — object histogram (memory usage by class)
- \`jstat -gc <pid> 1000\` — GC statistics every 1 second
- \`jcmd <pid> VM.flags\` — all active JVM flags
- \`jcmd <pid> VM.system_properties\` — system properties at runtime
- \`jfr start name=recording duration=60s filename=recording.jfr\` — start JDK Flight Recorder

## Profiling with JDK Flight Recorder
- Start recording: \`-XX:StartFlightRecording=duration=120s,filename=app.jfr\`
- Analyze with JDK Mission Control (jmc) or IntelliJ Profiler
- Key events to watch: CPU hotspots, allocations, GC pauses, I/O wait, lock contention
- Use continuous recording in production: \`-XX:StartFlightRecording=maxsize=250m,disk=true\`

## Common Debugging Patterns
- Heap dump analysis: open .hprof in VisualVM, Eclipse MAT, or IntelliJ
- Deadlock detection: \`jstack <pid>\` shows "Found one Java-level deadlock"
- Memory leak: compare two heap dumps — look for growing object counts
- ClassLoader leak: check for duplicate class loads or unreleased references to ClassLoaders
- Slow startup: use \`-Xlog:class+load=info\` to identify class loading bottlenecks

## Logging for Debugging
- Use SLF4J + Logback (or Log4j2) — never System.out.println in production
- Use parameterized logging: \`log.debug("User {} placed order {}", userId, orderId)\`
- Use MDC (Mapped Diagnostic Context) for request-scoped correlation IDs
- Configure log levels per package in logback.xml or application.yml
- Use log.isDebugEnabled() guard only for expensive string construction
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/import\\s+[\\w.]+\\.\\*;/.test(c))issues.push(\'Wildcard import detected — use explicit imports per Google Java Style Guide\');if(/catch\\s*\\(\\s*(Exception|Throwable)\\s/.test(c))issues.push(\'Catching Exception/Throwable — catch specific exception types\');if(/\\.printStackTrace\\(\\)/.test(c))issues.push(\'printStackTrace() detected — use a logging framework (SLF4J + Logback)\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
            timeout: 5,
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}"); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/new\\s+Date\\(\\)/.test(c)&&!/java\\.time/.test(c))issues.push(\'java.util.Date detected — prefer java.time API (Instant, LocalDate, ZonedDateTime)\');if(/System\\.out\\.print/.test(c)&&!/public\\s+static\\s+void\\s+main/.test(c))issues.push(\'System.out.print detected outside main — use SLF4J logger\');if(/java\\.util\\.Random/.test(c)&&/password|secret|token|key|salt|nonce/i.test(c))issues.push(\'java.util.Random used near security context — use SecureRandom\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'checkstyle',
        filePath: 'checkstyle.xml',
        mergeStrategy: 'create-only',
        config: {
          '<?xml version="1.0"?>': '',
          '<!DOCTYPE module PUBLIC "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN" "https://checkstyle.org/dtds/configuration_1_3.dtd">': '',
          module: {
            name: 'Checker',
            children: [
              { name: 'TreeWalker', children: [
                { name: 'AvoidStarImport' },
                { name: 'UnusedImports' },
                { name: 'RedundantImport' },
                { name: 'NeedBraces' },
                { name: 'LeftCurly' },
                { name: 'RightCurly' },
                { name: 'WhitespaceAround' },
                { name: 'OneStatementPerLine' },
                { name: 'MultipleVariableDeclarations' },
                { name: 'EmptyCatchBlock', properties: { exceptionVariableName: 'expected|ignored' } },
                { name: 'IllegalCatch', properties: { illegalClassNames: 'java.lang.Throwable' } },
                { name: 'MissingJavadocMethod', properties: { scope: 'public', allowMissingPropertyJavadoc: 'true' } },
                { name: 'MissingJavadocType', properties: { scope: 'public' } },
                { name: 'JavadocMethod' },
                { name: 'JavadocType' },
                { name: 'MethodLength', properties: { max: '50' } },
                { name: 'ParameterNumber', properties: { max: '5' } },
                { name: 'CyclomaticComplexity', properties: { max: '15' } },
                { name: 'MagicNumber', properties: { ignoreNumbers: '-1, 0, 1, 2' } },
                { name: 'UpperEll' },
                { name: 'ArrayTypeStyle' },
                { name: 'FinalClass' },
                { name: 'HideUtilityClassConstructor' },
                { name: 'InnerAssignment' },
                { name: 'ModifierOrder' },
              ]},
            ],
          },
        },
      },
    ],
  },
};
