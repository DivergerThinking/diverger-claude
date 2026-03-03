# Changelog

## [1.1.0] - 2026-03-03

### Añadido
- **Comando `diverger plugin install`**: Descarga e instala el plugin desde GitHub Releases automáticamente
  - Soporte para `--tag vX.Y.Z` para instalar versión específica
  - Detecta instalación existente y ofrece reinstalar/actualizar
  - Compatible con Windows (MSYS path conversion para GNU tar)
- **Comando `diverger plugin status`**: Muestra estado de instalación, versión, y sincronización con CLI
- **Comando `diverger plugin uninstall`**: Desinstala el plugin con confirmación interactiva
- **Documentación de migración CLI → Plugin**: Guía paso a paso con 3 comandos

### Cambiado
- Deprecation message ahora sugiere `diverger plugin install` en lugar de marketplace
- 875 tests, 70 test files, 0 errores TypeScript

## [1.0.0] - 2026-03-03

### Añadido
- **Comando `diverger cleanup`**: Elimina componentes universales duplicados de `.claude/` cuando el plugin está instalado
  - Detecta archivos modificados por el equipo y los preserva (compara con versión del plugin)
  - Limpia hooks universales de `settings.json` automáticamente
  - Soporta `--dry-run`, `--force`, `--dir`, `--json`
- **Auto-detección de plugin**: El CLI detecta automáticamente si el plugin diverger-claude está instalado y activa `pluginMode` sin necesidad de `--plugin-mode`
- **Flag `--no-plugin`**: Fuerza modo completo (generación legacy) incluso cuando el plugin está instalado
- **Avisos de deprecación**: El CLI muestra recomendación de migrar al plugin cuando se usa sin él
- **Supresión inteligente**: Los avisos se suprimen con `--quiet`, `--json`, `CI=true`, o `DIVERGER_NO_DEPRECATION=1`
- **Módulo `plugin-detect.ts`**: Detección de plugin en rutas user-scope, cache (marketplace) y project-scope
- **Auto-cleanup en `diverger update`**: Tras actualizar, ejecuta cleanup automáticamente si el plugin está instalado
  - Elimina componentes universales duplicados sin intervención manual
  - Flag `--no-cleanup` para desactivar el comportamiento
  - Si falla, muestra warning sin interrumpir el update

### Cambiado
- **Plugin = vía recomendada**: El CLI sigue funcionando pero recomienda migrar al plugin
- 865 tests, 69 test files, 0 errores TypeScript

## [0.8.0] - 2026-03-03

### Añadido
- **Distribución marketplace**: Plugin instalable via `/plugin marketplace add DivergerThinking/diverger-claude`
- **Manifiesto marketplace**: `.claude-plugin/marketplace.json` con registro de plugins
- **MCP server self-contained**: Bundle completo sin dependencias externas en `plugin/mcp/server.js`
- **GitHub Release automático**: Workflow crea release con tarball del plugin en cada tag
- **Validación CI del plugin**: Job dedicado verifica estructura, manifiestos y paths del plugin
- **Tests marketplace**: Validación de `marketplace.json`, MCP bundled server, y sync de versiones
- **Documentación**: `docs/guia-plugin.md` (guía de usuario) y `docs/migracion-cli-a-plugin.md` (migración CLI → plugin)
- **Plugin README**: Listing completo para marketplace con tabla de agentes, skills, hooks y MCP tools

### Cambiado
- **Plugin en git**: `plugin/` ya no está en `.gitignore`, se commitea el plugin construido
- **MCP paths**: `.mcp.json` usa `${CLAUDE_PLUGIN_ROOT}/mcp/server.js` (sin `../`)
- **build:plugin**: Ahora ejecuta `npm run build` primero para generar el bundle MCP
- **plugin.json**: Metadata enriquecida con author object, homepage, repository, keywords
- **tsup.config.ts**: Tercer entry point para bundle MCP self-contained (`noExternal: [/.*/]`)

### Eliminado
- **`.claude-plugin/plugin.json`**: Manifiesto legacy v0.1.0 con paths `../` rotos, reemplazado por `marketplace.json`

## [0.5.0] - 2026-03-02

### Cambiado (auditoría de calidad v2, score 6.3 → 9+/10)
- **Hook protocol**: Scripts externos `.claude/hooks/*.sh` con protocolo stdin JSON, `hookSpecificOutput` para PreToolUse, exit code 2 para bloqueo PostToolUse
- **Hook scripts**: Templates reutilizables (`makeFilePatternCheckScript`, `makePreToolUseBlockerScript`, `makeNodeCheckScript`) reemplazando todos los patrones HOOK_EXIT
- **Seguridad**: Secret scanner + bloqueador de comandos destructivos movidos a PreToolUse (se ejecutan antes)
- **Agentes separados**: code-reviewer, security-reviewer, ts-reviewer, react-reviewer, test-reviewer con `model: sonnet` en todos
- **Skill frontmatter**: `context: fork` + `allowedTools` en 58 skills generadores, `userInvocable` + `disableModelInvocation` en 11 skills de referencia
- **Rules trimming**: Todas las reglas ≤50 líneas, contenido verboso movido a skills on-demand
- **statusMessage**: Añadido en todas las entradas de hooks
- Zero referencias a HOOK_EXIT, $CLAUDE_FILE_PATH, $CLAUDE_TOOL_INPUT
- 774 tests, 57 test files, 0 errores TypeScript

### Corregido
- Uso de scoped registry en comando update para evitar E404 en dependencias transitivas

## [0.4.0] - 2026-03-02

### Mejorado (auditoría de calidad de output)
- **Skills YAML frontmatter**: SKILL.md incluye `name:` y `description:` en frontmatter YAML para auto-invocación
- **Rules path scoping**: Campo `paths` opcional en `RuleDefinition`, emite frontmatter `paths:` YAML
- **CLAUDE.md reducido**: Secciones condensadas de ~260 líneas a ~8 líneas por profile, referenciando `.claude/rules/`
- **ESLint config merging**: Múltiples configs ESLint de diferentes profiles se deep-mergen en un solo archivo
- **Settings $schema**: `settings.json` incluye key `$schema` para autocompletado en IDE
- **Agent skill references**: Enrichments de agentes referencian skills de su profile
- **Cross-platform hooks**: Reemplazado `grep -P` (Perl regex) por `grep -E` (POSIX ERE) en 49 profiles
- Extraído `yamlEscape()` compartido en `yaml-utils.ts`
- 716 tests, 54 test files, 0 errores TypeScript

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
