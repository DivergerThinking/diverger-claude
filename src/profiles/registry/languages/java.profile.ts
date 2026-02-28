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

- Follow Oracle Java Code Conventions and Google Java Style Guide
- Use records for immutable data carriers (Java 16+)
- Prefer sealed classes/interfaces for restricted hierarchies (Java 17+)
- Use \`Optional<T>\` for return types that may be absent - never return null
- Use Stream API for collection transformations - prefer declarative over imperative
- Prefer \`var\` for local variables when the type is obvious from context (Java 10+)
- Use text blocks for multi-line strings (Java 15+)
- Prefer pattern matching for \`instanceof\` (Java 16+)
- Use switch expressions with pattern matching where applicable (Java 21+)`,
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
        ],
      },
    },
    rules: [
      {
        path: 'java/conventions.md',
        governance: 'mandatory',
        description: 'Java coding conventions',
        content: `# Java Conventions

## Naming
- Classes and interfaces: PascalCase (\`UserService\`, \`Serializable\`)
- Methods and variables: camelCase (\`getUserById\`, \`userName\`)
- Constants: SCREAMING_SNAKE_CASE (\`MAX_RETRY_COUNT\`)
- Packages: all lowercase, reverse domain notation (\`com.example.service\`)
- Avoid Hungarian notation and single-letter variable names outside loops

## Type Safety
- Use \`Optional<T>\` for nullable return values - never pass Optional as a parameter
- Prefer immutable collections (\`List.of()\`, \`Map.of()\`, \`Collections.unmodifiable*\`)
- Use records for value objects and DTOs
- Use sealed classes to define restricted type hierarchies
- Prefer generics over raw types - never use raw collection types

## Error Handling
- Use checked exceptions for recoverable conditions
- Use unchecked exceptions (RuntimeException subclasses) for programming errors
- Define custom exception classes for domain-specific errors
- Never catch \`Exception\` or \`Throwable\` at a general level without re-throwing
- Always include the root cause when wrapping exceptions
- Use try-with-resources for all \`AutoCloseable\` resources

## Concurrency
- Prefer \`java.util.concurrent\` utilities over manual synchronization
- Use \`ExecutorService\` and \`CompletableFuture\` for async tasks
- Prefer virtual threads (Java 21+) for I/O-bound workloads
- Use \`ConcurrentHashMap\` instead of \`Collections.synchronizedMap\`
- Avoid shared mutable state - prefer immutable objects
- Use \`AtomicReference\` / \`AtomicInteger\` for simple atomic operations
`,
      },
      {
        path: 'java/patterns.md',
        governance: 'recommended',
        description: 'Java design patterns and Spring conventions',
        content: `# Java Patterns

## Spring Conventions
- Use constructor injection - avoid field injection with \`@Autowired\`
- Prefer \`@Configuration\` classes over XML configuration
- Use \`@Service\`, \`@Repository\`, \`@Controller\` stereotype annotations appropriately
- Use Spring profiles for environment-specific configuration
- Prefer \`application.yml\` over \`application.properties\` for readability

## Stream API
- Prefer Streams for collection transformations over manual loops
- Use \`Collectors.toUnmodifiableList()\` for immutable results
- Avoid side effects inside Stream operations
- Use \`flatMap\` for nested collections, \`map\` for one-to-one transformations
- Prefer method references (\`User::getName\`) over lambdas when clarity allows

## Project Structure
- Follow Maven standard directory layout (\`src/main/java\`, \`src/test/java\`)
- One public class per file
- Group classes by feature/domain, not by technical layer
- Keep packages cohesive and minimize cross-package dependencies
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Java-Specific Review
- Check for null returns where Optional should be used
- Verify proper use of try-with-resources for AutoCloseable
- Check for raw types and missing generics
- Verify constructor injection over field injection in Spring beans
- Check for proper exception handling (no swallowed exceptions)
- Verify immutability of records and value objects
- Check for thread safety issues in shared mutable state
- Verify Stream API usage avoids side effects`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Java Testing
- Use JUnit 5 with @DisplayName for readable test names
- Use Mockito for mocking dependencies
- Use AssertJ for fluent, readable assertions
- Test Optional return values for both present and empty cases
- Use @ParameterizedTest for data-driven tests
- Use @Nested classes to group related test scenarios
- Test exception messages and types with assertThrows`,
      },
    ],
  },
};
