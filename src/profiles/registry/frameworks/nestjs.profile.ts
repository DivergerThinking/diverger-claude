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

Module-based architecture with dependency injection. Decorators for metadata, pipes for validation.

**Detailed rules:** see \`.claude/rules/nestjs/\` directory.

**Key rules:**
- One module per feature domain, explicit imports/exports — no circular dependencies
- DTOs with class-validator decorators for all input, Pipes for transformation
- Guards for auth, Interceptors for cross-cutting concerns, Filters for error handling
- Repository pattern for data access, services for business logic`,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx nest:*)',
          'Bash(npm run start:*)',
          'Bash(npm run start:dev:*)',
          'Bash(npm run start:debug:*)',
          'Bash(npm run test:*)',
          'Bash(npm run test:e2e:*)',
          'Bash(npm run test:cov:*)',
          'Bash(npm run lint:*)',
          'Bash(npm run build:*)',
        ],
      },
    },
    rules: [
      {
        path: 'nestjs/architecture.md',
        paths: ['**/*.ts', 'src/**/*.module.ts', 'src/**/*.controller.ts', 'src/**/*.service.ts'],
        governance: 'mandatory',
        description: 'NestJS modular architecture, DI, providers, and execution pipeline',
        content: `# NestJS Architecture

## Module Organization
- One module per domain/feature (UsersModule, AuthModule, OrdersModule)
- Import only what the module needs — avoid circular dependencies
- Use \`forRoot()\` / \`forRootAsync()\` for global config modules, \`forFeature()\` for feature registrations
- Export only providers that other modules need — keep internals encapsulated
- Use a SharedModule to re-export commonly used modules (ConfigModule, HttpModule)
- Use dynamic modules for configurable, reusable library modules

## Controllers
- Controllers handle HTTP concerns ONLY: parse request, call service, return response
- Use \`@Param()\`, \`@Query()\`, \`@Body()\` decorators for type-safe request data extraction
- Return DTOs — never return raw entity/ORM objects
- Use \`@HttpCode()\` for non-default status codes (204 DELETE, 201 POST)
- Apply guards, pipes, interceptors via decorators at route or controller level

## Services
- Services contain ALL business logic — stateless, no mutable request-scoped instance properties
- Inject dependencies via constructor: \`constructor(private readonly repo: UsersRepository)\`
- Throw NestJS HTTP exceptions (NotFoundException, ConflictException, ForbiddenException)
- Use custom domain exceptions for business rules, caught by exception filters
- Return DTOs or plain objects — never ORM entities with lazy-loaded relations

## Dependency Injection — Custom Providers
- \`useClass\` for swapping implementations (testing, strategy pattern)
- \`useFactory\` for async setup or conditional logic (inject ConfigService)
- \`useValue\` for static config or mock replacements
- \`useExisting\` to alias providers
- Use Symbol injection tokens for interface-based injection
- Use \`@Optional()\` for optional dependencies
- Scope: singleton (default), request-scoped, or transient as needed
`,
      },
      {
        path: 'nestjs/guards-pipes-interceptors.md',
        paths: ['**/*.ts', 'src/**/*.module.ts', 'src/**/*.controller.ts', 'src/**/*.service.ts'],
        governance: 'mandatory',
        description: 'NestJS guards, pipes, interceptors, and exception filters patterns',
        content: `# NestJS Guards, Pipes, Interceptors & Exception Filters

## Guards — Authentication & Authorization
- Implement \`CanActivate\` interface — return true to allow, false/throw to deny
- Apply with \`@UseGuards()\` per-controller, per-route, or globally via APP_GUARD
- Use custom decorators (\`@Public()\`, \`@Roles()\`) with Reflector for metadata-driven auth
- Extend \`AuthGuard('jwt')\` for JWT auth, check \`IS_PUBLIC_KEY\` to skip public routes
- Use RolesGuard with Reflector to read required roles from handler/class metadata

## Pipes — Validation & Transformation
- Use global \`ValidationPipe\` with class-validator for DTO validation
- Enable \`whitelist: true\` to strip unknown properties (prevents mass assignment)
- Enable \`forbidNonWhitelisted: true\` to reject requests with unknown properties
- Enable \`transform: true\` to auto-convert payloads to DTO class instances
- Use built-in pipes: ParseIntPipe, ParseUUIDPipe, ParseBoolPipe, ParseEnumPipe, DefaultValuePipe
- Apply globally via \`app.useGlobalPipes()\` for consistent validation
- DTOs: use class-validator decorators (@IsEmail, @IsString, @MinLength, @IsEnum, @IsOptional)

## Interceptors — Cross-Cutting Concerns
- Interceptors wrap handler execution (before + after) — implement NestInterceptor
- Use \`tap()\` for side effects (logging), \`map()\` for response transformation
- Apply with \`@UseInterceptors()\` per-route, per-controller, or globally via APP_INTERCEPTOR
- Common uses: response wrapping, request logging with timing, caching, timeout

## Exception Filters — Consistent Error Handling
- Implement ExceptionFilter with \`catch()\` method, use \`@Catch()\` to specify exception types
- Apply globally for consistent error response shape across the API
- Extract status and message from HttpException, return generic message for unknown errors
- Log error details server-side — never expose stack traces or internals to clients
`,
      },
      {
        path: 'nestjs/naming.md',
        paths: ['**/*.ts', 'src/**/*.module.ts', 'src/**/*.controller.ts', 'src/**/*.service.ts'],
        governance: 'recommended',
        description: 'NestJS naming and file conventions',
        content: `# NestJS Naming Conventions

## File Naming — kebab-case with type suffix
- Controllers: \`users.controller.ts\` / Services: \`users.service.ts\` / Modules: \`users.module.ts\`
- DTOs: \`create-user.dto.ts\`, \`update-user.dto.ts\`, \`user-response.dto.ts\`
- Entities: \`user.entity.ts\` / Guards: \`jwt-auth.guard.ts\` / Pipes: \`parse-order-status.pipe.ts\`
- Interceptors: \`logging.interceptor.ts\` / Filters: \`all-exceptions.filter.ts\`
- Decorators: \`current-user.decorator.ts\` / Specs: \`users.service.spec.ts\`

## Class Naming — PascalCase with type suffix
- Controllers: UsersController / Services: UsersService / Modules: UsersModule
- Guards: JwtAuthGuard, RolesGuard / Pipes: ParseOrderStatusPipe
- Interceptors: LoggingInterceptor / Filters: AllExceptionsFilter
- DTOs: CreateUserDto, UpdateUserDto, UserResponseDto / Entities: User, Order (no suffix)

## Custom Decorators
- camelCase function names: \`@CurrentUser()\`, \`@Roles()\`, \`@Public()\`
- Place reusable decorators in \`common/decorators/\`
- Use \`createParamDecorator()\` for request parameter decorators
- Combine multiple decorators with \`applyDecorators()\` when a pattern repeats

## Directory Structure
- \`src/common/\` — decorators, filters, guards, interceptors, pipes, interfaces, constants
- \`src/config/\` — config.module.ts, database.config.ts, app.config.ts
- \`src/{feature}/\` — module, controller, service, repository, entities/, dto/
- \`src/auth/\` — auth module, controller, service, strategies/, guards/, dto/
`,
      },
      {
        path: 'nestjs/testing.md',
        paths: ['**/*.ts', 'src/**/*.module.ts', 'src/**/*.controller.ts', 'src/**/*.service.ts'],
        governance: 'mandatory',
        description: 'NestJS testing patterns with @nestjs/testing and dependency injection',
        content: `# NestJS Testing Patterns

## Unit Testing with Test.createTestingModule()
- Use \`@nestjs/testing\` to create an isolated DI container per test
- Override real providers with mocks using \`.overrideProvider()\` or inline useValue
- Get service/controller under test from the compiled module via \`module.get()\`
- Mock all injected dependencies — test services and controllers independently
- Use \`jest.Mocked<T>\` type for typed mock access

## Service Tests
- Create TestingModule with the service + mock providers for each dependency
- Test happy path: mock repo returns data, verify service returns correct DTO
- Test error cases: mock repo returns null, verify NotFoundException thrown
- Verify repository methods called with correct arguments

## Controller Tests
- Create TestingModule with the controller + mock service
- Verify controller delegates to service with correct arguments
- Verify return value matches service response

## Guard Tests
- Create TestingModule with the guard + Reflector
- Mock \`reflector.getAllAndOverride()\` to return role metadata
- Test allow (no roles required), allow (matching role), deny (missing role)
- Use a mock ExecutionContext with user data on the request

## E2E Testing with supertest
- Import full AppModule, override providers for test doubles
- Apply global pipes (ValidationPipe with whitelist) as in production
- Use \`request(app.getHttpServer())\` for HTTP assertions
- Test success paths, validation rejections, and auth failures
- Always call \`app.close()\` in afterAll
`,
      },
      {
        path: 'nestjs/security.md',
        paths: ['**/*.ts', 'src/**/*.module.ts', 'src/**/*.controller.ts', 'src/**/*.service.ts'],
        governance: 'mandatory',
        description: 'NestJS authentication, authorization, and security patterns',
        content: `# NestJS Security

## Authentication with Passport.js
- Use \`@nestjs/passport\` with strategy pattern (LocalStrategy, JwtStrategy)
- Use \`AuthGuard('jwt')\` for JWT-protected routes — register globally for secure-by-default
- Use \`@Public()\` decorator to opt specific routes out of global auth
- Store JWT secrets in ConfigService — never hardcode tokens or secrets
- JwtStrategy: use \`ExtractJwt.fromAuthHeaderAsBearerToken()\`, set \`ignoreExpiration: false\`
- Validate method returns the user payload attached to the request

## Authorization — Role-Based and Policy-Based
- Use guards for authorization — never check roles inside service methods
- Combine \`@Roles()\` decorator with RolesGuard for role-based access
- For complex authorization (resource ownership), use CASL or a policy-based guard
- Always verify resource ownership to prevent IDOR vulnerabilities
- Ownership guards: load resource, compare userId, throw ForbiddenException if mismatch

## Security Hardening
- Enable CORS with specific origins — never wildcard (\`*\`) in production
- Use \`helmet\` for security headers (CSP, HSTS, X-Frame-Options)
- Apply rate limiting with \`@nestjs/throttler\` on login and sensitive endpoints
- Global ValidationPipe with whitelist + forbidNonWhitelisted prevents mass assignment
- Use \`@Exclude()\` from class-transformer on sensitive entity fields (password, tokens)
- CSRF protection for cookie-based sessions (csurf or double-submit cookie pattern)
`,
      },
      {
        path: 'nestjs/database-patterns.md',
        paths: ['**/*.ts', 'src/**/*.module.ts', 'src/**/*.controller.ts', 'src/**/*.service.ts'],
        governance: 'recommended',
        description: 'NestJS database integration with TypeORM, Prisma, and Mongoose',
        content: `# NestJS Database Patterns

## TypeORM Integration
- Use \`TypeOrmModule.forRootAsync()\` with ConfigService for database configuration
- Use \`TypeOrmModule.forFeature([Entity])\` in feature modules to register entities
- Create custom repository classes extending \`Repository<Entity>\` for complex queries
- Use \`@Transaction()\` decorator or QueryRunner for multi-step operations
- Handle \`QueryFailedError\` — wrap with domain exceptions
- Use migrations for all schema changes — never \`synchronize: true\` in production
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow('DB_HOST'),
        port: config.getOrThrow('DB_PORT'),
        username: config.getOrThrow('DB_USER'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.getOrThrow('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false, // NEVER true in production
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        logging: config.get('DB_LOGGING') === 'true',
      }),
    }),
  ],
})
export class DatabaseConfigModule {}
\`\`\`

---

## Prisma Integration
- Create a \`PrismaService\` extending \`PrismaClient\` that implements \`OnModuleInit\` and \`OnModuleDestroy\`
- Inject \`PrismaService\` in repositories or services — do NOT use PrismaClient directly
- Use Prisma's built-in transactions (\`$transaction\`) for atomic operations
- Use Prisma middleware for soft deletes, audit logging, and query timing
- Generate client after every schema change: \`npx prisma generate\`
- Use Prisma Migrate for schema migrations: \`npx prisma migrate dev\`

### Correct — PrismaService lifecycle

\`\`\`typescript
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
\`\`\`

---

## Mongoose Integration (MongoDB)
- Use \`MongooseModule.forRootAsync()\` with ConfigService
- Use \`MongooseModule.forFeature()\` to register schemas per module
- Define schemas with \`@Schema()\` decorator and \`SchemaFactory.createForClass()\`
- Use \`@Prop()\` for all schema fields — set required, default, index, unique
- Use lean queries (\`.lean()\`) for read-only operations to skip Mongoose hydration
- Create indexes for frequently queried fields

### Anti-Pattern — synchronize in production

\`\`\`typescript
// NEVER do this in production — data loss risk
TypeOrmModule.forRoot({
  synchronize: true, // auto-alters tables based on entities — DANGEROUS
})
\`\`\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['nestjs-module-generator', 'nestjs-auth-setup'],
        prompt: `## NestJS-Specific Review

### Architecture & Modularity
- Verify modular architecture: each feature has its own module with proper imports/exports
- Check for circular module dependencies — use \`forwardRef()\` only as last resort
- Verify controllers are thin: no business logic, no direct repository access
- Check that services are stateless — no mutable instance properties holding request data
- Verify modules export only what other modules need — no over-exporting

### Dependency Injection
- Check for proper constructor injection — no \`@Autowired\` style field injection
- Verify custom providers use appropriate pattern: useFactory for async, useClass for swappable, useValue for static
- Check for missing \`@Inject()\` on token-based providers
- Verify provider scope is appropriate — REQUEST scope only when genuinely needed (it bubbles up)
- Check for providers registered in wrong module — verify encapsulation

### Validation & DTOs
- Verify ALL \`@Body()\` parameters use DTOs with class-validator decorators
- Check that \`@Param()\` uses built-in pipes (\`ParseUUIDPipe\`, \`ParseIntPipe\`)
- Verify ValidationPipe is configured with \`whitelist: true\` and \`forbidNonWhitelisted: true\`
- Check that response DTOs exist — controllers should never return raw entities
- Verify DTOs use \`@ApiProperty()\` for Swagger documentation

### Guards & Security
- Verify guards are applied for all protected routes — prefer global guard with \`@Public()\` opt-out
- Check that RolesGuard uses Reflector for metadata, not hardcoded role checks
- Verify resource ownership checks exist for IDOR-prone endpoints
- Check for rate limiting on authentication and sensitive endpoints
- Verify sensitive entity fields use \`@Exclude()\` from class-transformer

### Error Handling
- Verify a global exception filter exists for consistent error responses
- Check that services throw NestJS built-in exceptions or custom HttpExceptions
- Verify error responses do not leak internal details (stack traces, SQL errors, file paths)
- Check that async errors are properly caught — no unhandled promise rejections

### Interceptors & Middleware
- Verify interceptors follow the correct RxJS pattern (tap for side effects, map for transform)
- Check that middleware is applied in correct order (security -> parsing -> auth)
- Verify logging interceptor does not log sensitive data (passwords, tokens, PII)`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['nestjs-module-generator', 'nestjs-auth-setup'],
        prompt: `## NestJS Testing

### Unit Tests (Services)
- Use \`Test.createTestingModule()\` to create isolated DI containers for each test
- Mock all injected dependencies with typed mocks (jest.Mocked<T>)
- Test happy path, error cases (NotFoundException, ConflictException), and edge cases
- Verify correct exceptions are thrown with proper messages
- Reset mocks in beforeEach to ensure test isolation

### Unit Tests (Controllers)
- Mock the service layer completely — never test business logic through controllers
- Verify controllers call the correct service methods with correct arguments
- Test that proper HTTP exceptions propagate from services

### Guard Tests
- Test guards with mock ExecutionContext and Reflector
- Verify @Public() routes bypass authentication
- Test role-based guards with various user role combinations
- Verify guards throw UnauthorizedException/ForbiddenException correctly

### Pipe Tests
- Test custom pipes with valid and invalid input
- Verify transformation produces correct output types
- Test validation pipes reject malformed data with clear error messages

### E2E Tests
- Use supertest against the full NestJS application
- Override external dependencies (database, external APIs) with test doubles
- Configure the same global pipes, filters, and interceptors as production
- Test the full request lifecycle: validation -> auth -> handler -> response
- Verify correct HTTP status codes, response shapes, and error formats
- Test authentication flows end-to-end (login, protected routes, token refresh)`,
      },
      {
        name: 'security-checker',
        type: 'enrich',
        skills: ['nestjs-auth-setup'],
        prompt: `## NestJS Security Review

### Authentication & Session
- Verify Passport strategies use ConfigService for secrets — no hardcoded JWT secrets
- Check that JWT tokens have reasonable expiration times (access: 15-30min, refresh: 7-30d)
- Verify refresh token rotation is implemented — invalidate old tokens on refresh
- Check that failed login attempts are rate-limited via @nestjs/throttler
- Verify password hashing uses bcrypt or Argon2 with appropriate cost factor

### Authorization
- Verify global JwtAuthGuard is registered as APP_GUARD with @Public() opt-out pattern
- Check that IDOR-prone endpoints verify resource ownership (not just authentication)
- Verify role checks use guard + decorator pattern — not inline logic in handlers
- Check that admin-only routes require explicit role verification

### Input Validation & Injection
- Verify ValidationPipe with whitelist + forbidNonWhitelisted is applied globally
- Check for raw SQL queries without parameterization — use TypeORM query builder or Prisma
- Verify file upload endpoints validate file type, size, and sanitize filenames
- Check that @Exclude() is used on sensitive entity fields (password, tokens, secrets)

### API Security
- Verify CORS is configured with specific origins — no wildcard in production
- Check that helmet middleware is applied for security headers
- Verify rate limiting is configured for public and authentication endpoints
- Check that error responses do not leak stack traces, SQL queries, or internal paths
- Verify API versioning strategy is consistent (@nestjs/common versioning)`,
      },
    ],
    skills: [
      {
        name: 'nestjs-di-guide',
        description: 'Detailed reference for NestJS dependency injection patterns, custom providers, and module encapsulation',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# NestJS Dependency Injection — Detailed Reference

## How NestJS DI Works
NestJS uses an Inversion of Control (IoC) container that manages the lifecycle of providers.
When a module is loaded, the container resolves all declared providers, inspects constructor
parameters, and injects the correct instances automatically. Providers are registered in a
module's \`providers\` array and can be exported for use by other modules.

## Constructor Injection
The standard and recommended injection pattern. Declare dependencies as constructor parameters
with \`private readonly\` for immutability:

\\\`\\\`\\\`typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const user = await this.usersService.findOneOrFail(dto.userId);
    const order = this.ordersRepository.create({ ...dto, user });
    const saved = await this.ordersRepository.save(order);
    this.eventEmitter.emit('order.created', saved);
    return saved;
  }
}
\\\`\\\`\\\`

## Custom Providers — useClass, useFactory, useValue, useExisting

### useClass — Swap implementations (strategy pattern, testing)
\\\`\\\`\\\`typescript
// Swap payment processor based on environment
@Module({
  providers: [
    {
      provide: PAYMENT_PROCESSOR,
      useClass:
        process.env.NODE_ENV === 'production'
          ? StripePaymentProcessor
          : MockPaymentProcessor,
    },
  ],
})
export class PaymentsModule {}
\\\`\\\`\\\`

### useFactory — Async setup, conditional logic, inject other providers
\\\`\\\`\\\`typescript
@Module({
  providers: [
    {
      provide: CACHE_CLIENT,
      useFactory: async (config: ConfigService) => {
        const client = new Redis({
          host: config.getOrThrow('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
        });
        await client.ping();
        return client;
      },
      inject: [ConfigService],
    },
  ],
})
export class CacheModule {}
\\\`\\\`\\\`

### useValue — Static config, constants, mock replacements in tests
\\\`\\\`\\\`typescript
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useValue: {
        maxRetries: 3,
        timeoutMs: 5000,
        features: { newDashboard: true },
      },
    },
  ],
})
export class ConfigModule {}
\\\`\\\`\\\`

### useExisting — Alias a provider under a different token
\\\`\\\`\\\`typescript
@Module({
  providers: [
    ConcreteLogger,
    { provide: LOGGER, useExisting: ConcreteLogger },
  ],
})
export class LoggingModule {}
\\\`\\\`\\\`

## Interface-Based Injection with Symbol Tokens
TypeScript interfaces are erased at runtime, so use Symbol tokens with \`@Inject()\`:

\\\`\\\`\\\`typescript
// tokens.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// users.module.ts
@Module({
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}

// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}
}
\\\`\\\`\\\`

## Async Providers with ConfigService
Use \`useFactory\` with \`inject\` to access ConfigService or other async dependencies:

\\\`\\\`\\\`typescript
{
  provide: DATABASE_CONNECTION,
  useFactory: async (config: ConfigService): Promise<DataSource> => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: config.getOrThrow('DB_HOST'),
      port: config.getOrThrow<number>('DB_PORT'),
      username: config.getOrThrow('DB_USER'),
      password: config.getOrThrow('DB_PASSWORD'),
      database: config.getOrThrow('DB_NAME'),
    });
    return dataSource.initialize();
  },
  inject: [ConfigService],
}
\\\`\\\`\\\`

## Provider Scopes

### DEFAULT (Singleton) — One instance shared across the entire application
- Best performance, lowest memory usage
- Use for stateless services (most services)

### REQUEST — New instance per incoming request
- Use when you need request-specific data (e.g., tenant context, current user)
- **Warning**: REQUEST scope bubbles up — any provider that depends on a request-scoped
  provider also becomes request-scoped, which impacts performance

### TRANSIENT — New instance every time it is injected
- Use for providers that must maintain isolated internal state per consumer
- Rarely needed — consider whether you really need it

\\\`\\\`\\\`typescript
// Request-scoped: new instance per HTTP request
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get tenantId(): string {
    return this.request.headers['x-tenant-id'] as string;
  }
}

// Transient: new instance per injection point
@Injectable({ scope: Scope.TRANSIENT })
export class TaskLogger {
  private logs: string[] = [];
  log(msg: string) { this.logs.push(msg); }
  flush() { return this.logs.splice(0); }
}
\\\`\\\`\\\`

## Module Encapsulation — Exports, Imports, Dynamic Modules
- Providers are private to their module by default
- Only providers listed in \`exports\` are accessible to importing modules
- \`imports\` brings in exported providers from other modules

\\\`\\\`\\\`typescript
@Module({
  imports: [DatabaseModule],          // access DatabaseModule's exports
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],            // only UsersService is available outside
})
export class UsersModule {}
\\\`\\\`\\\`

## forRoot / forRootAsync Pattern for Configurable Modules
Use for modules that need one-time global configuration:

\\\`\\\`\\\`typescript
@Module({})
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    return {
      module: MailModule,
      global: true,
      providers: [
        { provide: MAIL_OPTIONS, useValue: options },
        MailService,
      ],
      exports: [MailService],
    };
  }

  static forRootAsync(options: MailModuleAsyncOptions): DynamicModule {
    return {
      module: MailModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: MAIL_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        MailService,
      ],
      exports: [MailService],
    };
  }
}

// Usage in AppModule
@Module({
  imports: [
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        host: config.getOrThrow('SMTP_HOST'),
        port: config.getOrThrow<number>('SMTP_PORT'),
        auth: {
          user: config.getOrThrow('SMTP_USER'),
          pass: config.getOrThrow('SMTP_PASS'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
\\\`\\\`\\\`

## @Optional() and @Inject() for Optional Dependencies
Use \`@Optional()\` when a dependency may not be registered:

\\\`\\\`\\\`typescript
@Injectable()
export class NotificationService {
  constructor(
    private readonly mailService: MailService,
    @Optional() @Inject(SLACK_CLIENT)
    private readonly slackClient?: SlackClient,
  ) {}

  async notify(message: string): Promise<void> {
    await this.mailService.send(message);
    if (this.slackClient) {
      await this.slackClient.postMessage(message);
    }
  }
}
\\\`\\\`\\\`

## Circular Dependency Resolution with forwardRef()
Use \`forwardRef()\` as a last resort when two providers depend on each other:

\\\`\\\`\\\`typescript
// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}
}

// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}
}

// Also needed at module level for circular module imports
@Module({
  imports: [forwardRef(() => AuthModule)],
})
export class UsersModule {}
\\\`\\\`\\\`

**Better approach**: Extract the shared logic into a third service to avoid the circular
dependency entirely.

## Testing with overrideProvider() — DI Makes Testing Easy
\\\`\\\`\\\`typescript
const module = await Test.createTestingModule({
  providers: [
    OrdersService,
    { provide: USER_REPOSITORY, useValue: mockUserRepo },
  ],
})
  .overrideProvider(OrdersRepository)
  .useValue(mockOrdersRepo)
  .compile();

const service = module.get(OrdersService);
\\\`\\\`\\\`

## Common Anti-Patterns

### Anti-Pattern: Field injection or manual instantiation
\\\`\\\`\\\`typescript
// WRONG: bypasses DI — not testable, not manageable
@Injectable()
export class OrdersService {
  private repo = new OrdersRepository(); // hardcoded dependency

  @Autowired() // does not exist in NestJS
  private usersService: UsersService;
}

// CORRECT: constructor injection
@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly usersService: UsersService,
  ) {}
}
\\\`\\\`\\\`

### Anti-Pattern: Using REQUEST scope unnecessarily
\\\`\\\`\\\`typescript
// WRONG: makes every dependent provider request-scoped too
@Injectable({ scope: Scope.REQUEST })
export class UtilityService {
  format(date: Date) { return date.toISOString(); }
}

// CORRECT: stateless service should be singleton (default scope)
@Injectable()
export class UtilityService {
  format(date: Date) { return date.toISOString(); }
}
\\\`\\\`\\\`

### Anti-Pattern: Over-exporting from modules
\\\`\\\`\\\`typescript
// WRONG: exposes internal implementation details
@Module({
  providers: [UsersService, UsersRepository, PasswordHasher, UserMapper],
  exports: [UsersService, UsersRepository, PasswordHasher, UserMapper],
})
export class UsersModule {}

// CORRECT: export only the public API
@Module({
  providers: [UsersService, UsersRepository, PasswordHasher, UserMapper],
  exports: [UsersService], // only the facade
})
export class UsersModule {}
\\\`\\\`\\\`
`,
      },
      {
        name: 'nestjs-testing-guide',
        description: 'Detailed reference for NestJS testing patterns with @nestjs/testing, mocking, guards, pipes, and e2e',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# NestJS Testing — Detailed Reference

## Test.createTestingModule() Setup
The \`@nestjs/testing\` package provides \`Test.createTestingModule()\` to create an isolated
DI container for each test. This lets you replace real dependencies with mocks while the
container handles wiring everything together.

\\\`\\\`\\\`typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());
});
\\\`\\\`\\\`

## Unit Testing Services — Complete Example
\\\`\\\`\\\`typescript
describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findOneOrFail', () => {
    it('should return user when found', async () => {
      const user = { id: '1', name: 'Alice', email: 'alice@test.com' } as User;
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.findOneOrFail('1');

      expect(result).toEqual(expect.objectContaining({ id: '1', name: 'Alice' }));
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneOrFail('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const dto: CreateUserDto = { name: 'Bob', email: 'bob@test.com' };
      const entity = { id: '2', ...dto } as User;
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.id).toBe('2');
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(entity);
    });

    it('should throw ConflictException on duplicate email', async () => {
      const dto: CreateUserDto = { name: 'Bob', email: 'existing@test.com' };
      mockRepo.create.mockReturnValue(dto as any);
      mockRepo.save.mockRejectedValue({ code: '23505' }); // unique violation

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
\\\`\\\`\\\`

## Unit Testing Controllers — Complete Example
\\\`\\\`\\\`typescript
describe('UsersController', () => {
  let controller: UsersController;
  let mockService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get(UsersController);
  });

  describe('findOne', () => {
    it('should delegate to service with correct id', async () => {
      const expected = { id: '1', name: 'Alice' } as UserResponseDto;
      mockService.findOneOrFail.mockResolvedValue(expected);

      const result = await controller.findOne('1');

      expect(result).toBe(expected);
      expect(mockService.findOneOrFail).toHaveBeenCalledWith('1');
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.findOneOrFail.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should delegate to service and return created user', async () => {
      const dto: CreateUserDto = { name: 'Bob', email: 'bob@test.com' };
      const expected = { id: '2', ...dto } as UserResponseDto;
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);

      expect(result).toBe(expected);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });
});
\\\`\\\`\\\`

## Testing Guards — JwtAuthGuard and RolesGuard

### Testing JwtAuthGuard with @Public() support
\\\`\\\`\\\`typescript
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JwtAuthGuard, Reflector],
    }).compile();

    guard = module.get(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  function createMockContext(handler?: Function): ExecutionContext {
    return {
      getHandler: () => handler || (() => {}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: '1', roles: ['user'] } }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when route is marked @Public()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createMockContext();

    expect(guard.canActivate(ctx)).toBe(true);
  });
});
\\\`\\\`\\\`

### Testing RolesGuard
\\\`\\\`\\\`typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get(RolesGuard);
    reflector = module.get(Reflector);
  });

  function createMockContext(user: { roles: string[] }): ExecutionContext {
    return {
      getHandler: () => () => {},
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ roles: ['user'] });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = createMockContext({ roles: ['admin', 'user'] });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const ctx = createMockContext({ roles: ['user'] });

    expect(guard.canActivate(ctx)).toBe(false);
  });
});
\\\`\\\`\\\`

## Testing Pipes — Custom Validation and Transformation
\\\`\\\`\\\`typescript
describe('ParseOrderStatusPipe', () => {
  let pipe: ParseOrderStatusPipe;

  beforeEach(() => {
    pipe = new ParseOrderStatusPipe();
  });

  it('should accept valid status values', () => {
    expect(pipe.transform('pending')).toBe('pending');
    expect(pipe.transform('shipped')).toBe('shipped');
    expect(pipe.transform('delivered')).toBe('delivered');
  });

  it('should throw BadRequestException for invalid status', () => {
    expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should normalize case', () => {
    expect(pipe.transform('PENDING')).toBe('pending');
    expect(pipe.transform('Shipped')).toBe('shipped');
  });
});
\\\`\\\`\\\`

## Testing Interceptors with Mock CallHandler
\\\`\\\`\\\`typescript
describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should log request timing', (done) => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/users' }),
      }),
      getClass: () => ({ name: 'UsersController' }),
      getHandler: () => ({ name: 'findAll' }),
    } as unknown as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ data: 'test' }),
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      next: (value) => {
        expect(value).toEqual({ data: 'test' });
      },
      complete: () => {
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
        done();
      },
    });
  });
});
\\\`\\\`\\\`

## E2E Testing with supertest and INestApplication
\\\`\\\`\\\`typescript
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let mockUsersService: Partial<UsersService>;

  beforeAll(async () => {
    mockUsersService = {
      findAll: jest.fn().mockResolvedValue([
        { id: '1', name: 'Alice', email: 'alice@test.com' },
      ]),
      findOneOrFail: jest.fn().mockImplementation(async (id: string) => {
        if (id === '1') return { id: '1', name: 'Alice', email: 'alice@test.com' };
        throw new NotFoundException();
      }),
      create: jest.fn().mockImplementation(async (dto) => ({
        id: '2', ...dto,
      })),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return list of users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].name).toBe('Alice');
        });
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('1');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/999')
        .expect(404);
    });
  });

  describe('POST /users', () => {
    it('should create a user with valid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Bob', email: 'bob@test.com' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBe('2');
          expect(res.body.name).toBe('Bob');
        });
    });

    it('should reject request with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Bob' }) // missing email
        .expect(400);
    });

    it('should reject request with unknown fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Bob', email: 'bob@test.com', isAdmin: true })
        .expect(400); // forbidNonWhitelisted rejects unknown properties
    });
  });
});
\\\`\\\`\\\`

## Overriding Providers for Test Doubles
\\\`\\\`\\\`typescript
// Override a single provider
const module = await Test.createTestingModule({
  imports: [UsersModule],
})
  .overrideProvider(UsersRepository)
  .useValue(mockRepository)
  .compile();

// Override a guard globally
const module = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideGuard(JwtAuthGuard)
  .useValue({ canActivate: () => true })
  .compile();

// Override an interceptor
const module = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideInterceptor(LoggingInterceptor)
  .useValue({ intercept: (_, next) => next.handle() })
  .compile();
\\\`\\\`\\\`

## Testing Async Operations and Error Cases
\\\`\\\`\\\`typescript
describe('OrdersService — async and errors', () => {
  it('should handle concurrent order creation', async () => {
    mockRepo.save.mockResolvedValueOnce(order1).mockResolvedValueOnce(order2);

    const [result1, result2] = await Promise.all([
      service.create(dto1),
      service.create(dto2),
    ]);

    expect(result1.id).not.toBe(result2.id);
    expect(mockRepo.save).toHaveBeenCalledTimes(2);
  });

  it('should wrap database errors in domain exceptions', async () => {
    mockRepo.save.mockRejectedValue(new Error('Connection refused'));

    await expect(service.create(dto)).rejects.toThrow(InternalServerErrorException);
  });

  it('should handle timeout scenarios', async () => {
    mockRepo.findOne.mockImplementation(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100),
      ),
    );

    await expect(service.findOneOrFail('1')).rejects.toThrow();
  });
});
\\\`\\\`\\\`

## Database Testing Patterns

### In-Memory Database
\\\`\\\`\\\`typescript
// Use SQLite in-memory for fast integration tests
const module = await Test.createTestingModule({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Order],
      synchronize: true, // OK for in-memory test DB
    }),
    TypeOrmModule.forFeature([User, Order]),
  ],
  providers: [UsersService],
}).compile();
\\\`\\\`\\\`

### Transaction Rollback Pattern
\\\`\\\`\\\`typescript
// Wrap each test in a transaction that rolls back
describe('UsersService (integration)', () => {
  let service: UsersService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  });

  afterEach(async () => {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  });

  it('should persist user to database', async () => {
    const user = await service.create({ name: 'Test', email: 'test@test.com' });
    const found = await service.findOneOrFail(user.id);
    expect(found.name).toBe('Test');
  });
});
\\\`\\\`\\\`

## Common Anti-Patterns

### Anti-Pattern: Testing implementation details
\\\`\\\`\\\`typescript
// WRONG: testing internal method calls instead of behavior
it('should call hashPassword', async () => {
  const spy = jest.spyOn(service as any, 'hashPassword');
  await service.create(dto);
  expect(spy).toHaveBeenCalled(); // brittle — breaks if you refactor internals
});

// CORRECT: test the observable behavior
it('should not store plain-text password', async () => {
  const result = await service.create({ ...dto, password: 'secret123' });
  const stored = await repo.findOne({ where: { id: result.id } });
  expect(stored.password).not.toBe('secret123');
});
\\\`\\\`\\\`

### Anti-Pattern: Not mocking dependencies
\\\`\\\`\\\`typescript
// WRONG: real dependencies make tests slow, flaky, and coupled
const module = await Test.createTestingModule({
  imports: [UsersModule, DatabaseModule, MailModule], // real DB, real mail
}).compile();

// CORRECT: mock external dependencies
const module = await Test.createTestingModule({
  providers: [
    UsersService,
    { provide: getRepositoryToken(User), useValue: mockRepo },
    { provide: MailService, useValue: { send: jest.fn() } },
  ],
}).compile();
\\\`\\\`\\\`

### Anti-Pattern: Missing global pipe configuration in e2e
\\\`\\\`\\\`typescript
// WRONG: e2e tests without production-like configuration
const app = moduleFixture.createNestApplication();
await app.init(); // no global pipes — validation is skipped!

// CORRECT: replicate production setup
const app = moduleFixture.createNestApplication();
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
);
app.useGlobalFilters(new AllExceptionsFilter());
await app.init();
\\\`\\\`\\\`
`,
      },
      {
        name: 'nestjs-module-generator',
        description: 'Generate complete NestJS feature modules with controller, service, DTOs, entity, and tests',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        content: `# NestJS Module Generator

Generate a complete NestJS feature module with:

1. **Module** — proper imports, providers, exports, and forFeature registrations
2. **Controller** — CRUD handlers with @ApiTags, @ApiOperation, @ApiResponse, proper pipes and guards
3. **Service** — business logic with typed exceptions, DTO mapping, event emission
4. **DTOs** — CreateDto, UpdateDto (PartialType), ResponseDto with class-validator + @ApiProperty
5. **Entity** — TypeORM/Prisma entity with proper column decorators, relations, and @Exclude on sensitive fields
6. **Repository** — custom repository with typed query methods
7. **Unit tests** — service and controller tests with Test.createTestingModule and mocked dependencies
8. **E2E test** — supertest against the full module with validation and auth testing

### Template: Module

\`\`\`typescript
@Module({
  imports: [TypeOrmModule.forFeature([EntityName])],
  controllers: [EntityNameController],
  providers: [EntityNameService],
  exports: [EntityNameService],
})
export class EntityNameModule {}
\`\`\`

### Template: DTO with validation

\`\`\`typescript
export class CreateEntityDto {
  @ApiProperty({ description: 'Field description', example: 'value' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly fieldName: string;
}

export class UpdateEntityDto extends PartialType(CreateEntityDto) {}

export class EntityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fieldName: string;

  static fromEntity(entity: EntityName): EntityResponseDto {
    const dto = new EntityResponseDto();
    dto.id = entity.id;
    dto.fieldName = entity.fieldName;
    return dto;
  }
}
\`\`\`

### Template: Service with error handling

\`\`\`typescript
@Injectable()
export class EntityNameService {
  constructor(
    @InjectRepository(EntityName)
    private readonly repo: Repository<EntityName>,
  ) {}

  async create(dto: CreateEntityDto): Promise<EntityResponseDto> {
    const entity = this.repo.create(dto);
    const saved = await this.repo.save(entity);
    return EntityResponseDto.fromEntity(saved);
  }

  async findOneOrFail(id: string): Promise<EntityResponseDto> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(\\\`Entity \\\${id} not found\\\`);
    return EntityResponseDto.fromEntity(entity);
  }
}
\`\`\`
`,
      },
      {
        name: 'nestjs-auth-setup',
        description: 'Generate NestJS authentication module with JWT, Passport, guards, and refresh tokens',
        content: `# NestJS Auth Module Generator

Generate a complete authentication setup with:

1. **AuthModule** — imports PassportModule, JwtModule.registerAsync with ConfigService
2. **AuthController** — login, register, refresh-token, logout endpoints
3. **AuthService** — credential validation, token generation, refresh token rotation
4. **JwtStrategy** — Passport JWT strategy extracting bearer token
5. **LocalStrategy** — Passport local strategy for username/password login
6. **JwtAuthGuard** — extends AuthGuard('jwt') with @Public() support via Reflector
7. **RolesGuard** — metadata-driven role-based access control
8. **Decorators** — @CurrentUser(), @Roles(), @Public()
9. **DTOs** — LoginDto, RegisterDto, TokenResponseDto, RefreshTokenDto
10. **Tests** — unit tests for AuthService, guard tests, e2e auth flow tests

### Key Security Requirements
- Hash passwords with bcrypt (cost factor 12+)
- JWT access token: 15-30 minute expiry
- JWT refresh token: 7-30 day expiry, stored hashed in database
- Rotate refresh tokens on every use — invalidate the old one
- Rate limit login endpoint (5 attempts per minute)
- Never return password or token hashes in responses
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.controller\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/Repository|getRepository|InjectRepository|PrismaService|\\bthis\\.prisma\\b/.test(c)) {
  console.log('Warning: Controller appears to access the database directly. Move data access to a service — controllers should only handle HTTP concerns.');
}
if (/@Body\\(\\)\\s+\\w+:\\s*any\\b/.test(c)) {
  console.log('Warning: @Body() parameter typed as any. Use a DTO class with class-validator decorators for input validation.');
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.service\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/@Req\\(\\)|@Res\\(\\)|Request|Response/.test(c) && /@Injectable/.test(c)) {
  console.log('Warning: Service appears to use HTTP Request/Response objects. Services should be framework-agnostic — handle HTTP concerns in controllers.');
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `FILE_PATH=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).tool_input?.file_path||'')}catch{console.log('')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
const f = process.argv[1] || '';
if (!/\\.dto\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/export\\s+class\\s+\\w+Dto/.test(c) && !/@Is|@Min|@Max|@IsOptional|@ValidateNested|@Matches|@ArrayMinSize/.test(c)) {
  console.log('Warning: DTO class detected without class-validator decorators. Add validation decorators to ensure input safety.');
}
if (/export\\s+class\\s+\\w+Dto/.test(c) && !/@ApiProperty|@ApiPropertyOptional/.test(c)) {
  console.log('Warning: DTO class detected without @ApiProperty decorators. Add Swagger annotations for API documentation.');
}
" -- "$FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
