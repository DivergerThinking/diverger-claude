# Guia de Flujos — diverger-claude v3.3.0

Referencia completa de todos los flujos del sistema, como activarlos y que hacen.

## Tabla resumen

| # | Flujo | Activacion | Tipo | Que hace |
|---|-------|-----------|------|----------|
| 1 | Instalacion npm | `npm install` | Manual | Instala el CLI globalmente |
| 2 | Plugin install via CLI | `diverger plugin install` | Manual | Descarga plugin desde GitHub Releases |
| 3 | Plugin install via Marketplace | `/plugin install` en Claude | Manual | Instala desde marketplace de Claude Code |
| 4 | Actualizacion | `diverger update --all` | Manual | Actualiza CLI + plugin a ultima version |
| 5 | Deteccion de stack | `diverger init` / MCP `detect_stack` | Manual | Escanea proyecto y detecta tecnologias |
| 6 | Generacion de config | `diverger init` / MCP `generate_config` | Manual | Genera `.claude/` completa adaptada al stack |
| 7 | Sincronizacion | `diverger sync` / MCP `sync_config` | Manual | Re-detecta stack y aplica three-way merge |
| 8 | Verificacion | `diverger status` / MCP `check_config` | Manual | Valida config existente contra stack actual |
| 9 | Diff | `diverger diff` | Manual | Muestra cambios pendientes sin aplicar |
| 10 | Secret scanner | Automatico (PreToolUse/Write) | Hook | Bloquea escritura de archivos con secretos |
| 11 | Destructive cmd blocker | Automatico (PreToolUse/Bash) | Hook | Bloquea comandos peligrosos |
| 12 | Pre-commit validator | Automatico (PreToolUse/Bash) | Hook | Bloquea commits sin build o con errores TS |
| 13 | Check long lines | Automatico (PostToolUse/Write) | Hook | Advierte sobre lineas >300 chars |
| 14 | Check trailing newline | Automatico (PostToolUse/Write) | Hook | Advierte si falta newline final |
| 15 | Error tracker | Automatico (PostToolUse/Write,Edit,Bash) | Hook | Captura errores para aprendizaje |
| 16 | Session learner | Automatico (SessionEnd) | Hook | Prepara errores para procesamiento |
| 17 | /diverger-init | Manual (skill) | Skill | Detecta stack y genera config |
| 18 | /diverger-status | Manual (skill) | Skill | Muestra estado del stack |
| 19 | /diverger-sync | Manual (skill) | Skill | Sincroniza config con cambios |
| 20 | /diverger-check | Manual (skill) | Skill | Valida config y detecta issues |
| 21 | /diverger-learn | Manual (skill) | Skill | Revisa patrones aprendidos |
| 22 | /diverger-repair | Manual (skill) | Skill | Diagnostica y repara .claude/ |
| 23 | /diverger-health | Manual (skill) | Skill | Verifica salud del plugin (9 checks) |
| 24 | /diverger-evolve | Manual (skill) | Skill | Recomienda actualizaciones de config |
| 25 | /diverger-ci-learn | Manual (skill) | Skill | Analiza fallos de CI y extrae aprendizajes |
| 26 | /diverger-audit | Manual (skill) | Skill | Auditoria integral del proyecto |
| 27 | /diverger-test-suite | Manual (skill) | Skill | Analiza cobertura y genera tests |
| 28 | /diverger-pr-review | Manual (skill) | Skill | Review exhaustivo de PR |
| 29 | /diverger-onboard | Manual (skill) | Skill | Genera documentacion de onboarding |
| 30 | /diverger-migrate | Manual (skill) | Skill | Planifica migraciones tecnologicas |
| 31 | /diverger-release | Manual (skill) | Skill | Checklist de release completo |
| 32 | /architecture-style-guide | Manual (skill) | Skill | Guia de estilo de arquitectura |
| 33 | /git-workflow-guide | Manual (skill) | Skill | Guia de flujo Git |
| 34 | /security-guide | Manual (skill) | Skill | Guia de seguridad OWASP |
| 35a | /diverger-doctor | Manual (skill) | Skill | Score de salud 0-100 con recomendaciones |
| 35b | /diverger-quickstart | Manual (skill) | Skill | Guia post-init de 5 minutos |
| 35c | /diverger-welcome | Manual (skill) | Skill | Briefing de proyecto (<40 lineas) |
| 35 | Aprendizaje de errores | Automatico (SessionStart) | Inteligencia | Clasifica errores y genera reglas |
| 36 | Ingesta de CI | Semi-auto (notifica + skill) | Inteligencia | Parsea logs CI y alimenta aprendizaje |
| 37 | Auto-reparacion | Automatico (SessionStart) | Inteligencia | Repara .claude/ segun modelo de confianza |
| 38 | Evolucion adaptativa | Semi-auto (skill) | Inteligencia | Detecta cambios de stack y recomienda |
| 39 | Deteccion tech desconocida | Automatico (durante evolucion) | Inteligencia | Identifica deps sin profile y sugiere Issue |
| 40 | Memoria persistente | Automatico (SessionStart/End) | Inteligencia | Sync a .diverger-memory.json y Claude memory |
| 41 | Plugin health monitoring | Semi-auto (skill/MCP) | Inteligencia | 9 health checks + auto-fix |
| 42 | Three-way merge | Automatico (durante sync) | Gobernanza | Merge inteligente BASE vs THEIRS vs OURS |
| 43 | Enforcement de reglas | Automatico (durante generacion) | Gobernanza | Fuerza reglas mandatory/recommended |
| 44 | Consolidacion de memoria | Automatico (cada 7 dias) | Inteligencia | Pruning y merge de memoria |
| 45 | /diverger-welcome | Manual (skill) | Skill | Briefing de proyecto (<40 lineas) |
| 46 | Interpolacion de templates | Automatico (durante composicion) | Generacion | Resuelve {{lang.*}}, {{ci.*}}, {{docker.*}} segun lenguaje detectado |
| 47 | Validacion de hooks | Automatico (durante generacion) | Generacion | Detecta scripts huerfanos y referencias a scripts faltantes |

---

## 1. Flujos de Instalacion y Setup

### 1.1 Instalacion del paquete npm

**Activacion**: Manual
**Comando**: `npm install -g @divergerthinking/diverger-claude --@divergerthinking:registry=https://npm.pkg.github.com`

**Requisitos**:
- Node.js 20+
- PAT de GitHub con scope `read:packages`
- Archivo `~/.npmrc` con `//npm.pkg.github.com/:_authToken=TOKEN`

**Flujo**:
1. npm descarga el paquete desde GitHub Packages
2. Se instala globalmente con los binarios `diverger` y `diverger-claude`
3. Se registra tambien `diverger-mcp` para el servidor MCP

**Output**: CLI disponible como comando `diverger` en terminal.

---

### 1.2 Plugin install via CLI

**Activacion**: Manual
**Comando**: `diverger plugin install`

**Requisitos**:
- GitHub CLI autenticado (`gh auth login`)
- O variable de entorno `GITHUB_TOKEN` / `GH_TOKEN`

**Flujo**:
1. Consulta la API de GitHub para obtener el ultimo release tag
2. Para repos privados: usa token de `gh auth token` para autenticarse
3. Descarga el asset `.tar.gz` del release
4. Extrae en `~/.claude/plugins/diverger-claude/`
5. Verifica la estructura del plugin (plugin.json, hooks, skills, agents, MCP)
6. **Registra el plugin en `~/.claude/settings.json`** (`enabledPlugins["diverger-claude"]: true`)
7. Ofrece ejecutar `diverger init --force` para regenerar config en modo plugin
8. Ofrece ejecutar `diverger cleanup` para eliminar duplicados

**Output**: Plugin instalado en `~/.claude/plugins/diverger-claude/` con todos sus componentes activos.

**Version especifica**: `diverger plugin install --tag v2.4.0`

---

### 1.3 Plugin install via Marketplace

**Activacion**: Manual (desde una sesion de Claude Code)
**Comando**: `/plugin marketplace add DivergerThinking/diverger-claude` + `/plugin install diverger-claude@divergerthinking-tools`

**Flujo**: Claude Code descarga e instala el plugin desde el marketplace.

**Output**: Plugin activo en la sesion de Claude Code.

---

### 1.4 Actualizacion

**Activacion**: Manual
**Comandos**:
- `diverger update --check` — solo verifica si hay actualizacion
- `diverger update` — actualiza el CLI
- `diverger update --all` — actualiza CLI + plugin

**Flujo**:
1. Consulta npm registry para la ultima version disponible
2. Compara con la version local instalada
3. Si hay nueva version: descarga e instala
4. Si `--all`: tambien ejecuta `diverger plugin install` para actualizar el plugin

**Output**: CLI y/o plugin actualizados a la ultima version.

---

## 2. Flujos de Deteccion y Configuracion

### 2.1 Deteccion de stack

**Activacion**: Manual (`diverger init`, `diverger status`) o Programatico (MCP `detect_stack`)
**Archivos fuente**: `src/detection/scanner.ts`, `src/detection/index.ts`, `src/detection/scoring.ts`

**Flujo**:
1. **Escaneo de filesystem**: `fast-glob` busca 80+ patrones de archivos (manifiestos, configs, Dockerfiles, CI)
   - Ignora: `node_modules/`, `dist/`, `build/`, `.git/`, `vendor/`, `.next/`, `target/`
2. **Analisis por 10 analizadores**: Cada uno busca tecnologias en los archivos encontrados
   - `node` — Node.js, npm, yarn, pnpm, TypeScript, ESLint, Prettier
   - `python` — Python, pip, poetry, pipenv
   - `java` — Java, Maven, Gradle, Spring Boot
   - `go` — Go, GoModule
   - `rust` — Rust, Cargo
   - `dotnet` — .NET, C#, MSBuild
   - `ci` — GitHub Actions, GitLab CI, CircleCI, Travis CI
   - `docker` — Docker, Docker Compose
   - `mobile` — React Native, Expo, Flutter, SwiftUI, Jetpack Compose
   - `runtime` — Deno, Bun, versiones de Node.js
3. **Scoring de confianza**: Cada evidencia tiene un peso (0-100). Se calcula:
   - Base = mayor peso individual de todas las evidencias
   - Boost = evidencias adicionales aportan bonus decreciente
   - Resultado = min(100, base + boost)
   - **Boosting**: TypeScript boosted por Node.js, Next.js por React, etc.
4. **Deduplicacion**: Si multiples analizadores detectan la misma tech, se queda la de mayor confianza
5. **Threshold**: Confianza >= 90 = auto-aplicar; < 90 = preguntar al usuario (en modo interactivo)

**Output**: Lista de tecnologias con nombre, version, confianza, evidencias y profiles asociados.

---

### 2.2 Generacion de configuracion

**Activacion**: Manual (`diverger init`) o Programatico (MCP `generate_config`)
**Archivos fuente**: `src/core/orchestrator.ts`, `src/profiles/`, `src/generation/`

**Flujo**:
1. **Deteccion** (flujo 2.1)
2. **Confirmacion** (modo interactivo): Muestra techs detectadas, usuario confirma/deselecciona
3. **Composicion de profiles** en 5 capas:
   - Capa 0 (Base): Profile universal — reglas, agentes, hooks comunes a todo proyecto
   - Capa 10 (Language): TypeScript, Python, Java, Go, Rust, etc.
   - Capa 20 (Framework): Next.js, Express, React, Vue, Django, Spring, etc.
   - Capa 30 (Testing): Vitest, Jest, Pytest, JUnit, etc.
   - Capa 40 (Infra): Docker, GitHub Actions, GitLab CI, Terraform, etc.
   - **Composicion**: Secciones de CLAUDE.md se concatenan, settings.json se hace deep merge, agentes se enriquecen
4. **Generacion de archivos**:
   - `.claude/CLAUDE.md` — Instrucciones principales del proyecto
   - `.claude/settings.json` — Permisos y configuracion
   - `.claude/rules/*.md` — Reglas por dominio (architecture, security, git-workflow, etc.)
   - `.claude/agents/*.md` — Definiciones de agentes (en modo no-plugin)
   - `.claude/skills/*/SKILL.md` — Definiciones de skills (en modo no-plugin)
   - `.claude/hooks/` — Scripts de hooks (en modo no-plugin)
   - `.diverger-meta.json` — Metadata para three-way merge futuro
5. **Modo plugin**: Si el plugin esta instalado, solo genera config tech-specific (el plugin provee lo universal)

**Output**: Directorio `.claude/` completo y configurado.

**Opciones**:
- `--force` — Sobrescribe sin preguntar
- `--dry-run` — Muestra cambios sin escribir
- `--plugin-mode` — Solo genera config tech-specific
- `--no-plugin` — Genera todo incluso si hay plugin

---

### 2.3 Sincronizacion (Three-Way Merge)

**Activacion**: Manual (`diverger sync`) o Programatico (MCP `sync_config`)
**Archivos fuente**: `src/governance/merge.ts`, `src/governance/index.ts`

**Flujo**:
1. **Re-deteccion** del stack actual
2. **Generacion nueva** de config desde los profiles actualizados
3. **Comparacion three-way** para cada archivo:
   - **BASE** = contenido original cuando se genero (almacenado en `.diverger-meta.json`)
   - **OURS** = nueva version generada (lo que la libreria quiere poner)
   - **THEIRS** = contenido actual en disco (lo que el equipo tiene)
4. **Determinacion de outcome** por archivo:

   | BASE vs OURS | BASE vs THEIRS | Outcome |
   |-------------|----------------|---------|
   | Iguales | Iguales | `skip` — nadie cambio nada |
   | Diferentes | Iguales | `auto-apply` — solo la libreria cambio |
   | Iguales | Diferentes | `keep` — solo el equipo cambio (salvo mandatory) |
   | Diferentes | Diferentes | Smart merge o `conflict` |

5. **Smart merge** (si ambos cambiaron):
   - **Markdown**: Merge por secciones (`## heading`). Cada seccion se compara independientemente contra BASE. El equipo gana en conflictos de misma seccion; la libreria puede agregar secciones nuevas.
   - **JSON**: Deep merge key-by-key. Arrays se unen y deduplican. En conflicto de escalares, el equipo gana.
6. **Governance override**: Si la regla es `mandatory`, la libreria siempre gana (fuerza su version).
7. **Escritura**: Archivos actualizados + metadata actualizada

**Output**: Reporte con archivos actualizados, preservados, mergeados y conflictos.

**Opciones de `sync_config`**:
- `resolveConflicts: 'ours'` — Libreria gana en conflictos (default)
- `resolveConflicts: 'theirs'` — Equipo gana en conflictos
- `resolveConflicts: 'report'` — Solo reporta, no escribe
- `dryRun: true` — Muestra cambios sin aplicar

---

### 2.4 Verificacion de estado

**Activacion**: Manual (`diverger status`, `diverger check`) o Programatico (MCP `check_config`)

**`diverger status`** — Muestra:
1. Metadata: version, fecha de generacion, profiles aplicados
2. Tecnologias detectadas con confianza y evidencias
3. Estado del plugin (instalado/version/sync con CLI)

**`diverger check`** / `check_config` — Valida:
1. `.claude/CLAUDE.md` existe
2. `.claude/settings.json` es JSON valido
3. Reglas mandatory no fueron borradas
4. Reglas mandatory no fueron modificadas
5. Directorio de reglas tiene contenido

**Output**: Lista de issues con severidad (error/warning) y archivo afectado.

---

### 2.5 Diff de cambios

**Activacion**: Manual (`diverger diff`)

**Flujo**: Ejecuta deteccion + sync sin escribir. Muestra diff unificado de cada archivo.

**Output**: Diff por archivo (added/modified/deleted) con conteo total.

---

## 3. Flujos de Proteccion (Hooks)

Todos los hooks se ejecutan **automaticamente** via eventos de Claude Code. No requieren configuracion.

### Tipos de hooks en Claude Code

Claude Code soporta 4 tipos de handlers para hooks: `command` (script), `prompt` (LLM evalua en 1 turno), `agent` (subagente multi-turno), `http` (HTTP POST a endpoint).

diverger-claude usa exclusivamente hooks de tipo `command` — scripts bash que reciben JSON por stdin y pueden retornar decisiones (allow/deny).

Los hooks NO son "de agente" ni "de prompt" — son hooks de ciclo de vida que se ejecutan en eventos especificos (PreToolUse, PostToolUse, SessionEnd) independientemente de si la accion la inicio el usuario o un agente.

### 3.1 Secret Scanner

**Evento**: `PreToolUse` en herramienta `Write`
**Trigger**: Cada vez que Claude intenta escribir un archivo
**Script**: `secret-scanner.sh`

**Que verifica**:
- Claves AWS (`AKIA...`)
- API keys de Google (`AIza...`)
- Tokens de OpenAI (`sk-...`)
- Tokens de GitHub (`ghp_...`, `github_pat_...`)
- Headers de clave privada (`-----BEGIN PRIVATE KEY-----`)
- Patrones de password/secret/api_key hardcodeados

**Si detecta secreto**:
- Retorna JSON con `permissionDecision: "deny"` y razon
- Claude Code **bloquea la escritura** y muestra el motivo al usuario

**Si no detecta**: Exit 0 (permite la escritura)

---

### 3.2 Destructive Command Blocker

**Evento**: `PreToolUse` en herramienta `Bash`
**Trigger**: Cada vez que Claude intenta ejecutar un comando bash
**Script**: `destructive-cmd-blocker.sh`

**Que verifica**:
- `git push --force` / `git push -f`
- `git reset --hard`
- `rm -rf /`
- `git clean -fd`
- `curl`/`wget` pipeado a `bash`/`sh`/`sudo`

**Si detecta comando peligroso**: Bloquea con deny + razon explicativa.

---

### 3.3 Pre-Commit Validator

**Evento**: `PreToolUse` en herramienta `Bash`
**Trigger**: Solo cuando el comando es `git commit`
**Script**: `pre-commit-validator.sh`

**Que verifica**:
1. **Version del plugin**: `package.json` version == `plugin/.claude-plugin/plugin.json` version
   - Si difieren: "Plugin build stale — run `npm run build:plugin` first"
2. **TypeScript**: `npx tsc --noEmit --pretty false`
   - Si hay errores: "TypeScript compilation: N error(s) found"

**Si alguna falla**: Bloquea el commit con deny + detalle de errores.

**Timeout**: 30 segundos (tsc puede tardar en proyectos grandes).

---

### 3.4 Check Long Lines

**Evento**: `PostToolUse` en herramienta `Write`
**Trigger**: Despues de que Claude escribe un archivo
**Script**: `check-long-lines.sh`

**Que verifica**: Si alguna linea del archivo supera 300 caracteres.

**Si detecta**: Imprime warning a stderr. Exit code 2 (warning, no bloquea).

---

### 3.5 Check Trailing Newline

**Evento**: `PostToolUse` en herramienta `Write`
**Trigger**: Despues de que Claude escribe un archivo
**Script**: `check-trailing-newline.sh`

**Que verifica**: Si el archivo termina con un caracter de nueva linea.

**Si falta newline**: Warning a stderr. Exit code 2.

---

### 3.6 Error Tracker

**Evento**: `PostToolUse` en herramientas `Write`, `Edit`, `Bash`
**Trigger**: Despues de cada uso de estas herramientas
**Script**: `error-tracker.sh`

**Flujo**:
1. Lee el JSON de entrada del hook
2. Si el campo `error` no existe: exit 0 (no hay error)
3. Si hay error:
   - Lee o crea `.claude/session-errors.local.json`
   - Agrega entrada: `{ message, tool, timestamp }`
   - Guarda el archivo actualizado

**Output**: Errores acumulados en `.claude/session-errors.local.json` (procesados en la siguiente sesion).

---

### 3.7 Session Learner

**Evento**: `SessionEnd`
**Trigger**: Cuando la sesion de Claude Code termina
**Script**: `session-learner.sh`

**Flujo**:
1. Verifica si `.claude/session-errors.local.json` existe
2. Si no existe: exit 0
3. Si existe y tiene 0 entradas: elimina el archivo
4. Si tiene entradas: lo deja para procesamiento en la proxima sesion

**Output**: Archivo preparado para `onSessionStart()`.

---

## 4. Flujos de Skills

Todos los skills se activan **manualmente** escribiendo su nombre con `/` en una sesion de Claude Code.

### 4.1 Skills de Configuracion

| Skill | Que hace | Tools MCP que usa |
|-------|----------|-------------------|
| `/diverger-init` | Detecta stack completo y genera configuracion `.claude/` adaptada | `detect_stack`, `generate_config` |
| `/diverger-status` | Muestra tecnologias detectadas y valida configuracion actual | `detect_stack`, `check_config` |
| `/diverger-sync` | Re-detecta stack y aplica three-way merge para actualizar config | `sync_config` |
| `/diverger-check` | Valida configuracion contra reglas de gobernanza | `check_config` |

---

### 4.2 Skills de Inteligencia

| Skill | Que hace | Tools MCP que usa |
|-------|----------|-------------------|
| `/diverger-learn` | Muestra patrones de error, anti-patterns, best practices y estadisticas | `get_memory` |
| `/diverger-repair` | Diagnostica problemas en `.claude/` y ofrece reparacion automatica | `repair_config` |
| `/diverger-health` | Ejecuta 9 health checks del plugin y reporta estado | `check_plugin_health` |
| `/diverger-evolve` | Analiza cambios de dependencias/arquitectura y recomienda updates de config | `detect_stack`, `get_memory` |
| `/diverger-ci-learn` | Obtiene logs de CI fallidos, los parsea y alimenta el pipeline de aprendizaje | `ingest_ci_errors` |

**Detalle de `/diverger-ci-learn`**:
1. Detecta proveedor CI (busca `.github/workflows/` o `.gitlab-ci.yml`)
2. Obtiene runs fallidos: `gh run list --status=failure --limit=5`
3. Para cada run: `gh run view {id} --log-failed`
4. Parsea logs y extrae errores estructurados
5. Procesa via pipeline de aprendizaje (clasificacion, patrones, reglas)
6. Reporta: errores encontrados, patrones descubiertos, reglas generadas

---

### 4.3 Skills de Workflows

Estos skills son complejos y guian a Claude paso a paso. Todos desactivan invocacion automatica por el modelo (`disable-model-invocation: true`).

#### `/diverger-audit`
Auditoria integral del proyecto.
1. Detecta stack
2. Auditoria de seguridad (OWASP Top 10)
3. Auditoria de calidad de codigo
4. Auditoria de testing (cobertura)
5. Auditoria de configuracion
6. Consulta memoria para context
7. Genera reporte con hallazgos y recomendaciones

#### `/diverger-test-suite`
Analisis de cobertura y generacion de tests.
1. Detecta stack y framework de testing
2. Analiza cobertura actual
3. Examina patrones de test existentes
4. Genera tests para areas descubiertas
5. Ejecuta tests generados
6. Reporta mejora de cobertura

#### `/diverger-pr-review`
Review exhaustivo de PR.
1. Obtiene contexto del PR (`gh pr view`)
2. Detecta stack del proyecto
3. Consulta memoria (anti-patterns conocidos)
4. Review de calidad de codigo
5. Review de seguridad
6. Review especifico del stack (ej: React hooks, Express middleware)
7. Genera reporte con checklist

#### `/diverger-onboard`
Documentacion de onboarding para nuevos desarrolladores.
1. Detecta stack
2. Mapea estructura del proyecto
3. Documenta flujos principales
4. Documenta setup de desarrollo
5. Documenta convenciones del equipo
6. Consulta memoria
7. Genera `ONBOARDING.md`

#### `/diverger-migrate`
Planificacion y ejecucion de migraciones tecnologicas.
1. Detecta stack actual
2. Identifica migracion requerida
3. Crea plan paso a paso
4. Presenta al usuario para aprobacion
5. Ejecuta pasos incrementalmente
6. Verifica tras cada paso
7. Registra aprendizaje (`record_learning`)

#### `/diverger-release`
Checklist de release completo.
1. Detecta stack y CI
2. Pre-flight checks (branch correcta, sin cambios uncommitted)
3. **Validacion de consistencia** (obligatorio):
   - `npm run build` (incluye build:plugin)
   - plugin.json version == package.json version
   - `npm run typecheck` sin errores
   - `npm test` con cobertura
   - Si ALGUNO falla, DETENER release
4. Determinar nueva version (analiza commits para sugerir MAJOR/MINOR/PATCH)
5. Actualizar CHANGELOG.md (agrupa commits por tipo)
6. Bump de version en manifiesto
7. Commit, tag, push
8. Post-release: verificar CI, sugerir GitHub Release

---

### 4.4 Skills de Referencia

| Skill | Que hace |
|-------|----------|
| `/architecture-style-guide` | Referencia completa de estructura, naming, funciones, comments, error handling |
| `/git-workflow-guide` | Conventional Commits, branch discipline, pre-commit checklist |
| `/security-guide` | OWASP Top 10 2025 con reglas, ejemplos correctos y anti-patterns |

---

## 5. Flujos de Inteligencia

### 5.1 Ciclo de Aprendizaje de Errores

**Activacion**: Automatico
**Trigger**: Al iniciar una nueva sesion de Claude Code en un proyecto con diverger configurado

**Flujo completo**:

```
Sesion N: Error ocurre
  |
  v
[error-tracker.sh] captura error en session-errors.local.json
  |
  v
Sesion N termina
  |
  v
[session-learner.sh] prepara archivo para proxima sesion
  |
  v
Sesion N+1 inicia
  |
  v
[onSessionStart()] lee session-errors.local.json
  |
  v
[ErrorAnalyzer] clasifica cada error con 15 patrones regex:
  - permission denied → tool-error (confianza 80)
  - TS\d{4}: → code-pattern (confianza 60)
  - hook.*fail → hook-failure (confianza 85)
  - JSON.parse error → config-issue (confianza 75)
  - etc.
  |
  v
[PatternMatcher] busca patron existente o crea nuevo:
  - Si existe: incrementa occurrences, actualiza lastSeen
  - Si no existe: crea nuevo patron con occurrences=1
  |
  v
[RuleGenerator] verifica threshold:
  - Si occurrences >= 3 Y no hay regla generada:
    * Genera .claude/rules/learned/{id}.md
    * Marca pattern.ruleGenerated = true
    * Claude Code lee automaticamente esta regla
  |
  v
Elimina session-errors.local.json
```

**Archivos fuente**:
- `src/learning/error-analyzer.ts` — 15 clasificadores con patrones regex y confianza
- `src/learning/pattern-matcher.ts` — Matching y almacenamiento de patrones
- `src/learning/rule-generator.ts` — Generacion de reglas .md

**Resultado**: Despues de 3 ocurrencias de un mismo tipo de error, se genera automaticamente una regla que Claude Code lee al inicio de cada sesion, previniendo que el error se repita.

---

### 5.2 Ingesta de CI

**Activacion**: Semi-automatico
**Trigger**: Notificacion automatica al iniciar sesion + skill manual

**Flujo**:
1. **Notificacion** (automatica en `onSessionStart`):
   - Si existe `.github/workflows/` y hay un run fallido reciente (posterior a la ultima sesion)
   - Muestra: "CI failure detected (run #123) — run /diverger-ci-learn to analyze"
2. **Analisis** (manual con `/diverger-ci-learn`):
   - Obtiene logs de runs fallidos via `gh run view --log-failed`
   - Parsea formato tab-separated de GitHub Actions: `{job}\t{step}\t{message}`
   - O formato de GitLab CI: section markers + bloques de error
   - Extrae errores estructurados
   - Los convierte a formato SessionError
   - Los procesa por el mismo pipeline de aprendizaje (clasificacion, patrones, reglas)

**Patrones de deteccion en logs CI**:
- `##[error]` — Marcador de error de GitHub Actions
- `error TS\d+` — Errores de TypeScript
- `ENOENT`, `EACCES` — Errores de filesystem
- `npm ERR!` — Errores de npm
- `AssertionError`, `SyntaxError` — Errores de JavaScript
- `version.*mismatch`, `build:plugin` — Errores de configuracion

**Proveedores soportados**: GitHub Actions, GitLab CI

---

### 5.3 Auto-Reparacion

**Activacion**: Automatico (en `onSessionStart`) o Manual (`/diverger-repair`, MCP `repair_config`)
**Archivos fuente**: `src/repair/engine.ts`, `src/repair/diagnostics.ts`

**9 Diagnosticos**:

| ID | Problema | Confianza | Severidad | Auto-fixable |
|----|----------|-----------|-----------|--------------|
| D1 | CLAUDE.md faltante | 95 | critical | Si |
| D2 | settings.json invalido (JSON roto) | 90 | critical | Si |
| D3 | Regla mandatory borrada | 95 | critical | Si |
| D4 | Regla mandatory modificada | 80 | warning | Si |
| D5 | Config desactualizada (>30 dias) | 60 | info | No |
| D6 | Paths invalidos en configs | 70 | warning | Si |
| D7 | Meta file corrupto | 85 | critical | Si |
| D8 | Rules directory faltante | 90 | critical | Si |
| D9 | Settings.json faltante | 90 | critical | Si |

**Modelo de confianza**:

| Confianza | Accion | Ejemplo |
|-----------|--------|---------|
| >= 90 | Auto-fix **silencioso** | D1: Regenerar CLAUDE.md sin preguntar |
| >= 70 | Auto-fix + **notificacion** | D4: Restaurar regla mandatory, notificar al usuario |
| >= 50 | **Sugerencia** al usuario | D5: Sugerir re-sync |
| < 50 | Solo **reportar** | Caso incierto, solo informar |

**Flujo**:
1. Ejecuta los 9 diagnosticos contra `.claude/`
2. Filtra los auto-reparables (confianza >= 70)
3. Ejecuta reparaciones (regenerar archivo, restaurar desde meta, etc.)
4. Registra reparaciones en memoria (fire-and-forget)
5. Retorna reporte

---

### 5.4 Evolucion Adaptativa

**Activacion**: Semi-automatico
**Trigger**: `/diverger-evolve` o durante analisis del advisor
**Archivos fuente**: `src/evolution/advisor.ts`, `src/evolution/dependency-mapper.ts`

**Flujo**:
1. Compara dependencias actuales vs dependencias trackeadas en `.diverger-meta.json`
2. **Nuevas dependencias**: Mapea contra ~60 paquetes conocidos
   - Si mapea a una tecnologia con profile disponible: sugiere agregar profile
   - Ejemplo: Se instala `@nestjs/core` → sugiere profile `nestjs`
3. **Dependencias removidas**: Si la tech asociada ya no es necesaria, sugiere remover profile
4. **Tecnologias desconocidas**: Deps que no mapean a nada conocido y parecen frameworks
   - Filtradas por heuristica (excluye utilidades como lodash, axios, uuid)
   - Incluye patrones: `*-cli`, `@*/core`, `vite-plugin-*`, `-framework`
5. **Cambios de arquitectura**: Analiza estructura de directorios
   - Detecta patrones: monolito, microservicios, monorepo

**Tipos de advice**:
- `new-profile` — Nueva dependencia mapea a profile disponible
- `dependency-update` — Dependencia removida, profile posiblemente innecesario
- `unknown-technology` — Dependencia no reconocida, posible nuevo profile necesario
- `architecture-change` — Patron arquitectonico nuevo detectado

---

### 5.5 Deteccion de Tecnologia Desconocida

**Activacion**: Automatico (durante flujo de evolucion)
**Archivos fuente**: `src/detection/unknown-tech-tracker.ts`, `src/detection/unknown-tech-filters.ts`

**Flujo**:
1. Durante analisis de evolucion, identifica dependencias sin mapping
2. Aplica filtros:
   - **Excluye utilidades**: lodash, axios, moment, uuid, chalk, etc. (~50 paquetes)
   - **Incluye frameworks**: Patrones como `@scope/core`, `*-cli`, `*-framework`
3. Si hay dependencias que pasan el filtro:
   - Sugiere abrir GitHub Issue en el repo del plugin
   - Usa `gh issue create` con label `technology-request,auto-detected`
   - Verifica que no exista Issue duplicado antes de crear

---

### 5.6 Memoria Persistente

**Activacion**: Automatico
**Trigger**: Inicio y fin de cada sesion
**Archivos fuente**: `src/memory/store.ts`, `src/memory/index.ts`

**Almacenamiento**:
- `.diverger-memory.json` — Memoria del proyecto (local, en .gitignore)
- `~/.diverger/memory.json` — Memoria global cross-project
- `~/.claude/projects/<project>/memory/MEMORY.md` — Sync con Claude Code nativo

**Contenido de la memoria**:
- Error patterns (max 200) — Patrones de error con frecuencia y estado de regla
- Repair log (max 500) — Historial de reparaciones
- Evolution log (max 200) — Cambios de dependencias/arquitectura
- Anti-patterns (max 100) — Practicas a evitar con razon y alternativa
- Best practices (max 50) — Buenas practicas confirmadas
- Stats — Contadores de sesiones, reparaciones, patrones, reglas

**Sync con Claude Code**:
- Al inicio de sesion, los top 5 anti-patterns y top 3 error patterns se sincronizan a `MEMORY.md`
- Usa seccion delimitada `<!-- diverger:start -->...<!-- diverger:end -->` para no interferir

---

### 5.7 Plugin Health Monitoring

**Activacion**: Semi-automatico (`/diverger-health` o MCP `check_plugin_health`)
**Archivos fuente**: `src/plugin-health/monitor.ts`

**9 Health Checks**:

| Check | Que valida | Auto-fixable |
|-------|-----------|--------------|
| plugin-json | plugin.json existe y es JSON valido | Si |
| hooks-json | hooks.json existe y es JSON valido | Si |
| hook-scripts | Todos los scripts referenciados existen | Si |
| mcp-server | Servidor MCP es valido | Si |
| mcp-config | Config MCP es valida | Si |
| agents-integrity | Archivos .md de agentes existen | Si |
| skills-integrity | Todos los skills tienen SKILL.md | Si |
| version-consistency | Version del plugin == version del CLI | Si |
| constants-consistency | Constantes UNIVERSAL_* coinciden con contenido real | Si |

**Status global**:
- **healthy** — Todos los checks pasan
- **degraded** — Algun check degraded (ninguno unhealthy)
- **unhealthy** — Algun check fallo

---

## 6. Flujos de Gobernanza

### 6.1 Three-Way Merge

**Activacion**: Automatico (durante `sync_config`)
**Archivos fuente**: `src/governance/merge.ts`

Ver seccion 2.3 para el flujo completo. Resumen:

- **Markdown**: Merge por secciones `## heading`. Ambos lados pueden agregar secciones nuevas. En conflicto de misma seccion, el equipo gana.
- **JSON**: Deep merge key-by-key. Arrays se unen. En conflicto de escalares, el equipo gana.
- **Governance override**: Reglas `mandatory` siempre fuerzan la version de la libreria.

---

### 6.2 Enforcement de Reglas

**Activacion**: Automatico (durante generacion y sync)

Dos niveles:
- **mandatory** — La libreria siempre gana, incluso si el equipo modifico la regla
  - Ejemplos: `security.md`, `architecture-and-style.md`
- **recommended** — Si el equipo modifico la regla, se preserva su version
  - Ejemplos: `development-process.md`, `git-workflow.md`

---

### 6.3 Consolidacion de Memoria

**Activacion**: Automatico (cada 7 dias)
**Trigger**: `onSessionStart()` verifica `lastConsolidation`

**Que hace**:
- **Pruning**: Elimina patterns con >90 dias y <3 ocurrencias
- **Merge**: Combina anti-patterns similares
- **Caps**: Aplica limites maximos (200 patterns, 500 repairs, 100 anti-patterns, 50 best practices)

---

## 7. Flujos MCP (Programaticos)

14 herramientas accesibles via el servidor MCP (`diverger-mcp`):

### Configuracion (8 tools)

| Tool | Parametros | Retorna |
|------|-----------|---------|
| `detect_stack` | `projectDir` | `technologies[], monorepo?, architecture?` |
| `generate_config` | `projectDir, pluginMode?, dryRun?` | `filesGenerated[], appliedProfiles[]` |
| `check_config` | `projectDir` | `valid, issues[]` |
| `sync_config` | `projectDir, resolveConflicts?, dryRun?` | `updated[], conflicts[], skipped[], summary` |
| `list_profiles` | _(ninguno)_ | Lista de 59 profiles con capa y descripcion |
| `get_profile` | `profileId` | Contenido completo del profile |
| `cleanup_project` | `projectDir, force?, dryRun?` | `removed[], preserved[], stats` |
| `eject_project` | `projectDir` | Estado de eyeccion, archivos conservados |

### Inteligencia (6 tools)

| Tool | Parametros | Retorna |
|------|-----------|---------|
| `get_memory` | `projectDir, section` | Datos de la seccion solicitada |
| `record_learning` | `projectDir, type, data` | Confirmacion del registro |
| `extract_learnings` | `projectDir, errors[]` | `patternsUpdated, rulesGenerated, paths[]` |
| `repair_config` | `projectDir, mode?, dryRun?` | `diagnoses[], repairs[], mode` |
| `check_plugin_health` | `pluginDir?, cliVersion?` | `status, checks[], autoFixableCount` |
| `ingest_ci_errors` | `projectDir, source, logContent` | `errorsFound, patternsUpdated, rulesGenerated` |

---

## 8. Flujos de Agentes

Los agentes se activan **automaticamente** cuando Claude Code delega tareas especializadas.

| Agente | Modelo | Cuando se activa | Que hace |
|--------|--------|-----------------|----------|
| `code-reviewer` | sonnet | Claude necesita revisar codigo | Revisa arquitectura, calidad, errores, seguridad, performance, tests |
| `test-writer` | _(default)_ | Claude necesita generar tests | Usa Arrange-Act-Assert, cubre happy path, edge cases, error cases |
| `security-checker` | sonnet | Claude necesita auditar seguridad | Audita contra OWASP Top 10 2025, clasifica por severidad |
| `doc-writer` | _(default)_ | Claude necesita documentar | Principio de piramide invertida, docs junto al codigo |
| `refactor-assistant` | _(default)_ | Claude necesita refactorizar | Identifica code smells, aplica refactorings en pasos pequenos |
| `migration-helper` | _(default)_ | Claude necesita migrar tecnologia | Analiza, planifica, ejecuta incrementalmente, valida |
| `evolution-advisor` | _(default)_ | Claude analiza evolucion del proyecto | Mapea dependencias, detecta cambios de arquitectura |
| `audit-reviewer` | _(default)_ | Claude necesita revision exhaustiva | Calidad, conformidad, seguridad integral |

---

## Resumen de Componentes

| Componente | Cantidad | Activacion |
|-----------|----------|------------|
| Profiles | 59 | Automatico (basado en deteccion) |
| Skills | 21 | Manual (`/nombre`) |
| Agents | 8 | Automatico (delegacion por Claude) |
| Hooks | 7 | Automatico (eventos de Claude Code) |
| MCP Tools | 14 | Programatico (via MCP server) |
| Health Checks | 9 | Semi-auto (`/diverger-health`) |
| Diagnosticos de Repair | 9 | Automatico (SessionStart) |
| Clasificadores de Error | 15 | Automatico (pipeline de aprendizaje) |
| Analizadores de Deteccion | 10 | Automatico (durante deteccion) |
