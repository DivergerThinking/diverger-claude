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
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
          command: `FILE_PATH=$(jq -r '.tool_input.file_path // empty' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "
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
