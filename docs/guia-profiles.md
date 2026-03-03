# Guía de Profiles

## Qué es un profile

Un profile es un módulo que define configuraciones específicas para una tecnología. Los profiles se componen en capas para crear una configuración completa.

## Capas

| Capa | Prioridad | Ejemplo |
|------|-----------|---------|
| Base | 0 | Clean code, seguridad genérica |
| Lenguaje | 10 | TypeScript, Python, Java |
| Framework | 20 | Next.js, FastAPI, Spring Boot |
| Testing | 30 | Jest, Vitest, Pytest |
| Infraestructura | 40 | Docker, GitHub Actions |

## Composición

### CLAUDE.md
Las secciones se concatenan en orden de capa. Cada profile contribuye secciones relevantes.

### settings.json
Deep merge: los arrays (permissions.allow, permissions.deny) se concatenan, no se reemplazan.

### Rules
Cada profile genera reglas en su propio directorio (e.g., `rules/typescript/`, `rules/nextjs/`), evitando conflictos.

### Agentes
Los agentes se **enriquecen** por nombre:
- El profile base define el agente con instrucciones genéricas
- Cada capa adicional añade instrucciones específicas de su tecnología
- El resultado es un agente con conocimiento profundo del stack completo

Ejemplo para `code-reviewer`:
1. Base: "Revisa calidad, seguridad, SOLID"
2. TypeScript: "Revisa `any`, strict mode, tipos"
3. Next.js: "Revisa Server Components, caching"
4. Vitest: "Revisa cobertura de tests"

## Gobernanza

### Mandatory (🔒)
- No se pueden modificar ni eliminar
- Estándares corporativos no negociables
- `diverger check` reporta error si se alteran

### Recommended (💡)
- Se pueden personalizar
- Representan buenas prácticas sugeridas
- `diverger sync` respeta los cambios del equipo

## Profiles disponibles (59 total)

### Base (1)
- `base/universal` - Clean code, seguridad genérica, agentes universales

### Lenguajes (9)
- `languages/typescript` - TypeScript strict mode, patrones, naming
- `languages/python` - PEP 8, type hints, patrones
- `languages/java` - SOLID, Optional, streams, concurrencia
- `languages/go` - Idioms, error handling, interfaces
- `languages/rust` - Ownership, Result/Option, traits
- `languages/csharp` - Async/await, LINQ, nullable refs
- `languages/kotlin` - Coroutines, null safety, extensions
- `languages/swift` - Protocol-oriented, optionals, concurrency
- `languages/dart` - Null safety, async, Flutter patterns

### Frameworks (27)
- `frameworks/react` - Hooks, componentes, estado
- `frameworks/nextjs` - App Router, Server Components, caching
- `frameworks/remix` - Loaders/actions, nested routes, progressive enhancement
- `frameworks/astro` - Content collections, islands, zero JS
- `frameworks/express` - Middleware, error handling, seguridad
- `frameworks/nestjs` - Módulos, DI, guards, pipes
- `frameworks/fastapi` - Async, Pydantic, DI
- `frameworks/spring-boot` - DI, JPA, Security
- `frameworks/django` - Models, views, ORM
- `frameworks/angular` - Componentes, RxJS, signals
- `frameworks/vue` - Composition API, Pinia, composables
- `frameworks/svelte` - Reactivity, stores, SvelteKit
- `frameworks/nuxt` - Auto-imports, Nitro, composables
- `frameworks/flask` - Blueprints, extensiones, Jinja2
- `frameworks/gin` - Middleware, binding, routing
- `frameworks/echo` - Middleware, context, validación
- `frameworks/fiber` - Performance, middleware, routing
- `frameworks/actix-web` - Handlers, extractors, middleware
- `frameworks/axum` - Tower layers, extractors, routing
- `frameworks/rocket` - Guards, fairings, managed state
- `frameworks/prisma` - Schema, migrations, client, relations
- `frameworks/trpc` - Type-safe APIs, routers, procedures
- `frameworks/react-native` - Components, navigation, native modules
- `frameworks/expo` - Managed workflow, EAS, OTA updates
- `frameworks/flutter` - Widgets, state, platform channels
- `frameworks/swiftui` - Views, modifiers, data flow
- `frameworks/jetpack-compose` - Composables, state, navigation

### Testing (9)
- `testing/jest` - Mocking, snapshots, coverage
- `testing/vitest` - Features Vitest, benchmarks
- `testing/pytest` - Fixtures, parametrize, markers
- `testing/junit` - JUnit 5, assertions, lifecycle
- `testing/cypress` - E2E, component testing
- `testing/playwright` - Page Objects, auto-waiting
- `testing/detox` - React Native E2E, device sync
- `testing/xctest` - XCTest/XCUITest, iOS testing
- `testing/espresso` - Android UI testing, matchers

### Infraestructura (13)
- `infra/docker` - Multi-stage, seguridad, compose
- `infra/kubernetes` - Resources, probes, security context
- `infra/github-actions` - Workflows, caching, secrets
- `infra/gitlab-ci` - Pipelines, stages, caching, artifacts
- `infra/jenkins` - Declarative pipelines, shared libraries
- `infra/circleci` - Orbs, workflows, caching, parallelism
- `infra/azure-pipelines` - YAML pipelines, templates, stages
- `infra/aws` - IAM, S3, Lambda
- `infra/terraform` - Modules, state, naming
- `infra/vercel` - Deploy, edge functions
- `infra/fastlane` - iOS/Android automation, lanes
- `infra/bun` - Runtime, bundler, package manager
- `infra/deno` - Permissions, web APIs, deploy
