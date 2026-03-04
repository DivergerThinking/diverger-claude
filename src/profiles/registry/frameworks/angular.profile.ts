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
- Every component, directive, and pipe must be standalone (default since v19)
- Import only what each component needs in its \`imports\` array
- NgModules only for wrapping third-party libraries that have not migrated

## Smart vs Presentational Components
- Smart (container): fetch data, call services, coordinate children, hold page-level state
- Presentational (dumb): signal inputs, emit outputs, zero side effects, \`OnPush\` mandatory
- Smart in feature folders; presentational in \`shared/\` or feature \`ui/\`

## Signals — Reactive State Management
- \`signal()\` for mutable local state
- \`computed()\` for derived read-only state — auto-tracked dependencies
- \`linkedSignal()\` when a signal must reset when a source changes
- \`effect()\` ONLY for side effects (logging, analytics, localStorage) — never to derive state
- \`resource()\` to bind async data fetching to signal-based request parameters
- \`input()\` / \`input.required()\` for signal inputs; \`output()\` for events; \`model()\` for two-way binding
- Never call \`signal.set()\` inside \`computed()\` — causes infinite loops

## Signals vs RxJS
- Component state / derived state / async data: signals (\`signal\`, \`computed\`, \`resource\`)
- HTTP request-response: \`HttpClient\` Observable -> bridge with \`toSignal()\`
- WebSocket / SSE / real-time: RxJS Observable
- Complex async (debounce, race, retry): RxJS operators
- Form state: Reactive Forms (Observable-based)

## Dependency Injection
- Use \`inject()\` function (not constructor params) inside injection context
- \`providedIn: 'root'\` for app-wide singletons
- \`InjectionToken<T>\` for non-class deps; \`provideX()\` in \`app.config.ts\`

## Template Syntax — New Control Flow
- \`@if\` / \`@else\` (not \`*ngIf\`), \`@for\` with \`track\` (not \`*ngFor\`), \`@switch\` (not \`[ngSwitch]\`)
- \`@defer\` / \`@loading\` / \`@placeholder\` / \`@error\` for lazy template sections
- \`@empty\` inside \`@for\` for empty-collection rendering
- Never call methods in templates — use \`computed()\` or pipes

## Routing
- Routes in \`app.routes.ts\`, \`provideRouter(routes)\` in \`app.config.ts\`
- Lazy-load: \`loadComponent\` (single) or \`loadChildren\` (route group)
- Functional guards: \`canActivate\`, \`canDeactivate\`, \`canMatch\`, \`resolve\`
- Query params for filterable state; path params for resource identity

## Forms
- Reactive forms (\`FormGroup\`, \`FormControl\`) for any form with validation
- \`NonNullableFormBuilder\` for strict typing
- Show errors only after \`touched\` or \`dirty\`
- Template-driven forms (\`ngModel\`) only for trivial one-input cases

## HttpClient
- \`provideHttpClient(withInterceptors([...]))\` in \`app.config.ts\`
- Functional interceptors (\`HttpInterceptorFn\`), not class-based
- Bridge to signals with \`toSignal()\` or \`resource()\`
- Global HTTP interceptor for centralized error handling
`,
      },
      {
        path: 'angular/naming.md',
        paths: ['**/*.ts', '**/*.html', '**/*.component.ts'],
        governance: 'recommended',
        description: 'Angular naming, file organization, and project structure conventions',
        content: `# Angular Naming & Project Structure

## File Naming (kebab-case + type suffix)
- Components: \`*.component.ts\`, Services: \`*.service.ts\`, Guards: \`*.guard.ts\`
- Pipes: \`*.pipe.ts\`, Directives: \`*.directive.ts\`, Interceptors: \`*.interceptor.ts\`
- Models: \`*.model.ts\`, Routes: \`*.routes.ts\`, Tests: \`*.spec.ts\`

## Class Naming (PascalCase + type suffix)
- Components: \`UserProfileComponent\`, Services: \`AuthService\`, Pipes: \`TruncatePipe\`
- Functional guards/interceptors: camelCase (\`adminGuard\`, \`authInterceptor\`)
- Injection tokens: UPPER_SNAKE_CASE (\`APP_CONFIG\`, \`API_BASE_URL\`)

## Selector Naming
- Component selectors: kebab-case with project prefix (\`app-user-profile\`)
- Directive selectors: camelCase with project prefix (\`appTooltip\`)

## Project Organization (Feature-First)
- \`core/\` — app-wide singletons (auth, config, error handling)
- \`shared/\` — reusable presentational components, pipes, directives
- \`features/\` — feature modules with routes, components, services, models
- Colocate tests: \`user.service.ts\` / \`user.service.spec.ts\`

## Key Style Guide Rules
- One artifact per file
- Inline template/styles for small components (<20 lines), extract for larger
- Colocate unit tests next to the source
`,
      },
      {
        path: 'angular/performance.md',
        paths: ['**/*.ts', '**/*.html', '**/*.component.ts'],
        governance: 'recommended',
        description: 'Angular performance best practices and optimization patterns',
        content: `# Angular Performance

## Change Detection
- \`ChangeDetectionStrategy.OnPush\` on ALL components — non-negotiable
- OnPush triggers: signal value changes, input reference changes, event handlers, \`markForCheck()\`
- Never call methods in templates — use \`computed()\` signals or pipes
- Never mutate arrays/objects in place — always create new references

## @defer — Lazy Template Sections
- \`@defer (on viewport)\` for below-the-fold content
- \`@defer (on interaction)\` for user-triggered content
- \`@defer (on idle)\` for low-priority content
- Combine with \`@loading\`, \`@placeholder\`, \`@error\` for graceful UX

## @for — Track Expression
- Always \`track\` by a unique, stable identifier (entity \`id\`)
- Never track by \`$index\` for dynamic lists that can be reordered or filtered

## Bundle Optimization
- Lazy-load feature routes with \`loadComponent\` / \`loadChildren\`
- Use \`@defer\` to split template-heavy components from the main bundle
- Audit bundle size: \`ng build --stats-json\` + analyzer
- Tree-shake: import only what you need from libraries

## Runtime Performance
- \`OnPush\` + signals to skip unnecessary change detection subtrees
- Virtual scrolling (\`@angular/cdk/scrolling\`) for long lists (100+ items)
- Debounce rapid user input before triggering data fetches
- \`NgOptimizedImage\` for image loading with lazy/priority hints
`,
      },
      {
        path: 'angular/security.md',
        paths: ['**/*.ts', '**/*.html'],
        governance: 'recommended',
        description: 'Angular security: sanitization, CSRF, CSP, and template injection prevention',
        content: `# Angular Security

## DomSanitizer — Safe HTML, URLs, and Resources
- Angular auto-sanitizes interpolated values in templates — do NOT bypass without justification
- Use \`DomSanitizer.bypassSecurityTrustHtml()\` ONLY for trusted, server-controlled content
- Use \`DomSanitizer.bypassSecurityTrustResourceUrl()\` ONLY for known-safe iframe/embed sources
- Never pass user input directly to \`bypassSecurityTrust*()\` methods — this disables XSS protection
- Prefer \`SafeHtml\`, \`SafeUrl\`, \`SafeResourceUrl\` types to document intent
- For dynamic HTML from CMS/API: sanitize server-side AND use \`DomSanitizer.sanitize(SecurityContext.HTML, value)\`

## CSRF Protection with HttpClient
- Angular HttpClient automatically sends XSRF tokens via \`HttpXsrfInterceptor\` (enabled by default with \`provideHttpClient(withXsrfConfiguration(...))\`)
- Backend must set the XSRF cookie (\`XSRF-TOKEN\` by default) on GET responses
- HttpClient reads the cookie and sends it as a header (\`X-XSRF-TOKEN\` by default)
- Customize cookie/header names via \`withXsrfConfiguration({ cookieName: '...', headerName: '...' })\`
- Ensure \`withXsrfConfiguration()\` is included in \`provideHttpClient()\` for session-based auth
- For JWT/bearer-token APIs: CSRF tokens are less critical but CSP headers are still mandatory

## Content Security Policy (CSP)
- Set CSP headers server-side — Angular apps should work with strict CSP
- Avoid \`'unsafe-inline'\` for scripts — Angular AOT compilation does not require inline scripts
- Avoid \`'unsafe-eval'\` — Angular AOT does not use \`eval()\`
- Use nonce-based CSP for any inline styles Angular injects: \`style-src 'nonce-<random>'\`
- Configure CSP via meta tag during development, HTTP header in production
- Test CSP with \`Content-Security-Policy-Report-Only\` header before enforcing

## Template Injection Prevention
- Never construct templates dynamically from user input — Angular compiles templates at build time (AOT)
- Never use \`innerHTML\` binding with unsanitized user content: \`[innerHTML]="userContent"\` is auto-sanitized, but verify no bypass
- Never disable Angular's built-in sanitization without security review
- Avoid \`ElementRef.nativeElement.innerHTML\` — use Renderer2 or template bindings instead
- Avoid \`document.createElement\` / \`document.write\` — use Angular's template engine
- Never use \`eval()\`, \`new Function()\`, or \`setTimeout(string)\` with user-controlled input

## Additional Security Practices
- Use \`HttpInterceptorFn\` to attach authorization headers — never hardcode tokens in services
- Validate and sanitize all route parameters before use in API calls
- Use Angular's built-in \`HttpParams\` to construct query strings — prevents parameter injection
- Keep Angular and all dependencies updated — security patches are released regularly
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
      {
        name: 'security-checker',
        type: 'enrich',
        prompt: `## Angular Security Review

### Sanitization & XSS
- Verify no calls to \`bypassSecurityTrustHtml()\`, \`bypassSecurityTrustUrl()\`, \`bypassSecurityTrustResourceUrl()\` with user-controlled input
- Check that \`[innerHTML]\` bindings do not receive unsanitized user content — Angular auto-sanitizes but verify no bypass chain
- Flag any direct \`ElementRef.nativeElement.innerHTML\` assignment — must use Renderer2 or template bindings
- Flag any usage of \`eval()\`, \`new Function()\`, or \`setTimeout(string)\` with dynamic input
- Verify \`DomSanitizer.sanitize(SecurityContext.HTML, ...)\` is used for CMS/API HTML content

### CSRF & HTTP Security
- Verify \`provideHttpClient(withXsrfConfiguration(...))\` is configured for session-based auth
- Check that authorization headers are set via \`HttpInterceptorFn\` — never hardcoded in individual service calls
- Verify no sensitive tokens or API keys are stored in localStorage — use httpOnly cookies or in-memory storage
- Flag any HTTP calls that do not go through Angular's \`HttpClient\` (raw fetch/XMLHttpRequest bypasses interceptors)

### Content Security Policy
- Check for \`'unsafe-inline'\` or \`'unsafe-eval'\` in CSP configuration — Angular AOT does not require either
- Verify nonce-based CSP is configured if server renders inline styles
- Flag any dynamic script creation (\`document.createElement('script')\`)

### Template & Routing Security
- Verify route guards (\`canActivate\`, \`canMatch\`) protect sensitive routes — flag unguarded admin/settings routes
- Check that route parameters are validated before use in API calls or DOM operations
- Verify \`HttpParams\` is used for query string construction — flag manual string concatenation
- Flag any dynamic template construction from user input`,
      },
    ],
    skills: [
      {
        name: 'angular-signals-guide',
        description: 'Detailed reference for Angular Signals (Angular 16+): signal(), computed(), effect(), input signals, model signals, SignalStore, and RxJS interop',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Angular Signals — Detailed Reference

## signal() — Writable Reactive State
Create a mutable reactive primitive. Read by calling the signal as a function.

### Correct
\\\`\\\`\\\`typescript
import { signal } from '@angular/core';

// Typed writable signal with initial value
const count = signal(0);

// Read the value — call as a function
console.log(count()); // 0

// Write — set() replaces, update() transforms
count.set(5);
count.update(prev => prev + 1); // 6
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Do NOT read with .value — signals are functions
const val = count.value; // undefined — not how Angular signals work

// WRONG: Do NOT use signals for values that never change
const API_URL = signal('https://api.example.com'); // Use a const instead
\\\`\\\`\\\`

## computed() — Derived Read-Only State
Derives a value from one or more signals. Auto-tracks dependencies, memoized.

### Correct
\\\`\\\`\\\`typescript
import { signal, computed } from '@angular/core';

const price = signal(100);
const quantity = signal(3);
const total = computed(() => price() * quantity()); // auto-tracks price & quantity

// Reads are lazy and cached — only recomputes when dependencies change
console.log(total()); // 300
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Never call signal.set() inside computed() — causes infinite loops
const doubled = computed(() => {
  count.set(count() * 2); // ERROR: writing to signals in computed is forbidden
  return count();
});

// WRONG: Do NOT use computed() for side effects — use effect() instead
const logger = computed(() => {
  console.log('Price changed:', price()); // side effect in computed
  return price();
});
\\\`\\\`\\\`

## effect() — Side Effects
Runs a callback whenever any signal it reads changes. ONLY for side effects.

### Correct
\\\`\\\`\\\`typescript
import { signal, effect, DestroyRef, inject } from '@angular/core';

const theme = signal<'light' | 'dark'>('light');

// Logging, localStorage, analytics — legitimate side effects
effect(() => {
  localStorage.setItem('theme', theme());
});

// In a component/service: effect auto-cleans up on destroy
@Component({ ... })
export class SettingsComponent {
  private theme = signal<'light' | 'dark'>('light');

  constructor() {
    effect(() => {
      document.body.classList.toggle('dark', this.theme() === 'dark');
    });
  }
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Deriving state inside effect — use computed() instead
effect(() => {
  this.fullName.set(this.firstName() + ' ' + this.lastName());
});

// WRONG: Fetching data inside effect without cleanup — use resource() instead
effect(() => {
  fetch(\\\\\`/api/users/\\\${this.userId()}\\\\\`).then(r => r.json()).then(u => this.user.set(u));
});
\\\`\\\`\\\`

## Signal Inputs, Model Signals, viewChild/viewChildren
Angular 17.1+ signal-based component API.

### Correct
\\\`\\\`\\\`typescript
import { Component, input, output, model, viewChild, viewChildren, ElementRef } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \\\\\`
    @if (user(); as u) {
      <h3 #heading>{{ u.name }}</h3>
      <button (click)="onSelect.emit(u.id)">Select</button>
    }
  \\\\\`,
})
export class UserCardComponent {
  // Signal inputs — read-only, auto-tracked
  readonly user = input.required<User>();
  readonly highlighted = input(false);           // optional with default

  // Signal output
  readonly onSelect = output<string>();

  // Two-way binding signal (parent uses [(model)]="value")
  readonly expanded = model(false);

  // Signal-based view queries
  readonly heading = viewChild<ElementRef>('heading');
  readonly items = viewChildren(ItemComponent);

  // Derived state from signal input
  readonly displayName = computed(() => {
    const u = this.user();
    return u ? \\\\\`\\\${u.firstName} \\\${u.lastName}\\\\\` : '';
  });
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Legacy decorator inputs — migrate to signal inputs
@Input() user!: User;
@Output() onSelect = new EventEmitter<string>();

// WRONG: @ViewChild with decorator — migrate to viewChild()
@ViewChild('heading') heading!: ElementRef;
\\\`\\\`\\\`

## signal() vs BehaviorSubject
When to use which reactive primitive.

| Use Case | Signal | BehaviorSubject |
|----------|--------|-----------------|
| Component local state | signal() | Overkill |
| Derived/computed state | computed() | combineLatest + map (verbose) |
| Template binding | signal() (direct call) | BehaviorSubject + async pipe |
| Cross-component shared state | SignalStore / signal services | Subject-based services |
| Complex async (debounce, retry, race) | toObservable() -> RxJS | BehaviorSubject + operators |
| WebSocket / SSE streams | toSignal() at boundary | Native Observable |

### Interop: toSignal() and toObservable()
\\\`\\\`\\\`typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Observable -> Signal (e.g., route params, HTTP)
const params$ = inject(ActivatedRoute).params;
readonly userId = toSignal(params$.pipe(map(p => p['id'])), { initialValue: '' });

// Signal -> Observable (e.g., feed into RxJS pipeline)
readonly search = signal('');
readonly search$ = toObservable(this.search);
readonly results$ = this.search$.pipe(
  debounceTime(300),
  switchMap(q => this.api.search(q)),
);
\\\`\\\`\\\`

## SignalStore (ngrx/signals)
Lightweight, signal-based state management.

### Correct
\\\`\\\`\\\`typescript
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
}

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withState<TodoState>({ todos: [], filter: 'all', loading: false }),
  withComputed((store) => ({
    filteredTodos: computed(() => {
      const todos = store.todos();
      const filter = store.filter();
      if (filter === 'all') return todos;
      return todos.filter(t => filter === 'completed' ? t.done : !t.done);
    }),
    count: computed(() => store.todos().length),
  })),
  withMethods((store, todoService = inject(TodoService)) => ({
    async loadTodos() {
      patchState(store, { loading: true });
      const todos = await firstValueFrom(todoService.getAll());
      patchState(store, { todos, loading: false });
    },
    setFilter(filter: TodoState['filter']) {
      patchState(store, { filter });
    },
    addTodo(title: string) {
      patchState(store, { todos: [...store.todos(), { id: crypto.randomUUID(), title, done: false }] });
    },
  })),
);

// Usage in component
@Component({ ... })
export class TodoPageComponent {
  readonly store = inject(TodoStore);
  // Template: store.filteredTodos(), store.count(), store.loading()
}
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Mutating state directly — always use patchState
store.todos().push(newTodo); // mutation — breaks change tracking

// WRONG: Using full NgRx Store + Actions + Reducers + Effects for simple local state
// SignalStore is sufficient for most feature-level state management
\\\`\\\`\\\`
`,
      },
      {
        name: 'angular-testing-guide',
        description: 'Detailed reference for Angular testing patterns: TestBed, components, services, forms, HTTP, routing, directives, and pipes',
        userInvocable: true,
        disableModelInvocation: true,
        content: `# Angular Testing — Detailed Reference

## TestBed.configureTestingModule — Minimal Setup
Only import/provide what the test needs. Less setup = faster, more focused tests.

### Correct
\\\`\\\`\\\`typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';

describe('UserCardComponent', () => {
  let fixture: ComponentFixture<UserCardComponent>;
  let component: UserCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent], // standalone component — import directly
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
  });
});
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Importing unnecessary modules
await TestBed.configureTestingModule({
  imports: [BrowserModule, AppModule, SharedModule], // imports entire app — slow, brittle
  declarations: [UserCardComponent], // declarations for standalone = error
});
\\\`\\\`\\\`

## Component Testing with ComponentFixture
Test rendering, signal inputs, outputs, and DOM interactions.

### Correct
\\\`\\\`\\\`typescript
describe('UserCardComponent', () => {
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(UserCardComponent);
  });

  it('should render user name from signal input', () => {
    // Set signal input via componentRef
    fixture.componentRef.setInput('user', { id: '1', name: 'Alice' });
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h3');
    expect(heading.textContent).toContain('Alice');
  });

  it('should emit onSelect when button is clicked', () => {
    fixture.componentRef.setInput('user', { id: '42', name: 'Bob' });
    fixture.detectChanges();

    const spy = jasmine.createSpy('onSelect');
    fixture.componentInstance.onSelect.subscribe(spy);

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(spy).toHaveBeenCalledWith('42');
  });

  it('should update computed signal when input changes', () => {
    fixture.componentRef.setInput('user', { id: '1', firstName: 'Jane', lastName: 'Doe' });
    fixture.detectChanges();

    expect(fixture.componentInstance.displayName()).toBe('Jane Doe');
  });
});
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Setting @Input() directly on standalone signal input components
component.user = { id: '1', name: 'Alice' }; // signal inputs are read-only

// WRONG: Not calling detectChanges() after changing inputs
fixture.componentRef.setInput('user', newUser);
// Missing: fixture.detectChanges();
expect(fixture.nativeElement.textContent).toContain('Alice'); // stale DOM
\\\`\\\`\\\`

## Service Testing with inject()
Test services independently via TestBed.inject(). No component fixture needed.

### Correct
\\\`\\\`\\\`typescript
import { TestBed } from '@angular/core/testing';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  it('should start as unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should set user after login', async () => {
    await service.login('admin', 'password');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.username).toBe('admin');
  });
});
\\\`\\\`\\\`

## Testing Observables
Use done callback, fakeAsync/tick, or firstValueFrom for async assertions.

### Correct
\\\`\\\`\\\`typescript
import { fakeAsync, tick } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

it('should emit search results after debounce', fakeAsync(() => {
  const results: string[][] = [];
  service.results$.subscribe(r => results.push(r));

  service.search.set('angular');
  tick(300); // advance past debounceTime

  expect(results.length).toBeGreaterThan(0);
}));

it('should return user by id (async)', async () => {
  const user = await firstValueFrom(service.getUserById('42'));
  expect(user.name).toBe('Alice');
});
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Not handling async — test passes vacuously
it('should load data', () => {
  service.loadData().subscribe(data => {
    expect(data.length).toBe(5); // never runs if observable is async
  });
});
\\\`\\\`\\\`

## Testing Reactive Forms
Set values, trigger validation, verify form state.

### Correct
\\\`\\\`\\\`typescript
describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent, ReactiveFormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be invalid when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should validate email format', () => {
    component.form.get('email')!.setValue('not-an-email');
    expect(component.form.get('email')!.hasError('email')).toBeTrue();

    component.form.get('email')!.setValue('user@example.com');
    expect(component.form.get('email')!.valid).toBeTrue();
  });

  it('should enable submit when form is valid', () => {
    component.form.patchValue({ email: 'user@example.com', password: 'Str0ng!Pass' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeFalse();
  });
});
\\\`\\\`\\\`

## Testing Template-Driven Forms
\\\`\\\`\\\`typescript
it('should bind ngModel to input', async () => {
  fixture.detectChanges();
  await fixture.whenStable(); // wait for ngModel async binding

  const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="username"]');
  input.value = 'newuser';
  input.dispatchEvent(new Event('input'));

  await fixture.whenStable();
  expect(component.username).toBe('newuser');
});
\\\`\\\`\\\`

## Testing HTTP with HttpClientTestingModule
Mock HTTP calls — never make real network requests in unit tests.

### Correct
\\\`\\\`\\\`typescript
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // ensure no outstanding requests
  });

  it('should fetch users', () => {
    const mockUsers = [{ id: '1', name: 'Alice' }];
    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should handle HTTP error', () => {
    service.getUsers().subscribe({
      error: (err) => expect(err.status).toBe(500),
    });

    const req = httpMock.expectOne('/api/users');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
\\\`\\\`\\\`

### Anti-Pattern
\\\`\\\`\\\`typescript
// WRONG: Using HttpClientModule instead of testing utilities
imports: [HttpClientModule], // makes real network requests!

// WRONG: Not calling httpMock.verify() in afterEach
// Outstanding requests go unnoticed — tests pass with hidden bugs
\\\`\\\`\\\`

## Testing Routing with RouterTestingModule
\\\`\\\`\\\`typescript
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

describe('Navigation', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'users', component: UserListComponent },
          { path: 'users/:id', component: UserDetailComponent },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('should navigate to user detail', async () => {
    const component = await harness.navigateByUrl('/users/42', UserDetailComponent);
    expect(component.userId()).toBe('42');
  });
});
\\\`\\\`\\\`

## Testing Directives
\\\`\\\`\\\`typescript
@Component({
  standalone: true,
  imports: [HighlightDirective],
  template: \\\\\`<p appHighlight="yellow">Test</p>\\\\\`,
})
class TestHostComponent {}

describe('HighlightDirective', () => {
  it('should apply background color', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const p = fixture.nativeElement.querySelector('p');
    expect(p.style.backgroundColor).toBe('yellow');
  });
});
\\\`\\\`\\\`

## Testing Pipes
Pipes are pure functions — test by instantiating directly. No TestBed needed.

### Correct
\\\`\\\`\\\`typescript
describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('should truncate text longer than limit', () => {
    expect(pipe.transform('Hello World', 5)).toBe('Hello...');
  });

  it('should not truncate short text', () => {
    expect(pipe.transform('Hi', 5)).toBe('Hi');
  });

  it('should handle null input', () => {
    expect(pipe.transform(null, 5)).toBe('');
  });
});
\\\`\\\`\\\`
`,
      },
      {
        name: 'angular-component-generator',
        description: 'Generate Angular standalone components following modern signal-based patterns',
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
        context: 'fork',
        allowedTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.ts\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/\\*ngIf/.test(c))issues.push(\'Use @if instead of *ngIf\');if(/\\*ngFor/.test(c))issues.push(\'Use @for instead of *ngFor\');if(/\\[ngSwitch\\]/.test(c))issues.push(\'Use @switch instead of [ngSwitch]\');if(/@Input\\(\\)/.test(c)&&!c.includes(\'@deprecated\'))issues.push(\'Use input()/input.required() signal inputs instead of @Input()\');if(/@Output\\(\\)/.test(c)&&!c.includes(\'@deprecated\'))issues.push(\'Use output() signal outputs instead of @Output()\');if(issues.length)console.log(\'Warning: \'+issues.join(\'; \'))" -- "$FILE_PATH"',
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
              'FILE_PATH=$(node -e "try{console.log(JSON.parse(require(\'fs\').readFileSync(0,\'utf8\')).tool_input?.file_path||\'\')}catch{console.log(\'\')}" 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.component.ts\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/@Component/.test(c)&&!/ChangeDetectionStrategy\\.OnPush/.test(c)&&!/changeDetection/.test(c))console.log(\'Warning: Component missing ChangeDetectionStrategy.OnPush — add it for optimal performance\')" -- "$FILE_PATH"',
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
