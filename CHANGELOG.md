# Changelog

## [0.3.0] - 2026-03-02

### Añadido
- **Soporte mobile completo**: React Native, Expo, Flutter, SwiftUI, Jetpack Compose
- **3 nuevos lenguajes**: Kotlin, Swift, Dart con reglas, skills y herramientas externas
- **5 nuevos frameworks mobile**: React Native, Expo, Flutter, SwiftUI, Jetpack Compose
- **3 nuevos testing profiles**: Detox (RN E2E), XCTest (Swift), Espresso (Android)
- **1 nuevo infra profile**: Fastlane (CI/CD mobile)
- **MobileAnalyzer**: detección automática de frameworks mobile desde manifiestos
- **4 templates greenfield**: React Native, Expo, Flutter, SwiftUI (configs iniciales)
- **Skills para todos los profiles**: react-component-generator, nextjs-route-generator, django-model-generator, y 16+ más
- **Hooks de advertencia**: useEffect sin cleanup, "use client" innecesario, @Autowired field injection, raw SQL en Django, latest tag en Docker, rutas sin validación
- **Resumen detallado post-init**: box con stack detectado, profiles aplicados, archivos generados, reglas activas, agentes configurados
- **Versión centralizada**: `src/cli/version.ts` con `getVersion()` usada en CLI, banner y update

### Corregido
- **Bug 1**: `normalizeTechId` eliminaba mayúsculas en vez de convertirlas a minúsculas ("React" → "eact" ahora → "react")
- **Bug 2**: `KnowledgeResult.fromCache` leído pero no definido en el tipo
- **Bug 3**: Tres archivos usaban diferentes fallback versions — ahora centralizado
- **Bug 4**: `update.ts` usaba `2>/dev/null` incompatible con Windows — reemplazado por `stdio: 'pipe'`
- **Bug 5**: Detección de BillingError frágil — agregado regex fallback `/credit.*(balance|low)|insufficient.*funds/i`
- **Bug 6**: `diverger init --force` en proyecto vacío retornaba exit 0 sin generar nada — ahora exit 1

### Mejorado
- 50 profiles totales (era 37): 1 base + 9 lang + 23 framework + 9 testing + 7 infra + 1 archetype
- Todos los profiles tienen al menos 2 rules, 1+ skills, agents con enrichments
- Agent enrichments para code-reviewer en todos los testing profiles
- External tools para Python (ruff), Java (checkstyle), Go (golangci), Rust (clippy), Docker (.dockerignore)
- Progress más granular durante generación con conteo de profiles
- 698 tests (era 632), 53 test files, 0 errores TS

### Refactorizado (auditoría de código)
- Eliminados 7 casts `as any` innecesarios en profiles de lenguajes
- Añadido type guard `isNodeError()` en `utils/fs.ts` reemplazando 4 casts `as NodeJS.ErrnoException`
- Añadido `extractErrorMessage()` centralizando 15 patrones duplicados de extracción de error en 13 archivos
- Eliminadas 5 etiquetas `@planned` de clases de error, reemplazadas con JSDoc descriptivo
- Añadido type guard `isWebSearchResultBlock()` y constante `WEB_SEARCH_TOOL_VERSION` en API client
- Extraído `mergeSecurityOverlay()` en `GenerationEngine` reduciendo complejidad de `generateFiles()`
- Extraído `satisfiesVersionConstraint()` en `ProfileComposer` mejorando legibilidad de lógica de versiones

## [0.2.2] - 2026-03-02

### Corregido
- Manejo de errores de billing: detiene búsqueda de knowledge tras primer error a nivel de cuenta
- Stop-after-first-failure para errores de API key y billing en pipeline de knowledge

## [0.2.1] - 2026-03-02

### Añadido
- Comando `diverger update` para auto-actualizar (detecta global vs local)
- Comando `diverger update --check` para verificar actualizaciones sin instalar
- Flag `--version` para ver la versión instalada
- Progreso granular durante `diverger init`: el spinner ahora muestra cada paso en tiempo real
- Timeout de 90 segundos en llamadas a Claude API para evitar cuelgues indefinidos
- Manejo de `APIConnectionTimeoutError` con mensaje claro al usuario
- Indicador de caché en búsqueda de knowledge (muestra si usa caché o API)

### Mejorado
- Prompts de permisos de knowledge se preguntan ANTES del spinner (ya no compiten con ora)
- El spinner muestra 12+ estados distintos durante la generación:
  - Buscando best practices de [Tech]... (por cada tecnología)
  - Best practices de [Tech] (caché)
  - Componiendo profiles (TypeScript, Next.js, ...)...
  - Generando reglas de seguridad...
  - Generando CLAUDE.md...
  - Generando settings.json...
  - Generando reglas del stack...
  - Generando agentes...
  - Generando skills...
  - Generando configuración MCP...
  - Generando configs externas (ESLint, Prettier, tsconfig)...
- Documentación actualizada con instrucciones de instalación global, versión y actualización
- CHANGELOG ampliado

### Corregido
- El comando `init` ya no se "cuelga" en "Generando configuración..." sin feedback

## [0.2.0] - 2026-03-02

### Añadido
- Detección de manifiestos en subdirectorios (`app/`, `frontend/`, `backend/`, `apps/web/`)
- Nuevo módulo `file-utils` con funciones de búsqueda por basename (`findFile`, `findFileEntry`, `findAllFileEntries`, `hasFile`)
- Soporte multi-manifiesto: Node y Python procesan TODOS los package.json / pyproject.toml encontrados
- Propiedad `rootOnlyPatterns` en BaseAnalyzer para proteger configs que solo deben buscarse en raíz
- Wildcard basename matching: `app/Dockerfile.dev` ahora matchea el patrón `Dockerfile.*`
- Scanner expande patterns con `**/` para buscar en subdirectorios (hasta profundidad 4)
- Nuevo banner wireframe globe 3D con paleta turquesa y saludo por hora del día
- Comando `welcome` en CLI
- Banner automático al ejecutar `diverger` sin argumentos
- Instalación global disponible: `npm install -g @divergerthinking/diverger-claude`
- 3 nuevos fixtures de integración (subdir-app, fullstack-multi, mixed-root-subdir)
- 95 tests nuevos (628 total)

### Mejorado
- Guía de instalación ampliada con instrucciones detalladas paso a paso
- Cada analyzer usa paths reales en evidence (ej: `frontend/package.json` en lugar de `package.json`)
- Docker analyzer usa `path.basename()` para detectar Dockerfiles en subdirectorios
- CI analyzer declara `rootOnlyPatterns` para Jenkinsfile, .gitlab-ci.yml, azure-pipelines.yml

## [0.1.0] - 2026-02-28

### Añadido
- Motor de detección de stack tecnológico (Node.js, Python, Java, Go, Rust, .NET, Docker, CI)
- Sistema de profiles de 5 capas (Base, Lenguaje, Framework, Testing, Infra)
- 37 profiles: 1 base + 6 lenguajes, 18 frameworks, 6 testing, 6 infra
- Algoritmo de composición por capas con enriquecimiento de agentes
- Generadores: CLAUDE.md, settings.json, rules, agents, skills, hooks, MCP
- Generador de seguridad (deny rules + sandbox)
- Generador de configs externas (ESLint, Prettier, tsconfig)
- CLI con comandos: init, diff, status, sync, check, eject
- UI rica: colores, spinners, menús interactivos
- Modos: --quiet, --json, --force, --dry-run
- Three-way merge para actualizaciones
- Sistema de gobernanza (mandatory vs recommended)
- Motor de conocimiento (Claude API + web search + caché)
- Adaptación continua (hook SessionStart + change detector)
- Soporte monorepo (npm workspaces, Turborepo, Nx, Lerna, pnpm)
- Wizard para proyectos greenfield con templates
- Plugin de Claude Code (commands, agents, skills, hooks)
- 6 agentes: code-reviewer, test-writer, security-checker, doc-writer, refactor-assistant, migration-helper
- Dogfooding: el propio proyecto usa .claude/ generado
- Documentación en español
- CI/CD con GitHub Actions
