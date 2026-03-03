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

## Project Structure (Official Recommendation)

Place the main application class in the root package above feature packages.
Spring Boot uses this package as the base for \`@ComponentScan\`, \`@EntityScan\`, and \`@ConfigurationPropertiesScan\`.

\`\`\`
com.example.myapp/
    MyApplication.java                  ← @SpringBootApplication in root package
    config/
        SecurityConfig.java             ← @Configuration for cross-cutting concerns
        CacheConfig.java
    customer/
        Customer.java                   ← @Entity
        CustomerDto.java                ← Request/response DTO
        CustomerController.java         ← @RestController
        CustomerService.java            ← @Service
        CustomerRepository.java         ← Spring Data JPA interface
    order/
        Order.java
        OrderLineItem.java
        OrderDto.java
        OrderController.java
        OrderService.java
        OrderRepository.java
\`\`\`

### Correct
\`\`\`java
// Root package — ensures all sub-packages are scanned
package com.example.myapp;

@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
\`\`\`

### Anti-Pattern
\`\`\`java
// Bad: main class in a sub-package — sibling packages are NOT scanned
package com.example.myapp.config;

@SpringBootApplication
public class MyApplication {
    // Beans in com.example.myapp.order will not be detected!
    // Fix: move to com.example.myapp root package
}
\`\`\`

## Dependency Injection

### Correct — Constructor Injection
\`\`\`java
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;

    // Single constructor — Spring auto-wires without @Autowired
    public OrderService(OrderRepository orderRepository,
                        PaymentGateway paymentGateway,
                        NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentGateway = paymentGateway;
        this.notificationService = notificationService;
    }
}
\`\`\`

### Anti-Pattern — Field Injection
\`\`\`java
@Service
public class OrderService {
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentGateway paymentGateway;
    // Bad: hides dependencies, prevents final fields, makes unit testing
    // harder (requires reflection or Spring context)
    // Fix: use constructor injection as shown above
}
\`\`\`

## REST Controller Patterns

### Correct — Clean Controller
\`\`\`java
@RestController
@RequestMapping("/api/v1/orders")
@Validated
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id);
    }

    @GetMapping
    public Page<OrderResponse> listOrders(@ParameterObject Pageable pageable) {
        return orderService.listOrders(pageable);
    }
}
\`\`\`

### Anti-Pattern — Fat Controller
\`\`\`java
@RestController
public class OrderController {
    @Autowired private OrderRepository orderRepository;
    @Autowired private EntityManager em;

    @PostMapping("/orders")
    public Order createOrder(@RequestBody Map<String, Object> body) {
        // Bad: business logic in controller, raw Map instead of typed DTO,
        // direct repository access bypassing service layer, no validation
        Order order = new Order();
        order.setAmount((Double) body.get("amount"));
        return orderRepository.save(order);
    }
    // Fix: use typed DTO with @Valid, delegate to service layer
}
\`\`\`

## JPA / Hibernate Best Practices

### Correct — Entity with Proper Mapping
\`\`\`java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderLineItem> lineItems = new ArrayList<>();

    @CreationTimestamp
    private Instant createdAt;

    // Business methods on the entity itself for domain logic
    public void addLineItem(OrderLineItem item) {
        lineItems.add(item);
        item.setOrder(this);
    }
}
\`\`\`

### Anti-Pattern — N+1 Query Risk
\`\`\`java
@Entity
public class Order {
    @OneToMany(fetch = FetchType.EAGER)  // Bad: EAGER loads all line items on every query
    private List<OrderLineItem> lineItems;
    // Fix: use FetchType.LAZY (default for collections) + JOIN FETCH in queries
}

// Repository with N+1 problem:
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> o.getLineItems().size()); // N+1 queries!

// Fix: use @EntityGraph or JPQL JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.lineItems WHERE o.status = :status")
List<Order> findByStatusWithLineItems(@Param("status") OrderStatus status);
\`\`\`

### Transaction Management
\`\`\`java
@Service
@Transactional(readOnly = true) // Default: read-only for all methods
public class OrderService {

    @Transactional // Overrides to read-write for mutations
    public OrderResponse createOrder(CreateOrderRequest request) {
        Order order = mapToEntity(request);
        Order saved = orderRepository.save(order);
        eventPublisher.publishEvent(new OrderCreatedEvent(saved.getId()));
        return mapToResponse(saved);
    }

    public OrderResponse getOrder(UUID id) {
        // Inherits read-only transaction — enables JPA query optimizations
        return orderRepository.findById(id)
            .map(this::mapToResponse)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }
}
\`\`\`

## Type-Safe Configuration

### Correct — @ConfigurationProperties
\`\`\`java
@Validated
@ConfigurationProperties(prefix = "app.payment")
public record PaymentProperties(
    @NotBlank String apiUrl,
    @NotBlank String apiKey,
    @Min(1) @Max(30) int timeoutSeconds,
    @NotNull RetryProperties retry
) {
    public record RetryProperties(
        @Min(0) @Max(10) int maxAttempts,
        @Min(100) long backoffMs
    ) {}
}
\`\`\`

### Anti-Pattern — Scattered @Value
\`\`\`java
@Service
public class PaymentService {
    @Value("\${app.payment.api-url}") private String apiUrl;
    @Value("\${app.payment.api-key}") private String apiKey;
    @Value("\${app.payment.timeout:10}") private int timeout;
    // Bad: no validation at startup, no type safety for nested config,
    // scattered across classes, hard to test
    // Fix: use @ConfigurationProperties record with @Validated
}
\`\`\`
`,
      },
      {
        path: 'spring-boot/error-handling.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'mandatory',
        description: 'Spring Boot centralized error handling with RFC 9457 ProblemDetail',
        content: `# Spring Boot Error Handling

## Centralized Exception Handling with @RestControllerAdvice

Use a single \`@RestControllerAdvice\` class to map exceptions to consistent HTTP responses.
Spring Boot 3+ supports RFC 9457 (ProblemDetail) natively.

### Correct — Structured Error Handling
\`\`\`java
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setProperty("resourceId", ex.getResourceId());
        return problem;
    }

    @ExceptionHandler(BusinessRuleViolationException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleViolationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Business Rule Violation");
        problem.setProperty("ruleCode", ex.getRuleCode());
        return problem;
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setTitle("Validation Failed");
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid",
                (a, b) -> a));
        problem.setProperty("fieldErrors", errors);
        return ResponseEntity.status(status).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred");
        problem.setTitle("Internal Server Error");
        // Never expose stack trace or internal details to the client
        return problem;
    }
}
\`\`\`

### Anti-Pattern — No Centralized Handling
\`\`\`java
@RestController
public class OrderController {
    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrder(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(orderService.getOrder(id));
        } catch (OrderNotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.toString()));
            // Bad: inconsistent error format, stack trace leak, duplicated in every controller
        }
    }
    // Fix: let exceptions propagate — @RestControllerAdvice handles them uniformly
}
\`\`\`

## Custom Domain Exceptions

\`\`\`java
public class ResourceNotFoundException extends RuntimeException {
    private final String resourceId;

    public ResourceNotFoundException(String resourceType, Object id) {
        super("%s with id '%s' not found".formatted(resourceType, id));
        this.resourceId = String.valueOf(id);
    }

    public String getResourceId() { return resourceId; }
}

public class BusinessRuleViolationException extends RuntimeException {
    private final String ruleCode;

    public BusinessRuleViolationException(String ruleCode, String message) {
        super(message);
        this.ruleCode = ruleCode;
    }

    public String getRuleCode() { return ruleCode; }
}
\`\`\`
`,
      },
      {
        path: 'spring-boot/security.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'mandatory',
        description: 'Spring Security configuration with SecurityFilterChain pattern',
        content: `# Spring Security Configuration

## SecurityFilterChain Bean Pattern (Spring Security 6+)

Configure security using \`SecurityFilterChain\` beans — the \`WebSecurityConfigurerAdapter\`
was removed in Spring Security 6. Spring Boot auto-configures sensible defaults: CSRF
protection, session fixation prevention, security headers (HSTS, X-Content-Type-Options,
X-Frame-Options), and BCrypt password encoding.

### Correct — Stateless REST API Security
\`\`\`java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable()) // Stateless API — no session, no CSRF needed
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**", "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
\`\`\`

### Correct — Session-Based Web App Security
\`\`\`java
@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain webFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(Customizer.withDefaults()) // CSRF enabled for session-based apps
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/css/**", "/js/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard")
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )
            .build();
    }
}
\`\`\`

### Anti-Pattern — Deprecated Approach
\`\`\`java
// Bad: WebSecurityConfigurerAdapter was removed in Spring Security 6
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests().anyRequest().authenticated();
    }
    // Fix: use SecurityFilterChain @Bean method as shown above
}
\`\`\`

## Method-Level Security

\`\`\`java
@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN') or #customerId == authentication.principal.id")
    public List<OrderResponse> getOrdersByCustomer(UUID customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
            .map(this::mapToResponse)
            .toList();
    }

    @PreAuthorize("hasAuthority('ORDER_WRITE')")
    public OrderResponse createOrder(CreateOrderRequest request) {
        // Only users with ORDER_WRITE authority can create orders
    }
}
\`\`\`

## Password Storage

\`\`\`java
// Always use BCrypt or Argon2 — never store plaintext passwords
@Service
public class UserService {
    private final PasswordEncoder passwordEncoder;

    public User registerUser(RegistrationRequest request) {
        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password())); // BCrypt hash
        return userRepository.save(user);
    }
}
\`\`\`

## CORS Configuration at Security Level

\`\`\`java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .cors(cors -> cors.configurationSource(corsConfigSource()))
        .csrf(csrf -> csrf.disable())
        // ... other config
        .build();
}

@Bean
public CorsConfigurationSource corsConfigSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.example.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
\`\`\`
`,
      },
      {
        path: 'spring-boot/testing.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'recommended',
        description: 'Spring Boot testing patterns with test slices and TestContainers',
        content: `# Spring Boot Testing Patterns

## Test Slices — Use the Narrowest Context

Spring Boot provides test slice annotations that load only the relevant parts
of the application context, making tests faster and more focused.

| Annotation | Scope | Use For |
|-----------|-------|---------|
| \`@WebMvcTest\` | Controller + filters + advice | REST endpoint behavior, validation, serialization |
| \`@DataJpaTest\` | JPA repos + Hibernate + embedded DB | Repository queries, entity mappings |
| \`@RestClientTest\` | RestTemplate/WebClient + MockRestServiceServer | HTTP client behavior |
| \`@JsonTest\` | Jackson ObjectMapper | JSON serialization/deserialization |
| \`@SpringBootTest\` | Full context | Integration tests, end-to-end flows |

### Controller Test with @WebMvcTest
\`\`\`java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("POST /api/v1/orders — 201 Created with valid request")
    void createOrder_validRequest_returnsCreated() throws Exception {
        var request = new CreateOrderRequest(UUID.randomUUID(), List.of(
            new OrderItemRequest("SKU-001", 2)));
        var response = new OrderResponse(UUID.randomUUID(), OrderStatus.CREATED, BigDecimal.TEN);

        when(orderService.createOrder(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("CREATED"))
            .andExpect(jsonPath("$.id").exists());
    }

    @Test
    @DisplayName("POST /api/v1/orders — 400 when request body is invalid")
    void createOrder_invalidRequest_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors").exists());
    }
}
\`\`\`

### Repository Test with @DataJpaTest
\`\`\`java
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE) // Use TestContainers DB
class OrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findByCustomerIdAndStatus — returns only matching orders")
    void findByCustomerIdAndStatus() {
        Customer customer = entityManager.persist(new Customer("Jane"));
        entityManager.persist(new Order(customer, OrderStatus.CREATED));
        entityManager.persist(new Order(customer, OrderStatus.SHIPPED));
        entityManager.flush();

        List<Order> result = orderRepository
            .findByCustomerIdAndStatus(customer.getId(), OrderStatus.CREATED);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(OrderStatus.CREATED);
    }
}
\`\`\`

### Integration Test with TestContainers
\`\`\`java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestClient restClient;

    @Test
    @DisplayName("Full order lifecycle: create -> get -> list")
    void orderLifecycle() {
        var createRequest = new CreateOrderRequest(/*...*/);

        var created = restClient.post().uri("/api/v1/orders")
            .body(createRequest)
            .exchange()
            .expectStatus().isCreated()
            .expectBody(OrderResponse.class)
            .returnResult().getResponseBody();

        restClient.get().uri("/api/v1/orders/{id}", created.id())
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(created.id().toString());
    }
}
\`\`\`

### Security Test
\`\`\`java
@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
class OrderControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("Unauthenticated request returns 401")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/orders"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("Authenticated user can access orders")
    void authenticated_canAccess() throws Exception {
        when(orderService.listOrders(any())).thenReturn(Page.empty());

        mockMvc.perform(get("/api/v1/orders"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("Non-admin cannot access admin endpoints")
    void nonAdmin_cannotAccessAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/reports"))
            .andExpect(status().isForbidden());
    }
}
\`\`\`
`,
      },
      {
        path: 'spring-boot/actuator-and-observability.md',
        paths: ['**/*.java', 'src/main/**/*', 'src/test/**/*'],
        governance: 'recommended',
        description: 'Spring Boot Actuator, health checks, metrics, and observability setup',
        content: `# Spring Boot Actuator & Observability

## Actuator Configuration

\`\`\`yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true          # Kubernetes liveness/readiness probes
  health:
    db:
      enabled: true
    diskSpace:
      enabled: true
  info:
    env:
      enabled: true
    java:
      enabled: true
    os:
      enabled: true
\`\`\`

## Custom Health Indicators

\`\`\`java
@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {

    private final PaymentGateway paymentGateway;

    public PaymentGatewayHealthIndicator(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    @Override
    public Health health() {
        try {
            paymentGateway.ping();
            return Health.up()
                .withDetail("provider", "stripe")
                .build();
        } catch (Exception ex) {
            return Health.down()
                .withDetail("provider", "stripe")
                .withDetail("error", ex.getMessage())
                .build();
        }
    }
}
\`\`\`

## Custom Metrics with Micrometer

\`\`\`java
@Service
public class OrderService {
    private final Counter orderCounter;
    private final Timer orderProcessingTimer;

    public OrderService(MeterRegistry registry, OrderRepository orderRepository) {
        this.orderCounter = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("source", "api")
            .register(registry);
        this.orderProcessingTimer = Timer.builder("orders.processing.time")
            .description("Order processing duration")
            .register(registry);
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        return orderProcessingTimer.record(() -> {
            Order order = processOrder(request);
            orderCounter.increment();
            return mapToResponse(order);
        });
    }
}
\`\`\`

## Structured Logging

\`\`\`yaml
# application.yml — Spring Boot 3.4+ structured logging
logging:
  structured:
    format:
      console: ecs    # Elastic Common Schema (or logstash, gelf)
\`\`\`

\`\`\`java
// Use MDC for request-scoped tracing context
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain) throws Exception {
        String correlationId = Optional
            .ofNullable(request.getHeader("X-Correlation-ID"))
            .orElse(UUID.randomUUID().toString());
        MDC.put("correlationId", correlationId);
        response.setHeader("X-Correlation-ID", correlationId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");
        }
    }
}
\`\`\`
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
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/@Autowired\\s+(?:private|protected|public)\\s/.test(c))issues.push(\'@Autowired field injection detected — use constructor injection for testability and immutability\');if(/extends\\s+WebSecurityConfigurerAdapter/.test(c))issues.push(\'WebSecurityConfigurerAdapter is removed in Spring Security 6 — use SecurityFilterChain @Bean\');if(/ddl-auto\\s*[:=]\\s*(update|create|create-drop)/.test(c)&&!/test|dev/.test(f))issues.push(\'hibernate.ddl-auto is not safe for production — use Flyway or Liquibase migrations\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: 'node -e "const f=process.argv[1]||\'\';if(!/\\.java$/.test(f))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/@Entity/.test(c)&&/@RestController/.test(c))issues.push(\'Entity and Controller in the same file — separate into distinct files per layer\');if(/@Entity/.test(c)&&/FetchType\\.EAGER/.test(c))issues.push(\'FetchType.EAGER on entity relationship — use LAZY and JOIN FETCH in queries to avoid N+1\');if(/@RequestBody/.test(c)&&!/@Valid/.test(c)&&!/Map</.test(c))issues.push(\'@RequestBody without @Valid — add @Valid to trigger Bean Validation on request DTOs\');if(issues.length)console.log(issues.map(i=>\'WARNING: \'+i).join(\'\\n\'))" -- "$CLAUDE_FILE_PATH"',
          timeout: 5,
        }],
      },
    ],
  },
};
