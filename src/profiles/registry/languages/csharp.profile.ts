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

### Naming (Microsoft Framework Design Guidelines)
- Types, records, structs, enums, properties, methods, events: \`PascalCase\`
- Interfaces: prefix with \`I\` — \`IRepository\`, \`IDisposable\`, \`IAsyncEnumerable<T>\`
- Local variables, parameters, lambda parameters: \`camelCase\`
- Private/internal fields: \`_camelCase\` with underscore prefix — \`_userRepository\`, \`_logger\`
- Constants and static readonly: \`PascalCase\` — \`MaxRetryCount\`, \`DefaultTimeout\`
- Type parameters: single letter or \`T\`-prefixed descriptor — \`T\`, \`TKey\`, \`TValue\`, \`TResult\`
- Namespaces: \`PascalCase\` matching folder structure — \`Company.Product.Feature\`
- Never use Hungarian notation, underscores in public identifiers, or non-standard abbreviations

### Modern C# Idioms (C# 11–13 / .NET 8+)
- Enable nullable reference types project-wide: \`<Nullable>enable</Nullable>\`
- Use file-scoped namespaces: \`namespace MyApp.Services;\` — one namespace per file
- Use primary constructors (C# 12+) for DI and simple initialization
- Use \`required\` properties for mandatory initialization without constructors
- Use raw string literals (\`\"\"\"\`) for multi-line strings, JSON templates, SQL
- Use collection expressions: \`int[] values = [1, 2, 3];\`
- Use \`global using\` directives in a central file for common namespaces
- Use records for immutable value semantics: \`record Person(string Name, int Age);\`
- Use pattern matching with switch expressions for type-safe branching
- Use \`using\` declarations (braceless) instead of \`using\` blocks where possible
- Prefer language keywords over BCL types: \`string\` not \`String\`, \`int\` not \`Int32\`

### Async/Await
- Use \`async\`/\`await\` for all I/O-bound operations — never block with \`.Result\`, \`.Wait()\`, or \`.GetAwaiter().GetResult()\`
- Suffix async methods with \`Async\`: \`GetUserAsync\`, \`SaveChangesAsync\`
- Propagate \`CancellationToken\` in every async method signature
- Use \`ValueTask<T>\` for hot paths that often complete synchronously
- Use \`Task.WhenAll\` for independent concurrent operations
- Use \`ConfigureAwait(false)\` in library code — omit in application/UI code
- Use \`IAsyncEnumerable<T>\` with \`await foreach\` for streaming async data

### LINQ
- Use method syntax (\`.Where()\`, \`.Select()\`) for simple queries
- Use query syntax (\`from x in y where ... select ...\`) for complex joins and grouping
- Use \`.Any()\` instead of \`.Count() > 0\` for existence checks
- Use deferred execution — only \`.ToList()\`/\`.ToArray()\` when materialization is needed
- Use \`.FirstOrDefault()\` with null checks — not \`.First()\` on uncertain sequences
- Rename anonymous type properties for clarity in projections

### Tooling
- Run \`dotnet format\` to enforce code style from \`.editorconfig\`
- Run \`dotnet build /warnaserror\` in CI to enforce zero warnings
- Enable Roslyn analyzers: \`<AnalysisLevel>latest-recommended</AnalysisLevel>\`
- Use \`dotnet test --collect "XPlat Code Coverage"\` for coverage reports`,
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
        governance: 'mandatory',
        description: 'C# naming conventions and code style aligned with Microsoft Framework Design Guidelines',
        content: `# C# Naming & Code Style

## Why This Matters
Microsoft's Framework Design Guidelines are the industry standard for .NET code. Consistent
naming makes APIs discoverable via IntelliSense, reduces cognitive load, and signals
professionalism. These rules are derived directly from the official guidelines.

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes, records, structs | PascalCase | \`UserService\`, \`OrderItem\` |
| Interfaces | \`I\` + PascalCase | \`IRepository\`, \`IAsyncDisposable\` |
| Methods, properties | PascalCase | \`GetUserById\`, \`FirstName\` |
| Events | PascalCase (verb/past-tense) | \`Clicked\`, \`PropertyChanged\` |
| Enums | PascalCase (singular) | \`OrderStatus\`, \`Color\` |
| Enum values | PascalCase | \`OrderStatus.Pending\` |
| Local variables, parameters | camelCase | \`userId\`, \`isValid\` |
| Private/internal fields | \`_camelCase\` | \`_logger\`, \`_connectionString\` |
| Constants, static readonly | PascalCase | \`MaxRetryCount\`, \`DefaultPort\` |
| Type parameters | \`T\`-prefixed PascalCase | \`T\`, \`TKey\`, \`TResult\` |
| Namespaces | PascalCase (dot-separated) | \`Company.Product.Feature\` |
| File names | Match type name | \`UserService.cs\`, \`IRepository.cs\` |

### Word Choice (Framework Design Guidelines)
- Choose easily readable names — \`HorizontalAlignment\` not \`AlignmentHorizontal\`
- Favor readability over brevity — \`CanScrollHorizontally\` not \`ScrollableX\`
- Do NOT use underscores, hyphens, or Hungarian notation in public APIs
- Do NOT use abbreviations or contractions — \`GetWindow\` not \`GetWin\`
- Do NOT use acronyms that are not widely accepted
- Use semantically meaningful names — \`GetLength\` not \`GetInt\`

### Correct
\`\`\`csharp
namespace Acme.Billing.Invoices;

public interface IInvoiceRepository
{
    Task<Invoice?> FindByIdAsync(int invoiceId, CancellationToken ct = default);
}

public class InvoiceService
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(IInvoiceRepository invoiceRepository, ILogger<InvoiceService> logger)
    {
        _invoiceRepository = invoiceRepository;
        _logger = logger;
    }

    public async Task<Invoice> GetInvoiceAsync(int invoiceId, CancellationToken ct)
    {
        var invoice = await _invoiceRepository.FindByIdAsync(invoiceId, ct);
        if (invoice is null)
            throw new InvoiceNotFoundException(invoiceId);
        return invoice;
    }
}
\`\`\`

### Anti-Pattern
\`\`\`csharp
// Bad: Hungarian notation, inconsistent casing, no nullable annotations
namespace acme.billing;

public class invoice_service  // snake_case class name
{
    IInvoiceRepository repo;  // no underscore prefix, no private modifier
    private ILogger lgr;      // abbreviation

    public Invoice getInvoice(int id)  // camelCase method, no Async suffix
    {
        var inv = repo.FindById(id);  // abbreviation
        return inv;  // no null check
    }
}
\`\`\`

---

## Code Style

### File Layout
- One type per file — file name matches type name exactly
- Use file-scoped namespaces: \`namespace X;\` — reduces one level of indentation
- Place \`using\` directives outside the namespace (at file top)
- Order: usings -> namespace -> type (attributes, XML doc, declaration)

### Formatting
- Use Allman brace style — opening brace on its own line
- Four spaces for indentation — never tabs
- One statement per line, one declaration per line
- Use \`var\` when the type is obvious from the right side (\`new\`, cast, literal)
- Use explicit types when the type is not apparent from a method name
- Use expression-bodied members for single-expression methods and properties

\`\`\`csharp
// Correct: var when type is obvious
var users = new List<User>();
var message = "Hello";
var config = (AppConfig)rawConfig;

// Correct: explicit type when not obvious
int retryCount = ComputeRetryCount();
UserRole currentRole = GetCurrentUserRole();
\`\`\`

### XML Documentation
- Use \`///\` XML comments on all public types and members
- Include \`<summary>\`, \`<param>\`, \`<returns>\`, \`<exception>\` tags
- First sentence is a concise description visible in IntelliSense

\`\`\`csharp
/// <summary>
/// Retrieves a user by their unique identifier.
/// </summary>
/// <param name="userId">The unique identifier of the user.</param>
/// <param name="ct">Cancellation token for the operation.</param>
/// <returns>The user if found; otherwise <c>null</c>.</returns>
/// <exception cref="ArgumentOutOfRangeException">
/// Thrown when <paramref name="userId"/> is less than 1.
/// </exception>
public async Task<User?> FindByIdAsync(int userId, CancellationToken ct = default)
{
    ArgumentOutOfRangeException.ThrowIfLessThan(userId, 1);
    return await _context.Users.FindAsync([userId], ct);
}
\`\`\`
`,
      },
      {
        path: 'csharp/nullable-and-errors.md',
        governance: 'mandatory',
        description: 'C# nullable reference types, error handling, and defensive coding',
        content: `# C# Nullable Reference Types & Error Handling

## Why This Matters
Nullable reference types (NRT) eliminate the most common category of runtime errors in .NET.
Combined with disciplined error handling, they make C# code provably safer at compile time.

---

## Nullable Reference Types

### Configuration
Enable project-wide in every \`.csproj\`:
\`\`\`xml
<PropertyGroup>
    <Nullable>enable</Nullable>
    <WarningsAsErrors>nullable</WarningsAsErrors>
</PropertyGroup>
\`\`\`

### Rules
- Annotate nullable references with \`?\` suffix — \`string?\`, \`User?\`
- Never suppress warnings with \`!\` (null-forgiving operator) without a justifying comment
- Prefer \`is not null\` over \`!= null\` and \`is null\` over \`== null\` for clarity
- Use null-conditional \`?.\` and null-coalescing \`??\`, \`??=\` operators
- Use \`[NotNull]\`, \`[MaybeNull]\`, \`[NotNullWhen]\` attributes for advanced nullability

### Correct
\`\`\`csharp
public string GetDisplayName(User? user)
{
    if (user is null)
        return "Anonymous";

    // Compiler knows user is not null here
    return user.PreferredName ?? user.FullName;
}

public async Task<User> GetRequiredUserAsync(int id, CancellationToken ct)
{
    var user = await _repository.FindByIdAsync(id, ct);
    return user ?? throw new UserNotFoundException(id);
}
\`\`\`

### Anti-Pattern
\`\`\`csharp
// Bad: null-forgiving operator without justification, no null checks
public string GetDisplayName(User user)
{
    return user!.PreferredName!.ToUpper();  // multiple ! suppressions, NPE risk
}
\`\`\`

---

## Error Handling

### Use Specific Exception Types
- Never throw \`Exception\` or \`ApplicationException\` directly
- Define domain-specific exceptions inheriting from \`Exception\`
- Always include inner exception when wrapping: \`throw new XxxException("msg", ex)\`
- Use exception filters with \`when\` for conditional catch

\`\`\`csharp
public class OrderNotFoundException : Exception
{
    public int OrderId { get; }

    public OrderNotFoundException(int orderId)
        : base($"Order {orderId} not found")
    {
        OrderId = orderId;
    }

    public OrderNotFoundException(int orderId, Exception innerException)
        : base($"Order {orderId} not found", innerException)
    {
        OrderId = orderId;
    }
}
\`\`\`

### Guard Clauses (.NET 8+)
Use \`ArgumentNullException.ThrowIfNull()\` and \`ArgumentException.ThrowIfNullOrWhiteSpace()\`:

\`\`\`csharp
public void ProcessOrder(Order? order, string? region)
{
    ArgumentNullException.ThrowIfNull(order);
    ArgumentException.ThrowIfNullOrWhiteSpace(region);
    // Both are guaranteed non-null past this point
}
\`\`\`

### Exception Filters
\`\`\`csharp
try
{
    await httpClient.SendAsync(request, ct);
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests)
{
    _logger.LogWarning("Rate limited, retrying after delay");
    await Task.Delay(retryDelay, ct);
}
catch (HttpRequestException ex) when (ex.StatusCode is >= HttpStatusCode.InternalServerError)
{
    _logger.LogError(ex, "Server error from upstream service");
    throw new UpstreamServiceException("Upstream service unavailable", ex);
}
\`\`\`

### Result Pattern for Expected Failures
Use a discriminated result type instead of exceptions for expected business failures:

\`\`\`csharp
public readonly record struct Result<T>
{
    public T? Value { get; }
    public string? Error { get; }
    public bool IsSuccess => Error is null;

    private Result(T value) { Value = value; Error = null; }
    private Result(string error) { Value = default; Error = error; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);
}

// Usage: return Result<Order>.Failure("Insufficient inventory");
\`\`\`

---

## IDisposable & Resource Management

### Rules
- Use \`using\` declarations for deterministic disposal
- Implement \`IAsyncDisposable\` for async resources (\`await using\`)
- Never call \`.Dispose()\` manually inside a \`finally\` block — use \`using\`
- In DI containers, prefer letting the container manage lifetimes

\`\`\`csharp
// Correct: using declaration (no braces needed)
await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync(ct);
await using var command = connection.CreateCommand();
command.CommandText = "SELECT Id, Name FROM Users WHERE Active = @active";
command.Parameters.AddWithValue("@active", true);
await using var reader = await command.ExecuteReaderAsync(ct);
\`\`\`
`,
      },
      {
        path: 'csharp/patterns-and-architecture.md',
        governance: 'recommended',
        description: 'C# patterns, LINQ idioms, dependency injection, async patterns, and project structure',
        content: `# C# Patterns & Architecture

## Records & Pattern Matching

### Records for Immutable Data
- Use \`record\` (reference type) for DTOs, events, and value objects
- Use \`record struct\` for small value types (< 16 bytes) with value semantics
- Use positional syntax for concise declaration: \`record Person(string Name, int Age);\`
- Use \`with\` expressions for non-destructive mutation

\`\`\`csharp
public record OrderCreatedEvent(int OrderId, DateTime CreatedAt, decimal Total);

// Non-destructive mutation
var updated = originalEvent with { Total = 150.00m };
\`\`\`

### Pattern Matching
\`\`\`csharp
// Switch expression with property patterns
public decimal CalculateDiscount(Customer customer) => customer switch
{
    { Tier: CustomerTier.Platinum, YearsActive: > 5 } => 0.25m,
    { Tier: CustomerTier.Gold } => 0.15m,
    { Tier: CustomerTier.Silver } => 0.10m,
    { IsEmployee: true } => 0.30m,
    _ => 0m,
};

// Type pattern with when clause
public string FormatError(Exception ex) => ex switch
{
    ArgumentNullException ane => $"Missing argument: {ane.ParamName}",
    HttpRequestException { StatusCode: HttpStatusCode.NotFound } => "Resource not found",
    TimeoutException => "Operation timed out — try again",
    _ => "An unexpected error occurred",
};

// List patterns (C# 11+)
public string DescribeArray(int[] values) => values switch
{
    [] => "empty",
    [var single] => $"one element: {single}",
    [var first, .., var last] => $"from {first} to {last}",
};
\`\`\`

---

## Dependency Injection

### Rules
- Use constructor injection for all required dependencies
- Use \`IOptions<T>\` / \`IOptionsSnapshot<T>\` / \`IOptionsMonitor<T>\` for configuration
- Register services with the correct lifetime:
  - \`Transient\`: lightweight stateless services (factories, formatters)
  - \`Scoped\`: per-request services (DbContext, unit-of-work)
  - \`Singleton\`: shared thread-safe services (caches, HTTP clients)
- Use \`IHttpClientFactory\` — never create \`HttpClient\` instances directly (socket exhaustion)
- Prefer interfaces for service abstractions — enables testability

### Primary Constructor DI (C# 12+)
\`\`\`csharp
public class OrderService(
    IOrderRepository orderRepository,
    IPaymentGateway paymentGateway,
    ILogger<OrderService> logger)
{
    public async Task<Order> PlaceOrderAsync(CreateOrderRequest request, CancellationToken ct)
    {
        logger.LogInformation("Placing order for {CustomerId}", request.CustomerId);
        var order = Order.Create(request);
        await paymentGateway.ChargeAsync(order.Total, ct);
        await orderRepository.SaveAsync(order, ct);
        return order;
    }
}
\`\`\`

### Anti-Pattern: Service Locator
\`\`\`csharp
// Bad: hides dependencies, untestable, violates DI principle
public class OrderService
{
    public async Task PlaceOrder(CreateOrderRequest request)
    {
        var repo = ServiceLocator.Get<IOrderRepository>();  // hidden dependency
        var payment = ServiceLocator.Get<IPaymentGateway>(); // no compile-time check
        // ...
    }
}
\`\`\`

---

## Async Patterns

### CancellationToken Propagation
Every async method that performs I/O should accept and forward \`CancellationToken\`:

\`\`\`csharp
public async Task<List<Product>> SearchAsync(
    string query,
    int page,
    CancellationToken ct = default)
{
    var results = await _httpClient.GetFromJsonAsync<List<Product>>(
        $"/api/products?q={Uri.EscapeDataString(query)}&page={page}", ct);
    return results ?? [];
}
\`\`\`

### IAsyncEnumerable for Streaming
\`\`\`csharp
public async IAsyncEnumerable<LogEntry> StreamLogsAsync(
    string source,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    await foreach (var line in _logReader.ReadLinesAsync(source, ct))
    {
        if (LogEntry.TryParse(line, out var entry))
            yield return entry;
    }
}

// Consumption
await foreach (var entry in service.StreamLogsAsync("app", ct))
{
    Console.WriteLine(entry);
}
\`\`\`

### Async Anti-Patterns
\`\`\`csharp
// Bad: blocking on async code — causes deadlocks in UI/ASP.NET contexts
var result = GetDataAsync().Result;           // NEVER
var result2 = GetDataAsync().GetAwaiter().GetResult();  // NEVER
GetDataAsync().Wait();                        // NEVER

// Bad: async void — exceptions are unobservable
async void OnButtonClick()  // should be async Task
{
    await DoWorkAsync();
}

// Bad: missing ConfigureAwait in library code
public async Task<Data> GetDataAsync()
{
    return await _client.GetAsync(url);  // should use ConfigureAwait(false) in libraries
}
\`\`\`

---

## Project Structure

### Recommended Solution Layout
\`\`\`
Solution.sln
src/
  MyApp.Domain/            # Entities, value objects, domain events, interfaces
    Entities/
    ValueObjects/
    Events/
    Interfaces/
  MyApp.Application/       # Use cases, DTOs, service interfaces, validators
    Features/
      Orders/
        CreateOrder/
          CreateOrderCommand.cs
          CreateOrderHandler.cs
          CreateOrderValidator.cs
  MyApp.Infrastructure/    # EF Core, external APIs, file system, messaging
    Persistence/
    ExternalServices/
  MyApp.Api/               # Controllers/endpoints, middleware, DI registration
    Endpoints/
    Middleware/
    Program.cs
tests/
  MyApp.Domain.Tests/
  MyApp.Application.Tests/
  MyApp.Infrastructure.Tests/
  MyApp.Api.IntegrationTests/
\`\`\`

### Rules
- One class per file — file name matches class name
- Organize by feature/domain slice, not by technical layer within a project
- Use the Clean Architecture or Vertical Slice pattern for non-trivial applications
- Keep \`Program.cs\` minimal — wire DI, middleware, and delegate to feature modules
- Use \`Directory.Build.props\` for shared project settings (nullable, analysis level, etc.)

\`\`\`xml
<!-- Directory.Build.props at solution root -->
<Project>
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
</Project>
\`\`\`

---

## Security — C#-Specific

### SQL Injection Prevention
\`\`\`csharp
// Correct: parameterized query
await using var cmd = connection.CreateCommand();
cmd.CommandText = "SELECT * FROM Users WHERE Email = @email";
cmd.Parameters.AddWithValue("@email", userEmail);

// Anti-pattern: string concatenation — SQL injection vulnerability
cmd.CommandText = $"SELECT * FROM Users WHERE Email = '{userEmail}'";  // NEVER
\`\`\`

### Dangerous APIs to Avoid
- Never use \`Process.Start()\` with \`UseShellExecute = true\` and user-controlled input
- Never use \`Assembly.Load()\` or \`Activator.CreateInstance()\` with untrusted type names
- Never use \`BinaryFormatter\` or \`SoapFormatter\` — use \`System.Text.Json\` or Protobuf
- Never use \`dynamic\` with untrusted data
- Use \`System.Security.Cryptography.RandomNumberGenerator\` — not \`System.Random\` for secrets
- Use \`Microsoft.AspNetCore.DataProtection\` for symmetric encryption of sensitive data
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.cs$" && grep -nE "\\.(Result|Wait\\(\\)|GetAwaiter\\(\\)\\.GetResult\\(\\))" "$CLAUDE_FILE_PATH" | head -5 | grep -q "." && echo "HOOK_EXIT:0:Warning: sync-over-async pattern detected (.Result/.Wait()/.GetAwaiter().GetResult()) — use await instead" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.cs$" && grep -nE "new\\s+HttpClient\\s*\\(" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:0:Warning: direct HttpClient instantiation detected — use IHttpClientFactory to avoid socket exhaustion" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -q "\\.cs$" && grep -nE "(BinaryFormatter|SoapFormatter|NetDataContractSerializer)" "$CLAUDE_FILE_PATH" | head -3 | grep -q "." && echo "HOOK_EXIT:1:Dangerous serializer detected (BinaryFormatter/SoapFormatter) — use System.Text.Json or Protobuf" || true',
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
              'echo "$CLAUDE_FILE_PATH" | grep -qE "\\.cs$" && grep -nE "\\$\"[^\"]*\\{[^}]+\\}[^\"]*\"\\s*;\\s*$" "$CLAUDE_FILE_PATH" | grep -iE "(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)" | head -3 | grep -q "." && echo "HOOK_EXIT:1:Potential SQL injection — string interpolation in SQL query detected. Use parameterized queries." || true',
            timeout: 10,
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
