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

### Modern Java (17+ LTS / 21+ LTS)
- Use records for immutable data carriers — replace POJOs that only carry data
- Use sealed classes/interfaces to restrict type hierarchies to known subtypes
- Use pattern matching for \`instanceof\` — eliminate manual casts
- Use switch expressions with arrow syntax and pattern matching (Java 21+)
- Use text blocks (triple-quoted strings) for multi-line SQL, JSON, and templates
- Prefer \`var\` for local variables when the right-hand side makes the type obvious
- Use virtual threads (Java 21+) for I/O-bound concurrency instead of platform threads

### Null Safety and Optionals
- Return \`Optional<T>\` for values that may legitimately be absent — never return null from public APIs
- Never use Optional as a method parameter, field, or collection element
- Chain Optional operations: \`.map()\`, \`.flatMap()\`, \`.orElseThrow()\` — avoid \`.isPresent()\` + \`.get()\`
- Use \`@Nullable\` / \`@NonNull\` annotations (jakarta.annotation or JSpecify) for API boundaries

### Resource Management
- Use try-with-resources for all \`AutoCloseable\` resources — never rely on finalizers
- Declare multiple resources in a single try-with-resources when they share a lifecycle
- Implement \`AutoCloseable\` on custom resource holders

### Javadoc
- Document all public classes, interfaces, methods, and constructors with Javadoc
- Use \`@param\`, \`@return\`, \`@throws\` tags on every public method
- First sentence of Javadoc is the summary — keep it concise and actionable
- Document thread-safety guarantees on concurrent classes`,
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
        governance: 'mandatory',
        description: 'Java coding conventions aligned with Google Java Style Guide and Oracle conventions',
        content: `# Java Conventions

## Naming (Google Java Style Guide Section 5)
- Classes and interfaces: PascalCase — nouns or noun phrases
  \`UserService\`, \`PaymentGateway\`, \`Serializable\`
- Methods: camelCase — verbs or verb phrases
  \`getUserById()\`, \`calculateDiscount()\`, \`isValid()\`
- Variables and parameters: camelCase — descriptive, no abbreviations
  \`remainingRetries\`, \`orderTotal\` — not \`r\`, \`cnt\`, \`val\`
- Constants: SCREAMING_SNAKE_CASE — only for deeply immutable \`static final\` fields
  \`MAX_RETRY_COUNT\`, \`DEFAULT_TIMEOUT_MS\`
- Packages: all lowercase, reverse domain notation, no underscores
  \`com.example.auth.service\` — not \`com.example.Auth_Service\`
- Type parameters: single uppercase letter or uppercase letter + digit
  \`T\`, \`E\`, \`K\`, \`V\`, \`T2\` — or descriptive like \`RequestT\`, \`ResponseT\`

### Correct
\`\`\`java
public record OrderSummary(
    UUID orderId,
    BigDecimal totalAmount,
    OrderStatus status
) {}
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: Hungarian notation, abbreviations, mutable POJO where record suffices
public class OrdSumDTO {
    private String strId;
    private double dblAmt;
    // 50 lines of getters, setters, equals, hashCode...
}
// Fix: Use a record with proper names as shown above
\`\`\`

## Source File Structure (Google Java Style Guide Section 3)
- One top-level class per file — file name matches the class name
- Order within a class: static fields -> instance fields -> constructors -> methods
- Group overloaded methods together — never split them with other members
- Order methods by logical readability, not by access modifier
- Organize imports: no wildcard imports (\`import java.util.*\` is forbidden)

## Formatting
- Braces: K&R style (opening brace on same line), always required even for single-statement blocks
- Indentation: 2 spaces (Google) or 4 spaces (Oracle) — be consistent within the project
- Line length: maximum 100 characters (Google) — break at meaningful points
- One statement per line — never chain multiple statements on one line
- Blank line between methods, between logical sections within a method

### Correct
\`\`\`java
if (user.isActive()) {
    processOrder(user);
} else {
    throw new InactiveUserException(user.getId());
}
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: missing braces, logic on same line, hard to debug
if (user.isActive()) processOrder(user);
else throw new InactiveUserException(user.getId());
// Fix: Always use braces and one statement per line
\`\`\`

## Type Safety
- Use \`Optional<T>\` for nullable return values — never pass Optional as a parameter
- Prefer immutable collections: \`List.of()\`, \`Map.of()\`, \`Set.of()\`, \`List.copyOf()\`
- Use records for value objects and DTOs — they provide equals, hashCode, toString for free
- Use sealed classes/interfaces to model closed type hierarchies
- Never use raw collection types — always parameterize generics

### Correct
\`\`\`java
public sealed interface Shape permits Circle, Rectangle, Triangle {}
public record Circle(double radius) implements Shape {}
public record Rectangle(double width, double height) implements Shape {}
public record Triangle(double a, double b, double c) implements Shape {}

public double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t -> {
            double s = (t.a() + t.b() + t.c()) / 2;
            yield Math.sqrt(s * (s - t.a()) * (s - t.b()) * (s - t.c()));
        }
    };
}
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: instanceof chains with manual casts, no exhaustiveness checking
public double area(Object shape) {
    if (shape instanceof Circle) {
        Circle c = (Circle) shape;
        return Math.PI * c.radius() * c.radius();
    } else if (shape instanceof Rectangle) {
        // Easy to forget a case, no compiler help
    }
    return 0; // Silent failure for unknown shapes
}
// Fix: Use sealed types + switch expressions for exhaustive, safe dispatch
\`\`\`

## Error Handling
- Use checked exceptions for recoverable conditions the caller must handle
- Use unchecked exceptions (RuntimeException subclasses) for programming errors
- Define custom exception classes for domain-specific errors with context fields
- Never catch \`Exception\` or \`Throwable\` at a general level without re-throwing
- Always include the root cause when wrapping exceptions: \`new XException("msg", cause)\`
- Use try-with-resources for all \`AutoCloseable\` resources — never use finally for cleanup
- Never swallow exceptions with empty catch blocks

### Correct
\`\`\`java
public User findUser(UUID userId) {
    try {
        return userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));
    } catch (DataAccessException ex) {
        throw new ServiceException("Failed to fetch user: " + userId, ex);
    }
}
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: swallowed exception, returns null, no context
public User findUser(UUID userId) {
    try {
        return userRepository.findById(userId).orElse(null);
    } catch (Exception e) {
        e.printStackTrace(); // Logs to stderr, no structured logging
        return null;         // Caller gets null with no idea why
    }
}
// Fix: Propagate with context, use Optional properly, catch specific exceptions
\`\`\`

## Concurrency
- Prefer \`java.util.concurrent\` utilities over manual \`synchronized\` blocks
- Use virtual threads (Java 21+ \`Thread.ofVirtual()\`) for I/O-bound workloads
- Use \`ExecutorService\` and \`CompletableFuture\` for structured async tasks
- Use \`ConcurrentHashMap\` instead of \`Collections.synchronizedMap()\`
- Avoid shared mutable state — prefer immutable objects passed between threads
- Use \`AtomicReference\` / \`AtomicInteger\` for simple lock-free atomic operations
- Document thread-safety guarantees with \`@ThreadSafe\` / \`@NotThreadSafe\` annotations

### Correct
\`\`\`java
// Java 21+ structured concurrency with virtual threads
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<User> userFuture = executor.submit(() -> userService.find(id));
    Future<List<Order>> ordersFuture = executor.submit(() -> orderService.findByUser(id));
    return new UserProfile(userFuture.get(), ordersFuture.get());
}
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: manual thread management, no structured cleanup
Thread t1 = new Thread(() -> { /* fetch user */ });
Thread t2 = new Thread(() -> { /* fetch orders */ });
t1.start(); t2.start();
t1.join(); t2.join();
// Fix: Use ExecutorService or virtual threads for structured concurrency
\`\`\`
`,
      },
      {
        path: 'java/streams-and-collections.md',
        governance: 'recommended',
        description: 'Java Stream API patterns and collection best practices',
        content: `# Java Stream API & Collections

## Stream API Best Practices
- Prefer Streams for collection transformations — they express intent more clearly than loops
- Use \`Collectors.toUnmodifiableList()\` or \`Stream.toList()\` (Java 16+) for immutable results
- Avoid side effects inside Stream operations — streams should be pure functional pipelines
- Use \`flatMap\` for nested collections, \`map\` for one-to-one transformations
- Prefer method references (\`User::getName\`) over lambdas when they improve clarity
- Use \`Optional\` return from \`findFirst()\`/\`findAny()\` — never assume the stream is non-empty
- Avoid Streams for simple iterations — a for-each loop is clearer for single operations

### Correct
\`\`\`java
List<String> activeEmails = users.stream()
    .filter(User::isActive)
    .map(User::getEmail)
    .filter(Objects::nonNull)
    .sorted()
    .toList(); // Java 16+ immutable list
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: side effects in stream, mutable accumulator
List<String> emails = new ArrayList<>();
users.stream().forEach(u -> {
    if (u.isActive()) {
        emails.add(u.getEmail()); // Side effect!
    }
});
// Fix: Use filter + map + collect — no side effects in the pipeline
\`\`\`

## Collection Factories (Java 9+)
- Use \`List.of()\`, \`Set.of()\`, \`Map.of()\` for small immutable collections
- Use \`List.copyOf()\`, \`Set.copyOf()\`, \`Map.copyOf()\` to make defensive copies
- Use \`Collections.emptyList()\` or \`List.of()\` instead of returning null for empty collections
- Prefer \`Map.ofEntries(Map.entry(k1, v1), ...)\` for maps with more than 10 entries

### Correct
\`\`\`java
private static final Set<String> ALLOWED_ROLES = Set.of("ADMIN", "EDITOR", "VIEWER");
private static final Map<String, Integer> PRIORITY = Map.of(
    "HIGH", 1,
    "MEDIUM", 2,
    "LOW", 3
);
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: mutable, verbose, error-prone initialization
private static final Set<String> ALLOWED_ROLES = new HashSet<>();
static {
    ALLOWED_ROLES.add("ADMIN");
    ALLOWED_ROLES.add("EDITOR");
    // Forgot "VIEWER" — and anyone can add more at runtime
}
// Fix: Use Set.of() for compile-time-constant immutable sets
\`\`\`

## Project Structure
- Follow Maven standard directory layout (\`src/main/java\`, \`src/test/java\`, \`src/main/resources\`)
- One public class per file — file name must match the public class name
- Group classes by feature/domain, not by technical layer
- Keep packages cohesive — minimize cross-package dependencies
- Use module-info.java (JPMS) for library projects to control encapsulation

### Recommended Package Layout
\`\`\`
com.example.myapp/
  order/
    Order.java
    OrderService.java
    OrderRepository.java
    OrderNotFoundException.java
  user/
    User.java
    UserService.java
    UserRepository.java
  shared/
    exception/
      ServiceException.java
    util/
      DateUtils.java
\`\`\`
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
              'node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/import\\s+[\\w.]+\\.\\*;/.test(c))issues.push(\'Wildcard import detected — use explicit imports per Google Java Style Guide\');if(/catch\\s*\\(\\s*(Exception|Throwable)\\s/.test(c))issues.push(\'Catching Exception/Throwable — catch specific exception types\');if(/\\.printStackTrace\\(\\)/.test(c))issues.push(\'printStackTrace() detected — use a logging framework (SLF4J + Logback)\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$CLAUDE_FILE_PATH"',
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
              'node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/new\\s+Date\\(\\)/.test(c)&&!/java\\.time/.test(c))issues.push(\'java.util.Date detected — prefer java.time API (Instant, LocalDate, ZonedDateTime)\');if(/System\\.out\\.print/.test(c)&&!/public\\s+static\\s+void\\s+main/.test(c))issues.push(\'System.out.print detected outside main — use SLF4J logger\');if(/java\\.util\\.Random/.test(c)&&/password|secret|token|key|salt|nonce/i.test(c))issues.push(\'java.util.Random used near security context — use SecureRandom\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$CLAUDE_FILE_PATH"',
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
