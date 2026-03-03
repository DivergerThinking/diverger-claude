import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const csharpProfile: Profile = {
  id: 'languages/csharp',
  name: 'C#',
  layer: PROFILE_LAYERS.LANGUAGE,
  technologyIds: ['csharp'],
  contributions: {
    claudeMd: [
      {
        heading: 'C# Conventions',
        order: 10,
        content: `## C# Conventions

Modern C# (10+) with nullable reference types, records, and pattern matching.

**Detailed rules:** see \`.claude/rules/csharp/\` directory.

**Key rules:**
- Enable nullable reference types (\`<Nullable>enable</Nullable>\`), use \`record\` for immutable DTOs
- Async/await throughout — never block with \`.Result\` or \`.Wait()\`
- Follow .NET naming: PascalCase for public members, \`_camelCase\` for private fields
- Use LINQ for queries, but keep chains readable — extract complex predicates`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(dotnet:*)',
          'Bash(dotnet build:*)',
          'Bash(dotnet test:*)',
          'Bash(dotnet run:*)',
          'Bash(dotnet format:*)',
          'Bash(dotnet ef:*)',
          'Bash(dotnet add:*)',
          'Bash(dotnet restore:*)',
          'Bash(dotnet publish:*)',
          'Bash(dotnet new:*)',
          'Bash(dotnet tool:*)',
          'Bash(dotnet clean:*)',
          'Bash(dotnet nuget:*)',
          'Bash(dotnet watch:*)',
          'Bash(dotnet user-secrets:*)',
        ],
      },
    },
    rules: [
      {
        path: 'csharp/naming-and-style.md',
        paths: ['**/*.cs'],
        governance: 'mandatory',
        description: 'C# naming conventions and code style aligned with Microsoft Framework Design Guidelines',
        content: `# C# Naming & Code Style

## Naming Conventions (Framework Design Guidelines)

| Element | Convention | Example |
|---------|-----------|---------|
| Classes, records, structs | PascalCase | \`UserService\`, \`OrderItem\` |
| Interfaces | \`I\` + PascalCase | \`IRepository\`, \`IAsyncDisposable\` |
| Methods, properties | PascalCase | \`GetUserById\`, \`FirstName\` |
| Events | PascalCase (verb/past-tense) | \`Clicked\`, \`PropertyChanged\` |
| Enums | PascalCase (singular) | \`OrderStatus\`, \`Color\` |
| Local variables, parameters | camelCase | \`userId\`, \`isValid\` |
| Private/internal fields | \`_camelCase\` | \`_logger\`, \`_connectionString\` |
| Constants, static readonly | PascalCase | \`MaxRetryCount\`, \`DefaultPort\` |
| Type parameters | \`T\`-prefixed PascalCase | \`T\`, \`TKey\`, \`TResult\` |
| Namespaces | PascalCase (dot-separated) | \`Company.Product.Feature\` |
| File names | Match type name | \`UserService.cs\`, \`IRepository.cs\` |

## Word Choice

- Favor readability over brevity — \`CanScrollHorizontally\` not \`ScrollableX\`
- No underscores, Hungarian notation, abbreviations, or contractions in public APIs
- Use semantically meaningful names — \`GetLength\` not \`GetInt\`

## Code Style

- One type per file, name matches type name
- File-scoped namespaces: \`namespace X;\` (reduces indentation)
- Allman brace style, 4-space indentation, one statement per line
- Use \`var\` when type is obvious (\`new\`, cast, literal); explicit types otherwise
- Use expression-bodied members for single-expression methods/properties

## XML Documentation

- \`///\` XML comments on all public types and members
- Include \`<summary>\`, \`<param>\`, \`<returns>\`, \`<exception>\` tags
- First sentence is a concise IntelliSense-visible description
`,
      },
      {
        path: 'csharp/nullable-and-errors.md',
        paths: ['**/*.cs'],
        governance: 'mandatory',
        description: 'C# nullable reference types, error handling, and defensive coding',
        content: `# C# Nullable Reference Types & Error Handling

## Nullable Reference Types

- Enable project-wide: \`<Nullable>enable</Nullable>\` + \`<WarningsAsErrors>nullable</WarningsAsErrors>\`
- Annotate nullable references with \`?\` suffix — \`string?\`, \`User?\`
- Never suppress with \`!\` (null-forgiving) without a justifying comment
- Use \`is null\` / \`is not null\` instead of \`== null\` / \`!= null\`
- Use null-conditional \`?.\` and null-coalescing \`??\`, \`??=\` operators
- Use \`[NotNull]\`, \`[MaybeNull]\`, \`[NotNullWhen]\` for advanced nullability

## Error Handling

- Never throw \`Exception\` or \`ApplicationException\` directly — use domain-specific types
- Define custom exceptions inheriting from \`Exception\` with context properties
- Always include inner exception when wrapping: \`new XxxException("msg", ex)\`
- Use exception filters with \`when\` for conditional catch
- Use guard clauses (.NET 7+): \`ArgumentNullException.ThrowIfNull()\`, \`ThrowIfNullOrWhiteSpace()\`
- Never swallow exceptions with empty catch blocks

## Result Pattern

- Use a discriminated result type for expected business failures (not exceptions)
- Pattern: \`Result<T>.Success(value)\` / \`Result<T>.Failure("reason")\`
- Reserve exceptions for truly exceptional conditions

## IDisposable & Resource Management

- Use \`using\` declarations for deterministic disposal — never manual \`.Dispose()\` in finally
- Use \`await using\` for \`IAsyncDisposable\` resources
- Let DI containers manage service lifetimes when possible
`,
      },
      {
        path: 'csharp/patterns-and-architecture.md',
        paths: ['**/*.cs'],
        governance: 'recommended',
        description: 'C# patterns, LINQ idioms, dependency injection, async patterns, and project structure',
        content: `# C# Patterns & Architecture

## Records & Pattern Matching

- Use \`record\` for DTOs, events, value objects — immutable with \`with\` expressions
- Use \`record struct\` for small value types (< 16 bytes) with value semantics
- Use switch expressions with property/type/list patterns for multi-branch logic
- Prefer pattern matching over if-else chains for type dispatch

## Dependency Injection

- Constructor injection for all required dependencies
- \`IOptions<T>\` / \`IOptionsSnapshot<T>\` for configuration
- Correct lifetimes: Transient (stateless), Scoped (per-request), Singleton (thread-safe shared)
- Use \`IHttpClientFactory\` — never \`new HttpClient()\` directly (socket exhaustion)
- No service locator pattern — never call \`IServiceProvider.GetService\` in business logic
- Primary constructors (C# 12+) for clean DI class declarations

## Async Patterns

- Every async I/O method must accept and forward \`CancellationToken\`
- All async methods have \`Async\` suffix and return \`Task\`/\`Task<T>\`/\`ValueTask<T>\`
- Use \`ConfigureAwait(false)\` in library code
- Use \`IAsyncEnumerable\` with \`[EnumeratorCancellation]\` for streaming
- NEVER use \`.Result\`, \`.Wait()\`, \`.GetAwaiter().GetResult()\` — causes deadlocks
- NEVER use \`async void\` except for event handlers

## Project Structure

- Clean Architecture: Domain -> Application -> Infrastructure -> Api
- Organize by feature/domain slice, not technical layer
- One class per file, name matches class name
- Keep \`Program.cs\` minimal — wire DI, middleware, delegate to modules
- Use \`Directory.Build.props\` for shared settings (nullable, analysis level)

## Security

- All SQL queries must be parameterized — no string interpolation/concatenation
- Never use \`BinaryFormatter\`/\`SoapFormatter\` — use \`System.Text.Json\` or Protobuf
- Never use \`Process.Start(UseShellExecute=true)\` with user input
- Never use \`Assembly.Load()\`/\`Activator.CreateInstance()\` with untrusted type names
- Use \`RandomNumberGenerator\` for cryptographic purposes — not \`System.Random\`
- Use \`DataProtection\` API for symmetric encryption of sensitive data
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## C#-Specific Review Checklist

### Nullable Reference Types
- [ ] NRT is enabled project-wide (\`<Nullable>enable</Nullable>\`)
- [ ] No null-forgiving operator (\`!\`) without a justifying comment
- [ ] Nullable annotations (\`?\`) match actual nullability semantics
- [ ] Null checks use \`is null\` / \`is not null\` pattern (not \`== null\`)
- [ ] Null-conditional (\`?.\`) and null-coalescing (\`??\`) used where appropriate

### Async/Await
- [ ] No \`.Result\`, \`.Wait()\`, or \`.GetAwaiter().GetResult()\` — no sync-over-async
- [ ] All async methods have \`Async\` suffix and return \`Task\`/\`Task<T>\`/\`ValueTask<T>\`
- [ ] \`CancellationToken\` propagated through all async method signatures
- [ ] \`ConfigureAwait(false)\` used in library code (omitted in application code)
- [ ] No \`async void\` methods (except event handlers)
- [ ] \`IAsyncDisposable\` used with \`await using\` for async resource cleanup

### LINQ & Collections
- [ ] \`.Any()\` used instead of \`.Count() > 0\` for existence checks
- [ ] No premature materialization — deferred execution preserved until needed
- [ ] \`.FirstOrDefault()\` used with null checks, not \`.First()\` on uncertain data
- [ ] Collection expressions used where supported (\`[1, 2, 3]\` syntax)

### Dependency Injection
- [ ] Constructor injection used for all required dependencies
- [ ] Service lifetimes are correct (Transient vs Scoped vs Singleton)
- [ ] \`IHttpClientFactory\` used — no direct \`new HttpClient()\`
- [ ] No service locator pattern (calling \`IServiceProvider.GetService\` in business logic)
- [ ] \`IOptions<T>\` pattern used for configuration, not raw config strings

### Resource Management
- [ ] \`using\`/\`await using\` for all \`IDisposable\`/\`IAsyncDisposable\` objects
- [ ] No manual \`Dispose()\` calls in \`finally\` blocks — use \`using\` instead
- [ ] Database connections/commands use \`using\` statements

### Error Handling
- [ ] No bare \`throw new Exception()\` — use specific exception types
- [ ] Inner exception preserved when wrapping: \`new XxxException("msg", ex)\`
- [ ] \`ArgumentNullException.ThrowIfNull()\` used for guard clauses (.NET 7+)
- [ ] Exception filters (\`catch ... when\`) used for conditional handling
- [ ] No empty catch blocks — always log or rethrow

### Security
- [ ] All SQL queries parameterized — no string interpolation/concatenation
- [ ] No \`BinaryFormatter\` or \`SoapFormatter\` — use \`System.Text.Json\`
- [ ] No \`Process.Start\` with shell execution and user input
- [ ] \`RandomNumberGenerator\` used for cryptographic purposes — not \`System.Random\``,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['dotnet-cli'],
        prompt: `## C# Testing Conventions

### Test Framework & Assertion
- Use xUnit as the primary test framework (default for .NET project templates)
- Use FluentAssertions for readable, chainable assertion syntax
- Use NSubstitute or Moq for mocking interfaces and abstract classes
- Use AutoFixture for automated test data generation

### Test Structure (Arrange-Act-Assert)
- Name test methods descriptively: \`MethodName_Scenario_ExpectedResult\`
  - Example: \`GetUserAsync_WhenUserNotFound_ReturnsNull\`
  - Example: \`PlaceOrder_WithInsufficientStock_ThrowsOutOfStockException\`
- One logical assertion per test — multiple \`Should()\` only for a single behavior
- Use \`[Fact]\` for single-case tests, \`[Theory]\` with \`[InlineData]\` for parameterized
- Use \`[MemberData]\` or \`[ClassData]\` for complex parameterized test data

### Async Testing
- Use \`async Task\` return type for all async tests (not \`async void\`)
- Use \`CancellationTokenSource\` with timeout for tests that might hang
- Use \`Func<Task> act = ...; await act.Should().ThrowAsync<T>()\` for async exception testing

### Example
\`\`\`csharp
public class OrderServiceTests
{
    private readonly IOrderRepository _orderRepo = Substitute.For<IOrderRepository>();
    private readonly IPaymentGateway _paymentGateway = Substitute.For<IPaymentGateway>();
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        _sut = new OrderService(_orderRepo, _paymentGateway, NullLogger<OrderService>.Instance);
    }

    [Fact]
    public async Task PlaceOrderAsync_WhenPaymentSucceeds_SavesOrderAndReturns()
    {
        // Arrange
        var request = new CreateOrderRequest { CustomerId = 42, Total = 99.99m };
        _paymentGateway.ChargeAsync(Arg.Any<decimal>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.PlaceOrderAsync(request, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.CustomerId.Should().Be(42);
        await _orderRepo.Received(1).SaveAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public async Task PlaceOrderAsync_WhenTotalIsInvalid_ThrowsArgumentException(decimal total)
    {
        var request = new CreateOrderRequest { CustomerId = 1, Total = total };

        Func<Task> act = () => _sut.PlaceOrderAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }
}
\`\`\`

### Integration Testing
- Use \`WebApplicationFactory<TEntryPoint>\` for ASP.NET Core integration tests
- Use Testcontainers for database integration tests (real DB, not in-memory)
- Use \`IClassFixture<T>\` for shared expensive fixtures (DB, server)
- Isolate test data: each test creates its own data, cleans up after

### What to Mock vs What to Use Real
- MOCK: external HTTP APIs, payment gateways, email services, file systems
- REAL: your own domain logic, value objects, mapping functions
- REAL (with Testcontainers): databases, message brokers, caches`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## C#/.NET Security Review

### Serialization
- [ ] No \`BinaryFormatter\`, \`SoapFormatter\`, \`NetDataContractSerializer\` — these allow RCE
- [ ] \`System.Text.Json\` or \`Newtonsoft.Json\` used with safe default options
- [ ] \`JsonSerializerOptions.PropertyNameCaseInsensitive\` set explicitly
- [ ] No \`TypeNameHandling.All\` in Newtonsoft.Json — allows type confusion attacks
- [ ] \`[JsonIgnore]\` on sensitive properties to prevent accidental serialization

### Input Validation
- [ ] All user input validated with FluentValidation or DataAnnotations before processing
- [ ] SQL queries use parameterized commands — no string interpolation/concatenation
- [ ] File paths from user input validated with \`Path.GetFullPath()\` + prefix check
- [ ] Regular expressions use \`RegexOptions.NonBacktracking\` or timeout to prevent ReDoS
- [ ] \`Uri.EscapeDataString()\` used for URL parameters from user input

### Authentication & Authorization
- [ ] \`[Authorize]\` attribute on all protected endpoints
- [ ] No \`[AllowAnonymous]\` on sensitive endpoints without documentation
- [ ] Claims-based authorization preferred over role-based for fine-grained control
- [ ] Anti-forgery tokens validated for form submissions (\`[ValidateAntiForgeryToken]\`)

### Cryptography
- [ ] \`RandomNumberGenerator.GetBytes()\` used for cryptographic randomness — not \`System.Random\`
- [ ] \`Rfc2898DeriveBytes\` or \`Argon2\` used for password hashing (not MD5/SHA*)
- [ ] Data Protection API used for symmetric encryption in ASP.NET Core
- [ ] No hardcoded keys, connection strings, or secrets in source code
- [ ] User secrets (\`dotnet user-secrets\`) or Azure Key Vault for sensitive config

### ASP.NET Core Specific
- [ ] CORS configured restrictively — no \`AllowAnyOrigin()\` in production
- [ ] Security headers set (HSTS, CSP, X-Content-Type-Options, X-Frame-Options)
- [ ] Rate limiting middleware applied to authentication endpoints
- [ ] Request size limits configured to prevent DoS (\`[RequestSizeLimit]\`)
- [ ] \`app.UseHttpsRedirection()\` enabled in production`,
      },
      {
        name: 'refactor-assistant',
        type: 'enrich',
        skills: ['dotnet-scaffold'],
        prompt: `## C#-Specific Refactoring Patterns

### Modernization (upgrade to C# 12+/.NET 8+)
- Replace traditional constructors with primary constructors for DI classes
- Replace \`class\` DTOs with \`record\` types for immutable value semantics
- Replace \`switch\` statements with switch expressions and pattern matching
- Replace \`if (x != null)\` chains with \`is not null\` and null-coalescing operators
- Replace \`using (var x = ...)\` blocks with \`using var x = ...;\` declarations
- Replace \`namespace X { }\` with file-scoped \`namespace X;\`
- Replace \`new List<T> { ... }\` with collection expressions \`[...]\`
- Replace \`Task<T>\` with \`ValueTask<T>\` on hot paths that often complete synchronously

### Architecture Refactoring
- Replace service locator calls with constructor injection
- Replace static helper classes with injectable services
- Replace \`HttpClient\` direct instantiation with \`IHttpClientFactory\`
- Extract domain events from entity methods to enable decoupled event handling
- Replace \`string\` parameters for enums with \`enum\` or strongly-typed IDs
- Replace \`Dictionary<string, object>\` with strongly-typed records or \`TypedDict\`-equivalents
- Replace raw ADO.NET with EF Core or Dapper for data access

### Error Handling Refactoring
- Replace \`if (x == null) throw\` with \`ArgumentNullException.ThrowIfNull(x)\`
- Replace generic \`Exception\` throws with domain-specific exception types
- Replace exception-based control flow with Result pattern for expected failures
- Add \`CancellationToken\` parameters to all async methods missing them`,
      },
    ],
    skills: [
      {
        name: 'dotnet-cli',
        description: 'dotnet CLI commands: build, test, run, EF migrations, NuGet, and project management',
        content: `# .NET CLI Skill

## Build & Run
- \`dotnet build\` — compile the project/solution
- \`dotnet build --no-restore\` — skip NuGet restore (faster in CI)
- \`dotnet build /warnaserror\` — treat all warnings as errors
- \`dotnet run\` — build and run the default project
- \`dotnet run --project src/MyApp.Api\` — run a specific project
- \`dotnet watch run\` — hot-reload on file changes (development)
- \`dotnet publish -c Release\` — produce deployment-ready output

## Testing
- \`dotnet test\` — run all tests in the solution
- \`dotnet test --filter "ClassName=OrderServiceTests"\` — run specific test class
- \`dotnet test --filter "FullyQualifiedName~PlaceOrder"\` — run tests matching pattern
- \`dotnet test --collect "XPlat Code Coverage"\` — generate code coverage
- \`dotnet test --blame-hang-timeout 60s\` — detect and abort hanging tests
- \`dotnet test --logger "console;verbosity=detailed"\` — verbose test output

## Entity Framework Core
- \`dotnet ef migrations add MigrationName\` — create a new migration
- \`dotnet ef database update\` — apply pending migrations
- \`dotnet ef migrations script --idempotent\` — generate SQL script for production
- \`dotnet ef dbcontext scaffold "ConnectionString" Provider\` — reverse engineer DB to code
- \`dotnet ef migrations remove\` — remove last migration (if not applied)
- \`dotnet ef database drop --force\` — drop the database (development only)

## NuGet Package Management
- \`dotnet add package PackageName\` — add a NuGet package
- \`dotnet add package PackageName --version 8.0.0\` — add specific version
- \`dotnet remove package PackageName\` — remove a package
- \`dotnet list package --outdated\` — check for newer versions
- \`dotnet list package --vulnerable\` — check for known vulnerabilities
- \`dotnet restore\` — restore all NuGet packages

## Project Management
- \`dotnet new webapi -n MyApp.Api\` — create new Web API project
- \`dotnet new classlib -n MyApp.Domain\` — create class library
- \`dotnet new xunit -n MyApp.Tests\` — create xUnit test project
- \`dotnet new sln -n MySolution\` — create solution file
- \`dotnet sln add src/MyApp.Api\` — add project to solution
- \`dotnet add reference ../MyApp.Domain\` — add project reference

## Code Quality
- \`dotnet format\` — apply code style from .editorconfig
- \`dotnet format --verify-no-changes\` — CI check for formatting compliance
- \`dotnet user-secrets set "Key" "Value"\` — store development secrets securely
- \`dotnet tool install -g dotnet-reportgenerator-globaltool\` — install coverage report tool
`,
      },
      {
        name: 'dotnet-scaffold',
        description: 'Scaffolding patterns for ASP.NET Core: Minimal APIs, controllers, EF Core, and middleware',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# .NET Scaffold Skill

## Minimal API Endpoints (Recommended for .NET 8+)
\`\`\`csharp
// Program.cs — register endpoint groups
var app = builder.Build();
app.MapGroup("/api/orders")
    .MapOrderEndpoints()
    .RequireAuthorization();

// OrderEndpoints.cs — endpoint definitions
public static class OrderEndpoints
{
    public static RouteGroupBuilder MapOrderEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetAllOrders)
            .WithName("GetAllOrders")
            .Produces<List<OrderDto>>();

        group.MapGet("/{id:int}", GetOrderById)
            .WithName("GetOrderById")
            .Produces<OrderDto>()
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateOrder)
            .WithName("CreateOrder")
            .Produces<OrderDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        return group;
    }

    private static async Task<IResult> GetOrderById(
        int id,
        IOrderService orderService,
        CancellationToken ct)
    {
        var order = await orderService.GetByIdAsync(id, ct);
        return order is not null
            ? TypedResults.Ok(order)
            : TypedResults.NotFound();
    }

    private static async Task<IResult> CreateOrder(
        CreateOrderRequest request,
        IOrderService orderService,
        CancellationToken ct)
    {
        var order = await orderService.CreateAsync(request, ct);
        return TypedResults.Created($"/api/orders/{order.Id}", order);
    }
}
\`\`\`

## Controller Scaffolding (Traditional)
\`\`\`csharp
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet("{id:int}")]
    [ProducesResponseType<OrderDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var order = await orderService.GetByIdAsync(id, ct);
        return order is not null ? Ok(order) : NotFound();
    }
}
\`\`\`

## EF Core DbContext Setup
\`\`\`csharp
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

// Fluent configuration per entity
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Total).HasPrecision(18, 2);
        builder.HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerId);
        builder.HasIndex(o => o.CreatedAt);
    }
}
\`\`\`

## Middleware Pattern
\`\`\`csharp
public class RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();
            logger.LogInformation(
                "{Method} {Path} responded {StatusCode} in {Elapsed}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                sw.ElapsedMilliseconds);
        }
    }
}
\`\`\`
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.cs$" && grep -nE "\\.(Result|Wait\\(\\)|GetAwaiter\\(\\)\\.GetResult\\(\\))" "$FILE_PATH" | head -5 | grep -q "." && { echo "Warning: sync-over-async pattern detected (.Result/.Wait()/.GetAwaiter().GetResult()) — use await instead" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for sync-over-async patterns',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.cs$" && grep -nE "new\\s+HttpClient\\s*\\(" "$FILE_PATH" | head -3 | grep -q "." && { echo "Warning: direct HttpClient instantiation detected — use IHttpClientFactory to avoid socket exhaustion" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for direct HttpClient instantiation',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -q "\\.cs$" && grep -nE "(BinaryFormatter|SoapFormatter|NetDataContractSerializer)" "$FILE_PATH" | head -3 | grep -q "." && { echo "Dangerous serializer detected (BinaryFormatter/SoapFormatter) — use System.Text.Json or Protobuf" >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for dangerous serializers',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\') && [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE "\\.cs$" && grep -nE "\\$\"[^\"]*\\{[^}]+\\}[^\"]*\"\\s*;\\s*$" "$FILE_PATH" | grep -iE "(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)" | head -3 | grep -q "." && { echo "Potential SQL injection — string interpolation in SQL query detected. Use parameterized queries." >&2; exit 2; } || exit 0',
            timeout: 10,
            statusMessage: 'Checking for SQL injection patterns',
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'editorconfig',
        filePath: '.editorconfig',
        mergeStrategy: 'create-only',
        config: {
          'root': true,
          '[*.cs]': {
            'indent_style': 'space',
            'indent_size': 4,
            'end_of_line': 'lf',
            'charset': 'utf-8-bom',
            'trim_trailing_whitespace': true,
            'insert_final_newline': true,
            // Naming rules
            'dotnet_naming_rule.interface_should_be_begins_with_i.severity': 'error',
            'dotnet_naming_rule.interface_should_be_begins_with_i.symbols': 'interface',
            'dotnet_naming_rule.interface_should_be_begins_with_i.style': 'begins_with_i',
            'dotnet_naming_symbol.interface.applicable_kinds': 'interface',
            'dotnet_naming_style.begins_with_i.required_prefix': 'I',
            'dotnet_naming_style.begins_with_i.capitalization': 'pascal_case',
            // Private fields with underscore
            'dotnet_naming_rule.private_fields_should_be_underscore_camel.severity': 'warning',
            'dotnet_naming_rule.private_fields_should_be_underscore_camel.symbols': 'private_fields',
            'dotnet_naming_rule.private_fields_should_be_underscore_camel.style': 'underscore_camel',
            'dotnet_naming_symbol.private_fields.applicable_kinds': 'field',
            'dotnet_naming_symbol.private_fields.applicable_accessibilities': 'private,internal',
            'dotnet_naming_style.underscore_camel.required_prefix': '_',
            'dotnet_naming_style.underscore_camel.capitalization': 'camel_case',
            // Code style
            'csharp_style_namespace_declarations': 'file_scoped:warning',
            'csharp_style_var_for_built_in_types': 'false:suggestion',
            'csharp_style_var_when_type_is_apparent': 'true:suggestion',
            'csharp_style_prefer_switch_expression': 'true:suggestion',
            'csharp_style_prefer_pattern_matching': 'true:suggestion',
            'csharp_style_prefer_not_pattern': 'true:suggestion',
            'csharp_style_prefer_primary_constructors': 'true:suggestion',
            'csharp_using_directive_placement': 'outside_namespace:warning',
            'dotnet_sort_system_directives_first': true,
          },
        },
      },
    ],
  },
};
