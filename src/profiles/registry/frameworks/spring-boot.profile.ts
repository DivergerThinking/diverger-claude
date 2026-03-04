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

## Input Validation & SQL Injection Prevention
- Use \`@Valid @RequestBody\` on all DTO parameters — never accept raw \`Map<String, Object>\`
- Apply Jakarta Bean Validation annotations (\`@NotBlank\`, \`@Size\`, \`@Email\`, \`@Min\`) on DTO fields
- Use \`@Validated\` at controller class level for constraint annotations on \`@PathVariable\` and \`@RequestParam\`
- In custom \`@Query\` annotations, always use named parameters (\`:paramName\`) — never string concatenation
- Use parameterized queries in JdbcTemplate: \`jdbcTemplate.query(sql, params)\` — never build SQL with \`+\`
- Sanitize user input that goes into log statements to prevent log injection
- Reject unexpected fields with \`spring.jackson.deserialization.fail-on-unknown-properties: true\` in sensitive APIs
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
        name: 'spring-di-guide',
        description: 'Detailed reference for Spring dependency injection: constructor injection, qualifiers, scopes, profiles, and configuration',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Spring Dependency Injection — Detailed Reference

## Constructor Injection (Preferred)
- Use constructor injection for all required dependencies — Spring auto-wires when there is a single constructor
- Declare fields as \`private final\` for immutability — no setter needed
- Lombok \`@RequiredArgsConstructor\` can generate the constructor from final fields
- For optional dependencies, use \`@Autowired(required = false)\` on a setter or \`Optional<T>\` constructor parameter

### Correct
\\\`\\\`\\\`java
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
    private final ApplicationEventPublisher eventPublisher;

    // Single constructor — Spring auto-wires, no @Autowired needed
    public OrderService(OrderRepository orderRepository,
                        PaymentGateway paymentGateway,
                        ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.paymentGateway = paymentGateway;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Order placeOrder(CreateOrderRequest request) {
        Order order = orderRepository.save(Order.from(request));
        paymentGateway.charge(order.getTotal());
        eventPublisher.publishEvent(new OrderPlacedEvent(order.getId()));
        return order;
    }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`java
@Service
public class OrderService {

    // WRONG: field injection — not testable without reflection, hides dependencies
    @Autowired
    private OrderRepository orderRepository;

    // WRONG: field injection with no final — mutable, can be reassigned
    @Autowired
    private PaymentGateway paymentGateway;

    // WRONG: no way to construct this object in a unit test without Spring context
}
\\\`\\\`\\\`

## @Qualifier and @Primary
- Use \`@Qualifier("beanName")\` when multiple beans of the same type exist
- Use \`@Primary\` on the default implementation — other beans are selected with \`@Qualifier\`
- Prefer custom qualifier annotations over string-based qualifiers for type safety

### Correct
\\\`\\\`\\\`java
// Define two implementations
@Service
@Primary
public class StripePaymentGateway implements PaymentGateway { /* ... */ }

@Service
@Qualifier("paypal")
public class PayPalPaymentGateway implements PaymentGateway { /* ... */ }

// Inject the primary (Stripe) by default
@Service
public class CheckoutService {
    private final PaymentGateway gateway; // gets StripePaymentGateway

    public CheckoutService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}

// Inject a specific implementation when needed
@Service
public class RefundService {
    private final PaymentGateway gateway;

    public RefundService(@Qualifier("paypal") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`java
// WRONG: no @Qualifier or @Primary — Spring fails at startup with ambiguous bean
@Service
public class CheckoutService {
    private final PaymentGateway gateway;
    // NoUniqueBeanDefinitionException: expected single bean but found 2
    public CheckoutService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
\\\`\\\`\\\`

## @Profile and @Conditional
- Use \`@Profile("dev")\` to activate beans only in specific environments
- Use \`@ConditionalOnProperty\` for feature flags: \`@ConditionalOnProperty(name = "feature.x.enabled", havingValue = "true")\`
- Use \`@ConditionalOnMissingBean\` for default implementations that can be overridden
- Use \`@ConditionalOnClass\` for optional integrations that depend on classpath availability

### Correct
\\\`\\\`\\\`java
@Configuration
public class CacheConfig {

    @Bean
    @Profile("prod")
    @ConditionalOnClass(name = "io.lettuce.core.RedisClient")
    public CacheManager redisCacheManager(RedisConnectionFactory factory) {
        return RedisCacheManager.builder(factory)
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)))
            .build();
    }

    @Bean
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager inMemoryCacheManager() {
        return new ConcurrentMapCacheManager("default");
    }
}
\\\`\\\`\\\`

## Bean Scope
- \`singleton\` (default): One instance per application context — use for stateless services
- \`prototype\`: New instance per injection point and per \`getBean()\` call — use for stateful short-lived objects
- \`request\`: One instance per HTTP request — use for request-scoped data holders
- \`session\`: One instance per HTTP session — use for user session state

### Correct
\\\`\\\`\\\`java
@Configuration
public class ScopeConfig {

    // Prototype: each injection gets a fresh instance
    @Bean
    @Scope("prototype")
    public ReportBuilder reportBuilder() {
        return new ReportBuilder();
    }

    // Request scope: one per HTTP request, inject via proxy
    @Bean
    @Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public RequestAuditContext auditContext() {
        return new RequestAuditContext();
    }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`java
// WRONG: mutable state in a singleton — shared across all requests, thread-unsafe
@Service
public class ReportService {
    private List<String> currentRows = new ArrayList<>(); // shared mutable state!

    public void addRow(String row) {
        currentRows.add(row); // race condition in concurrent requests
    }
}
\\\`\\\`\\\`

## @Configuration and @Bean
- Use \`@Configuration\` classes to group related bean definitions
- \`@Bean\` methods define beans that Spring cannot auto-detect (third-party classes, complex setup)
- Use \`proxyBeanMethods = false\` on \`@Configuration\` for lite mode (no CGLIB proxy, faster startup)
- Separate configuration by concern: \`SecurityConfig\`, \`CacheConfig\`, \`AsyncConfig\`

### Correct
\\\`\\\`\\\`java
@Configuration(proxyBeanMethods = false)
public class HttpClientConfig {

    @Bean
    public RestClient restClient(RestClient.Builder builder) {
        return builder
            .baseUrl("https://api.example.com")
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .requestInterceptor(new LoggingInterceptor())
            .build();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
            .addModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .build();
    }
}
\\\`\\\`\\\`

## Component Scanning
- \`@SpringBootApplication\` scans the package it is in and all sub-packages
- Place the main class in the root package (e.g., \`com.example.myapp\`)
- Feature packages underneath: \`com.example.myapp.order\`, \`com.example.myapp.user\`
- Use \`@ComponentScan(basePackages = ...)\` only when scanning outside the root package

## Testing with @MockBean and @SpyBean
- \`@MockBean\` replaces a bean in the Spring context with a Mockito mock — use in \`@WebMvcTest\` to mock service layer
- \`@SpyBean\` wraps the real bean with a spy — use when you need real behavior with selective stubbing
- Prefer \`@MockBean\` for controller tests, \`@SpyBean\` for integration tests needing partial mocking
- In Spring Boot 3.4+, consider \`@MockitoBean\` and \`@MockitoSpyBean\` as the newer alternatives

### Correct
\\\`\\\`\\\`java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService; // mock replaces real bean in context

    @Test
    @DisplayName("GET /api/v1/orders/{id} — returns order when found")
    void getOrder_returnsOrder() throws Exception {
        given(orderService.findById(1L)).willReturn(Optional.of(sampleOrder()));

        mockMvc.perform(get("/api/v1/orders/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/orders/{id} — returns 404 when not found")
    void getOrder_notFound() throws Exception {
        given(orderService.findById(99L)).willReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/orders/99"))
            .andExpect(status().isNotFound());
    }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`java
// WRONG: using @SpringBootTest to test a single controller — loads entire context unnecessarily
@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {
    @Autowired
    private MockMvc mockMvc;
    // Full app context loaded for a simple controller test — slow, brittle
}
\\\`\\\`\\\`
`,
      },
      {
        name: 'spring-testing-guide',
        description: 'Detailed reference for Spring Boot testing: test slices, MockMvc, TestContainers, security tests, and integration patterns',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Spring Boot Testing — Detailed Reference

## Test Slices — Use the Narrowest Context
- \`@WebMvcTest(Controller.class)\`: Loads only the web layer — controller, filters, advice, converters
- \`@DataJpaTest\`: Loads JPA components — entities, repositories, Hibernate, embedded DB
- \`@WebFluxTest(Controller.class)\`: Loads WebFlux layer — reactive controllers, WebTestClient
- \`@RestClientTest(Client.class)\`: Loads RestTemplate/WebClient with MockRestServiceServer
- \`@JsonTest\`: Loads Jackson ObjectMapper for serialization tests
- \`@SpringBootTest\`: Loads the full application context — use ONLY for end-to-end integration tests

## MockMvc Patterns

### Correct — Testing a REST endpoint
\\\`\\\`\\\`java
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("POST /api/v1/products — creates product and returns 201")
    void createProduct_returnsCreated() throws Exception {
        var request = new CreateProductRequest("Widget", new BigDecimal("29.99"), "Tools");
        var response = new ProductResponse(1L, "Widget", new BigDecimal("29.99"), "Tools");
        given(productService.create(any())).willReturn(response);

        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "Widget", "price": 29.99, "category": "Tools"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.name").value("Widget"))
            .andExpect(jsonPath("$.price").value(29.99));
    }

    @Test
    @DisplayName("POST /api/v1/products — returns 400 for invalid request body")
    void createProduct_invalidRequest_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "", "price": -1}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail").exists())
            .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/products — returns paginated list")
    void listProducts_returnsPaginatedResults() throws Exception {
        var page = new PageImpl<>(List.of(sampleProduct()), PageRequest.of(0, 20), 1);
        given(productService.findAll(any(Pageable.class))).willReturn(page);

        mockMvc.perform(get("/api/v1/products")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").value(1));
    }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`java
// WRONG: using @SpringBootTest for controller unit tests — loads entire context, slow
@SpringBootTest
@AutoConfigureMockMvc
class ProductControllerTest {
    @Autowired
    private MockMvc mockMvc;
    // No @MockBean — hits real service and database, making this an integration test
}

// WRONG: testing service logic through MockMvc — test services directly with unit tests
@WebMvcTest(ProductController.class)
class ProductControllerTest {
    @Test
    void createProduct_verifiesBusinessRules() {
        // Controller tests should verify HTTP behavior, not business logic
    }
}
\\\`\\\`\\\`

## @DataJpaTest — Repository Testing

### Correct
\\\`\\\`\\\`java
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Testcontainers
class ProductRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findByCategory — returns only products in the given category")
    void findByCategory_returnsMatchingProducts() {
        entityManager.persist(new Product("Widget", new BigDecimal("10.00"), "Tools"));
        entityManager.persist(new Product("Gadget", new BigDecimal("20.00"), "Electronics"));
        entityManager.persist(new Product("Wrench", new BigDecimal("15.00"), "Tools"));
        entityManager.flush();

        List<Product> tools = productRepository.findByCategory("Tools");

        assertThat(tools).hasSize(2)
            .extracting(Product::getName)
            .containsExactlyInAnyOrder("Widget", "Wrench");
    }

    @Test
    @DisplayName("custom JPQL query — fetches product with reviews eagerly")
    void findWithReviews_usesJoinFetch() {
        var product = entityManager.persist(new Product("Widget", new BigDecimal("10.00"), "Tools"));
        entityManager.persist(new Review(product, 5, "Great product"));
        entityManager.flush();
        entityManager.clear(); // clear persistence context to force DB fetch

        Product result = productRepository.findWithReviewsById(product.getId()).orElseThrow();

        assertThat(result.getReviews()).hasSize(1);
        // No LazyInitializationException — JOIN FETCH loaded reviews
    }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`java
// WRONG: using H2 when production uses PostgreSQL — behavior differences in queries
@DataJpaTest // default replaces DB with H2
class ProductRepositoryTest {
    // H2 may accept queries that PostgreSQL rejects (different SQL dialects)
    // Use TestContainers with @AutoConfigureTestDatabase(replace = NONE) instead
}

// WRONG: not clearing persistence context — test passes due to first-level cache, not DB query
@Test
void findById_returnsProduct() {
    entityManager.persist(product);
    // entityManager.flush() and entityManager.clear() missing!
    Product found = repository.findById(product.getId()).orElseThrow();
    // This reads from the persistence context cache, not the database
}
\\\`\\\`\\\`

## @WebFluxTest — Reactive Controller Testing

### Correct
\\\`\\\`\\\`java
@WebFluxTest(ProductController.class)
class ProductControllerWebFluxTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private ProductService productService;

    @Test
    @DisplayName("GET /api/v1/products/{id} — returns product as reactive response")
    void getProduct_returnsProduct() {
        given(productService.findById(1L)).willReturn(Mono.just(sampleProduct()));

        webTestClient.get().uri("/api/v1/products/1")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.name").isEqualTo("Widget");
    }
}
\\\`\\\`\\\`

## TestRestTemplate — Full Integration Tests

### Correct
\\\`\\\`\\\`java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class ProductIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("Full CRUD lifecycle — create, read, update, delete")
    void productLifecycle() {
        // Create
        var createRequest = new CreateProductRequest("Widget", new BigDecimal("29.99"), "Tools");
        ResponseEntity<ProductResponse> createResponse =
            restTemplate.postForEntity("/api/v1/products", createRequest, ProductResponse.class);
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long productId = createResponse.getBody().id();

        // Read
        ResponseEntity<ProductResponse> getResponse =
            restTemplate.getForEntity("/api/v1/products/" + productId, ProductResponse.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().name()).isEqualTo("Widget");

        // Update
        var updateRequest = new UpdateProductRequest("Updated Widget", new BigDecimal("39.99"));
        restTemplate.put("/api/v1/products/" + productId, updateRequest);

        // Delete
        restTemplate.delete("/api/v1/products/" + productId);
        ResponseEntity<ProductResponse> deletedResponse =
            restTemplate.getForEntity("/api/v1/products/" + productId, ProductResponse.class);
        assertThat(deletedResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
\\\`\\\`\\\`

## Security Testing

### Correct
\\\`\\\`\\\`java
@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class AdminControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @Test
    @DisplayName("GET /api/v1/admin/users — returns 401 without authentication")
    void listUsers_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("GET /api/v1/admin/users — returns 403 for non-admin user")
    void listUsers_regularUser_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/admin/users — returns 200 for admin user")
    void listUsers_admin_returns200() throws Exception {
        given(adminService.listUsers()).willReturn(List.of(sampleUser()));

        mockMvc.perform(get("/api/v1/admin/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`java
// WRONG: testing security without importing SecurityConfig — security filters not loaded
@WebMvcTest(AdminController.class)
class AdminControllerSecurityTest {
    // No @Import(SecurityConfig.class) — all requests pass through without auth checks
    // Tests pass but security is not actually tested
}

// WRONG: disabling security in integration tests instead of testing with proper auth
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // disables security filters entirely
class AdminControllerTest {
    // Security is skipped — no assurance that protected endpoints are secure
}
\\\`\\\`\\\`

## H2 for Fast Unit Tests vs TestContainers for Integration
- Use H2 for quick feedback in \`@DataJpaTest\` during development (default behavior)
- Use TestContainers with real database for CI and pre-merge validation
- Use \`@ActiveProfiles("test")\` with \`application-test.yml\` to switch between H2 and TestContainers
- Always validate with the real database before merging — H2 has different SQL dialect behavior

## AssertJ Best Practices
\\\`\\\`\\\`java
// Prefer AssertJ fluent assertions over JUnit assertEquals
assertThat(result).isNotNull();
assertThat(result.getName()).isEqualTo("Widget");
assertThat(products).hasSize(3)
    .extracting(Product::getName)
    .containsExactlyInAnyOrder("A", "B", "C");
assertThat(result.getPrice()).isCloseTo(new BigDecimal("29.99"), within(new BigDecimal("0.01")));

// Use assertThatThrownBy for exception testing
assertThatThrownBy(() -> service.findById(999L))
    .isInstanceOf(ResourceNotFoundException.class)
    .hasMessageContaining("Product not found");
\\\`\\\`\\\`
`,
      },
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
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/@Autowired\\s+(?:private|protected|public)\\s/.test(c))issues.push(\'@Autowired field injection detected — use constructor injection for testability and immutability\');if(/extends\\s+WebSecurityConfigurerAdapter/.test(c))issues.push(\'WebSecurityConfigurerAdapter is removed in Spring Security 6 — use SecurityFilterChain @Bean\');if(/ddl-auto\\s*[:=]\\s*(update|create|create-drop)/.test(c)&&!/test|dev/.test(f))issues.push(\'hibernate.ddl-auto is not safe for production — use Flyway or Liquibase migrations\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/@Entity/.test(c)&&/@RestController/.test(c))issues.push(\'Entity and Controller in the same file — separate into distinct files per layer\');if(/@Entity/.test(c)&&/FetchType\\.EAGER/.test(c))issues.push(\'FetchType.EAGER on entity relationship — use LAZY and JOIN FETCH in queries to avoid N+1\');if(/@RequestBody/.test(c)&&!/@Valid/.test(c)&&!/Map</.test(c))issues.push(\'@RequestBody without @Valid — add @Valid to trigger Bean Validation on request DTOs\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f)&&!/\\.yml$/.test(f)&&!/\\.yaml$/.test(f)&&!/\\.properties$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/\\.java$/.test(f)){if(/CascadeType\\.ALL/.test(c)&&/@ManyToOne/.test(c))issues.push(\'CascadeType.ALL on @ManyToOne — parent deletion will cascade to child; use CascadeType.ALL only on @OneToMany owning side\');if(/\"[^\"]*\"\\s*\\+\\s*\\w/.test(c)&&/(createQuery|nativeQuery|jdbcTemplate|JdbcTemplate)/.test(c))issues.push(\'String concatenation in SQL query — use named parameters (:param) or ? placeholders to prevent SQL injection\');if(/(password|secret|apiKey|api_key|token)\\s*=\\s*\"[^\"]+\"/.test(c))issues.push(\'Hardcoded secret detected — externalize to environment variables or Spring Vault\');if(/@Transactional/.test(c)&&/@Controller|@RestController/.test(c))issues.push(\'@Transactional on controller — move transaction management to the service layer\')}if(/\\.(yml|yaml|properties)$/.test(f)){if(/cors\\.allowed-origins\\s*[:=]\\s*\\*/.test(c))issues.push(\'CORS wildcard * allowed origin — use explicit origins in production\');if(/management\\.endpoints\\.web\\.exposure\\.include\\s*[:=]\\s*\\*/.test(c))issues.push(\'All Actuator endpoints exposed — restrict to health, info, metrics, prometheus\')}if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Edit',
        hooks: [{
          type: 'command' as const,
          command: 'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/@Autowired\\s+(?:private|protected|public)\\s/.test(c))issues.push(\'@Autowired field injection detected — use constructor injection\');if(/@RequestBody/.test(c)&&!/@Valid/.test(c)&&!/Map</.test(c))issues.push(\'@RequestBody without @Valid — add @Valid for Bean Validation\');if(/@Entity/.test(c)&&/FetchType\\.EAGER/.test(c))issues.push(\'FetchType.EAGER detected — use LAZY and JOIN FETCH to avoid N+1\');if(/extends\\s+WebSecurityConfigurerAdapter/.test(c))issues.push(\'WebSecurityConfigurerAdapter removed in Spring Security 6 — use SecurityFilterChain @Bean\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
