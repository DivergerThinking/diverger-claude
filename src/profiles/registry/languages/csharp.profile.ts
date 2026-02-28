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

- Follow Microsoft .NET coding conventions and framework design guidelines
- Enable nullable reference types (\`<Nullable>enable</Nullable>\`) in all projects
- Use async/await for all I/O-bound operations - never block with \`.Result\` or \`.Wait()\`
- Prefer LINQ for collection queries and transformations
- Use records for immutable data transfer objects and value semantics
- Use pattern matching with switch expressions for type-safe branching
- Prefer \`string.IsNullOrEmpty()\` / \`string.IsNullOrWhiteSpace()\` over null checks
- Use raw string literals (\`\"\"\"\`) for multi-line strings (C# 11+)
- Use primary constructors for concise dependency injection (C# 12+)`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(dotnet:*)',
          'Bash(dotnet build:*)',
          'Bash(dotnet test:*)',
          'Bash(dotnet run:*)',
        ],
      },
    },
    rules: [
      {
        path: 'csharp/conventions.md',
        governance: 'mandatory',
        description: 'C# coding conventions',
        content: `# C# Conventions

## Naming
- Classes, records, structs, interfaces: PascalCase (\`UserService\`, \`IRepository\`)
- Interfaces: prefix with "I" (\`IUserRepository\`, \`IDisposable\`)
- Methods and properties: PascalCase (\`GetUserById\`, \`FirstName\`)
- Local variables and parameters: camelCase (\`userId\`, \`isValid\`)
- Private fields: _camelCase with underscore prefix (\`_userRepository\`)
- Constants: PascalCase (\`MaxRetryCount\`)
- Namespaces: PascalCase, matching folder structure

## Nullable Reference Types
- Enable nullable reference types project-wide
- Use \`?\` suffix for nullable reference types (\`string?\`, \`User?\`)
- Never suppress nullable warnings with \`!\` without justification
- Use null-conditional (\`?.\`) and null-coalescing (\`??\`, \`??=\`) operators
- Prefer \`is not null\` over \`!= null\` for clarity

## Async/Await
- Use async/await for all I/O-bound operations
- Suffix async methods with \`Async\` (\`GetUserAsync\`)
- Never use \`.Result\`, \`.Wait()\`, or \`.GetAwaiter().GetResult()\` to block
- Use \`ValueTask<T>\` for hot paths that often complete synchronously
- Use \`CancellationToken\` in all async method signatures
- Prefer \`Task.WhenAll\` for concurrent independent async operations

## Error Handling
- Use specific exception types - never throw \`Exception\` directly
- Define custom exceptions for domain-specific errors
- Use exception filters (\`catch (Exception ex) when (condition)\`)
- Prefer Result pattern over exceptions for expected failure cases
- Always include inner exception when wrapping: \`throw new CustomException("msg", ex)\`
`,
      },
      {
        path: 'csharp/patterns.md',
        governance: 'recommended',
        description: 'C# patterns and LINQ conventions',
        content: `# C# Patterns

## LINQ
- Prefer method syntax for simple queries, query syntax for complex joins
- Use \`.Select()\`, \`.Where()\`, \`.OrderBy()\` for collection transformations
- Avoid materializing queries prematurely - use deferred execution
- Use \`.Any()\` instead of \`.Count() > 0\` for existence checks
- Use \`.FirstOrDefault()\` with null checks instead of \`.First()\` when items may be absent
- Prefer \`.ToList()\` or \`.ToArray()\` only when materialization is required

## Records and Pattern Matching
- Use \`record\` types for immutable DTOs and value objects
- Use \`record struct\` for small value types with value semantics
- Use switch expressions with pattern matching for type-safe branching
- Use property patterns for conditional logic: \`user is { IsActive: true, Age: > 18 }\`
- Use list patterns for array/span matching (C# 11+)

## Dependency Injection
- Use constructor injection for required dependencies
- Register services with appropriate lifetimes (Transient, Scoped, Singleton)
- Use \`IOptions<T>\` / \`IOptionsSnapshot<T>\` for configuration
- Prefer interfaces for service abstractions
- Use primary constructors (C# 12+) to reduce boilerplate

## Project Structure
- One class per file, file name matches class name
- Organize by feature/domain, not by technical layer
- Use \`global using\` directives for commonly used namespaces
- Use file-scoped namespaces (\`namespace X;\`) to reduce indentation
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## C#-Specific Review
- Check for nullable reference type warnings and missing null checks
- Verify async methods use await and are not blocking with .Result or .Wait()
- Check for proper CancellationToken propagation in async methods
- Verify LINQ usage is efficient (no premature materialization)
- Check for proper IDisposable implementation and using statements
- Verify dependency injection uses constructor injection
- Check for proper exception handling (no bare catch blocks)
- Verify records are used for immutable data types`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## C# Testing
- Use xUnit or NUnit with descriptive test method names
- Use FluentAssertions for readable assertion syntax
- Use Moq or NSubstitute for mocking interfaces
- Test async methods with async Task test signatures
- Use [Theory] with [InlineData] or [MemberData] for parameterized tests
- Test nullable reference type boundaries (null inputs, null returns)
- Use AutoFixture for test data generation`,
      },
    ],
  },
};
