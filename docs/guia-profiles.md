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

## Profiles disponibles

### Lenguajes
- `languages/typescript` - TypeScript strict mode, patrones, naming
- `languages/python` - PEP 8, type hints, patrones
- `languages/java` - SOLID, Optional, streams, concurrencia
- `languages/go` - Idioms, error handling, interfaces
- `languages/rust` - Ownership, Result/Option, traits
- `languages/csharp` - Async/await, LINQ, nullable refs

### Frameworks
- `frameworks/react` - Hooks, componentes, estado
- `frameworks/nextjs` - App Router, Server Components, caching
- `frameworks/express` - Middleware, error handling, seguridad
- `frameworks/nestjs` - Módulos, DI, guards, pipes
- `frameworks/fastapi` - Async, Pydantic, DI
- `frameworks/spring-boot` - DI, JPA, Security
- `frameworks/django` - Models, views, ORM
- `frameworks/angular` - Componentes, RxJS, signals
- `frameworks/vue` - Composition API, Pinia, composables

### Testing
- `testing/jest` - Mocking, snapshots, coverage
- `testing/vitest` - Features Vitest, benchmarks
- `testing/pytest` - Fixtures, parametrize, markers
- `testing/junit` - JUnit 5, assertions, lifecycle
- `testing/cypress` - E2E, component testing
- `testing/playwright` - Page Objects, auto-waiting

### Infraestructura
- `infra/docker` - Multi-stage, seguridad, compose
- `infra/kubernetes` - Resources, probes, security context
- `infra/github-actions` - Workflows, caching, secrets
- `infra/aws` - IAM, S3, Lambda
- `infra/terraform` - Modules, state, naming
- `infra/vercel` - Deploy, edge functions
