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

### Modular Architecture
- Every feature/domain gets its own module — modules are the primary organizational unit
- Use dependency injection for all services — never instantiate with \`new\` manually
- Controllers handle HTTP concerns only — delegate all business logic to services
- Services are stateless and reusable — no request-specific data stored as instance state
- Use DTOs with class-validator for all request input validation
- Use custom decorators to reduce boilerplate and express domain intent

### Provider Lifecycle & Scope
- Default provider scope is \`SINGLETON\` — one instance shared across the entire app
- Use \`REQUEST\` scope only when the provider genuinely needs per-request state (e.g., multi-tenancy, request-scoped caching)
- Use \`TRANSIENT\` scope only when each consumer needs its own unique instance
- Be aware: request-scoped providers bubble up — any provider injecting a request-scoped provider also becomes request-scoped
- Prefer \`SINGLETON\` scope for performance — request-scoped providers incur per-request instantiation overhead

### Execution Pipeline Order
Understand the exact order NestJS processes a request:
1. **Middleware** — runs first (similar to Express middleware)
2. **Guards** — authentication and authorization (can prevent execution)
3. **Interceptors (before)** — pre-processing, logging, caching
4. **Pipes** — input validation and transformation
5. **Route handler** — the controller method
6. **Interceptors (after)** — post-processing, response mapping
7. **Exception filters** — error handling (catches thrown exceptions at any step)

### Configuration
- Use \`@nestjs/config\` ConfigModule with \`.env\` files and validation schemas (Joi or class-validator)
- Access config via \`ConfigService\` injection — never use \`process.env\` directly in services
- Use \`forRoot()\` / \`forRootAsync()\` for global configuration modules
- Use \`registerAs()\` with namespaced configuration for organized config access

### API Documentation
- Use \`@nestjs/swagger\` decorators on all controllers and DTOs
- Annotate endpoints with \`@ApiOperation()\`, \`@ApiResponse()\`, \`@ApiTags()\`
- Use \`@ApiProperty()\` on all DTO fields for automatic schema generation
- Generate OpenAPI spec automatically — keep Swagger UI enabled in development`,
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
        governance: 'mandatory',
        description: 'NestJS modular architecture, DI, providers, and execution pipeline',
        content: `# NestJS Architecture

## Module Organization
- Create one module per domain/feature (e.g., UsersModule, AuthModule, OrdersModule)
- Import only what the module needs — avoid circular dependencies
- Use \`forRoot()\` / \`forRootAsync()\` for global configuration modules (database, config, auth)
- Use \`forFeature()\` for feature-specific registrations (e.g., TypeORM entities, Mongoose schemas)
- Export only the providers that other modules need — keep internals encapsulated
- Use a \`SharedModule\` to re-export commonly used modules (ConfigModule, HttpModule, etc.)
- Use dynamic modules for configurable, reusable library modules

### Correct — well-organized module

\`\`\`typescript
// users/users.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,       // import only what this feature needs
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],  // export only what other modules need
})
export class UsersModule {}
\`\`\`

### Anti-Pattern — god module

\`\`\`typescript
// app.module.ts — everything registered in one module
@Module({
  controllers: [UsersController, OrdersController, ProductsController, AuthController],
  providers: [UsersService, OrdersService, ProductsService, AuthService, MailService],
  // Problem: no encapsulation, everything coupled, impossible to lazy-load
})
export class AppModule {}
\`\`\`

---

## Controllers
- Controllers handle HTTP concerns ONLY: parse request, call service, return response
- Use decorators for routing: \`@Get()\`, \`@Post()\`, \`@Put()\`, \`@Delete()\`, \`@Patch()\`
- Use \`@Param()\`, \`@Query()\`, \`@Body()\` decorators to extract request data with type safety
- Return DTOs or serialized responses — never return raw entity/ORM objects
- Apply route-level guards, pipes, and interceptors via decorators
- Use \`@HttpCode()\` to set non-default status codes (e.g., 204 for DELETE, 201 for POST)
- Use \`@Header()\` for custom response headers

### Correct — thin controller delegating to service

\`\`\`typescript
@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOneOrFail(id);
  }
}
\`\`\`

### Anti-Pattern — business logic in controller

\`\`\`typescript
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly mailer: MailService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    // Problem: direct repo access, no validation, email logic, no DTO
    const user = this.userRepo.create(body);
    await this.userRepo.save(user);
    await this.mailer.send(user.email, 'Welcome!');
    return user; // leaks entity internals
  }
}
\`\`\`

---

## Services
- Services contain ALL business logic — they are the heart of the application
- Inject dependencies via constructor: \`constructor(private readonly usersRepo: UsersRepository)\`
- Services must be stateless — no mutable instance properties that hold request data
- Throw NestJS HTTP exceptions (\`NotFoundException\`, \`ConflictException\`, \`ForbiddenException\`) for API error responses
- Use custom domain exceptions for business-rule violations that are caught and translated by exception filters
- Return DTOs or plain objects — never return ORM entities with lazy-loaded relations

### Correct — focused service with proper error handling

\`\`\`typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersRepo.create(dto);
    this.eventEmitter.emit('user.created', new UserCreatedEvent(user.id));
    return UserResponseDto.fromEntity(user);
  }

  async findOneOrFail(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException(\`User \${id} not found\`);
    }
    return UserResponseDto.fromEntity(user);
  }
}
\`\`\`

---

## Dependency Injection — Custom Providers
- Register providers in the module's \`providers\` array
- Use \`useClass\` for swapping implementations (testing, strategy pattern)
- Use \`useFactory\` for providers that need async setup or conditional logic
- Use \`useValue\` for static configuration objects or mock replacements
- Use \`useExisting\` to alias one provider to another
- Use string or Symbol injection tokens for interface-based injection
- Use \`@Optional()\` for optional dependencies
- Scope providers as singleton (default), request-scoped, or transient as needed

### Correct — factory provider with async configuration

\`\`\`typescript
// database.providers.ts
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: async (config: ConfigService) => {
        const dataSource = new DataSource({
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          database: config.get('DB_NAME'),
        });
        return dataSource.initialize();
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
\`\`\`

### Correct — interface-based injection with tokens

\`\`\`typescript
// payment.interface.ts
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface PaymentGateway {
  charge(amount: number, currency: string): Promise<PaymentResult>;
  refund(transactionId: string): Promise<RefundResult>;
}

// payment.module.ts
@Module({
  providers: [
    {
      provide: PAYMENT_GATEWAY,
      useClass:
        process.env.NODE_ENV === 'production'
          ? StripeGateway
          : MockPaymentGateway,
    },
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentModule {}

// orders.service.ts — consuming the interface
@Injectable()
export class OrdersService {
  constructor(
    @Inject(PAYMENT_GATEWAY) private readonly payment: PaymentGateway,
  ) {}
}
\`\`\`
`,
      },
      {
        path: 'nestjs/guards-pipes-interceptors.md',
        governance: 'mandatory',
        description: 'NestJS guards, pipes, interceptors, and exception filters patterns',
        content: `# NestJS Guards, Pipes, Interceptors & Exception Filters

## Guards — Authentication & Authorization
- Guards determine whether a request is allowed to proceed
- Implement \`CanActivate\` interface with a single \`canActivate()\` method
- Return \`true\` to allow, \`false\` or throw to deny
- Apply with \`@UseGuards()\` per-controller, per-route, or globally via \`APP_GUARD\`
- Use custom decorators (\`@Public()\`, \`@Roles()\`) with \`Reflector\` for metadata-driven auth

### Correct — JWT guard with role-based access

\`\`\`typescript
// auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context) as Promise<boolean>;
  }
}

// auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage in controller
@Post()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async createAdmin(@Body() dto: CreateUserDto) { /* ... */ }
\`\`\`

### Anti-Pattern — auth logic scattered in controllers

\`\`\`typescript
@Post()
async create(@Req() req: Request, @Body() dto: CreateUserDto) {
  // Problem: auth logic duplicated in every handler
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new UnauthorizedException();
  const payload = this.jwtService.verify(token);
  if (!payload.roles.includes('admin')) throw new ForbiddenException();
  // ...
}
\`\`\`

---

## Pipes — Validation & Transformation
- Pipes validate and/or transform input data before it reaches the route handler
- Use the built-in \`ValidationPipe\` with class-validator for DTO validation
- Enable \`transform: true\` to auto-convert payloads to DTO class instances
- Enable \`whitelist: true\` to strip properties not in the DTO (prevents mass assignment)
- Enable \`forbidNonWhitelisted: true\` to reject requests with unknown properties
- Use built-in pipes: \`ParseIntPipe\`, \`ParseUUIDPipe\`, \`ParseBoolPipe\`, \`ParseEnumPipe\`, \`DefaultValuePipe\`
- Apply globally via \`app.useGlobalPipes()\` for consistent validation

### Correct — global validation pipe setup

\`\`\`typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // strip unknown properties
      forbidNonWhitelisted: true,   // reject unknown properties
      transform: true,              // auto-transform to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
\`\`\`

### Correct — DTO with class-validator decorators

\`\`\`typescript
// users/dto/create-user.dto.ts
export class CreateUserDto {
  @ApiProperty({ example: 'jane.doe@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly name: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  readonly role?: Role = Role.USER;
}
\`\`\`

### Anti-Pattern — no validation

\`\`\`typescript
@Post()
async create(@Body() body: any) {
  // Problem: no type safety, no validation, accepts anything
  return this.usersService.create(body);
}
\`\`\`

---

## Interceptors — Cross-Cutting Concerns
- Interceptors wrap the route handler execution (before + after)
- Use for: logging, caching, response transformation, timeout, performance metrics
- Implement \`NestInterceptor\` with \`intercept()\` method returning an \`Observable\`
- Use \`tap()\` for side effects (logging), \`map()\` for response transformation, \`catchError()\` for error handling
- Apply with \`@UseInterceptors()\` per-route, per-controller, or globally via \`APP_INTERCEPTOR\`

### Correct — response transformation interceptor

\`\`\`typescript
// common/interceptors/transform-response.interceptor.ts
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
\`\`\`

### Correct — logging interceptor with timing

\`\`\`typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - start;
        this.logger.log(\`\${method} \${url} — \${elapsed}ms\`);
      }),
    );
  }
}
\`\`\`

---

## Exception Filters — Consistent Error Handling
- Exception filters catch unhandled exceptions and format error responses
- Implement \`ExceptionFilter\` with \`catch()\` method
- Use \`@Catch()\` decorator to specify which exceptions to handle
- Apply globally for consistent error response shape across the API
- Use NestJS built-in exceptions for HTTP errors — extend \`HttpException\` for custom ones
- Log error details server-side, return sanitized messages to the client

### Correct — global exception filter

\`\`\`typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.extractError(exception);

    this.logger.error(
      \`\${request.method} \${request.url} — \${status}\`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private extractError(exception: unknown): { status: number; message: string } {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: exception.message,
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
\`\`\`
`,
      },
      {
        path: 'nestjs/naming.md',
        governance: 'recommended',
        description: 'NestJS naming and file conventions',
        content: `# NestJS Naming Conventions

## File Naming — kebab-case with type suffix
- Controllers: \`users.controller.ts\`
- Services: \`users.service.ts\`
- Modules: \`users.module.ts\`
- DTOs: \`create-user.dto.ts\`, \`update-user.dto.ts\`, \`user-response.dto.ts\`
- Entities: \`user.entity.ts\`
- Guards: \`jwt-auth.guard.ts\`, \`roles.guard.ts\`
- Pipes: \`parse-order-status.pipe.ts\`
- Interceptors: \`logging.interceptor.ts\`, \`cache.interceptor.ts\`
- Filters: \`all-exceptions.filter.ts\`, \`http-exception.filter.ts\`
- Decorators: \`current-user.decorator.ts\`, \`roles.decorator.ts\`
- Interfaces: \`payment-gateway.interface.ts\`
- Specs: \`users.service.spec.ts\`, \`users.controller.spec.ts\`

## Class Naming — PascalCase with type suffix
- Controllers: \`UsersController\`
- Services: \`UsersService\`
- Modules: \`UsersModule\`
- Guards: \`JwtAuthGuard\`, \`RolesGuard\`
- Pipes: \`ParseOrderStatusPipe\`
- Interceptors: \`LoggingInterceptor\`, \`CacheInterceptor\`
- Filters: \`AllExceptionsFilter\`, \`HttpExceptionFilter\`
- DTOs: \`CreateUserDto\`, \`UpdateUserDto\`, \`UserResponseDto\`
- Entities: \`User\`, \`Order\` (no suffix needed)

## Custom Decorators
- Use camelCase function names: \`@CurrentUser()\`, \`@Roles()\`, \`@Public()\`
- Place reusable decorators in \`common/decorators/\`
- Use \`createParamDecorator()\` for request parameter decorators
- Combine multiple decorators into a single \`applyDecorators()\` call when a pattern repeats

### Correct — custom parameter decorator

\`\`\`typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage:
@Get('me')
async getProfile(@CurrentUser() user: User) {
  return this.usersService.getProfile(user.id);
}
\`\`\`

## Directory Structure

\`\`\`
src/
  app.module.ts
  main.ts
  common/
    decorators/          # @CurrentUser(), @Roles(), @Public()
    filters/             # AllExceptionsFilter
    guards/              # JwtAuthGuard, RolesGuard
    interceptors/        # LoggingInterceptor, TransformInterceptor
    pipes/               # Custom pipes
    interfaces/          # Shared interfaces and tokens
    constants/           # Injection tokens, configuration keys
  config/
    config.module.ts     # ConfigModule.forRoot() setup
    database.config.ts   # TypeORM/Prisma config
    app.config.ts        # Validated app configuration
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    strategies/          # JwtStrategy, LocalStrategy
    guards/              # Auth-specific guards
    dto/
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    users.repository.ts
    entities/
      user.entity.ts
    dto/
      create-user.dto.ts
      update-user.dto.ts
      user-response.dto.ts
\`\`\`
`,
      },
      {
        path: 'nestjs/testing.md',
        governance: 'mandatory',
        description: 'NestJS testing patterns with @nestjs/testing and dependency injection',
        content: `# NestJS Testing Patterns

## Unit Testing with Test.createTestingModule()
- Use \`@nestjs/testing\` to create an isolated DI container for each test
- Override real providers with mocks using \`.overrideProvider()\`
- Get the service/controller under test from the compiled module
- Test services and controllers independently — mock all injected dependencies

### Correct — unit testing a service

\`\`\`typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('findOneOrFail', () => {
    it('should return user when found', async () => {
      const user = { id: 'uuid-1', email: 'test@example.com', name: 'Test' };
      repository.findById.mockResolvedValue(user as User);

      const result = await service.findOneOrFail('uuid-1');

      expect(result).toBeDefined();
      expect(repository.findById).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOneOrFail('non-existent'))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
\`\`\`

### Correct — unit testing a controller

\`\`\`typescript
describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findOneOrFail: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('should create a user and return 201', async () => {
    const dto: CreateUserDto = { email: 'new@test.com', name: 'New User' };
    const expected = { id: 'uuid-1', ...dto };
    service.create.mockResolvedValue(expected as UserResponseDto);

    const result = await controller.create(dto);

    expect(result).toEqual(expected);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
\`\`\`

---

## Testing Guards

\`\`\`typescript
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

  it('should allow when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext({ user: { roles: [] } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = createMockExecutionContext({ user: { roles: [Role.USER] } });

    expect(guard.canActivate(context)).toBe(false);
  });
});
\`\`\`

---

## E2E Testing with supertest

\`\`\`typescript
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersRepository)
      .useValue(mockUsersRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users — should create user with valid data', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('test@example.com');
      });
  });

  it('POST /users — should reject invalid email', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email: 'not-an-email', name: 'Test' })
      .expect(400);
  });
});
\`\`\`
`,
      },
      {
        path: 'nestjs/security.md',
        governance: 'mandatory',
        description: 'NestJS authentication, authorization, and security patterns',
        content: `# NestJS Security

## Authentication with Passport.js
- Use \`@nestjs/passport\` with strategy pattern for authentication
- Implement strategies: \`LocalStrategy\` (username/password), \`JwtStrategy\` (token-based)
- Use \`AuthGuard('jwt')\` for JWT-protected routes — register as global guard for secure-by-default
- Use the \`@Public()\` decorator to opt specific routes out of global auth
- Store JWT secrets in ConfigService — never hardcode tokens or secrets

### Correct — JWT strategy with ConfigService

\`\`\`typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
\`\`\`

---

## Authorization — Role-Based and Policy-Based
- Use guards for authorization — never check roles inside service methods
- Combine \`@Roles()\` decorator with \`RolesGuard\` for role-based access
- For complex authorization (resource ownership, conditional access), use CASL or a policy-based guard
- Always verify resource ownership — prevent IDOR (Insecure Direct Object Reference)

### Correct — resource ownership check

\`\`\`typescript
@Injectable()
export class OrderOwnershipGuard implements CanActivate {
  constructor(private readonly ordersService: OrdersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const orderId = request.params.id;

    const order = await this.ordersService.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId && !request.user.roles.includes(Role.ADMIN)) {
      throw new ForbiddenException('You can only access your own orders');
    }
    return true;
  }
}
\`\`\`

---

## Security Hardening
- Enable CORS with specific origins — never use wildcard (\`*\`) in production
- Use \`helmet\` for security headers (CSP, HSTS, X-Frame-Options)
- Apply rate limiting with \`@nestjs/throttler\` — protect login and sensitive endpoints
- Validate all input with \`ValidationPipe\` (whitelist + forbidNonWhitelisted) to prevent mass assignment
- Use \`class-transformer\` \`@Exclude()\` on sensitive entity fields (password, tokens) to prevent accidental serialization
- Set appropriate CSRF protection for cookie-based sessions
- Use \`csurf\` or custom double-submit cookie pattern for non-SPA clients

### Correct — security bootstrap

\`\`\`typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS with specific origins
  app.enableCors({
    origin: ['https://app.example.com'],
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Rate limiting is configured via ThrottlerModule in AppModule

  await app.listen(3000);
}
\`\`\`

### Correct — excluding sensitive fields from serialization

\`\`\`typescript
// users/entities/user.entity.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()  // never serialized to response
  password: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;
}
\`\`\`
`,
      },
      {
        path: 'nestjs/database-patterns.md',
        governance: 'recommended',
        description: 'NestJS database integration with TypeORM, Prisma, and Mongoose',
        content: `# NestJS Database Patterns

## TypeORM Integration
- Use \`TypeOrmModule.forRootAsync()\` with ConfigService for database configuration
- Use \`TypeOrmModule.forFeature([Entity])\` in feature modules to register entities
- Create custom repository classes that extend \`Repository<Entity>\` for complex queries
- Use \`@Transaction()\` decorator or \`QueryRunner\` for multi-step operations
- Always handle \`QueryFailedError\` — wrap with domain exceptions
- Use migrations for all schema changes — never rely on synchronize in production

### Correct — async TypeORM configuration

\`\`\`typescript
// config/database.config.ts
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
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
          command: `node -e "
const f = process.argv[1] || '';
if (!/\\.controller\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/Repository|getRepository|InjectRepository|PrismaService|\\bthis\\.prisma\\b/.test(c)) {
  console.log('Warning: Controller appears to access the database directly. Move data access to a service — controllers should only handle HTTP concerns.');
}
if (/@Body\\(\\)\\s+\\w+:\\s*any\\b/.test(c)) {
  console.log('Warning: @Body() parameter typed as any. Use a DTO class with class-validator decorators for input validation.');
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `node -e "
const f = process.argv[1] || '';
if (!/\\.service\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/@Req\\(\\)|@Res\\(\\)|Request|Response/.test(c) && /@Injectable/.test(c)) {
  console.log('Warning: Service appears to use HTTP Request/Response objects. Services should be framework-agnostic — handle HTTP concerns in controllers.');
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [{
          type: 'command' as const,
          command: `node -e "
const f = process.argv[1] || '';
if (!/\\.dto\\.ts$/.test(f)) process.exit(0);
const c = require('fs').readFileSync(f, 'utf8');
if (/export\\s+class\\s+\\w+Dto/.test(c) && !/@Is|@Min|@Max|@IsOptional|@ValidateNested|@Matches|@ArrayMinSize/.test(c)) {
  console.log('Warning: DTO class detected without class-validator decorators. Add validation decorators to ensure input safety.');
}
if (/export\\s+class\\s+\\w+Dto/.test(c) && !/@ApiProperty|@ApiPropertyOptional/.test(c)) {
  console.log('Warning: DTO class detected without @ApiProperty decorators. Add Swagger annotations for API documentation.');
}
" -- "$CLAUDE_FILE_PATH"`,
          timeout: 5,
        }],
      },
    ],
  },
};
