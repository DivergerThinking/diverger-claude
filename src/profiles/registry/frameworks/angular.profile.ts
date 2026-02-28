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

- Follow the Angular Style Guide for naming, structure, and patterns
- Use standalone components by default - NgModules only for legacy compatibility
- Use Angular signals for reactive state management
- Use RxJS for async streams (HTTP responses, WebSocket events, complex event coordination)
- Use dependency injection for all services - never instantiate manually
- Use the Angular CLI for generating components, services, guards, and pipes
- Keep components focused: smart (container) components for logic, presentational (dumb) components for UI
- Use Angular's built-in pipes for data transformation in templates
- Use reactive forms for complex form handling, template-driven forms for simple cases
- Use route guards for navigation control and access restrictions
- Use lazy loading for feature modules to reduce initial bundle size
- Use \`trackBy\` with \`@for\` loops for efficient DOM updates`,
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
        ],
      },
    },
    rules: [
      {
        path: 'angular/architecture.md',
        governance: 'mandatory',
        description: 'Angular component architecture and dependency injection',
        content: `# Angular Architecture

## Component Patterns
- Use standalone components as the default (\`standalone: true\`)
- Keep components small: template, styles, and logic in a single responsibility
- Separate smart (container) components from presentational (dumb) components
- Smart components manage data, call services, and coordinate child components
- Presentational components receive data via @Input and emit events via @Output
- Use \`ChangeDetectionStrategy.OnPush\` for presentational components
- Use Angular signals (\`signal()\`, \`computed()\`, \`effect()\`) for component state

## Services and Dependency Injection
- Register services with \`providedIn: 'root'\` for singletons
- Use \`inject()\` function or constructor injection for dependencies
- Create feature-level services when shared state should not be global
- Use \`InjectionToken\` for providing configuration and non-class values
- Use \`@Optional()\` for optional dependencies

## RxJS and Signals
- Prefer signals for synchronous state and simple derived state
- Use RxJS for async streams: HTTP calls, WebSocket messages, complex event coordination
- Use the \`async\` pipe in templates to subscribe and auto-unsubscribe
- Use \`takeUntilDestroyed()\` to manage observable lifetimes in components
- Avoid subscribing in component code when the \`async\` pipe suffices
- Use higher-order mapping operators (\`switchMap\`, \`mergeMap\`, \`concatMap\`) correctly

## Template Syntax
- Use the new control flow syntax: \`@if\`, \`@for\`, \`@switch\`, \`@defer\`
- Use \`@for\` with \`track\` for efficient list rendering
- Use \`@defer\` for lazy-loading heavy template sections
- Use attribute binding \`[attr.x]\` for non-property DOM attributes
- Use event binding \`(event)\` for DOM events
- Use two-way binding \`[(ngModel)]\` sparingly - prefer reactive forms

## Routing
- Use lazy loading for feature routes with \`loadComponent\` or \`loadChildren\`
- Use route guards (\`canActivate\`, \`canDeactivate\`, \`resolve\`) as functions
- Use route resolvers to pre-fetch data before navigation
- Use \`RouterLink\` directive for internal navigation
- Use query parameters for optional/filterable state, path parameters for identity

## Forms
- Use reactive forms (\`FormGroup\`, \`FormControl\`, \`FormArray\`) for complex forms
- Use Validators for built-in validation, custom validator functions for domain rules
- Display validation errors only after the user interacts with the control (\`touched\`)
- Use template-driven forms only for very simple, one-off forms
`,
      },
      {
        path: 'angular/naming.md',
        governance: 'recommended',
        description: 'Angular naming and file conventions',
        content: `# Angular Naming Conventions

## Files
- Use kebab-case with a type suffix: \`user-profile.component.ts\`, \`auth.service.ts\`
- Component files: \`*.component.ts\`, \`*.component.html\`, \`*.component.scss\`
- Services: \`*.service.ts\`
- Guards: \`*.guard.ts\`
- Pipes: \`*.pipe.ts\`
- Directives: \`*.directive.ts\`
- Interceptors: \`*.interceptor.ts\`
- Models/Interfaces: \`*.model.ts\` or \`*.interface.ts\`

## Classes and Selectors
- Components: PascalCase + Component suffix (\`UserProfileComponent\`)
- Services: PascalCase + Service suffix (\`AuthService\`)
- Pipes: PascalCase + Pipe suffix (\`DateFormatPipe\`)
- Directives: PascalCase + Directive suffix (\`HighlightDirective\`)
- Component selectors: kebab-case with app prefix (\`app-user-profile\`)
- Directive selectors: camelCase with app prefix (\`appHighlight\`)

## Project Organization
- Group by feature: \`/features/users/\`, \`/features/orders/\`
- Shared components in \`/shared/\`
- Core services and guards in \`/core/\`
- Application-wide layout in \`/layout/\`
`,
      },
    ],
    agents: [
      {
        name: 'code-reviewer',
        type: 'enrich',
        prompt: `## Angular-Specific Review
- Verify standalone components are used by default
- Check for proper use of OnPush change detection on presentational components
- Verify RxJS observables are unsubscribed (async pipe, takeUntilDestroyed, or explicit unsubscribe)
- Check for proper dependency injection - no manual service instantiation
- Verify smart/presentational component separation
- Check template syntax: prefer new control flow (@if, @for) over structural directives
- Verify @for loops use the track expression
- Check for proper use of signals vs RxJS (signals for sync, RxJS for async streams)
- Verify route guards and lazy loading are applied to feature routes
- Check for proper reactive form validation and error display`,
      },
      {
        name: 'test-writer',
        type: 'enrich',
        prompt: `## Angular Testing
- Use TestBed to configure the testing module with minimal providers
- Test components with ComponentFixture: render, interact, assert
- Use \`harnesses\` (component test harnesses) for Material components
- Mock services with jasmine spies or jest mocks via \`provideMock\`
- Test services independently by injecting them from TestBed
- Test RxJS logic with marble testing or by subscribing and asserting
- Test signal-based components by setting signal values and checking rendered output
- Test route guards by invoking them with mocked ActivatedRouteSnapshot
- Test pipes by instantiating and calling their \`transform\` method
- Test reactive forms: set values, trigger validation, verify error state`,
      },
    ],
  },
};
