# Plan: diverger-claude

## Context

En la empresa existe una adopción parcial de Claude Code sin estandarización. Con 100+ proyectos y múltiples equipos, no hay una manera consistente de configurar Claude Code para que siga buenas prácticas de desarrollo, seguridad y convenciones corporativas.

**diverger-claude** es una herramienta interna (CLI + Plugin de Claude Code) que:
1. Detecta automáticamente el stack tecnológico de un proyecto
2. Genera una configuración `.claude/` completa y adaptada (rules, agents, skills, hooks, MCP)
3. Busca y aplica las mejores prácticas actualizadas de cada tecnología vía Claude API
4. Se adapta continuamente a los cambios del proyecto
5. Genera/alinea configs de herramientas externas (ESLint, Prettier, tsconfig...)

---

## Decisiones del Usuario (Registro Completo)

| # | Pregunta | Decisión |
|---|---|---|
| 1 | Adopción de Claude Code | Parcial: algunos equipos lo usan, otros no. Estandarizar y expandir |
| 2 | Formato de distribución | Plugin + CLI combo |
| 3 | Nivel de adaptación | Los 3 niveles: detección estática + arquitectura + adaptación continua |
| 4 | Alcance de best practices | Full stack: dev + Claude config + estándares empresa |
| 5 | Tecnologías a cubrir | Sistema extensible de profiles (módulos por tecnología) |
| 6 | Gobernanza | Híbrido: reglas base corporativas + equipos extienden/personalizan |
| 7 | Documento base (greenfield) | Cualquier fuente: markdown, input del usuario, ARCHITECTURE.md |
| 8 | Seguridad | Sin restricciones de red + datos sensibles protegidos + configurable |
| 9 | UX de instalación | Auto-detect + confirmar (strict mode: si <90% confianza, pregunta) |
| 10 | Estándares corporativos | Dentro de la propia librería |
| 11 | Escala | 100+ proyectos |
| 12 | Destino | Empresa interna |
| 13 | SCM | GitHub |
| 14 | Registry | GitHub Packages (npm) |
| 15 | Enforcement | Instrucciones + hooks de validación + CI/CD checks (máximo) |
| 16 | Actualizaciones | PRs automáticos vía Dependabot/Renovate |
| 17 | Override de reglas | Configurable por regla: mandatory (no degradable) vs recommended |
| 18 | Nombre | diverger-claude |
| 19 | Lenguaje CLI | TypeScript/Node.js (mejor encaje con Claude Code) |
| 20 | Plugin runtime | Skills + Hooks + Agents compartidos |
| 21 | Monorepo | Auto-detectar estructura y aplicar estrategia óptima |
| 22 | Merge al actualizar | Three-way merge (original vs equipo vs nueva versión) |
| 23 | Métricas | No necesarias ahora |
| 24 | Idioma reglas | Inglés (reglas internas), Español (todo lo user-facing) |
| 25 | Capa extra profiles | Testing/QA como capa independiente |
| 26 | Granularidad agentes | Máxima: conocimiento profundo y específico de tecnologías detectadas |
| 27 | Fuente de conocimiento | Docs oficiales importadas vía Claude API web search, pidiendo permiso |
| 28 | Versionado frameworks | Yo decido → Detectar versión + profiles con override por versión major |
| 29 | Alcance herramientas | .claude/ + configs de herramientas externas (crear + alinear) |
| 30 | Docs en español | Todo lo user-facing: README, CLI output, guías, FAQs |
| 31 | Docs import | Claude API busca docs actualizadas en web, pidiendo permiso al dev |
| 32 | Configs herramientas | Crear si no existen + alinear existentes con reglas Claude |
| 33 | Web search engine | Claude API con capacidad de web search para sintetizar best practices |
| 34 | API Key | Key corporativa de empresa para el CLI |
| 35 | Prioridad MVP | Todo el pipeline completo |
| 36 | Equipo | Solo desarrollador + Claude Code |
| 37 | UX CLI | UI rica (colores, spinners, menús) + --quiet/--json para CI |
| 38 | Dry-run | Imprescindible: mostrar exactamente qué se generaría con diff |
| 39 | Online/offline | Siempre online |
| 40 | Adaptación continua | Hook activo que aplica cambios menores automáticamente + /diverger-sync manual |
| 41 | Agentes core | 6+ agentes adaptativos al stack detectado (code-reviewer, test-writer, security-checker, doc-writer, refactor-assistant, migration-helper) |
| 42 | Dogfooding | Sí, desde el día 1: diverger-claude usa su propio .claude/ |

---

## Arquitectura del Repositorio

```
diverger-claude/
  .claude/                          # Dogfooding: configuración propia
    CLAUDE.md
    settings.json
    rules/
    skills/
    agents/
  .claude-plugin/                   # Manifiesto del plugin
    plugin.json

  # Plugin assets (distribuidos con npm)
  commands/                         # Slash commands del plugin
    diverger-init.md
    diverger-sync.md
    diverger-check.md
    diverger-status.md
  agents/                           # Agentes del plugin
    code-reviewer.md
    test-writer.md
    security-checker.md
    doc-writer.md
    refactor-assistant.md
    migration-helper.md
  skills/                           # Skills del plugin
    diverger-sync/SKILL.md
    diverger-check/SKILL.md
  hooks/
    hooks.json                      # Hooks del plugin (SessionStart)

  # Código fuente
  src/
    index.ts                        # Entry point CLI
    cli/
      index.ts                      # Setup Commander.js
      commands/
        init.ts                     # `diverger init` - wizard interactivo
        sync.ts                     # `diverger sync` - re-analizar y actualizar
        check.ts                    # `diverger check` - validar configs
        status.ts                   # `diverger status` - mostrar stack detectado
        diff.ts                     # `diverger diff` - dry-run con diff
        eject.ts                    # `diverger eject` - desconectar, mantener configs
      ui/
        prompts.ts                  # Prompts interactivos (inquirer)
        spinner.ts                  # Spinners (ora)
        logger.ts                   # Output con colores (chalk)
        diff-display.ts             # Renderizado de diffs en terminal

    core/
      engine.ts                     # Orquestador: detección → composición → generación
      types.ts                      # Interfaces TypeScript compartidas
      constants.ts                  # Constantes, rutas, umbrales
      errors.ts                     # Jerarquía de errores custom

    detection/
      index.ts                      # DetectionEngine facade
      scanner.ts                    # Escáner de filesystem (busca manifiestos)
      analyzers/
        index.ts                    # Registro de todos los analizadores
        base.ts                     # Clase abstracta BaseAnalyzer
        node.ts                     # package.json analyzer
        python.ts                   # pyproject.toml / requirements.txt
        java.ts                     # pom.xml / build.gradle
        go.ts                       # go.mod analyzer
        rust.ts                     # Cargo.toml analyzer
        dotnet.ts                   # .csproj / .sln analyzer
        docker.ts                   # Dockerfile / docker-compose
        ci.ts                       # GitHub Actions / GitLab CI / etc.
      patterns/
        monorepo.ts                 # Detección monorepo (workspaces, lerna, nx, turborepo)
        architecture.ts             # Microservicios, serverless, monolito
      scoring.ts                    # Motor de puntuación de confianza

    profiles/
      index.ts                      # Registro de profiles + motor de composición
      composer.ts                   # Algoritmo de composición por capas
      conflict-resolver.ts          # Detección y resolución de conflictos
      registry/
        base/
          universal.profile.ts      # Capa 1: reglas universales
        languages/
          typescript.profile.ts     # Capa 2: TypeScript
          python.profile.ts
          java.profile.ts
          go.profile.ts
          rust.profile.ts
          csharp.profile.ts
        frameworks/
          react.profile.ts          # Capa 3: React
          nextjs.profile.ts
          fastapi.profile.ts
          spring-boot.profile.ts
          django.profile.ts
          express.profile.ts
          nestjs.profile.ts
          angular.profile.ts
          vue.profile.ts
        testing/
          jest.profile.ts           # Capa 4: Jest
          vitest.profile.ts
          pytest.profile.ts
          junit.profile.ts
          cypress.profile.ts
          playwright.profile.ts
        infra/
          docker.profile.ts         # Capa 5: Docker
          kubernetes.profile.ts
          github-actions.profile.ts
          aws.profile.ts
          terraform.profile.ts
          vercel.profile.ts

    generation/
      index.ts                      # GenerationEngine facade
      generators/
        claude-md.ts                # Genera .claude/CLAUDE.md
        settings.ts                 # Genera .claude/settings.json
        rules.ts                    # Genera .claude/rules/*.md
        skills.ts                   # Genera .claude/skills/
        agents.ts                   # Genera .claude/agents/
        mcp.ts                      # Genera .mcp.json
        hooks.ts                    # Genera configuración de hooks
        security.ts                 # Genera deny rules + sandbox
        external-tools.ts           # ESLint, Prettier, tsconfig
      templates/
        claude-md.hbs               # Templates Handlebars
        agents/                     # Templates de agentes
        skills/                     # Templates de skills
      file-writer.ts                # Escritura atómica con backup
      diff-engine.ts                # Computa diffs para dry-run

    governance/
      index.ts                      # RulesGovernanceEngine
      rule-types.ts                 # Clasificación mandatory/recommended
      merge.ts                      # Algoritmo three-way merge
      validator.ts                  # Valida integridad de reglas
      history.ts                    # Tracking via .diverger-meta.json

    knowledge/
      index.ts                      # KnowledgeEngine facade
      api-client.ts                 # Cliente Claude API (web search)
      cache.ts                      # Caché de respuestas (file-based)
      prompts.ts                    # Templates de prompts para buscar knowledge

    adaptation/
      index.ts                      # ContinuousAdaptationEngine
      session-hook.ts               # Lógica del hook SessionStart
      change-detector.ts            # Detecta cambios en deps/config
      auto-updater.ts               # Aplica actualizaciones menores automáticas

    monorepo/
      index.ts                      # MonorepoEngine
      workspace-resolver.ts         # Resuelve paquetes del workspace
      config-distributor.ts         # Genera root + configs por paquete

    external/
      index.ts                      # ExternalToolsEngine
      eslint.ts                     # Alineación config ESLint
      prettier.ts                   # Alineación config Prettier
      tsconfig.ts                   # Alineación tsconfig

    greenfield/
      index.ts                      # Soporte proyecto nuevo
      wizard.ts                     # Wizard interactivo
      document-parser.ts            # Parser ARCHITECTURE.md
      templates.ts                  # Templates predefinidos

    utils/
      fs.ts                         # Helpers de filesystem
      hash.ts                       # Hashing para detección de cambios
      parsers.ts                    # JSON, TOML, YAML, XML

  tests/
    unit/
      detection/
        analyzers/*.test.ts
        scoring.test.ts
      profiles/
        composer.test.ts
      generation/
        claude-md.test.ts
        agents.test.ts
      governance/
        merge.test.ts
    integration/
      engine.test.ts                # Tests pipeline completo
      monorepo.test.ts
      fixtures/                     # Proyectos simulados
        nextjs-app/
        spring-boot-api/
        monorepo-turbo/
        python-fastapi/
    e2e/
      cli.test.ts                   # Tests CLI end-to-end

  docs/                             # Documentación en español
    guia-instalacion.md
    guia-uso.md
    guia-profiles.md
    claude-code-reference/          # Ya creado

  .diverger-meta.json               # Metadata de auto-tracking
  package.json
  tsconfig.json
  vitest.config.ts
  .github/workflows/
    ci.yml
    release.yml
  CHANGELOG.md
  README.md
```

---

## Sistema de Profiles (5 Capas Composables)

### Capas y Alcance

| Capa | Prioridad | Alcance de Output | Ejemplo |
|---|---|---|---|
| 1. Base | 0 | CLAUDE.md (sección universal), settings.json base, rules/code-style.md, rules/security.md | Clean code, SOLID, seguridad genérica |
| 2. Language | 10 | CLAUDE.md (sección lenguaje), rules/<lang>/*.md, permisos de herramientas | TypeScript strict, Python type hints |
| 3. Framework | 20 | CLAUDE.md (sección framework), rules/<framework>/*.md, skills específicos | Next.js Server Components, FastAPI async |
| 4. Testing/QA | 30 | CLAUDE.md (sección testing), rules/testing/*.md, agente test-writer adaptado | Jest + React Testing Library, Pytest fixtures |
| 5. Infra | 40 | CLAUDE.md (sección infra), rules/infra/*.md, .mcp.json, hooks CI | Docker multi-stage, GitHub Actions |

### Algoritmo de Composición

1. Ordenar profiles por capa (0, 10, 20, 30, 40)
2. Para cada profile, ACUMULAR sus contribuciones:
   - **CLAUDE.md**: Secciones se concatenan en orden de capa
   - **settings.json**: Deep merge con arrays concatenados (permissions.allow, permissions.deny)
   - **rules/**: Se añaden (sin overlap porque cada profile usa su propia ruta)
   - **agents**: Se ENRIQUECEN por nombre (capas posteriores añaden contexto al prompt, skills, hooks)
   - **skills, hooks, MCP**: Se acumulan (aditivos)
3. Validar: sin conflictos de permisos, sin nombres duplicados
4. Aplicar gobernanza (mandatory no degradable)

### Enriquecimiento de Agentes

Cuando múltiples capas contribuyen al mismo agente (ej: `code-reviewer`):
- **Prompt**: Se concatena. El agente base tiene review genérico, TypeScript añade "verificar no `any`", Next.js añade "verificar Server Components"
- **Skills**: Unión de todos
- **Hooks**: Se acumulan
- **Model**: La capa más específica gana

---

## Motor de Detección

### Archivos Escaneados

| Archivo | Analizador | Detecta |
|---|---|---|
| `package.json` | node | TypeScript, React, Next.js, Express, Jest, etc. |
| `tsconfig.json` | node | TypeScript (boost confianza) |
| `pyproject.toml` / `requirements.txt` | python | Python, FastAPI, Django, Pytest |
| `pom.xml` / `build.gradle` | java | Java, Spring Boot, JUnit |
| `go.mod` | go | Go, frameworks Go |
| `Cargo.toml` | rust | Rust, frameworks Rust |
| `*.csproj` | dotnet | .NET, ASP.NET |
| `Dockerfile` / `docker-compose.yml` | docker | Docker, microservicios |
| `.github/workflows/*.yml` | ci | GitHub Actions |
| `nx.json` / `turbo.json` / `lerna.json` | monorepo | Tipo de monorepo |

### Sistema de Confianza

- **>= 90%**: Aplicar automáticamente (strict mode)
- **< 90%**: Preguntar al desarrollador
- Boosting: si `next` en deps (90%) + `next.config.js` existe → 99%

---

## Three-Way Merge (Actualizaciones)

### Participantes
- **BASE**: Contenido original generado (hash en `.diverger-meta.json`)
- **THEIRS**: Archivo actual en disco (puede tener cambios del equipo)
- **OURS**: Contenido nuevo de la versión actualizada de diverger-claude

### Algoritmo
1. Si nadie cambió nada → skip
2. Si solo la librería cambió → auto-apply (seguro)
3. Si solo el equipo cambió → keep (respetar)
4. Si ambos cambiaron → merge inteligente:
   - Archivos estructurados (JSON, YAML): merge por keys/secciones
   - Archivos markdown: merge por secciones (## headers)
   - Conflictos en reglas: governance gana (mandatory de librería no se toca)
   - Otros conflictos: mostrar diff al dev para decidir

### Metadata de Tracking

```json
// .diverger-meta.json (raíz del proyecto)
{
  "version": "1.2.0",
  "generatedAt": "2026-02-28T...",
  "detectedStack": [...],
  "appliedProfiles": ["base", "languages/typescript", "frameworks/nextjs", "testing/jest"],
  "fileHashes": {
    ".claude/rules/typescript/conventions.md": "sha256:...",
    ".claude/agents/code-reviewer.md": "sha256:..."
  },
  "ruleGovernance": {
    "typescript/conventions": "mandatory",
    "typescript/error-handling": "recommended"
  }
}
```

---

## Sistema de Conocimiento (Claude API + Web Search)

### Flujo

1. Se detecta tecnología (ej: Next.js 15)
2. CLI pregunta al dev: "¿Quieres buscar las últimas best practices de Next.js 15?"
3. Si acepta → Claude API con web search busca docs oficiales
4. Claude sintetiza las best practices relevantes
5. Se incorporan como contenido adicional en `rules/<framework>/latest-practices.md`
6. Se cachean localmente para no repetir búsquedas

### API Key

- Key corporativa configurada via variable de entorno `ANTHROPIC_API_KEY`

---

## Seguridad

### Generación Automática

Para cada proyecto, diverger-claude genera:

1. **Deny Rules** en settings.json:
```json
{
  "permissions": {
    "deny": ["Read(.env*)", "Read(**/*.pem)", "Read(**/secrets/**)", "Read(**/.aws/**)", "Read(**/.ssh/**)"]
  }
}
```

2. **Sandbox Config** adaptado:
```json
{
  "sandbox": {
    "filesystem": {
      "denyRead": ["~/.aws/credentials", "~/.ssh/**"]
    }
  }
}
```

3. **Hooks de Validación** (PostToolUse): verifican que no se hayan filtrado datos sensibles

---

## Dependencias npm Principales

| Paquete | Propósito |
|---|---|
| `commander` | Framework CLI |
| `inquirer` v10+ | Prompts interactivos |
| `ora` | Spinners |
| `chalk` v5+ | Colores terminal |
| `fast-glob` | Globbing de archivos |
| `js-yaml` | Parsing YAML |
| `smol-toml` | Parsing TOML |
| `fast-xml-parser` | Parsing XML |
| `handlebars` | Motor de templates |
| `deep-diff` | Diffing de objetos (three-way merge) |
| `deepmerge-ts` | Deep merge tipado |
| `diff` | Diffing de texto (dry-run) |
| `zod` | Validación de schemas |
| `@anthropic-ai/sdk` | Cliente Claude API |
| `vitest` | Test runner (dev) |
| `tsup` | Build/bundle (dev) |

---

## Plan de Implementación (Fases)

### Fase 1: Fundamentos (Core + Detection)
1. Inicializar repositorio: `package.json`, `tsconfig.json`, estructura de directorios
2. Crear `.claude/` propio del proyecto (dogfooding)
3. Implementar `core/types.ts` con todas las interfaces
4. Implementar motor de detección: scanner + analyzers (empezar por node.ts, python.ts)
5. Implementar sistema de confianza (scoring.ts)
6. Tests unitarios para cada analyzer

### Fase 2: Profiles + Composición
7. Implementar profile registry y composer
8. Crear profiles base (universal), typescript, react, nextjs, python, fastapi
9. Implementar algoritmo de composición por capas
10. Implementar enriquecimiento de agentes
11. Tests: composición, conflictos, enriquecimiento

### Fase 3: Generación
12. Implementar generadores: CLAUDE.md, settings, rules, agents, skills, hooks, MCP
13. Implementar generador de seguridad (deny rules + sandbox)
14. Implementar generador de herramientas externas (ESLint, Prettier, tsconfig)
15. Implementar dry-run con diff visual
16. Implementar file-writer con backup atómico

### Fase 4: CLI
17. Implementar CLI con Commander.js
18. Implementar `diverger init` (auto-detect + confirm)
19. Implementar `diverger diff` (dry-run)
20. Implementar `diverger status`
21. UI rica: spinners, colores, tablas, menús
22. Flags: --quiet, --json, --force

### Fase 5: Gobernanza + Merge
23. Implementar .diverger-meta.json tracking
24. Implementar three-way merge
25. Implementar `diverger sync` con merge
26. Implementar clasificación mandatory/recommended

### Fase 6: Knowledge System
27. Implementar cliente Claude API
28. Implementar búsqueda web de docs
29. Implementar caché de conocimiento
30. Integrar en flujo de init y sync

### Fase 7: Adaptación Continua
31. Implementar hook SessionStart (change-detector + auto-updater)
32. Implementar skill /diverger-sync
33. Implementar detección de monorepo
34. Implementar config distributor para monorepos

### Fase 8: Plugin
35. Crear estructura de plugin (.claude-plugin/, commands/, agents/, skills/, hooks/)
36. Empaquetar plugin assets con el npm package
37. Documentar instalación del plugin

### Fase 9: Greenfield + Polish
38. Implementar wizard para proyectos nuevos
39. Implementar document-parser (ARCHITECTURE.md)
40. Implementar templates predefinidos
41. Implementar `diverger eject`
42. Implementar `diverger check` (validación)

### Fase 10: Testing + Release
43. Tests de integración con fixtures reales
44. Tests E2E del CLI
45. Documentación en español (README, guías)
46. Setup GitHub Actions CI/CD
47. Publicar en GitHub Packages
48. Setup Dependabot/Renovate template

---

## Verificación

### Cómo probar que funciona end-to-end

1. **Test con proyecto Next.js real**:
   ```bash
   cd mi-proyecto-nextjs
   npx diverger-claude diff    # dry-run: ver qué generaría
   npx diverger-claude init    # generar config
   claude                      # abrir Claude Code y verificar que las reglas se cargan
   ```

2. **Test con proyecto Python**:
   ```bash
   cd mi-proyecto-fastapi
   npx diverger-claude init
   # Verificar que .claude/rules/ contiene reglas de Python+FastAPI
   ```

3. **Test de actualización**:
   ```bash
   npm update @empresa/diverger-claude
   npx diverger-claude sync    # verificar three-way merge
   ```

4. **Test monorepo**:
   ```bash
   cd mi-monorepo-turbo
   npx diverger-claude init    # verificar root + per-package configs
   ```

5. **Tests automatizados**: `npm test` ejecuta unit + integration + e2e

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Detección incorrecta de stack | Media | Alto | Strict mode: siempre confirmar si <90%. Dry-run obligatorio. |
| Three-way merge corrompe config del equipo | Baja | Crítico | Backup automático antes de cada merge. Revert fácil. |
| Claude API web search devuelve info incorrecta | Media | Medio | Mostrar resultado al dev para aprobación. Caché con TTL. |
| Profiles desactualizados (React 22 sale) | Alta | Medio | Versionado de profiles. Claude API complementa con docs actuales. |
| Conflictos entre profiles | Baja | Medio | Cada capa tiene scope aislado. Validator detecta conflictos. |
| Coste API Claude para 100+ proyectos | Media | Medio | Caché agresivo. Solo buscar docs en init/sync, no cada sesión. |
