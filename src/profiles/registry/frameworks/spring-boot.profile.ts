import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const springBootProfile: Profile = {
  id: 'frameworks/spring-boot',
  name: 'Spring Boot',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['spring-boot'],
  contributions: {
    claudeMd: [
      {
        heading: 'Spring Boot Conventions',
        order: 20,
        content: `## Spring Boot Conventions

- Use constructor injection for all dependencies - avoid field injection with \`@Autowired\`
- Organize code in layers: Controller -> Service -> Repository
- Use Spring Boot starters for consistent dependency management
- Externalize configuration with \`application.yml\` and profiles (dev, staging, prod)
- Use \`@ConfigurationProperties\` for type-safe configuration binding
- Use Spring Data JPA repositories for data access - avoid raw JDBC unless necessary
- Use \`@Transactional\` at the service layer for database operations
- Apply \`@Valid\` with Jakarta Bean Validation for request validation
- Use Spring Security for authentication and authorization
- Use Spring Boot Actuator for health checks, metrics, and monitoring
- Use \`@RestControllerAdvice\` for global exception handling
- Follow the convention-over-configuration principle`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(./mvnw:*)',
          'Bash(./gradlew:*)',
          'Bash(mvn:*)',
          'Bash(gradle:*)',
        ],
      },
    },
    rules: [
      {
        path: 'spring-boot/architecture.md',
        governance: 'mandatory',
        description: 'Spring Boot layered architecture and dependency injection',
        content: `# Spring Boot Architecture

## Layered Architecture
- Controllers (\`@RestController\`): handle HTTP, validate input, delegate to services
- Services (\`@Service\`): business logic, transaction management
- Repositories (\`@Repository\`): data access via Spring Data JPA
- DTOs: transfer data between layers - never expose entities directly in API responses
- Entities (\`@Entity\`): JPA-managed domain objects mapped to database tables

## Dependency Injection
- Use constructor injection exclusively - make dependencies explicit and immutable
- Avoid \`@Autowired\` on fields - it hides dependencies and makes testing harder
- Use \`@RequiredArgsConstructor\` (Lombok) or explicit constructors
- Use \`@Qualifier\` when multiple implementations of an interface exist
- Use \`@Primary\` to designate the default implementation
- Use \`@Profile\` for environment-specific beans

## JPA / Hibernate
- Define entities with \`@Entity\` and proper relationship annotations
- Use \`@GeneratedValue\` with appropriate strategy for primary keys
- Map relationships carefully: \`@OneToMany\`, \`@ManyToOne\`, \`@ManyToMany\`
- Use fetch type LAZY by default - switch to EAGER only when justified
- Use \`@Transactional(readOnly = true)\` for read-only operations
- Avoid N+1 queries: use JOIN FETCH, entity graphs, or DTO projections
- Use database migrations with Flyway or Liquibase

## Spring Security
- Configure security with \`SecurityFilterChain\` bean (not deprecated WebSecurityConfigurerAdapter)
- Use method-level security with \`@PreAuthorize\`, \`@Secured\`
- Store passwords with BCrypt or Argon2 - never plain text
- Implement JWT-based authentication for REST APIs
- Configure CORS at the security level
- Disable CSRF for stateless REST APIs, enable for session-based apps

## Configuration
- Use \`application.yml\` with profiles for environment-specific settings
- Use \`@ConfigurationProperties\` with \`@Validated\` for type-safe config
- Never hardcode secrets - use environment variables or a vault
- Use Spring Boot's auto-configuration and override only when needed
`,
      },
      {
        path: 'spring-boot/annotations.md',
        governance: 'recommended',
        description: 'Spring Boot annotation best practices',
        content: `# Spring Boot Annotations

## Core Annotations
- \`@SpringBootApplication\`: main class entry point (combines @Configuration, @EnableAutoConfiguration, @ComponentScan)
- \`@RestController\`: combines @Controller and @ResponseBody
- \`@Service\`: marks service layer components
- \`@Repository\`: marks data access components, enables exception translation

## Request Mapping
- Use specific annotations: \`@GetMapping\`, \`@PostMapping\`, \`@PutMapping\`, \`@DeleteMapping\`, \`@PatchMapping\`
- Use \`@PathVariable\`, \`@RequestParam\`, \`@RequestBody\` for parameter binding
- Use \`@Valid\` or \`@Validated\` to trigger Bean Validation

## Exception Handling
- Use \`@RestControllerAdvice\` with \`@ExceptionHandler\` for global error handling
- Return \`ProblemDetail\` (RFC 7807) for consistent error responses
- Handle specific exceptions before generic ones

## Testing Annotations
- \`@SpringBootTest\`: full application context for integration tests
- \`@WebMvcTest\`: controller layer only, with MockMvc
- \`@DataJpaTest\`: repository layer only, with embedded database
- \`@MockBean\`: replace a bean with a Mockito mock in test context
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Spring Boot-Specific Review
- Verify constructor injection is used - flag any field injection with @Autowired
- Check for proper layering: controllers should not contain business logic
- Verify entities are not exposed directly in API responses - use DTOs
- Check for N+1 query risks: verify fetch strategies and JOIN FETCH usage
- Verify @Transactional is applied at the service layer, not controllers
- Check Spring Security configuration: CORS, CSRF, authentication
- Verify input validation with @Valid and Bean Validation annotations
- Check for proper exception handling with @RestControllerAdvice
- Verify configuration uses @ConfigurationProperties instead of scattered @Value
- Check that database migrations are managed (Flyway or Liquibase)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Spring Boot Testing
- Use @WebMvcTest for controller unit tests with MockMvc
- Use @DataJpaTest for repository tests with embedded database
- Use @SpringBootTest for integration tests that need the full context
- Mock service dependencies with @MockBean
- Test validation by sending invalid request bodies and verifying 400 responses
- Test security configuration: verify protected endpoints reject unauthenticated requests
- Use TestContainers for integration tests with real databases
- Test @ConfigurationProperties classes for proper binding and validation`,
      },
    ],
  },
};
