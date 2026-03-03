import type { Profile } from '../../../core/types.js';
import { PROFILE_LAYERS } from '../../../core/types.js';

export const angularProfile: Profile = {
  id: 'frameworks/angular',
  name: 'Angular',
  layer: PROFILE_LAYERS.FRAMEWORK,
  technologyIds: ['angular'],
  contributions: {
    claudeMd: [
      {
        heading: 'Angular Conventions',
        order: 20,
        content: `## Angular Conventions

Angular CLI structure. Standalone components preferred, RxJS for reactive patterns.

**Detailed rules:** see \`.claude/rules/angular/\` directory.

**Key rules:**
- Standalone components by default, lazy-loaded routes with \`loadComponent\`
- Smart (container) vs presentational (dumb) component separation
- Services for business logic, injected via constructor — single responsibility
- Unsubscribe from observables: use \`async\` pipe, \`takeUntilDestroyed\`, or \`DestroyRef\``,
      },
    ],
    settings: {
      permissions: {
        allow: [
          'Bash(npx ng:*)',
          'Bash(ng:*)',
          'Bash(npm run start:*)',
          'Bash(npm run build:*)',
          'Bash(npm run test:*)',
          'Bash(npm run lint:*)',
          'Bash(npm run e2e:*)',
        ],
      },
    },
    rules: [
      {
        path: 'angular/architecture.md',
        paths: ['**/*.ts', '**/*.html', '**/*.component.ts'],
        governance: 'mandatory',
        description: 'Angular component architecture, signals, DI, and routing patterns',
        content: `# Angular Architecture

## Standalone Components (Default)
- Every component, directive, and pipe must be standalone (\`standalone: true\` is the default since v19)
- Import only what each component needs directly in its \`imports\` array
- NgModules are only acceptable for wrapping third-party libraries that have not migrated

\`\`\`typescript
// Correct: standalone component with direct imports
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [DatePipe, RouterLink, UserAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @if (user()) {
      <app-user-avatar [src]="user()!.avatarUrl" />
      <h3>{{ user()!.name }}</h3>
      <time>{{ user()!.joinedAt | date:'mediumDate' }}</time>
      <a [routerLink]="['/users', user()!.id]">View profile</a>
    }
  \`,
})
export class UserCardComponent {
  user = input.required<User>();
}
\`\`\`

\`\`\`typescript
// Anti-pattern: NgModule wrapper for standalone-era code
@NgModule({
  declarations: [UserCardComponent],   // Problem: not standalone
  imports: [CommonModule, RouterModule], // Problem: importing entire modules
  exports: [UserCardComponent],
})
export class UserCardModule {}
\`\`\`

## Smart vs Presentational Components
- Smart (container) components: fetch data, call services, coordinate children, hold page-level state
- Presentational (dumb) components: receive data via signal inputs, emit events via outputs, zero side effects
- Presentational components MUST use \`ChangeDetectionStrategy.OnPush\`
- Smart components live in feature folders; presentational components live in \`shared/\` or feature \`ui/\`

\`\`\`typescript
// Smart component — orchestrates data and delegates rendering
@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [OrderListComponent, OrderFiltersComponent],
  template: \`
    <app-order-filters (filterChange)="onFilterChange($event)" />
    @if (orders.isLoading()) {
      <p>Loading orders...</p>
    } @else {
      <app-order-list [orders]="orders.value()" />
    }
  \`,
})
export class OrderPageComponent {
  private readonly orderService = inject(OrderService);
  filter = signal<OrderFilter>({ status: 'all' });
  orders = resource({
    request: this.filter,
    loader: ({ request: filter }) => this.orderService.getOrders(filter),
  });

  onFilterChange(filter: OrderFilter): void {
    this.filter.set(filter);
  }
}
\`\`\`

\`\`\`typescript
// Presentational component — pure rendering, no injected services
@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <ul>
      @for (order of orders(); track order.id) {
        <li>
          {{ order.description }} — {{ order.total | currency }}
          <time>{{ order.createdAt | date:'short' }}</time>
        </li>
      } @empty {
        <li>No orders found.</li>
      }
    </ul>
  \`,
})
export class OrderListComponent {
  orders = input.required<Order[]>();
}
\`\`\`

## Signals — Reactive State Management
- Use \`signal()\` for mutable local state
- Use \`computed()\` for derived read-only state — Angular tracks dependencies automatically
- Use \`linkedSignal()\` when a signal must reset when a source signal changes
- Use \`effect()\` only for side effects that cannot be expressed as computed values (logging, analytics, localStorage sync)
- Use \`resource()\` to bind async data fetching to signal-based request parameters
- Use \`input()\` / \`input.required()\` for component signal inputs
- Use \`output()\` for component event emitters with signal semantics
- Use \`model()\` for two-way bindable signal properties
- Avoid calling \`signal.set()\` inside \`computed()\` — it causes infinite loops

\`\`\`typescript
// Correct: signals for component state
export class ProductFilterComponent {
  searchTerm = signal('');
  category = signal<string | null>(null);
  sortBy = signal<'price' | 'name'>('name');

  // Derived state — automatically recalculates
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.searchTerm()) count++;
    if (this.category()) count++;
    return count;
  });

  // linkedSignal: resets page to 1 when category changes
  currentPage = linkedSignal({
    source: this.category,
    computation: () => 1,
  });
}
\`\`\`

\`\`\`typescript
// Anti-pattern: using effect() for derived state
effect(() => {
  // Problem: this should be a computed(), not an effect with manual set()
  this.fullName.set(this.firstName() + ' ' + this.lastName());
});
\`\`\`

## Signals vs RxJS Decision Guide
| Use Case | Choose |
|----------|--------|
| Component local state | \`signal()\` |
| Derived / computed state | \`computed()\` |
| Async data fetching tied to inputs | \`resource()\` |
| HTTP request-response | \`HttpClient\` (returns Observable) — \`toSignal()\` to bridge |
| WebSocket / SSE / real-time stream | RxJS Observable |
| Complex async coordination (debounce, race, retry) | RxJS operators |
| Cross-component shared state | Signal-based service |
| Form state | Reactive Forms (still Observable-based) |

## Dependency Injection
- Use \`inject()\` function inside injection context (constructor, field initializer) — preferred over constructor params
- Register services with \`providedIn: 'root'\` for app-wide singletons
- Use \`InjectionToken<T>\` for non-class dependencies (config objects, API URLs)
- Use \`provideX()\` functions in \`app.config.ts\` — avoid \`NgModule.forRoot()\` patterns
- Use environment injectors (\`EnvironmentInjector\`) for dynamic component creation

\`\`\`typescript
// Correct: inject() function in field initializer
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly router = inject(Router);
}
\`\`\`

\`\`\`typescript
// Anti-pattern: constructor injection (verbose, harder to refactor)
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly http: HttpClient,   // Problem: verbose, positional
    private readonly config: AppConfig,
    private readonly router: Router,
  ) {}
}
\`\`\`

## Template Syntax — New Control Flow
- Use \`@if\` / \`@else\` instead of \`*ngIf\`
- Use \`@for\` with \`track\` expression instead of \`*ngFor\` — track is mandatory
- Use \`@switch\` / \`@case\` / \`@default\` instead of \`[ngSwitch]\`
- Use \`@defer\` / \`@loading\` / \`@placeholder\` / \`@error\` for lazy template sections
- Use \`@empty\` block inside \`@for\` for empty-collection rendering
- Never call component methods in templates — use \`computed()\` signals or pipes instead

\`\`\`typescript
// Correct: @defer for lazy-loading heavy content
@Component({
  template: \`
    <h1>Dashboard</h1>
    <app-summary-cards [data]="summaryData()" />

    @defer (on viewport) {
      <app-analytics-chart [data]="chartData()" />
    } @loading (minimum 300ms) {
      <div class="skeleton-chart"></div>
    } @placeholder {
      <p>Scroll down to load analytics</p>
    }
  \`,
})
export class DashboardComponent { /* ... */ }
\`\`\`

## Routing
- Configure routes in \`app.routes.ts\` — use \`provideRouter(routes)\` in \`app.config.ts\`
- Lazy-load feature routes with \`loadComponent\` (single component) or \`loadChildren\` (route group)
- Use functional route guards: \`canActivate\`, \`canDeactivate\`, \`canMatch\`, \`resolve\`
- Use route resolvers to prefetch data before navigation completes
- Use query params for optional/filterable state; path params for resource identity

\`\`\`typescript
// Correct: functional guards and lazy-loaded routes
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component') },
  {
    path: 'admin',
    canActivate: [() => inject(AuthService).isAdmin()],
    loadChildren: () => import('./admin/admin.routes'),
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./orders/order-detail.component'),
    resolve: { order: (route: ActivatedRouteSnapshot) => inject(OrderService).getById(route.params['id']) },
  },
];
\`\`\`

## Forms
- Use reactive forms (\`FormGroup\`, \`FormControl\`, \`FormArray\`) for any form with validation
- Define form shape with typed \`FormGroup\` — use \`NonNullableFormBuilder\` for strict typing
- Display validation errors only after the user interacts with the control (\`touched\` or \`dirty\`)
- Use custom validator functions for domain rules; compose with \`Validators.compose()\`
- Use template-driven forms (\`ngModel\`) only for trivial one-input cases

\`\`\`typescript
// Correct: typed reactive form with NonNullableFormBuilder
export class CreateUserFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['viewer' as UserRole, Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue(); // fully typed
    // ...
  }
}
\`\`\`

## HttpClient Patterns
- Use \`provideHttpClient(withInterceptors([...]))\` in \`app.config.ts\`
- Write functional interceptors (not class-based) — use \`HttpInterceptorFn\`
- Bridge observables to signals with \`toSignal()\` or use \`resource()\`
- Centralize error handling in a global HTTP interceptor
- Use \`withFetch()\` for \`fetch\`-based backend in SSR/Node environments

\`\`\`typescript
// Correct: functional interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).accessToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } });
  }
  return next(req);
};
\`\`\`
`,
      },
      {
        path: 'angular/naming.md',
        paths: ['**/*.ts', '**/*.html', '**/*.component.ts'],
        governance: 'recommended',
        description: 'Angular naming, file organization, and project structure conventions',
        content: `# Angular Naming & Project Structure

## File Naming (kebab-case + type suffix)
| Artifact | File Pattern | Example |
|----------|-------------|---------|
| Component | \`*.component.ts\` | \`user-profile.component.ts\` |
| Service | \`*.service.ts\` | \`auth.service.ts\` |
| Guard (functional) | \`*.guard.ts\` | \`admin.guard.ts\` |
| Pipe | \`*.pipe.ts\` | \`truncate.pipe.ts\` |
| Directive | \`*.directive.ts\` | \`tooltip.directive.ts\` |
| Interceptor (functional) | \`*.interceptor.ts\` | \`auth.interceptor.ts\` |
| Resolver (functional) | \`*.resolver.ts\` | \`order-detail.resolver.ts\` |
| Model / Interface | \`*.model.ts\` | \`user.model.ts\` |
| Routes file | \`*.routes.ts\` | \`admin.routes.ts\` |
| Config | \`app.config.ts\` | \`app.config.ts\` |
| Test | \`*.spec.ts\` | \`auth.service.spec.ts\` |

## Class / Symbol Naming
| Artifact | Convention | Example |
|----------|-----------|---------|
| Component | PascalCase + Component | \`UserProfileComponent\` |
| Service | PascalCase + Service | \`AuthService\` |
| Pipe | PascalCase + Pipe | \`TruncatePipe\` |
| Directive | PascalCase + Directive | \`TooltipDirective\` |
| Guard fn | camelCase + Guard | \`adminGuard\` |
| Interceptor fn | camelCase + Interceptor | \`authInterceptor\` |
| Injection Token | UPPER_SNAKE_CASE | \`APP_CONFIG\`, \`API_BASE_URL\` |

## Selector Naming
- Component selectors: kebab-case with project prefix — \`app-user-profile\`
- Directive selectors: camelCase with project prefix — \`appTooltip\`
- Define the selector prefix in \`angular.json\` → \`prefix\` to enforce via linting

## Project Organization (Feature-First)
\`\`\`
src/app/
  core/              # App-wide singletons: auth, config, error handling
    auth.service.ts
    auth.interceptor.ts
    error-handler.service.ts
    app.config.ts
  shared/            # Reusable presentational components, pipes, directives
    ui/
      button/button.component.ts
      card/card.component.ts
    pipes/
      truncate.pipe.ts
    directives/
      tooltip.directive.ts
  features/
    users/
      user-list.component.ts
      user-detail.component.ts
      user.service.ts
      user.model.ts
      users.routes.ts
    orders/
      order-page.component.ts
      order-list.component.ts
      order.service.ts
      order.model.ts
      orders.routes.ts
  app.component.ts
  app.config.ts
  app.routes.ts
\`\`\`

## Key Style Guide Rules
- One artifact per file — never define two components in the same file
- Colocate component template and styles inline for small components (<20 template lines)
- Extract template to a separate \`.html\` file when it exceeds 20 lines
- Colocate unit tests next to the source: \`user.service.ts\` / \`user.service.spec.ts\`
- Put shared models/interfaces in a \`models/\` directory or next to the feature that owns them
`,
      },
      {
        path: 'angular/performance.md',
        paths: ['**/*.ts', '**/*.html', '**/*.component.ts'],
        governance: 'recommended',
        description: 'Angular performance best practices and optimization patterns',
        content: `# Angular Performance

## Change Detection
- Use \`ChangeDetectionStrategy.OnPush\` on all components — this is non-negotiable for scalable apps
- With OnPush, change detection only runs when: signal values change, input references change, an event handler fires, or \`markForCheck()\` is called
- Avoid calling functions in templates — use \`computed()\` signals or pipes instead
- Never mutate arrays or objects in place — always create new references

\`\`\`typescript
// Correct: OnPush + signal-based rendering
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<p>Total: {{ totalPrice() | currency }}</p>\`,
})
export class CartSummaryComponent {
  items = input.required<CartItem[]>();
  totalPrice = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
}
\`\`\`

\`\`\`typescript
// Anti-pattern: method call in template triggers on every CD cycle
@Component({
  template: \`<p>Total: {{ getTotalPrice() | currency }}</p>\`,
})
export class CartSummaryComponent {
  getTotalPrice(): number {  // Problem: called on EVERY change detection cycle
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
\`\`\`

## @defer — Lazy Template Sections
- Use \`@defer (on viewport)\` for below-the-fold content
- Use \`@defer (on interaction)\` for content triggered by user action
- Use \`@defer (on idle)\` for low-priority content loaded when the browser is idle
- Use \`@defer (when condition)\` for conditional lazy sections
- Combine with \`@loading\`, \`@placeholder\`, and \`@error\` for graceful UX

## @for — Track Expression
- Always provide a \`track\` expression in \`@for\` — Angular enforces this
- Track by a unique, stable identifier (usually the entity \`id\`)
- Never track by \`$index\` for dynamic lists where items can be reordered or filtered

\`\`\`typescript
// Correct: track by stable identifier
@for (user of users(); track user.id) {
  <app-user-card [user]="user" />
}

// Anti-pattern: track by index for dynamic list
@for (user of users(); track $index) {  // Problem: breaks when list is reordered
  <app-user-card [user]="user" />
}
\`\`\`

## Bundle Optimization
- Lazy-load feature routes with \`loadComponent\` / \`loadChildren\`
- Use \`@defer\` to split template-heavy components from the main bundle
- Use \`provideRouter(routes, withPreloading(PreloadAllModules))\` for eager background loading of lazy routes
- Audit bundle size with \`ng build --stats-json\` + webpack-bundle-analyzer or esbuild analysis
- Tree-shake unused library code by importing only what you need (e.g., \`import { map } from 'rxjs'\`)

## Runtime Performance
- Use \`trackBy\` in \`@for\` to minimize DOM operations
- Avoid complex template expressions — precompute in \`computed()\`
- Use \`OnPush\` + signals to skip unnecessary change detection subtrees
- Use virtual scrolling (\`@angular/cdk/scrolling\`) for long lists (100+ items)
- Debounce rapid user input (search fields) before triggering data fetches
- Use \`NgOptimizedImage\` directive for image loading with lazy/priority hints
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        skills: ['angular-component-generator', 'angular-service-generator'],
        prompt: `## Angular-Specific Review
- Verify all components are standalone — flag any lingering NgModule declarations
- Check that every component uses \`ChangeDetectionStrategy.OnPush\`
- Verify signal-first approach: \`input()\` / \`input.required()\` over \`@Input()\`, \`output()\` over \`@Output()\`
- Check for \`signal()\` / \`computed()\` usage — flag unnecessary \`effect()\` calls that should be \`computed()\`
- Verify new control flow: \`@if\`, \`@for\` (with \`track\`), \`@switch\` — flag legacy \`*ngIf\`, \`*ngFor\`, \`[ngSwitch]\`
- Verify \`@for\` loops use \`track\` by a stable unique id — flag \`track $index\` on dynamic lists
- Check for method calls in templates — must use \`computed()\` or pipes instead
- Verify dependency injection uses \`inject()\` function — flag constructor injection in new code
- Verify services use \`providedIn: 'root'\` or feature-level providers — no unnecessary NgModule providers arrays
- Verify functional guards and interceptors — flag class-based guards/interceptors in new code
- Check RxJS observables are properly unsubscribed: \`takeUntilDestroyed()\`, \`toSignal()\`, or \`async\` pipe
- Verify smart/presentational component separation — presentational components must not inject services
- Check reactive forms use \`NonNullableFormBuilder\` for strict typing
- Verify lazy loading is applied to feature routes via \`loadComponent\` / \`loadChildren\`
- Check \`@defer\` usage for heavy below-the-fold content`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        skills: ['angular-component-generator', 'angular-service-generator'],
        prompt: `## Angular Testing
- Use \`TestBed.configureTestingModule()\` with minimal providers — only what the test needs
- Test standalone components by importing them directly in \`TestBed\` imports
- Use \`ComponentFixture\` for component tests: create, detect changes, query DOM, assert
- Test signal-based components: set signal input values, call \`fixture.detectChanges()\`, assert rendered output
- Test \`computed()\` signals by setting source signals and reading the computed value
- Use \`ComponentHarness\` from \`@angular/cdk/testing\` for Angular Material components
- Mock services with \`jasmine.createSpyObj()\` or provide mock implementations via \`TestBed.overrideProvider()\`
- Test services independently by providing them through \`TestBed.inject()\`
- Test functional guards by calling them directly with mocked \`ActivatedRouteSnapshot\` and \`RouterStateSnapshot\`
- Test functional interceptors by calling them with mock \`HttpRequest\` and a spy \`next\` handler
- Test pipes by instantiating and calling their \`transform()\` method — no TestBed needed
- Test reactive forms: set values with \`patchValue()\` / \`setValue()\`, trigger validation, verify error state and \`valid\`/\`invalid\`
- Test \`resource()\` by setting the request signal, awaiting the loader, and asserting the value signal
- Use \`HttpClientTestingModule\` / \`provideHttpClientTesting()\` to mock HTTP calls — never make real network requests in unit tests
- Use \`fakeAsync()\` / \`tick()\` for testing time-dependent logic (debounce, setTimeout, interval)`,
      },
    ],
    skills: [
      {
        name: 'angular-component-generator',
        description: 'Generate Angular standalone components following modern signal-based patterns',
        content: `# Angular Component Generator

Generate Angular standalone components following modern best practices:

## Output Files
1. **Component file** (\`*.component.ts\`): standalone, OnPush, signal inputs/outputs, inline or external template
2. **Styles file** (\`*.component.scss\`): scoped SCSS with BEM or utility classes
3. **Test file** (\`*.component.spec.ts\`): TestBed-based tests covering rendering, inputs, outputs, user interactions

## Component Checklist
- \`standalone: true\` (default in v19+)
- \`changeDetection: ChangeDetectionStrategy.OnPush\`
- Signal inputs via \`input()\` / \`input.required()\`
- Signal outputs via \`output()\`
- \`model()\` for two-way binding properties
- Local state via \`signal()\`, derived state via \`computed()\`
- New control flow: \`@if\`, \`@for\` (with \`track\`), \`@switch\`
- Inject dependencies with \`inject()\` function
- Selector with project prefix (\`app-\`)
- No method calls in template — use computed() or pipes

## Smart Component Additions
- Inject services with \`inject()\`
- Use \`resource()\` for async data loading bound to signal parameters
- Use \`linkedSignal()\` for state that resets on source changes
- Lazy-load child routes with \`loadComponent\` / \`loadChildren\`

## Test Checklist
- Test rendering with default and provided inputs
- Test user interactions (click, input) and verify output emissions
- Test conditional rendering (\`@if\` / \`@for\` blocks)
- Test computed signal values
- Mock injected services
`,
      },
      {
        name: 'angular-service-generator',
        description: 'Generate Angular injectable services with signal-based state and HttpClient',
        content: `# Angular Service Generator

Generate Angular injectable services following modern patterns:

## Output Files
1. **Service file** (\`*.service.ts\`): \`@Injectable({ providedIn: 'root' })\`, signal-based state, HttpClient calls
2. **Model file** (\`*.model.ts\`): TypeScript interfaces for domain entities and DTOs
3. **Test file** (\`*.service.spec.ts\`): TestBed tests with HttpClientTestingModule

## Service Checklist
- \`@Injectable({ providedIn: 'root' })\` for singleton services
- Dependencies injected via \`inject()\` function
- Expose state as readonly signals: \`items = this._items.asReadonly()\`
- Use \`computed()\` for derived state
- HTTP methods return \`Observable<T>\` — consumers bridge to signals with \`toSignal()\` or \`resource()\`
- Error handling: catch HTTP errors, throw typed domain errors
- No mutable public state — all mutations through methods

## Test Checklist
- Provide \`provideHttpClientTesting()\` in TestBed
- Use \`HttpTestingController\` to mock and flush requests
- Test success and error paths for each HTTP method
- Verify signal state after method calls
`,
      },
    ],
    hooks: [
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.ts\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/\\*ngIf/.test(c))issues.push(\'Use @if instead of *ngIf\');if(/\\*ngFor/.test(c))issues.push(\'Use @for instead of *ngFor\');if(/\\[ngSwitch\\]/.test(c))issues.push(\'Use @switch instead of [ngSwitch]\');if(/@Input\\(\\)/.test(c)&&!c.includes(\'@deprecated\'))issues.push(\'Use input()/input.required() signal inputs instead of @Input()\');if(/@Output\\(\\)/.test(c)&&!c.includes(\'@deprecated\'))issues.push(\'Use output() signal outputs instead of @Output()\');if(issues.length)console.log(\'Warning: \'+issues.join(\'; \'))" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
      {
        event: 'PostToolUse' as const,
        matcher: 'Write',
        hooks: [
          {
            type: 'command' as const,
            command:
              'node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.component.ts\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/@Component/.test(c)&&!/ChangeDetectionStrategy\\.OnPush/.test(c)&&!/changeDetection/.test(c))console.log(\'Warning: Component missing ChangeDetectionStrategy.OnPush — add it for optimal performance\')" -- "$CLAUDE_FILE_PATH"',
            timeout: 5,
          },
        ],
      },
    ],
    externalTools: [
      {
        type: 'eslint',
        filePath: '.eslintrc.json',
        config: {
          _comment:
            'Recommended Angular ESLint rules — merge with existing config or use as reference',
          overrides: [
            {
              files: ['*.ts'],
              extends: [
                'plugin:@angular-eslint/recommended',
                'plugin:@angular-eslint/template/process-inline-templates',
              ],
              rules: {
                '@angular-eslint/prefer-standalone': 'error',
                '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
                '@angular-eslint/component-selector': [
                  'error',
                  { type: 'element', prefix: 'app', style: 'kebab-case' },
                ],
                '@angular-eslint/directive-selector': [
                  'error',
                  { type: 'attribute', prefix: 'app', style: 'camelCase' },
                ],
                '@angular-eslint/no-empty-lifecycle-method': 'error',
                '@angular-eslint/use-lifecycle-interface': 'error',
              },
            },
            {
              files: ['*.html'],
              extends: ['plugin:@angular-eslint/template/recommended'],
              rules: {
                '@angular-eslint/template/prefer-control-flow': 'error',
                '@angular-eslint/template/prefer-self-closing-tags': 'warn',
              },
            },
          ],
        },
        mergeStrategy: 'create-only',
      },
    ],
  },
};
