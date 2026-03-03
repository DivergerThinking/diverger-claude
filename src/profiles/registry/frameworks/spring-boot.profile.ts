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

Convention over configuration. Layered architecture with dependency injection.

**Detailed rules:** see \`.claude/rules/spring-boot/\` directory.

**Key rules:**
- Layered architecture: Controller → Service → Repository, one responsibility per layer
- Constructor injection (no field injection), interfaces for testability
- Bean Validation (\`@Valid\`, \`@NotNull\`) on all DTOs, global \`@ControllerAdvice\` for errors
- Profiles for environment config, externalized properties via \`application.yml\``,
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
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'mandatory',
        description: 'Spring Boot layered architecture, DI, JPA, and configuration patterns',
        content: `# Spring Boot Architecture

## Project Structure
- Place \`@SpringBootApplication\` class in the root package above all feature packages
- Organize by feature, not by layer: each domain gets its own package (entity, DTO, controller, service, repository)
- Cross-cutting \`@Configuration\` classes go in a \`config/\` package

## Dependency Injection
- Use constructor injection exclusively — never \`@Autowired\` field injection
- Single constructor: Spring auto-wires without \`@Autowired\` annotation
- Declare dependencies as \`private final\` fields for immutability
- Program to interfaces for testability

## REST Controllers
- \`@RestController\` with versioned \`@RequestMapping("/api/v1/...")\`
- \`@Validated\` on the controller class for constraint annotations on path/query params
- \`@Valid @RequestBody\` on typed DTO parameters — never raw \`Map<String, Object>\`
- Explicit \`@ResponseStatus\` for non-200 success codes (201 Created, 204 No Content)
- Pageable with \`@ParameterObject\` for list endpoints
- Controllers delegate to service layer — no business logic or repository access

## JPA / Hibernate
- Entities: \`@Table\` with explicit name, \`@Column\` with constraints, \`@Enumerated(EnumType.STRING)\`
- Relationships default to \`FetchType.LAZY\` — use \`JOIN FETCH\` or \`@EntityGraph\` when eager loading is needed
- Never use \`FetchType.EAGER\` on collections — causes N+1 query problems
- \`CascadeType.ALL\` + \`orphanRemoval = true\` on \`@OneToMany\` owned collections
- Audit fields via \`@CreationTimestamp\`, \`@LastModifiedTimestamp\`

## Transaction Management
- \`@Transactional(readOnly = true)\` at class level on services, override with \`@Transactional\` on mutations
- Apply transactions at service layer — never on controllers or repositories
- Use \`ApplicationEventPublisher\` for domain events within transactions

## Configuration
- Use \`@ConfigurationProperties\` records with \`@Validated\` for type-safe, validated config
- Never use scattered \`@Value\` annotations — they lack validation, type safety, and testability
- Load secrets from environment variables — never hardcode
- Use Spring profiles (\`application-{profile}.yml\`) for environment-specific settings
`,
      },
      {
        path: 'spring-boot/error-handling.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'mandatory',
        description: 'Spring Boot centralized error handling with RFC 9457 ProblemDetail',
        content: `# Spring Boot Error Handling

## Centralized Exception Handling
- Use a single \`@RestControllerAdvice\` extending \`ResponseEntityExceptionHandler\`
- Return RFC 9457 \`ProblemDetail\` responses (Spring Boot 3+ native support)
- Map each domain exception to a specific HTTP status: ResourceNotFoundException -> 404, BusinessRuleViolation -> 422, etc.
- Override \`handleMethodArgumentNotValid\` to return field-level validation errors with 400 status
- Catch-all \`@ExceptionHandler(Exception.class)\` returns generic 500 message — log the real error server-side
- Never expose stack traces, SQL errors, or internal details to the client
- Let exceptions propagate from controllers — never use try-catch in controllers for error formatting

## Custom Domain Exceptions
- \`ResourceNotFoundException\` extends \`RuntimeException\` — carries resource type and ID
- \`BusinessRuleViolationException\` extends \`RuntimeException\` — carries rule code
- Use specific exception classes per error type — not generic RuntimeException with status codes
- Domain exceptions are thrown by the service layer, mapped to HTTP by the advice class
`,
      },
      {
        path: 'spring-boot/security.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'mandatory',
        description: 'Spring Security configuration with SecurityFilterChain pattern',
        content: `# Spring Security Configuration

## SecurityFilterChain Bean Pattern (Spring Security 6+)
- Configure via \`SecurityFilterChain\` \`@Bean\` — \`WebSecurityConfigurerAdapter\` was removed in Spring Security 6
- Enable \`@EnableMethodSecurity\` for \`@PreAuthorize\` support
- Use \`BCryptPasswordEncoder\` or \`Argon2PasswordEncoder\` — never store plaintext passwords

## REST API Security (Stateless)
- Disable CSRF (no session, no CSRF needed for stateless APIs)
- Set \`sessionCreationPolicy(STATELESS)\`
- Configure \`oauth2ResourceServer\` with JWT decoder
- Use deny-by-default: \`.anyRequest().authenticated()\` as the last rule
- Permit public endpoints explicitly: health checks, auth endpoints

## Web App Security (Session-Based)
- Keep CSRF enabled (default) for session-based apps
- Configure form login with custom login page and success URL
- Configure logout with session invalidation and cookie cleanup
- Permit static resources (CSS, JS, images) explicitly

## Method-Level Security
- \`@PreAuthorize\` on service methods for fine-grained access control
- Use SpEL expressions for role checks and ownership verification
- Combine role-based (\`hasRole\`) and attribute-based (\`#param == principal.id\`) authorization

## CORS
- Configure CORS at the security level via \`CorsConfigurationSource\` bean
- Use explicit allowed origins — never wildcard \`"*"\` in production
- Set explicit allowed methods, headers, and \`maxAge\` for preflight caching
`,
      },
      {
        path: 'spring-boot/testing.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'recommended',
        description: 'Spring Boot testing patterns with test slices and TestContainers',
        content: `# Spring Boot Testing Patterns

## Test Slices — Use the Narrowest Context
- \`@WebMvcTest\`: Controller + filters + advice — REST endpoint behavior, validation, serialization
- \`@DataJpaTest\`: JPA repos + Hibernate + embedded DB — repository queries, entity mappings
- \`@RestClientTest\`: RestTemplate/WebClient + MockRestServiceServer — HTTP client behavior
- \`@JsonTest\`: Jackson ObjectMapper — JSON serialization/deserialization
- \`@SpringBootTest\`: Full context — integration tests, end-to-end flows only

## Controller Tests (@WebMvcTest)
- Inject \`MockMvc\` and mock service dependencies with \`@MockBean\`
- Test success cases: correct status code, response body matches schema
- Test validation errors: send invalid request body, verify 400 with field errors
- Use \`@DisplayName\` for readable test names describing HTTP method, path, and expected outcome

## Repository Tests (@DataJpaTest)
- Use \`TestEntityManager\` for test data setup
- Use \`@AutoConfigureTestDatabase(replace = Replace.NONE)\` with TestContainers for real DB
- Test custom query methods, entity mappings, and cascade behavior

## Integration Tests
- Use \`@SpringBootTest(webEnvironment = RANDOM_PORT)\` with TestContainers (\`@ServiceConnection\`)
- Use \`TestRestClient\` for full HTTP request/response cycle testing
- Test complete lifecycle flows (create -> get -> list -> update -> delete)

## Security Tests
- \`@WebMvcTest\` + \`@Import(SecurityConfig.class)\` for controller security tests
- Test unauthenticated (401), unauthorized/forbidden (403), and authenticated access
- Use \`@WithMockUser\` for simulating authenticated requests with specific roles
`,
      },
      {
        path: 'spring-boot/actuator-and-observability.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'recommended',
        description: 'Spring Boot Actuator, health checks, metrics, and observability setup',
        content: `# Spring Boot Actuator & Observability

## Actuator Configuration
- Expose only necessary endpoints: health, info, metrics, prometheus
- Set \`show-details: when-authorized\` for health endpoint — never expose to unauthenticated users
- Enable Kubernetes probes: \`management.endpoint.health.probes.enabled: true\`
- Enable DB and disk space health checks

## Custom Health Indicators
- Implement \`HealthIndicator\` for external dependency checks (payment gateway, messaging, caches)
- Return \`Health.up()\` or \`Health.down()\` with descriptive details
- Use constructor injection for the dependency being monitored

## Custom Metrics with Micrometer
- Inject \`MeterRegistry\` and create \`Counter\`, \`Timer\`, \`Gauge\` for business metrics
- Use descriptive metric names: \`orders.created\`, \`orders.processing.time\`
- Add tags for dimensions: source, type, status
- Wrap operations with \`Timer.record()\` for latency measurement

## Structured Logging
- Spring Boot 3.4+: use \`logging.structured.format.console: ecs\` for structured JSON output
- Use MDC (\`Mapped Diagnostic Context\`) for request-scoped fields: correlation ID, user ID, tenant
- Add a \`OncePerRequestFilter\` to inject correlation ID from request header or generate a new one
- Always clean MDC in a \`finally\` block to prevent context leaking across requests
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Spring Boot-Specific Review

### Architecture & Layering
- Verify constructor injection is used — flag any field injection with @Autowired
- Check controllers contain NO business logic — they must only delegate to services
- Verify entities are NEVER exposed directly in API responses — require DTOs
- Check @Transactional is applied at the service layer, not on controllers or repositories
- Verify @Transactional(readOnly = true) is used for read-only operations
- Flag any @SpringBootApplication class that is not in the root package above all other packages

### Data Access
- Check for N+1 query risks: flag EAGER fetch types on collections, verify JOIN FETCH or @EntityGraph usage
- Verify cascade types are intentional — flag CascadeType.ALL on @ManyToOne (parent deletion risk)
- Check that database schema is managed by Flyway or Liquibase — flag hibernate.ddl-auto=update/create in non-dev profiles
- Verify pagination for list endpoints — flag unbounded findAll() calls exposed via API

### Security
- Verify SecurityFilterChain bean pattern — flag any WebSecurityConfigurerAdapter usage (removed in Spring Security 6)
- Check CSRF: disabled for stateless REST APIs, enabled for session-based web apps
- Verify CORS is configured at the security level with explicit allowed origins — flag wildcard "*" in production
- Check @PreAuthorize or @Secured on sensitive service methods — not just URL-level security
- Verify password storage uses BCryptPasswordEncoder or Argon2PasswordEncoder — flag plaintext

### Configuration & Error Handling
- Verify @ConfigurationProperties with @Validated for structured config — flag scattered @Value usage
- Check for @RestControllerAdvice with ProblemDetail (RFC 9457) error responses
- Verify no stack traces or internal details are exposed in API error responses
- Check application.yml uses Spring profiles for env-specific settings — flag hardcoded production values

**Available skills:** Use \`spring-boot-starter\` for feature module scaffolding, \`spring-boot-security-setup\` for security configuration.`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Spring Boot Testing

### Test Slice Strategy (Use the Narrowest Context)
- Use @WebMvcTest for controller tests with MockMvc — mock service dependencies with @MockBean
- Use @DataJpaTest for repository tests — verify queries, entity mappings, and cascade behavior
- Use @RestClientTest for HTTP client tests with MockRestServiceServer
- Use @JsonTest for serialization/deserialization tests
- Use @SpringBootTest ONLY for full integration tests — never for unit testing a single layer

### What to Test
- Test validation: send invalid request bodies and verify 400 responses with field-level error details
- Test security: verify protected endpoints reject unauthenticated requests (401), verify role-based access (403)
- Test error handling: verify @RestControllerAdvice maps exceptions to correct HTTP status codes and ProblemDetail format
- Test @ConfigurationProperties: verify binding, defaults, and validation failure at startup

### Integration Testing
- Use TestContainers with @ServiceConnection for real database integration tests
- Use @WithMockUser or custom SecurityContext for testing authorized flows
- Test complete HTTP request/response cycles — not just service method calls
- Verify Flyway/Liquibase migrations run successfully against a real database instance

**Available skills:** Use \`spring-boot-starter\` for feature module + test scaffolding, \`spring-boot-security-setup\` for security test patterns.`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Spring Security-Specific Review
- Verify SecurityFilterChain uses deny-by-default: last rule should be .anyRequest().authenticated() or .denyAll()
- Check for mass assignment: verify @ModelAttribute or @RequestBody DTOs do not bind sensitive fields (role, isAdmin)
- Verify JWT validation: check token signature verification, expiry validation, issuer/audience claims
- Check for IDOR (Insecure Direct Object Reference): verify service layer validates resource ownership, not just authentication
- Verify Actuator endpoints are secured: /actuator/** should not be publicly accessible except /health
- Check for SQL injection in custom @Query annotations: verify named parameters (:param), not string concatenation
- Verify HTTPS enforcement: check for requiresChannel().anyRequest().requiresSecure() or server.ssl configuration
- Check sensitive data exposure: verify @JsonIgnore on entity fields that should not appear in responses (password, internalId)
- Verify logging does not include passwords, tokens, or PII — check log statements in authentication flows

**Available skills:** Use \`spring-boot-starter\` for secure scaffolding, \`spring-boot-security-setup\` for security configuration patterns.`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        prompt: `## Spring Boot-Specific Refactoring
- Replace WebSecurityConfigurerAdapter with SecurityFilterChain @Bean (Spring Security 6 migration)
- Convert @Value scattered annotations to @ConfigurationProperties records with @Validated
- Replace manual try-catch in controllers with @RestControllerAdvice + ProblemDetail
- Extract Flyway/Liquibase migration scripts when entities change — never modify existing migration files
- Replace RestTemplate with WebClient or RestClient (Spring Boot 3.2+) for HTTP calls
- Convert imperative repository queries to Spring Data derived query methods or @Query with JPQL
- Replace Swagger 2 / SpringFox with SpringDoc OpenAPI 3 (@Operation, @Schema annotations)
- Introduce @ServiceConnection with TestContainers to replace manual DataSource configuration in tests

**Available skills:** Use \`spring-boot-starter\` for module scaffolding, \`spring-boot-security-setup\` for security migration patterns.`,
      },
    ],
    skills: [
      {
        name: 'spring-boot-starter',
        description: 'Scaffold Spring Boot components with layered architecture and full test coverage',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Spring Boot Starter Skill

## Scaffold a Complete Feature Module

Given a domain entity name (e.g., "Product"), generate:

### 1. Entity with JPA Mapping
- @Entity with @Table, @Id, @GeneratedValue
- Proper relationship annotations with FetchType.LAZY
- Audit fields with @CreationTimestamp, @LastModifiedTimestamp
- Equals/hashCode based on business key (not auto-generated id)

### 2. Spring Data Repository
- Interface extending JpaRepository<Entity, IdType>
- Custom query methods using JPQL with JOIN FETCH for eager loading
- Pagination support

### 3. Service Layer
- @Service with constructor injection
- @Transactional(readOnly = true) class-level, @Transactional on mutations
- Business validation before persistence
- Domain event publishing with ApplicationEventPublisher

### 4. REST Controller
- @RestController with versioned @RequestMapping ("/api/v1/...")
- @Valid on request DTOs
- Proper HTTP status codes: 201 Created, 204 No Content, etc.
- Pageable endpoints with @ParameterObject

### 5. Request/Response DTOs
- Java records for immutability
- Jakarta Bean Validation annotations (@NotBlank, @Size, @Min, etc.)
- Separate Create, Update, and Response DTOs

### 6. Exception Classes
- ResourceNotFoundException extending RuntimeException
- BusinessRuleViolationException with ruleCode

### 7. Tests
- @WebMvcTest for controller (happy path, validation, security)
- @DataJpaTest for repository (queries, entity mapping)
- Unit test for service (mocked repository with Mockito)

### 8. Flyway Migration
- V{timestamp}__create_{entity}_table.sql
- Proper column types, constraints, and indexes
`,
      },
      {
        name: 'spring-boot-security-setup',
        description: 'Configure Spring Security for REST API or web app with modern patterns',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# Spring Security Setup Skill

## REST API Security (Stateless + JWT)
1. SecurityFilterChain with CSRF disabled, STATELESS session
2. OAuth2 Resource Server with JWT decoder
3. @EnableMethodSecurity for @PreAuthorize support
4. Custom JwtAuthenticationConverter for authorities mapping
5. CORS configuration with explicit allowed origins

## Web Application Security (Session-based)
1. SecurityFilterChain with CSRF enabled (default)
2. Form login with custom login page
3. Remember-me with persistent token
4. Session management with maximum sessions
5. Logout with session invalidation and cookie cleanup

## Common Components
- BCryptPasswordEncoder bean
- Custom UserDetailsService implementation
- Custom AccessDeniedHandler and AuthenticationEntryPoint
- Security event listener for audit logging
- Test configuration with @WithMockUser patterns
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/@Autowired\\s+(?:private|protected|public)\\s/.test(c))issues.push(\'@Autowired field injection detected — use constructor injection for testability and immutability\');if(/extends\\s+WebSecurityConfigurerAdapter/.test(c))issues.push(\'WebSecurityConfigurerAdapter is removed in Spring Security 6 — use SecurityFilterChain @Bean\');if(/ddl-auto\\s*[:=]\\s*(update|create|create-drop)/.test(c)&&!/test|dev/.test(f))issues.push(\'hibernate.ddl-auto is not safe for production — use Flyway or Liquibase migrations\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/@Entity/.test(c)&&/@RestController/.test(c))issues.push(\'Entity and Controller in the same file — separate into distinct files per layer\');if(/@Entity/.test(c)&&/FetchType\\.EAGER/.test(c))issues.push(\'FetchType.EAGER on entity relationship — use LAZY and JOIN FETCH in queries to avoid N+1\');if(/@RequestBody/.test(c)&&!/@Valid/.test(c)&&!/Map</.test(c))issues.push(\'@RequestBody without @Valid — add @Valid to trigger Bean Validation on request DTOs\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
