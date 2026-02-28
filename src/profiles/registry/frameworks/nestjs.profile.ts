import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const nestjsProfile: Profile = {
  id: 'frameworks/nestjs',
  name: 'NestJS',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['nestjs'],
  contributions: {
    claudeMd: [
      {
        heading: 'NestJS Conventions',
        order: 20,
        content: `## NestJS Conventions

- Follow the modular architecture: every feature gets its own module
- Use dependency injection for all services - never instantiate manually
- Use controllers for HTTP handling, services for business logic
- Apply guards for authentication and authorization
- Use pipes for input validation and transformation
- Use interceptors for cross-cutting concerns (logging, caching, response mapping)
- Use custom decorators to reduce boilerplate and express intent
- Use DTOs (Data Transfer Objects) with class-validator for request validation
- Apply exception filters for consistent error responses
- Use the ConfigModule for environment-based configuration
- Prefer constructor injection over property injection
- Use async/await consistently - NestJS supports it natively`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx nest:*)',
          'Bash(npm run start:*)',
          'Bash(npm run start\\:dev:*)',
        ],
      },
    },
    rules: [
      {
        path: 'nestjs/architecture.md',
        governance: 'mandatory',
        description: 'NestJS modular architecture and dependency injection patterns',
        content: `# NestJS Architecture

## Module Organization
- Create one module per domain/feature (e.g., UsersModule, AuthModule, OrdersModule)
- Import only what the module needs - avoid circular dependencies
- Use \`forRoot()\` / \`forRootAsync()\` for global configuration modules
- Use \`forFeature()\` for feature-specific registrations (e.g., TypeORM entities)
- Export only the providers that other modules need

## Controllers
- Controllers handle HTTP concerns only: parse request, call service, return response
- Use decorators for routing: \`@Get()\`, \`@Post()\`, \`@Put()\`, \`@Delete()\`, \`@Patch()\`
- Use \`@Param()\`, \`@Query()\`, \`@Body()\` decorators to extract request data
- Return DTOs, not raw entity objects
- Apply route-level guards, pipes, and interceptors via decorators

## Services
- Services contain all business logic
- Inject dependencies via constructor: \`constructor(private readonly userRepo: UserRepository)\`
- Services should be stateless and reusable
- Throw NestJS exceptions (\`NotFoundException\`, \`BadRequestException\`) for HTTP errors
- Use custom exceptions for domain-specific error cases

## Dependency Injection
- Register providers in the module's \`providers\` array
- Use custom providers (\`useFactory\`, \`useClass\`, \`useValue\`) for complex setup
- Use \`@Inject()\` with tokens for interface-based injection
- Use \`@Optional()\` for optional dependencies
- Scope providers as singleton (default), request-scoped, or transient as needed

## Guards, Pipes, Interceptors
- Guards: authentication and authorization (\`@UseGuards()\`)
- Pipes: validation and transformation (\`@UsePipes()\`, \`ValidationPipe\`)
- Interceptors: logging, caching, response transformation (\`@UseInterceptors()\`)
- Exception Filters: consistent error response formatting (\`@UseFilters()\`)
- Apply globally via \`app.useGlobalPipes()\` or per-controller/per-route via decorators
`,
      },
      {
        path: 'nestjs/naming.md',
        governance: 'recommended',
        description: 'NestJS naming and file conventions',
        content: `# NestJS Naming Conventions

## Files
- Use kebab-case with a type suffix: \`user.controller.ts\`, \`user.service.ts\`, \`user.module.ts\`
- DTOs: \`create-user.dto.ts\`, \`update-user.dto.ts\`
- Entities: \`user.entity.ts\`
- Guards: \`auth.guard.ts\`, \`roles.guard.ts\`
- Pipes: \`parse-int.pipe.ts\`, \`validation.pipe.ts\`
- Interceptors: \`logging.interceptor.ts\`, \`cache.interceptor.ts\`
- Filters: \`http-exception.filter.ts\`

## Classes
- Controllers: PascalCase + Controller suffix (\`UsersController\`)
- Services: PascalCase + Service suffix (\`UsersService\`)
- Modules: PascalCase + Module suffix (\`UsersModule\`)
- Guards: PascalCase + Guard suffix (\`AuthGuard\`)
- Pipes: PascalCase + Pipe suffix (\`ValidationPipe\`)
- Interceptors: PascalCase + Interceptor suffix (\`LoggingInterceptor\`)
- DTOs: PascalCase + Dto suffix (\`CreateUserDto\`)

## Decorators
- Custom decorators: camelCase (\`@currentUser()\`, \`@roles()\`)
- Place in \`common/decorators/\` or feature-specific directories
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## NestJS-Specific Review
- Verify modular architecture: each feature has its own module with proper imports/exports
- Check for proper dependency injection - no manual instantiation of services
- Verify controllers delegate to services - no business logic in controllers
- Check DTOs have class-validator decorators for request validation
- Verify guards are applied for protected routes
- Check for circular module dependencies
- Verify exception handling uses NestJS built-in or custom exception filters
- Check that services are stateless and do not hold request-specific data
- Verify proper use of async/await in controllers and services
- Check for proper provider scoping (singleton vs request-scoped)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## NestJS Testing
- Use \`@nestjs/testing\` Test module to create isolated test environments
- Test controllers: mock services, verify correct HTTP responses and status codes
- Test services: mock repositories and external dependencies
- Test guards: verify they allow/deny access correctly for different roles
- Test pipes: verify validation rejects invalid input and transforms data
- Test interceptors: verify they modify request/response as expected
- Use \`Test.createTestingModule()\` for unit tests with dependency injection
- Write e2e tests with supertest against the full NestJS application`,
      },
    ],
  },
};
