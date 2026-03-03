# Plan de Migración a Plugin Architecture (v0.6.0 – v1.0.0)

> Documento de referencia completa para la migración de diverger-claude desde generador CLI estático hacia una arquitectura de plugin nativa de Claude Code. Incluye fases, decisiones técnicas, diagramas, riesgos y referencia técnica de la plataforma de plugins.

---

## Tabla de Contenidos

- [1. Contexto y Motivación](#1-contexto-y-motivación)
- [2. Decisiones de Arquitectura](#2-decisiones-de-arquitectura)
- [3. Fase 1: Plugin Scaffold (v0.6.0)](#3-fase-1-plugin-scaffold-v060)
- [4. Fase 2: MCP Server (v0.7.0)](#4-fase-2-mcp-server-v070)
- [5. Fase 3: Marketplace Distribution (v0.8.0)](#5-fase-3-marketplace-distribution-v080)
- [6. Fase 4: CLI Transition (v1.0.0)](#6-fase-4-cli-transition-v100)
- [7. Mapa de Componentes](#7-mapa-de-componentes)
- [8. Diagramas de Arquitectura](#8-diagramas-de-arquitectura)
- [9. Evaluación de Riesgos](#9-evaluación-de-riesgos)
- [10. Checklist de Verificación](#10-checklist-de-verificación)
- [11. Referencia Técnica del Sistema de Plugins](#11-referencia-técnica-del-sistema-de-plugins)

---

## 1. Contexto y Motivación

### Situación actual (v0.5.0)

diverger-claude v0.5.0 genera ~50 archivos estáticos en `.claude/` por proyecto. El CLI detecta el stack tecnológico, compone profiles por capas (Base → Language → Framework → Testing → Infra), y escribe agentes, skills, hooks, rules, settings y CLAUDE.md adaptados al stack detectado.

### Problemas estructurales

| # | Problema | Impacto |
|---|---------|---------|
| 1 | **Archivos obsoletos** | Actualizar protocolo o best practices requiere regenerar todo en cada proyecto. Con 100+ proyectos, esto no escala. |
| 2 | **Duplicación masiva** | Mismos agentes universales (code-reviewer, test-writer, security-reviewer, etc.), mismos hooks de seguridad y mismas skills guía se copian idénticamente en cada proyecto. |
| 3 | **Sin runtime** | diverger desaparece después de generar. No hay presencia activa del plugin en Claude Code, lo que limita capacidades como detección en vivo, sync automático o herramientas MCP. |

### Oportunidad

La plataforma Claude Code ahora soporta un sistema completo de plugins con:
- Marketplace para distribución centralizada
- Servidores MCP embebidos en plugins
- Servidores LSP para análisis de código
- Hooks con variable `${CLAUDE_PLUGIN_ROOT}` para paths relativos al plugin
- Settings, agentes y skills bundleados

Migrar a plugin architecture resuelve los 3 problemas: los componentes universales viven en el plugin (1 actualización = 100 proyectos actualizados), se eliminan duplicaciones, y el plugin tiene presencia activa en runtime.

### Principio guía

> **Plugin = componentes universales. Generator = componentes tech-specific.**
>
> El plugin contiene todo lo que es igual en todos los proyectos. El generador (CLI o MCP) solo produce los archivos que dependen del stack tecnológico detectado (rules/, CLAUDE.md, settings.json, agentes enriquecidos por framework).

---

## 2. Decisiones de Arquitectura

| # | Decisión | Elección | Razón |
|---|---------|---------|------|
| 1 | Universal vs proyecto | Plugin = universal, Generator = tech-specific | Actualizar 100 proyectos = actualizar 1 plugin |
| 2 | Rules en plugin | No soportado; generar siempre per-project | `plugin.json` no tiene campo `rules/`; Claude Code no carga rules desde plugins |
| 3 | Agent enrichment | Eliminar en plugin mode; usar agentes standalone | ts-reviewer, react-reviewer ya son standalone en generación per-project |
| 4 | MCP server | Sí, expone detección + generación como tools | Permite `/diverger-init` sin CLI externo |
| 5 | LSP configs | No bundlear; recomendar plugins oficiales existentes | Ya existen clangd-lsp, pyright-lsp, typescript-lsp, etc. |
| 6 | CLI | Mantener como compatibilidad + CI/CD | No romper usuarios existentes; CI/CD no tiene Claude Code interactivo |
| 7 | Marketplace | GitHub marketplace de DivergerThinking | Distribución centralizada con versionado |
| 8 | settings.json plugin | Solo campo `"agent"` si aplica | Es el único campo soportado en settings.json de plugins |
| 9 | Hook scripts | Usar `${CLAUDE_PLUGIN_ROOT}` para paths | Portabilidad entre máquinas sin paths absolutos |
| 10 | Single source of truth | Profiles siguen siendo la fuente; plugin se construye desde ellos | Build script extrae assets del registry de profiles |

---

## 3. Fase 1: Plugin Scaffold (v0.6.0)

### Objetivo

Crear directorio `plugin/` con componentes universales extraídos del sistema de perfiles. El plugin funciona standalone con `claude --plugin-dir ./plugin`.

### 3A. Estructura del plugin

```
plugin/
  .claude-plugin/
    plugin.json                    # Manifiesto del plugin
  agents/                          # 6 agentes universales
    code-reviewer.md
    test-writer.md
    security-reviewer.md
    doc-writer.md
    refactor-assistant.md
    migration-helper.md
  skills/                          # Skills universales
    architecture-style-guide/
      SKILL.md
    security-guide/
      SKILL.md
    git-workflow-guide/
      SKILL.md
    diverger-init/                 # Skill principal: detecta + genera
      SKILL.md
    diverger-status/
      SKILL.md
    diverger-sync/
      SKILL.md
  hooks/
    hooks.json                     # Config de hooks universales
    scripts/
      secret-scanner.sh          # PreToolUse Write
      destructive-cmd-blocker.sh # PreToolUse Bash
      check-long-lines.sh       # PostToolUse Write
      check-trailing-newline.sh  # PostToolUse Write
  settings.json                    # Solo campo "agent" si aplica
```

### 3B. Manifiesto del plugin (`plugin.json`)

```json
{
  "name": "diverger-claude",
  "description": "Auto-configures Claude Code for your tech stack with best practices, security hooks, and specialized agents",
  "version": "0.6.0",
  "author": { "name": "DivergerThinking" },
  "homepage": "https://github.com/DivergerThinking/diverger-claude",
  "repository": "https://github.com/DivergerThinking/diverger-claude",
  "license": "Proprietary"
}
```

### 3C. Build script para extraer assets

**Nuevo archivo**: `scripts/build-plugin.ts`

Responsabilidades:
1. Importa `universalProfile` del registry de perfiles
2. Usa `formatAgentFile()` de `src/generation/generators/agents.ts` para generar cada agente
3. Usa `formatSkillFile()` de `src/generation/generators/skills.ts` para generar cada skill
4. Extrae hook scripts de `hook-script-templates.ts`
5. Genera `hooks/hooks.json` con paths usando `${CLAUDE_PLUGIN_ROOT}`
6. Genera `plugin.json` con la versión de `package.json`
7. Escribe todo a `plugin/`

Ejemplo de hooks.json generado:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/secret-scanner.sh",
            "timeout": 10,
            "statusMessage": "Scanning for secrets..."
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/destructive-cmd-blocker.sh",
            "timeout": 10,
            "statusMessage": "Checking for destructive commands..."
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/check-long-lines.sh",
            "timeout": 10
          },
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/check-trailing-newline.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**Comando npm**: Añadir a `package.json`:
```json
{
  "scripts": {
    "build:plugin": "tsx scripts/build-plugin.ts"
  }
}
```

Esto garantiza **single source of truth**: los profiles siguen siendo la fuente canónica, el plugin se construye automáticamente desde ellos.

### 3D. Plugin mode en el engine

**Archivos a modificar:**

| Archivo | Cambio |
|---------|--------|
| `src/core/constants.ts` | Añadir sets `UNIVERSAL_AGENT_NAMES`, `UNIVERSAL_SKILL_NAMES`, `UNIVERSAL_HOOK_SCRIPTS` |
| `src/core/types.ts` | Añadir `pluginMode?: boolean` a `EngineContext` |
| `src/core/engine.ts` | Leer `pluginMode` del contexto y pasarlo a generación |
| `src/generation/index.ts` | Añadir `filterUniversalComponents()` que excluye componentes universales del output |
| `src/generation/generators/hooks.ts` | Filtrar hooks universales cuando `pluginMode` |
| `src/generation/generators/agents.ts` | Filtrar agentes universales cuando `pluginMode` |
| `src/generation/generators/skills.ts` | Filtrar skills universales cuando `pluginMode` |
| `src/cli/commands/init.ts` | Añadir flag `--plugin-mode` |

**Constantes a definir** en `src/core/constants.ts`:

```typescript
export const UNIVERSAL_AGENT_NAMES = new Set([
  'code-reviewer',
  'test-writer',
  'security-reviewer',
  'doc-writer',
  'refactor-assistant',
  'migration-helper',
]);

export const UNIVERSAL_SKILL_NAMES = new Set([
  'architecture-style-guide',
  'security-guide',
  'git-workflow-guide',
]);

export const UNIVERSAL_HOOK_SCRIPTS = new Set([
  'secret-scanner.sh',
  'destructive-cmd-blocker.sh',
  'check-long-lines.sh',
  'check-trailing-newline.sh',
]);
```

**Lógica de filtrado en plugin mode:**
- **Excluir**: agentes universales, skills universales, hook scripts universales
- **NO excluir rules/**: plugins no soportan `rules/`, siempre se generan per-project
- **NO excluir settings.json**: permisos son siempre per-project
- **NO excluir CLAUDE.md**: instrucciones de proyecto son siempre per-project
- **NO excluir agentes enriquecidos**: ts-reviewer, react-reviewer, etc. son tech-specific

### 3E. Tests

**Nuevos archivos de test:**

| Archivo | Verifica |
|---------|----------|
| `tests/unit/generation/plugin-filter.test.ts` | `filterUniversalComponents()` excluye correctamente agentes, skills y hooks universales |
| `tests/unit/core/engine-plugin-mode.test.ts` | Engine con `pluginMode: true` genera menos archivos que sin él |
| `tests/integration/plugin-scaffold.test.ts` | Estructura del plugin generada es válida: plugin.json existe, todos los archivos referenciados en hooks.json existen, agentes tienen frontmatter válido |

**Criterios de aceptación:**
- `filterUniversalComponents()` elimina exactamente los 6 agentes, 3 skills y 4 hook scripts universales
- Engine en plugin mode genera al menos rules/, settings.json y CLAUDE.md
- Engine en plugin mode NO genera code-reviewer.md, security-guide/SKILL.md, etc.
- Build script produce un directorio `plugin/` válido

### 3F. Verificación

```bash
npm run build:plugin          # Assets generados correctamente
claude --plugin-dir ./plugin  # Plugin carga: 6 agents, 6 skills, 4 hooks
diverger init --plugin-mode   # Solo genera archivos tech-specific
npx vitest run                # Todos los tests pasan
npx tsc --noEmit              # 0 errores TypeScript
```

**Scope estimado**: ~30 archivos nuevos/modificados, ~1500 líneas

---

## 4. Fase 2: MCP Server (v0.7.0)

### Objetivo

Implementar un servidor MCP que expone la detección de stack y generación de configuración como tools, haciendo el plugin programáticamente accesible desde dentro de Claude Code sin necesidad del CLI.

### 4A. Servidor MCP

**Nuevos archivos:**

| Archivo | Responsabilidad |
|---------|----------------|
| `src/mcp/server.ts` | Entry point del servidor MCP (stdio transport) |
| `src/mcp/tools/detect-stack.ts` | Wrapper de `DetectionEngine.detect()` |
| `src/mcp/tools/generate-config.ts` | Wrapper de `DivergerEngine.init()` con `pluginMode: true` |
| `src/mcp/tools/check-config.ts` | Wrapper de `GovernanceEngine.validate()` |
| `src/mcp/tools/sync-config.ts` | Wrapper de `DivergerEngine.sync()` |
| `src/mcp/tools/list-profiles.ts` | Lista perfiles disponibles con sus capas y metadatos |
| `src/mcp/tools/get-profile.ts` | Detalle completo de un perfil específico |

**Dependencia nueva**: `@modelcontextprotocol/sdk`

**Definición de tools MCP:**

| Tool | Input | Output |
|------|-------|--------|
| `detect_stack` | `{ projectDir: string }` | `{ technologies: TechDetection[], confidence: number }` |
| `generate_config` | `{ projectDir: string, pluginMode?: boolean, dryRun?: boolean }` | `{ filesGenerated: string[], summary: string }` |
| `check_config` | `{ projectDir: string }` | `{ valid: boolean, issues: ValidationIssue[] }` |
| `sync_config` | `{ projectDir: string }` | `{ updated: string[], conflicts: string[] }` |
| `list_profiles` | `{ layer?: number }` | `{ profiles: ProfileSummary[] }` |
| `get_profile` | `{ name: string }` | `{ profile: ProfileDetail }` |

### 4B. Build del servidor MCP

**Modificar**: `tsup.config.ts`

Añadir segundo entry point para el servidor MCP:

```typescript
export default defineConfig([
  // Entry point existente del CLI
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    // ... config existente
  },
  // Nuevo entry point del MCP server
  {
    entry: ['src/mcp/server.ts'],
    format: ['esm'],
    outDir: 'dist/mcp',
    banner: { js: '#!/usr/bin/env node' },
    dts: false,
    clean: false,
  },
]);
```

### 4C. Configuración MCP en plugin

**Nuevo archivo**: `plugin/.mcp.json`

```json
{
  "mcpServers": {
    "diverger-claude": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/../dist/mcp/server.js"]
    }
  }
}
```

Nota: `${CLAUDE_PLUGIN_ROOT}` apunta al directorio del plugin. El servidor compilado está en `dist/mcp/` relativo a la raíz del repositorio.

### 4D. Actualizar skills para usar MCP

La skill `/diverger-init` cambia de shell out al CLI a usar MCP tools directamente:

```markdown
---
name: diverger-init
description: Detects your tech stack and generates Claude Code configuration
argument-hint: [--plugin-mode]
---

## Instrucciones

1. Usar la herramienta MCP `detect_stack` con el directorio actual del proyecto
2. Mostrar al usuario las tecnologías detectadas con su nivel de confianza
3. Preguntar confirmación al usuario
4. Usar la herramienta MCP `generate_config` con `pluginMode: true`
5. Mostrar resumen de archivos generados
```

Similarmente, `/diverger-status` usa `detect_stack` y `/diverger-sync` usa `sync_config`.

### 4E. Tests

| Archivo | Verifica |
|---------|----------|
| `tests/unit/mcp/detect-stack.test.ts` | Tool detect_stack devuelve detecciones válidas |
| `tests/unit/mcp/generate-config.test.ts` | Tool generate_config genera archivos en plugin mode |
| `tests/unit/mcp/check-config.test.ts` | Tool check_config valida configuraciones |
| `tests/unit/mcp/list-profiles.test.ts` | Tool list_profiles devuelve los 50 profiles |
| `tests/integration/mcp-server.test.ts` | Start server, call tools, verify responses JSON válidos |

### 4F. Verificación

```bash
node dist/mcp/server.js                    # Server arranca sin error
claude --plugin-dir ./plugin               # MCP tools disponibles
# En Claude Code: usar detect_stack tool
npx vitest run                             # Todos los tests pasan
npx tsc --noEmit                           # 0 errores TypeScript
```

**Scope estimado**: ~15 archivos nuevos, ~1200 líneas

---

## 5. Fase 3: Marketplace Distribution (v0.8.0)

### Objetivo

Empaquetar el plugin para distribución vía Claude Code marketplace, permitiendo instalación con un solo comando.

### 5A. Marketplace setup

**Nuevo repositorio**: `DivergerThinking/claude-plugins`

Contiene un `marketplace.json` que registra todos los plugins de la organización:

```json
{
  "name": "diverger-tools",
  "owner": { "name": "DivergerThinking" },
  "plugins": [
    {
      "name": "diverger-claude",
      "source": {
        "source": "github",
        "repo": "DivergerThinking/diverger-claude"
      },
      "description": "Auto-configures Claude Code for your tech stack with best practices, security hooks, and specialized agents"
    }
  ]
}
```

**Instalación por usuarios:**

```bash
# Añadir marketplace corporativo
claude plugin marketplace add diverger-tools \
  --source github \
  --repo DivergerThinking/claude-plugins

# Instalar plugin
claude plugin install diverger-claude
```

### 5B. Workflow de release del plugin

**Nuevo archivo**: `.github/workflows/plugin-release.yml`

```yaml
name: Plugin Release
on:
  push:
    tags: ['plugin-v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run build:plugin
      - name: Validate plugin manifest
        run: claude plugin validate ./plugin
      - name: Package plugin
        run: tar -czf diverger-claude-plugin.tar.gz plugin/
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: diverger-claude-plugin.tar.gz
```

**Nota sobre tags**: El plugin usa tags `plugin-v*` separados de las releases npm `v*` para permitir versionado independiente si fuera necesario.

### 5C. Documentación

| Archivo | Contenido |
|---------|-----------|
| `plugin/README.md` | Listing del marketplace: descripción, features, instalación |
| `docs/guia-plugin.md` | Guía de uso del plugin para usuarios finales |
| `docs/migracion-cli-a-plugin.md` | Paso a paso para migrar desde el CLI |

### 5D. Verificación

```bash
claude plugin validate ./plugin             # Manifest válido
claude plugin install --from ./plugin       # Instalación local funciona
claude plugin list                          # Plugin aparece en listado
npx vitest run                              # Todos los tests pasan
```

**Scope estimado**: ~8 archivos, ~500 líneas

---

## 6. Fase 4: CLI Transition (v1.0.0)

### Objetivo

Establecer el plugin como distribución primaria, manteniendo el CLI como vía de compatibilidad para CI/CD y usuarios existentes.

### 6A. Auto-detección de plugin

**Modificar**: `src/cli/commands/init.ts`

```typescript
async function detectPluginInstalled(): Promise<boolean> {
  // Verificar si el plugin diverger-claude está instalado
  // via `claude plugin list --json` o chequeando paths conocidos
  // Si está instalado, activar pluginMode automáticamente
}
```

Cuando el CLI detecta que el plugin está instalado:
1. Activa `pluginMode` automáticamente (sin necesidad de `--plugin-mode`)
2. Muestra mensaje informativo: "Plugin diverger-claude detectado. Generando solo configuración tech-specific."
3. Omite componentes universales del output

### 6B. Deprecation notices

El CLI muestra avisos para nuevas instalaciones:

```
  diverger-claude ahora está disponible como plugin de Claude Code.
  Instala con: claude plugin install diverger-claude
  El CLI seguirá funcionando pero el plugin es la vía recomendada.
```

Estos avisos:
- Se muestran solo una vez por sesión
- Se pueden silenciar con `--quiet` o `DIVERGER_NO_DEPRECATION=1`
- NO se muestran en CI/CD (detección via `CI=true` o `--json`)

### 6C. Documentación de migración

**Archivo**: `docs/migracion-cli-a-plugin.md`

Contenido:
1. Pre-requisitos (Claude Code con soporte de plugins)
2. Instalar plugin
3. Regenerar con `diverger init --plugin-mode` o `/diverger-init`
4. Verificar que rules/ y settings.json siguen intactos
5. Eliminar agentes/skills/hooks duplicados que ahora vienen del plugin
6. Script de limpieza automática (eliminar archivos universales del `.claude/` existente)

### 6D. Verificación

```bash
diverger init                              # Auto-detecta plugin, activa plugin mode
diverger init --no-plugin                  # Fuerza modo completo (legacy)
diverger init --quiet                      # Sin deprecation notice
npx vitest run                             # Todos los tests pasan
```

**Scope estimado**: ~5 archivos, ~200 líneas

---

## 7. Mapa de Componentes

### Qué vive en el plugin vs qué se genera por proyecto

| Componente | Plugin (universal) | Generado per-project | Notas |
|-----------|-------------------|---------------------|-------|
| **CLAUDE.md** | -- | SI | Instrucciones específicas del stack detectado |
| **settings.json** | Solo `"agent"` | SI (permisos, hooks, env) | Plugins solo soportan clave `"agent"` |
| **rules/** | -- | SI | Plugins no soportan `rules/`; siempre per-project |
| **code-reviewer.md** | SI | -- | Agente universal |
| **test-writer.md** | SI | -- | Agente universal |
| **security-reviewer.md** | SI | -- | Agente universal |
| **doc-writer.md** | SI | -- | Agente universal |
| **refactor-assistant.md** | SI | -- | Agente universal |
| **migration-helper.md** | SI | -- | Agente universal |
| **ts-reviewer.md** | -- | SI (si TypeScript) | Agente enriquecido por stack |
| **react-reviewer.md** | -- | SI (si React) | Agente enriquecido por stack |
| **python-reviewer.md** | -- | SI (si Python) | Agente enriquecido por stack |
| **(otros tech-specific agents)** | -- | SI | Según stack detectado |
| **architecture-style-guide/** | SI | -- | Skill universal |
| **security-guide/** | SI | -- | Skill universal |
| **git-workflow-guide/** | SI | -- | Skill universal |
| **diverger-init/** | SI | -- | Skill del plugin |
| **diverger-status/** | SI | -- | Skill del plugin |
| **diverger-sync/** | SI | -- | Skill del plugin |
| **tech-specific skills/** | -- | SI | Skills específicas del framework |
| **secret-scanner.sh** | SI | -- | Hook universal |
| **destructive-cmd-blocker.sh** | SI | -- | Hook universal |
| **check-long-lines.sh** | SI | -- | Hook universal |
| **check-trailing-newline.sh** | SI | -- | Hook universal |
| **tech-specific hooks** | -- | SI | Hooks de linters, formatters, etc. |
| **MCP server** | SI (via .mcp.json) | -- | Servidor MCP embebido |
| **.eslintrc / prettier / tsconfig** | -- | SI | Configs de herramientas externas |

### Resultado esperado por proyecto

**Sin plugin** (modo legacy):
```
.claude/
  CLAUDE.md                          # ~80 líneas
  settings.json                      # Permisos + hooks
  rules/                             # 5-15 archivos .md
  agents/                            # 6 universales + N tech-specific
  skills/                            # 3 universales + N tech-specific
  hooks/scripts/                     # 4 universales + N tech-specific
```

**Con plugin** (modo plugin):
```
.claude/
  CLAUDE.md                          # ~80 líneas
  settings.json                      # Permisos (hooks tech-specific)
  rules/                             # 5-15 archivos .md
  agents/                            # Solo N tech-specific
  skills/                            # Solo N tech-specific
  hooks/scripts/                     # Solo N tech-specific (si los hay)
```

Reducción típica: **~15 archivos menos** por proyecto.

---

## 8. Diagramas de Arquitectura

### Arquitectura Actual (v0.5.0) -- CLI estático

```
+------------------------------------------------------------------+
|                        diverger-claude CLI                        |
+------------------------------------------------------------------+
|                                                                   |
|  npm install -g @divergerthinking/diverger-claude                 |
|                                                                   |
|  +-------------+    +-------------+    +-----------------------+  |
|  |  Detection   |--->|  Profiles    |--->|    Generation         |  |
|  |  Engine      |    |  Compositor  |    |    Engine             |  |
|  +-------------+    +-------------+    +-----------------------+  |
|  | scanner.ts  |    | 5 capas:    |    | CLAUDE.md             |  |
|  | 9 analyzers |    | Base(0)     |    | settings.json         |  |
|  |             |    | Lang(10)    |    | rules/*.md            |  |
|  |             |    | Frame(20)   |    | agents/*.md           |  |
|  |             |    | Test(30)    |    | skills/*/SKILL.md     |  |
|  |             |    | Infra(40)   |    | hooks/hooks.json      |  |
|  +-------------+    +-------------+    | hooks/scripts/*.sh    |  |
|                                        +-----------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                   Proyecto del usuario                            |
|  .claude/                                                        |
|    CLAUDE.md            <-- instrucciones                        |
|    settings.json        <-- permisos + hooks                     |
|    rules/               <-- 5-15 rules .md                       |
|    agents/              <-- 6 universales + N tech-specific       |
|    skills/              <-- 3 universales + N tech-specific       |
|    hooks/scripts/       <-- 4 universales + N tech-specific       |
|                                                                   |
|  TOTAL: ~50 archivos estáticos (se quedan obsoletos)             |
+------------------------------------------------------------------+
```

### Arquitectura Objetivo (v1.0.0) -- Plugin + Generator

```
+------------------------------------------------------------------+
|                    Plugin diverger-claude                         |
|              (instalado 1 vez, compartido por todos)              |
+------------------------------------------------------------------+
|                                                                   |
|  plugin/                                                          |
|    .claude-plugin/plugin.json       # Manifiesto                  |
|    agents/                          # 6 agentes universales       |
|      code-reviewer.md                                             |
|      test-writer.md                                               |
|      security-reviewer.md                                         |
|      doc-writer.md                                                |
|      refactor-assistant.md                                        |
|      migration-helper.md                                          |
|    skills/                          # 6 skills universales        |
|      architecture-style-guide/                                    |
|      security-guide/                                              |
|      git-workflow-guide/                                          |
|      diverger-init/                                               |
|      diverger-status/                                             |
|      diverger-sync/                                               |
|    hooks/                           # 4 hooks universales         |
|      hooks.json                                                   |
|      scripts/*.sh                                                 |
|    .mcp.json                        # Servidor MCP embebido       |
|                                                                   |
+------------------------------------------------------------------+
        |                                      |
        | Hooks/Agents/Skills                  | MCP Tools
        | (runtime)                            | (detect/generate)
        v                                      v
+------------------------------------------------------------------+
|                      Claude Code Runtime                         |
|                                                                   |
|  Carga plugin al iniciar sesión:                                 |
|  - 6 agentes disponibles como subagentes                         |
|  - 6 skills invocables (/diverger-init, etc.)                    |
|  - 4 hooks activos (seguridad)                                   |
|  - 6 MCP tools (detect_stack, generate_config, etc.)             |
+------------------------------------------------------------------+
        |
        | /diverger-init o CLI
        v
+------------------------------------------------------------------+
|                   Proyecto del usuario                            |
|  .claude/                                                        |
|    CLAUDE.md            <-- instrucciones tech-specific           |
|    settings.json        <-- permisos per-project                 |
|    rules/               <-- 5-15 rules .md (NO en plugin)        |
|    agents/              <-- Solo agentes tech-specific            |
|    skills/              <-- Solo skills tech-specific             |
|    hooks/scripts/       <-- Solo hooks tech-specific (si hay)     |
|                                                                   |
|  TOTAL: ~35 archivos (menos duplicación, más fácil de mantener)  |
+------------------------------------------------------------------+
```

### Flujo de actualización comparado

```
ANTES (v0.5.0):
  Nueva versión de diverger-claude
    -> Ejecutar CLI en CADA proyecto (100 proyectos)
    -> Three-way merge en cada uno
    -> ~100 ejecuciones manuales

DESPUÉS (v1.0.0):
  Nueva versión del plugin
    -> claude plugin update diverger-claude  (1 comando)
    -> Componentes universales actualizados instantáneamente
    -> Solo regenerar configs tech-specific si hubo cambios en profiles
```

---

## 9. Evaluación de Riesgos

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|-----------|
| 1 | **Plugin API cambia** en futuras versiones de Claude Code | Media | Alto | CLI como fallback completo; tests de integración que validan plugin loading |
| 2 | **`${CLAUDE_PLUGIN_ROOT}` no funciona en Windows** nativo | Baja | Medio | Testear en Windows nativo + WSL; usar paths compatibles con forward slashes |
| 3 | **MCP server lento al arrancar** (carga 50 profiles) | Media | Medio | Lazy loading de profiles; solo cargar el registry cuando se invoca una tool |
| 4 | **Pérdida de enrichment** en agentes universales | Aceptado | Bajo | Los agentes tech-specific (ts-reviewer, react-reviewer) son standalone y se generan per-project; los universales son genéricos por diseño |
| 5 | **Rules no soportados en plugins** | Confirmado | Bajo | Siempre generar rules/ per-project; no depende de cambios de plataforma |
| 6 | **Conflicto de nombres** entre plugin y archivos per-project | Baja | Medio | Plugin usa prefijo en slash commands (`/diverger-claude:init`); agentes tech-specific tienen nombres distintos a los universales |
| 7 | **Marketplace no disponible** para GitHub Enterprise | Media | Medio | Soporte de instalación directa via `claude --plugin-dir` y `source: directory` |
| 8 | **Breaking change en @modelcontextprotocol/sdk** | Baja | Medio | Pinear versión; actualizar con tests de integración |
| 9 | **Usuarios no migran** al plugin | Baja | Bajo | CLI sigue funcionando indefinidamente; deprecation notices graduales |
| 10 | **Tamaño del plugin** demasiado grande | Baja | Bajo | Solo archivos .md y scripts .sh; sin node_modules en el plugin dir |

---

## 10. Checklist de Verificación

### Fase 1 (v0.6.0) -- Plugin Scaffold

- [ ] `npm run build:plugin` genera todos los assets sin errores
- [ ] `plugin/.claude-plugin/plugin.json` tiene schema válido
- [ ] `plugin/agents/` contiene exactamente 6 archivos .md
- [ ] `plugin/skills/` contiene 6 directorios con SKILL.md
- [ ] `plugin/hooks/hooks.json` referencia scripts existentes
- [ ] Todos los paths en hooks.json usan `${CLAUDE_PLUGIN_ROOT}`
- [ ] `claude --plugin-dir ./plugin` carga sin errores
- [ ] `diverger init --plugin-mode` NO genera agentes universales
- [ ] `diverger init --plugin-mode` SI genera rules/, settings.json, CLAUDE.md
- [ ] `npx vitest run` -- todos los tests pasan
- [ ] `npx tsc --noEmit` -- 0 errores TypeScript
- [ ] Build script usa profiles como single source of truth

### Fase 2 (v0.7.0) -- MCP Server

- [ ] `node dist/mcp/server.js` arranca sin errores
- [ ] Tool `detect_stack` retorna detecciones válidas
- [ ] Tool `generate_config` genera archivos correctamente
- [ ] Tool `check_config` valida configuraciones existentes
- [ ] Tool `sync_config` sincroniza sin perder cambios del usuario
- [ ] Tool `list_profiles` retorna los 50 profiles
- [ ] Tool `get_profile` retorna detalle completo
- [ ] `.mcp.json` del plugin carga el servidor correctamente
- [ ] Skills actualizadas usan MCP tools en lugar de CLI
- [ ] `npx vitest run` -- todos los tests pasan
- [ ] `npx tsc --noEmit` -- 0 errores TypeScript

### Fase 3 (v0.8.0) -- Marketplace

- [ ] `marketplace.json` tiene schema válido
- [ ] `claude plugin validate ./plugin` pasa
- [ ] Workflow `plugin-release.yml` ejecuta build + test + package
- [ ] Instalación desde marketplace funciona
- [ ] Documentación completa (README plugin, guía, migración)
- [ ] `npx vitest run` -- todos los tests pasan

### Fase 4 (v1.0.0) -- CLI Transition

- [ ] CLI auto-detecta plugin instalado
- [ ] CLI activa plugin mode automáticamente cuando plugin presente
- [ ] Deprecation notices aparecen en modo interactivo
- [ ] Deprecation notices NO aparecen con `--quiet` o `--json`
- [ ] Deprecation notices NO aparecen en CI (`CI=true`)
- [ ] `diverger init --no-plugin` fuerza modo legacy
- [ ] Script de limpieza elimina archivos universales de `.claude/`
- [ ] `npx vitest run` -- todos los tests pasan
- [ ] `npx tsc --noEmit` -- 0 errores TypeScript

### Verificación transversal (todas las fases)

```bash
npx vitest run                         # All tests pass
npx tsc --noEmit                       # Zero type errors
claude --plugin-dir ./plugin           # Plugin loads correctly
claude plugin validate ./plugin        # Manifest valid
npm run build:plugin                   # Assets in sync with profiles
```

---

## 11. Referencia Técnica del Sistema de Plugins

> Resumen de las especificaciones técnicas de la plataforma de plugins de Claude Code relevantes para esta migración. Basado en la documentación oficial de Febrero 2026.

### 11.1. Schema de `plugin.json`

El manifiesto del plugin se ubica en `.claude-plugin/plugin.json` dentro del directorio raíz del plugin.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | `string` | Sí | Identificador único del plugin (lowercase, hyphens) |
| `description` | `string` | Sí | Descripción del plugin para marketplace y listados |
| `version` | `string` | Sí | Versión semver del plugin |
| `author` | `{ name: string }` | No | Autor u organización |
| `homepage` | `string` (URL) | No | URL de la página del plugin |
| `repository` | `string` (URL) | No | URL del repositorio de código fuente |
| `license` | `string` | No | Identificador SPDX de la licencia (o "Proprietary") |

Ejemplo completo:

```json
{
  "name": "diverger-claude",
  "description": "Auto-configures Claude Code for your tech stack",
  "version": "0.6.0",
  "author": { "name": "DivergerThinking" },
  "homepage": "https://github.com/DivergerThinking/diverger-claude",
  "repository": "https://github.com/DivergerThinking/diverger-claude",
  "license": "Proprietary"
}
```

### 11.2. Estructura de directorio del plugin

```
mi-plugin/
  .claude-plugin/
    plugin.json            # Manifiesto (OBLIGATORIO, único archivo aquí)
  commands/                # Comandos slash como archivos .md (opcional)
  agents/                  # Definiciones de sub-agentes (opcional)
  skills/                  # Skills con SKILL.md (opcional)
  hooks/
    hooks.json             # Configuración de hooks del plugin (opcional)
  .mcp.json                # Servidores MCP embebidos (opcional)
  .lsp.json                # Servidores LSP embebidos (opcional)
  settings.json            # Settings del plugin (solo clave "agent" soportada)
```

**Diferencias clave con `.claude/` de proyecto:**

| Característica | Proyecto (`.claude/`) | Plugin |
|---------------|----------------------|--------|
| Rules (`rules/`) | Soportado | **NO soportado** |
| CLAUDE.md | Soportado | **NO soportado** |
| settings.json | Todos los campos | **Solo clave `"agent"`** |
| Hooks | En `settings.json` | En `hooks/hooks.json` |
| Slash commands prefijo | `/nombre` | `/plugin-name:nombre` |
| Alcance | Solo este proyecto | Todos los proyectos donde está habilitado |

### 11.3. Variable `${CLAUDE_PLUGIN_ROOT}`

Variable de entorno especial disponible en el contexto de ejecución de un plugin. Se expande al **directorio raíz del plugin** (el directorio que contiene `.claude-plugin/`).

**Uso principal**: Referenciar scripts y archivos del plugin en hooks.json y .mcp.json sin usar paths absolutos.

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/secret-scanner.sh"
      }]
    }]
  }
}
```

**Comportamiento:**
- Se expande en tiempo de ejecución cuando Claude Code carga el plugin
- Funciona en `hooks.json`, `.mcp.json`, y campos `command`/`args`
- Compatible con Windows, macOS y Linux
- Soporta subdirectorios: `${CLAUDE_PLUGIN_ROOT}/ruta/al/script.sh`

**Otras variables de entorno disponibles en hooks:**
- `$CLAUDE_PROJECT_DIR`: Directorio raíz del proyecto actual
- `$CLAUDE_CODE_REMOTE`: `"true"` si se ejecuta en entorno remoto web

### 11.4. Formato de `hooks/hooks.json`

El archivo de hooks del plugin sigue el mismo schema que hooks en `settings.json`, pero vive en su propio archivo.

**Schema:**

```json
{
  "hooks": {
    "<EventName>": [
      {
        "matcher": "<regex-pattern>",
        "hooks": [
          {
            "type": "command | http | prompt | agent",
            "command": "string (para type command)",
            "url": "string (para type http)",
            "prompt": "string (para type prompt/agent)",
            "timeout": 600,
            "async": false,
            "statusMessage": "string",
            "once": false,
            "model": "haiku | sonnet | opus",
            "headers": {},
            "allowedEnvVars": []
          }
        ]
      }
    ]
  }
}
```

**Eventos disponibles (17 total):**

| Evento | Puede bloquear | Matcher |
|--------|---------------|---------|
| `SessionStart` | No | `startup`, `resume`, `clear`, `compact` |
| `UserPromptSubmit` | Sí | -- |
| `PreToolUse` | Sí | Nombre de herramienta (`Write`, `Bash`, `Edit`, etc.) |
| `PermissionRequest` | Sí | Nombre de herramienta |
| `PostToolUse` | No | Nombre de herramienta |
| `PostToolUseFailure` | No | Nombre de herramienta |
| `Notification` | No | `permission_prompt`, `idle_prompt`, etc. |
| `SubagentStart` | No | Tipo de agente |
| `SubagentStop` | Sí | Tipo de agente |
| `Stop` | Sí | -- |
| `TeammateIdle` | Sí | -- |
| `TaskCompleted` | Sí | -- |
| `ConfigChange` | Sí | `user_settings`, `project_settings`, etc. |
| `WorktreeCreate` | Sí | -- |
| `WorktreeRemove` | No | -- |
| `PreCompact` | No | `manual`, `auto` |
| `SessionEnd` | No | `clear`, `logout`, etc. |

**Tipos de handler:**

| Tipo | Descripción | Input | Timeout default |
|------|-----------|-------|-----------------|
| `command` | Ejecuta comando shell | JSON en stdin | 600s |
| `http` | HTTP POST a URL | JSON en body | 30s |
| `prompt` | Evaluación LLM single-turn | Transcript context | 30s |
| `agent` | Sub-agente multi-turn con herramientas | Transcript context | 60s |

**Códigos de salida (para type command):**
- **Exit 0**: Acción procede. Stdout se parsea como JSON.
- **Exit 2**: Error bloqueante. Stderr se envía a Claude como error.
- **Cualquier otro**: Error no bloqueante. Stderr se loguea en verbose.

**Output JSON de hooks:**

```json
{
  "continue": true,
  "stopReason": "mensaje para el usuario",
  "suppressOutput": false,
  "systemMessage": "mensaje de advertencia",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Razón del rechazo"
  }
}
```

Valores de `permissionDecision` para `PreToolUse`: `"allow"`, `"deny"`, `"ask"`.

### 11.5. Opciones de distribución del marketplace

**Tipos de fuente soportados:**

| Tipo | Formato | Caso de uso |
|------|---------|-------------|
| `github` | `{ "source": "github", "repo": "org/repo", "ref": "v2.0", "path": "dir" }` | Repos GitHub públicos o con acceso |
| `git` | `{ "source": "git", "url": "https://gitlab.example.com/repo.git" }` | Cualquier servidor Git |
| `url` | `{ "source": "url", "url": "https://host/marketplace.json", "headers": {} }` | HTTP endpoint |
| `npm` | `{ "source": "npm", "package": "@org/claude-plugins" }` | Registro npm |
| `file` | `{ "source": "file", "path": "/path/to/marketplace.json" }` | Archivo local |
| `directory` | `{ "source": "directory", "path": "/path/to/plugins-dir" }` | Directorio local |
| `hostPattern` | `{ "source": "hostPattern", "hostPattern": "^github\\.corp\\.com$" }` | Patrón de host |

**Schema de `marketplace.json`:**

```json
{
  "name": "nombre-del-marketplace",
  "owner": { "name": "Organización" },
  "plugins": [
    {
      "name": "nombre-plugin",
      "source": { "source": "github", "repo": "org/repo" },
      "description": "Descripción del plugin"
    }
  ]
}
```

**Control managed de marketplaces (settings managed):**

```json
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "OurOrg/claude-plugins" }
  ],
  "blockedMarketplaces": [
    { "source": "hostPattern", "hostPattern": "^untrusted\\.com$" }
  ]
}
```

### 11.6. Scopes de plugin

Los plugins pueden estar habilitados en diferentes alcances:

| Scope | Cómo se instala | Visibilidad |
|-------|----------------|-------------|
| **user** | `claude plugin install <name>` | Todos los proyectos del usuario |
| **project** | Configuración en `.claude/` del proyecto | Solo este proyecto |
| **local** | `claude --plugin-dir ./path` | Solo esta sesión |
| **managed** | Políticas IT/MDM | Todos los usuarios de la org |

**Prioridad de componentes** (mayor a menor):
1. CLI args (`--agents`, etc.)
2. Proyecto (`.claude/`)
3. Usuario (`~/.claude/`)
4. Plugin

Esto significa que archivos per-project **siempre ganan** sobre componentes del plugin en caso de conflicto de nombres.

### 11.7. Comandos CLI para gestión de plugins

```bash
# Instalación y gestión
claude plugin install <name>              # Instalar desde marketplace
claude plugin install --from <path>       # Instalar desde directorio local
claude plugin uninstall <name>            # Desinstalar plugin
claude plugin update <name>               # Actualizar a última versión
claude plugin list                        # Listar plugins instalados

# Validación
claude plugin validate <path>             # Validar manifiesto y estructura

# Marketplace
claude plugin marketplace add <name> --source <type> --repo <repo>
claude plugin marketplace remove <name>
claude plugin marketplace list

# Desarrollo
claude --plugin-dir <path>                # Cargar plugin local para desarrollo
claude plugin create <name>               # Scaffold de nuevo plugin (interactivo)

# Ejecución directa en sesión
claude --plugin-dir ./plugin              # Cargar plugin para esta sesión
```

### 11.8. Compatibilidad con otros componentes del plugin

**`.mcp.json` en plugins:**

```json
{
  "mcpServers": {
    "mi-server": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/server.js"]
    }
  }
}
```

Soporta expansión de variables: `${VAR}` y `${VAR:-default}` en `command`, `args`, `env`, `url`, `headers`.

**`.lsp.json` en plugins:**

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": { ".go": "go" }
  }
}
```

**`settings.json` en plugins:**

Solo la clave `"agent"` está soportada:

```json
{
  "agent": "security-reviewer"
}
```

Esto establece un agente del plugin como hilo principal de la sesión. Otras claves de settings (permissions, hooks, env, etc.) son ignoradas.

**Agentes del plugin:**

Formato idéntico a `.claude/agents/*.md`. Frontmatter soporta:

```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: sonnet
permissionMode: default
maxTurns: 50
skills:
  - api-conventions
mcpServers:
  - slack
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"
memory: user
background: false
isolation: worktree
---

Instrucciones del agente en markdown...
```

**Skills del plugin:**

Formato idéntico a `.claude/skills/`. Frontmatter soporta:

```yaml
---
name: mi-skill
description: Descripción para auto-invocación
argument-hint: [argumento]
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Grep, Glob
model: sonnet
context: fork
agent: Explore
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/check.sh"
---
```

**Diferencia de invocación**: Skills del plugin se invocan con prefijo: `/diverger-claude:init` en lugar de `/init`.

---

## Apéndice A: Cronograma estimado

| Fase | Versión | Scope | Dependencia |
|------|---------|-------|-------------|
| Fase 1: Plugin Scaffold | v0.6.0 | ~30 archivos, ~1500 líneas | Ninguna |
| Fase 2: MCP Server | v0.7.0 | ~15 archivos, ~1200 líneas | Fase 1 |
| Fase 3: Marketplace | v0.8.0 | ~8 archivos, ~500 líneas | Fase 2 |
| Fase 4: CLI Transition | v1.0.0 | ~5 archivos, ~200 líneas | Fase 3 |
| **TOTAL** | | **~58 archivos, ~3400 líneas** | |

---

## Apéndice B: Documentación relacionada a actualizar

Antes de implementar, actualizar la referencia técnica en `docs/claude-code-reference/`:

| Archivo | Actualización necesaria |
|---------|----------------------|
| `07-plugins.md` | Schema completo de plugin.json, marketplace, distribución |
| `03-hooks.md` | 17 eventos, 4 tipos de handler, protocolo completo |
| `04-skills.md` | Frontmatter completo, arguments, dynamic injection |
| `06-subagents.md` | Memory, isolation, agent teams |
| `05-mcp.md` | OAuth, managed config, tool search |
| **Nuevo**: `10-agent-teams.md` | Sistema experimental de equipos |
| **Nuevo**: `11-lsp.md` | Language Server Protocol en plugins |
