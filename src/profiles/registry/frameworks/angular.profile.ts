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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.ts\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');const issues=[];if(/\\*ngIf/.test(c))issues.push(\'Use @if instead of *ngIf\');if(/\\*ngFor/.test(c))issues.push(\'Use @for instead of *ngFor\');if(/\\[ngSwitch\\]/.test(c))issues.push(\'Use @switch instead of [ngSwitch]\');if(/@Input\\(\\)/.test(c)&&!c.includes(\'@deprecated\'))issues.push(\'Use input()/input.required() signal inputs instead of @Input()\');if(/@Output\\(\\)/.test(c)&&!c.includes(\'@deprecated\'))issues.push(\'Use output() signal outputs instead of @Output()\');if(issues.length)console.log(\'Warning: \'+issues.join(\'; \'))" -- "$FILE_PATH"',
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
              'FILE_PATH=$(jq -r \'.tool_input.file_path // empty\' 2>/dev/null); [ -n "$FILE_PATH" ] && node -e "const f=process.argv[1]||\'\';if(!f.endsWith(\'.component.ts\'))process.exit(0);const c=require(\'fs\').readFileSync(f,\'utf8\');if(/@Component/.test(c)&&!/ChangeDetectionStrategy\\.OnPush/.test(c)&&!/changeDetection/.test(c))console.log(\'Warning: Component missing ChangeDetectionStrategy.OnPush — add it for optimal performance\')" -- "$FILE_PATH"',
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
