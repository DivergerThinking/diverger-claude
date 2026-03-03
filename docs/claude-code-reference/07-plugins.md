# Plugins - Sistema de Extensiones
> Referencia oficial: https://code.claude.com/docs/en/plugins-reference
> Referencia marketplaces: https://code.claude.com/docs/en/plugin-marketplaces
> Referencia descubrimiento: https://code.claude.com/docs/en/discover-plugins
> Última actualización: 2026-03-03

## Estructura de Directorio de Plugin

```
my-plugin/
  .claude-plugin/
    plugin.json              # Manifiesto del plugin (SOLO plugin.json va aquí)
  commands/                  # Comandos slash como archivos .md (legacy; usar skills/)
  skills/                    # Skills de agente con SKILL.md (preferido)
    code-reviewer/
      SKILL.md
      scripts/               # Scripts auxiliares (opcional)
    pdf-processor/
      SKILL.md
      reference.md           # Archivos de soporte (opcional)
  agents/                    # Definiciones de subagentes custom (.md)
    security-reviewer.md
    performance-tester.md
  hooks/                     # Configuraciones de hooks
    hooks.json               # Config principal de hooks
  .mcp.json                  # Configuraciones de servidor MCP
  .lsp.json                  # Configuraciones de servidor LSP
  settings.json              # Settings por defecto (solo clave "agent" soportada)
  scripts/                   # Scripts de utilidad para hooks
    format-code.sh
    deploy.js
  LICENSE
  CHANGELOG.md
```

> **Regla fundamental**: `.claude-plugin/` contiene SOLO `plugin.json`. Todos los demás directorios (`commands/`, `skills/`, `agents/`, `hooks/`) van en la raíz del plugin, NUNCA dentro de `.claude-plugin/`.

---

## Manifiesto del Plugin (`plugin.json`)

El manifiesto es **opcional**. Si se omite, Claude Code auto-descubre componentes en ubicaciones por defecto y deriva el nombre del plugin del nombre del directorio. Usar manifiesto cuando se necesite metadata o rutas custom de componentes.

### Schema Completo

```json
{
  "name": "plugin-name",
  "version": "2.1.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json"
}
```

### Campo Requerido

Si se incluye manifiesto, `name` es el **unico campo requerido**.

| Campo | Tipo | Descripcion | Ejemplo |
|---|---|---|---|
| `name` | string | Identificador unico (kebab-case, sin espacios) | `"deployment-tools"` |

El nombre se usa para namespacing de componentes. Por ejemplo, el agente `agent-creator` del plugin `plugin-dev` aparece como `plugin-dev:agent-creator` en la UI.

### Campos de Metadata

| Campo | Tipo | Descripcion | Ejemplo |
|---|---|---|---|
| `version` | string | Version semantica. Si tambien se define en marketplace, `plugin.json` tiene prioridad | `"2.1.0"` |
| `description` | string | Explicacion breve del proposito del plugin | `"Deployment automation tools"` |
| `author` | object | Informacion del autor (`name` requerido, `email` y `url` opcionales) | `{"name": "Dev Team", "email": "dev@co.com"}` |
| `homepage` | string | URL de documentacion | `"https://docs.example.com"` |
| `repository` | string | URL del codigo fuente | `"https://github.com/user/plugin"` |
| `license` | string | Identificador SPDX de licencia | `"MIT"`, `"Apache-2.0"` |
| `keywords` | array | Tags de descubrimiento | `["deployment", "ci-cd"]` |

### Campos de Rutas de Componentes

| Campo | Tipo | Descripcion | Ejemplo |
|---|---|---|---|
| `commands` | string\|array | Archivos/directorios de comandos adicionales | `"./custom/cmd.md"` o `["./cmd1.md"]` |
| `agents` | string\|array | Archivos de agentes adicionales | `"./custom/agents/reviewer.md"` |
| `skills` | string\|array | Directorios de skills adicionales | `"./custom/skills/"` |
| `hooks` | string\|array\|object | Rutas a config de hooks o config inline | `"./my-extra-hooks.json"` |
| `mcpServers` | string\|array\|object | Rutas a config MCP o config inline | `"./my-extra-mcp-config.json"` |
| `outputStyles` | string\|array | Archivos/directorios de estilos de output | `"./styles/"` |
| `lspServers` | string\|array\|object | Configs de Language Server Protocol | `"./.lsp.json"` |

### Comportamiento de Rutas

**Las rutas custom SUPLEMENTAN los directorios por defecto, NO los reemplazan.**

- Si `commands/` existe, se carga ademas de las rutas custom especificadas
- Todas las rutas deben ser **relativas a la raiz del plugin** y empezar con `./`
- Multiples rutas se pueden especificar como arrays

```json
{
  "commands": [
    "./specialized/deploy.md",
    "./utilities/batch-process.md"
  ],
  "agents": [
    "./custom-agents/reviewer.md",
    "./custom-agents/tester.md"
  ]
}
```

---

## Tipos de Componentes

### Skills

Skills crean atajos `/nombre` que el usuario o Claude pueden invocar.

**Ubicacion**: `skills/` o `commands/` (legacy) en la raiz del plugin.

```
skills/
  pdf-processor/
    SKILL.md                # Instrucciones principales (requerido)
    reference.md            # Archivos de soporte (opcional)
    scripts/                # Scripts auxiliares (opcional)
  code-reviewer/
    SKILL.md
```

- Se descubren automaticamente al instalar el plugin
- Claude puede invocarlos automaticamente segun contexto de la tarea
- Pueden incluir archivos de soporte junto a `SKILL.md`
- Se acceden como `/plugin-name:skill-name`

### Agents (Subagentes)

Subagentes especializados que Claude puede invocar automaticamente cuando sea apropiado.

**Ubicacion**: `agents/` en la raiz del plugin.

```markdown
---
name: agent-name
description: What this agent specializes in and when Claude should invoke it
---

Detailed system prompt for the agent describing its role, expertise, and behavior.
```

- Aparecen en la interfaz `/agents`
- Claude puede invocarlos automaticamente segun contexto
- Los usuarios pueden invocarlos manualmente
- Funcionan junto a los agentes built-in de Claude

### Hooks

Event handlers que responden a eventos de Claude Code automaticamente.

**Ubicacion**: `hooks/hooks.json` en la raiz del plugin, o inline en `plugin.json`.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

**Eventos disponibles**:

| Evento | Descripcion |
|---|---|
| `PreToolUse` | Antes de que Claude use cualquier herramienta |
| `PostToolUse` | Despues de que Claude use una herramienta exitosamente |
| `PostToolUseFailure` | Despues de que falle la ejecucion de herramienta |
| `PermissionRequest` | Cuando se muestra un dialogo de permiso |
| `UserPromptSubmit` | Cuando el usuario envia un prompt |
| `Notification` | Cuando Claude Code envia notificaciones |
| `Stop` | Cuando Claude intenta detenerse |
| `SubagentStart` | Cuando se inicia un subagente |
| `SubagentStop` | Cuando un subagente intenta detenerse |
| `SessionStart` | Al inicio de sesion |
| `SessionEnd` | Al final de sesion |
| `TeammateIdle` | Cuando un teammate del agent team va a estar idle |
| `TaskCompleted` | Cuando una tarea se marca como completada |
| `PreCompact` | Antes de compactar el historial de conversacion |

**Tipos de hook**:

| Tipo | Descripcion |
|---|---|
| `command` | Ejecutar comandos shell o scripts |
| `prompt` | Evaluar un prompt con un LLM (usa `$ARGUMENTS` para contexto) |
| `agent` | Ejecutar un verificador agentico con herramientas para validacion compleja |

### MCP Servers

Servidores Model Context Protocol para conectar Claude Code con herramientas y servicios externos.

**Ubicacion**: `.mcp.json` en la raiz del plugin, o inline en `plugin.json`.

```json
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data"
      }
    },
    "plugin-api-client": {
      "command": "npx",
      "args": ["@company/mcp-server", "--plugin-mode"],
      "cwd": "${CLAUDE_PLUGIN_ROOT}"
    }
  }
}
```

- Se inician automaticamente cuando el plugin esta habilitado
- Aparecen como herramientas MCP estandar en el toolkit de Claude
- Se pueden configurar independientemente de los servidores MCP del usuario

### LSP Servers

Servidores Language Server Protocol para dar a Claude inteligencia de codigo en tiempo real (diagnosticos, go to definition, find references, hover info).

**Ubicacion**: `.lsp.json` en la raiz del plugin, o inline en `plugin.json`.

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

**Campos requeridos**:

| Campo | Descripcion |
|---|---|
| `command` | Binario LSP a ejecutar (debe estar en PATH) |
| `extensionToLanguage` | Mapeo de extensiones de archivo a identificadores de lenguaje |

**Campos opcionales**:

| Campo | Descripcion |
|---|---|
| `args` | Argumentos de linea de comandos para el servidor LSP |
| `transport` | Transporte de comunicacion: `stdio` (default) o `socket` |
| `env` | Variables de entorno al iniciar el servidor |
| `initializationOptions` | Opciones pasadas al servidor durante inicializacion |
| `settings` | Settings pasados via `workspace/didChangeConfiguration` |
| `workspaceFolder` | Ruta del workspace folder para el servidor |
| `startupTimeout` | Tiempo maximo de espera para startup (milisegundos) |
| `shutdownTimeout` | Tiempo maximo para shutdown graceful (milisegundos) |
| `restartOnCrash` | Si reiniciar automaticamente el servidor al crashear |
| `maxRestarts` | Maximo de intentos de reinicio antes de rendirse |

> **Importante**: El binario del language server debe instalarse por separado. Los plugins LSP configuran como Claude Code se conecta, pero no incluyen el servidor en si.

### Output Styles

Personalizan como responde Claude. Se ubican en el directorio especificado por `outputStyles` en el manifiesto.

### Settings del Plugin

**Ubicacion**: `settings.json` en la raiz del plugin.

```json
{
  "agent": "security-reviewer"
}
```

Solo la clave `"agent"` esta soportada actualmente. Activa un agente del plugin como hilo principal cuando el plugin esta habilitado.

---

## Variable de Entorno

### `${CLAUDE_PLUGIN_ROOT}`

Contiene la **ruta absoluta** al directorio del plugin. Usar en hooks, MCP servers y scripts para asegurar rutas correctas sin importar la ubicacion de instalacion.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/process.sh"
          }
        ]
      }
    ]
  }
}
```

> Los plugins se copian a un cache local (`~/.claude/plugins/cache`) al instalarse desde un marketplace. Las rutas con `../` no funcionan porque los archivos externos no se copian. Usar symlinks si se necesitan archivos compartidos.

---

## Scopes de Instalacion

| Scope | Archivo de settings | Caso de uso |
|---|---|---|
| `user` | `~/.claude/settings.json` | Plugins personales en todos los proyectos (**default**) |
| `project` | `.claude/settings.json` | Plugins de equipo compartidos via version control |
| `local` | `.claude/settings.local.json` | Plugins especificos del proyecto, gitignored |
| `managed` | Managed settings (rutas del sistema por plataforma) | Plugins administrados (solo lectura, solo update) |

---

## Comandos CLI

### Comandos no-interactivos (terminal)

```bash
# Instalar plugin (default: scope user)
claude plugin install <plugin> [--scope user|project|local]
claude plugin install formatter@my-marketplace --scope project

# Desinstalar plugin (aliases: remove, rm)
claude plugin uninstall <plugin> [--scope user|project|local]

# Habilitar plugin deshabilitado
claude plugin enable <plugin> [--scope user|project|local]

# Deshabilitar sin desinstalar
claude plugin disable <plugin> [--scope user|project|local]

# Actualizar a ultima version
claude plugin update <plugin> [--scope user|project|local|managed]

# Validar plugin o marketplace
claude plugin validate .
```

### Desarrollo con `--plugin-dir`

```bash
# Cargar plugin local para testing durante la sesion
claude --plugin-dir ./path/to/my-plugin
```

El plugin se carga solo por la duracion de la sesion, sin instalarlo en cache.

### Comando TUI `/plugin`

Interfaz interactiva con 4 tabs (navegar con Tab / Shift+Tab):

| Tab | Descripcion |
|---|---|
| **Discover** | Explorar plugins disponibles de todos los marketplaces registrados |
| **Installed** | Ver y gestionar plugins instalados (agrupados por scope) |
| **Marketplaces** | Agregar, eliminar o actualizar marketplaces |
| **Errors** | Ver errores de carga de plugins |

Dentro de la TUI:
- Escribir para filtrar por nombre o descripcion
- Enter en un plugin para ver detalles y elegir scope de instalacion
- Gestionar enable/disable/uninstall desde la tab Installed

### Gestion de Marketplaces desde TUI

```bash
# Agregar marketplace desde GitHub
/plugin marketplace add owner/repo

# Agregar desde URL Git (GitLab, Bitbucket, etc.)
/plugin marketplace add https://gitlab.com/company/plugins.git

# Agregar branch/tag especifico
/plugin marketplace add https://gitlab.com/company/plugins.git#v1.0.0

# Agregar marketplace local
/plugin marketplace add ./my-marketplace

# Agregar desde URL remota
/plugin marketplace add https://example.com/marketplace.json

# Listar marketplaces
/plugin marketplace list

# Actualizar listings
/plugin marketplace update marketplace-name

# Eliminar marketplace (desinstala sus plugins)
/plugin marketplace remove marketplace-name
```

> **Atajo**: `/plugin market` en vez de `/plugin marketplace`, `rm` en vez de `remove`.

---

## Marketplace

### Schema de `marketplace.json`

Ubicacion: `.claude-plugin/marketplace.json` en la raiz del repositorio.

```json
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "metadata": {
    "description": "Internal development plugins",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0"
    },
    {
      "name": "deployment-tools",
      "source": {
        "source": "github",
        "repo": "company/deploy-plugin"
      },
      "description": "Deployment automation tools"
    }
  ]
}
```

### Campos Requeridos del Marketplace

| Campo | Tipo | Descripcion | Ejemplo |
|---|---|---|---|
| `name` | string | Identificador del marketplace (kebab-case) | `"acme-tools"` |
| `owner` | object | Informacion del mantenedor | Ver abajo |
| `plugins` | array | Lista de plugins disponibles | Ver abajo |

**Campos de `owner`**:

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `name` | string | Si | Nombre del mantenedor o equipo |
| `email` | string | No | Email de contacto |

**Metadata opcional**:

| Campo | Tipo | Descripcion |
|---|---|---|
| `metadata.description` | string | Descripcion breve del marketplace |
| `metadata.version` | string | Version del marketplace |
| `metadata.pluginRoot` | string | Directorio base prepended a paths relativos de source de plugins |

### Campos de Entrada de Plugin

**Requeridos**:

| Campo | Tipo | Descripcion |
|---|---|---|
| `name` | string | Identificador del plugin (kebab-case). Visible al instalar: `/plugin install my-plugin@marketplace` |
| `source` | string\|object | De donde obtener el plugin (ver tipos de source abajo) |

**Opcionales (metadata estandar)**:

| Campo | Tipo | Descripcion |
|---|---|---|
| `description` | string | Descripcion breve del plugin |
| `version` | string | Version del plugin |
| `author` | object | Informacion del autor (`name` requerido, `email` opcional) |
| `homepage` | string | URL de homepage o documentacion |
| `repository` | string | URL del repositorio de codigo fuente |
| `license` | string | Identificador SPDX de licencia |
| `keywords` | array | Tags para descubrimiento y categorizacion |
| `category` | string | Categoria del plugin para organizacion |
| `tags` | array | Tags para busqueda |
| `strict` | boolean | Controla si `plugin.json` es la autoridad para componentes (default: `true`) |

**Opcionales (configuracion de componentes)**: Se pueden incluir `commands`, `agents`, `hooks`, `mcpServers`, `lspServers` con la misma estructura del manifiesto.

### Tipos de Source de Plugins

| Tipo | Formato | Campos | Notas |
|---|---|---|---|
| Path relativo | `string` (ej. `"./my-plugin"`) | -- | Directorio local dentro del repo del marketplace. Debe empezar con `./` |
| `github` | object | `repo` (requerido), `ref?`, `sha?` | Repositorio GitHub en formato `owner/repo` |
| `url` (Git) | object | `url` (requerido, debe terminar en `.git`), `ref?`, `sha?` | Cualquier URL Git (GitLab, Bitbucket, self-hosted) |
| `npm` | object | `package` (requerido), `version?`, `registry?` | Instalado via `npm install` |
| `pip` | object | `package` (requerido), `version?`, `registry?` | Instalado via pip |

**Ejemplos de source**:

```json
// Path relativo (dentro del mismo repo)
{ "name": "my-plugin", "source": "./plugins/my-plugin" }

// GitHub
{ "name": "gh-plugin", "source": { "source": "github", "repo": "owner/repo", "ref": "v2.0.0", "sha": "a1b2c3d4..." } }

// Git URL
{ "name": "git-plugin", "source": { "source": "url", "url": "https://gitlab.com/team/plugin.git", "ref": "main" } }

// npm
{ "name": "npm-plugin", "source": { "source": "npm", "package": "@acme/claude-plugin", "version": "^2.0.0", "registry": "https://npm.example.com" } }

// pip
{ "name": "pip-plugin", "source": { "source": "pip", "package": "my-claude-plugin", "version": ">=1.0" } }
```

### Strict Mode

| Valor | Comportamiento |
|---|---|
| `true` (default) | `plugin.json` es la autoridad. El marketplace entry puede suplementar con componentes adicionales, y ambas fuentes se mezclan |
| `false` | El marketplace entry es la definicion completa. Si el plugin tambien tiene `plugin.json` con componentes, hay conflicto y el plugin falla al cargar |

- **`strict: true`**: el plugin gestiona sus propios componentes; el marketplace puede agregar extras encima.
- **`strict: false`**: el marketplace tiene control total; util cuando se restructuran o curan componentes de forma diferente a la intencion del autor.

### Nombres Reservados de Marketplace

Los siguientes nombres estan reservados para uso oficial de Anthropic y **no pueden usarse** por marketplaces de terceros:

- `claude-code-marketplace`
- `claude-code-plugins`
- `claude-plugins-official`
- `anthropic-marketplace`
- `anthropic-plugins`
- `agent-skills`
- `life-sciences`

Nombres que impersonan marketplaces oficiales (como `official-claude-plugins` o `anthropic-tools-v2`) tambien estan bloqueados.

---

## `enabledPlugins` en settings.json

Formato para habilitar/deshabilitar plugins en cualquier archivo de settings:

```json
{
  "enabledPlugins": {
    "code-formatter@company-tools": true,
    "deployment-tools@company-tools": true,
    "old-plugin@some-marketplace": false
  }
}
```

El formato es `"plugin-name@marketplace-name": true|false`.

---

## Configuracion de Marketplaces en Settings

### `extraKnownMarketplaces`

Registrar marketplaces para que el equipo los instale automaticamente al confiar en el folder del proyecto. Se configura en `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  }
}
```

### `strictKnownMarketplaces` (solo managed settings)

Restringe que marketplaces pueden agregar los usuarios. Solo configurable en managed settings.

| Valor | Comportamiento |
|---|---|
| Undefined (default) | Sin restricciones. Usuarios pueden agregar cualquier marketplace |
| Array vacio `[]` | Lockdown completo. Usuarios no pueden agregar ningun marketplace nuevo |
| Lista de sources | Usuarios solo pueden agregar marketplaces que coincidan exactamente |

```json
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/approved-plugins" },
    { "source": "github", "repo": "acme-corp/security-tools", "ref": "v2.0" },
    { "source": "url", "url": "https://plugins.example.com/marketplace.json" },
    { "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
  ]
}
```

### `blockedMarketplaces` (solo managed settings)

Bloquear marketplaces especificos para usuarios de la organizacion. Se configura en managed settings.

---

## Versionado

### Semantic Versioning

Formato: `MAJOR.MINOR.PATCH`

| Componente | Significado |
|---|---|
| **MAJOR** | Cambios incompatibles (breaking changes) |
| **MINOR** | Nuevas funcionalidades (backward-compatible) |
| **PATCH** | Bug fixes (backward-compatible) |

Se soportan pre-releases: `2.0.0-beta.1`.

### Prioridad de Version

- Si la version se define en **ambos** `plugin.json` y `marketplace.json`, **`plugin.json` siempre gana** (silenciosamente).
- Para plugins con path relativo, definir version en el marketplace entry.
- Para plugins con source externo, definir version en `plugin.json`.
- Evitar definirla en ambos lugares.

### Cache y Actualizaciones

- Los plugins de marketplace se copian al **cache local** (`~/.claude/plugins/cache`).
- Claude Code usa la version para determinar si actualizar. Si se cambia codigo pero no se bumpa la version, los usuarios existentes **no veran los cambios** debido al cache.
- Rutas con `../` no funcionan despues de la instalacion (archivos externos no se copian).
- Se pueden usar symlinks para compartir archivos entre plugins.

### Auto-updates

| Tipo de marketplace | Auto-update por defecto |
|---|---|
| Oficial de Anthropic (`claude-plugins-official`) | Habilitado |
| Terceros y desarrollo local | Deshabilitado |

Configuracion de auto-update:
- Toggle por marketplace individual desde la TUI (`/plugin` > Marketplaces > elegir > Enable/Disable auto-update).
- Variable `DISABLE_AUTOUPDATER` deshabilita todas las actualizaciones automaticas (Claude Code + plugins).
- Variable `FORCE_AUTOUPDATE_PLUGINS=true` junto con `DISABLE_AUTOUPDATER` mantiene plugin auto-updates activos pero deshabilita updates de Claude Code.

Para repos privados, las auto-updates requieren tokens de autenticacion en el environment:

| Proveedor | Variables de entorno |
|---|---|
| GitHub | `GITHUB_TOKEN` o `GH_TOKEN` |
| GitLab | `GITLAB_TOKEN` o `GL_TOKEN` |
| Bitbucket | `BITBUCKET_TOKEN` |

### Release Channels

Se pueden configurar canales "stable" y "latest" creando dos marketplaces que apunten a diferentes refs del mismo repo:

```json
// stable-tools marketplace
{ "plugins": [{ "name": "formatter", "source": { "source": "github", "repo": "acme/formatter", "ref": "stable" } }] }

// latest-tools marketplace
{ "plugins": [{ "name": "formatter", "source": { "source": "github", "repo": "acme/formatter", "ref": "latest" } }] }
```

> El `plugin.json` debe declarar una `version` diferente en cada ref. Si dos refs tienen la misma version, Claude Code los trata como identicos y no actualiza.

---

## Plugin vs Standalone

| Aspecto | Standalone (`.claude/`) | Plugin |
|---|---|---|
| Invocacion de skills | `/hello` | `/plugin-name:hello` |
| Alcance | Especifico del proyecto | Compartible via marketplaces |
| Ubicacion de skills | `.claude/skills/` o `.claude/commands/` | `plugin/skills/` o `plugin/commands/` |
| Ubicacion de hooks | `settings.json` directamente | `hooks/hooks.json` |
| Ubicacion de MCP | `.claude/settings.json` > `mcpServers` | `.mcp.json` en raiz del plugin |
| Ubicacion de agentes | `.claude/agents/` | `agents/` en raiz del plugin |
| Variable de entorno | No aplica | `${CLAUDE_PLUGIN_ROOT}` disponible |
| Distribucion | Manual (copiar archivos) | Automatica via marketplaces |
| Versionado | No tiene | Semantic versioning con auto-updates |
| Namespacing | Nombre directo | `plugin-name:component-name` |

---

## Migracion Standalone a Plugin

1. **Crear estructura**: `mkdir -p my-plugin/.claude-plugin`
2. **Crear manifiesto**: Crear `.claude-plugin/plugin.json` con al menos `name`
3. **Mover skills**: `.claude/skills/*` o `.claude/commands/*` a `my-plugin/skills/` o `my-plugin/commands/`
4. **Mover agentes**: `.claude/agents/*` a `my-plugin/agents/`
5. **Extraer hooks**: Hooks de `settings.json` a `my-plugin/hooks/hooks.json` (envolver en `{"hooks": {...}}`)
6. **Extraer MCP**: Configs MCP de settings a `my-plugin/.mcp.json`
7. **Actualizar rutas**: Reemplazar rutas absolutas/relativas con `${CLAUDE_PLUGIN_ROOT}`
8. **Hacer scripts ejecutables**: `chmod +x scripts/*.sh`
9. **Probar localmente**: `claude --plugin-dir ./my-plugin`
10. **Distribuir**: Crear marketplace o agregar a uno existente

---

## Debugging

### Herramientas de Debug

```bash
# Ver detalles de carga de plugins (que se carga, errores, registros)
claude --debug

# Dentro de la TUI
/debug

# Validar plugin o marketplace
claude plugin validate .
/plugin validate .
```

La tab **Errors** de `/plugin` muestra errores de carga de plugins.

### Problemas Comunes y Soluciones

| Problema | Causa | Solucion |
|---|---|---|
| Plugin no carga | `plugin.json` invalido | Validar JSON con `claude plugin validate` o `/plugin validate` |
| Comandos no aparecen | Estructura de directorio incorrecta | Asegurar `commands/` en la raiz, no dentro de `.claude-plugin/` |
| Hooks no se ejecutan | Script no ejecutable | `chmod +x script.sh` y verificar shebang (`#!/bin/bash`) |
| MCP server falla | Falta `${CLAUDE_PLUGIN_ROOT}` | Usar la variable para todas las rutas del plugin |
| Errores de ruta | Rutas absolutas usadas | Todas las rutas deben ser relativas y empezar con `./` |
| LSP `Executable not found in $PATH` | Language server no instalado | Instalar el binario (ej. `npm install -g typescript-language-server typescript`) |
| Archivos no encontrados post-install | Rutas con `../` | Los plugins se copian a cache; usar symlinks para archivos externos |
| Skills de plugin no aparecen | Cache corrupto | `rm -rf ~/.claude/plugins/cache`, reiniciar, reinstalar |

### Mensajes de Error Comunes

**Errores de validacion de manifiesto**:
- `Invalid JSON syntax: Unexpected token...` -- falta coma, coma extra, o strings sin comillas
- `Plugin has an invalid manifest file... name: Required` -- campo requerido faltante
- `Plugin has a corrupt manifest file...` -- error de sintaxis JSON

**Errores de carga**:
- `Warning: No commands found in plugin...` -- la ruta de comandos existe pero no contiene archivos `.md` validos
- `Plugin directory not found at path...` -- la ruta `source` en marketplace.json apunta a un directorio inexistente
- `Plugin has conflicting manifests...` -- definiciones duplicadas de componentes; verificar `strict` mode

**Troubleshooting de hooks**:
1. Verificar que el script es ejecutable: `chmod +x ./scripts/your-script.sh`
2. Verificar shebang: primera linea `#!/bin/bash` o `#!/usr/bin/env bash`
3. Verificar ruta con `${CLAUDE_PLUGIN_ROOT}`
4. Probar script manualmente: `./scripts/your-script.sh`
5. Verificar nombre de evento (case-sensitive): `PostToolUse`, no `postToolUse`

**Git timeout**: Si git clone/pull excede 120s, aumentar con:
```bash
export CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS=300000  # 5 minutos
```

---

## Plugins Oficiales del Marketplace (`claude-plugins-official`)

El marketplace oficial de Anthropic esta pre-configurado y disponible automaticamente.

### Code Intelligence (LSP)

| Plugin | Language Server | Comando de instalacion del binario |
|---|---|---|
| `typescript-lsp` | TypeScript Language Server | `npm install -g typescript-language-server typescript` |
| `pyright-lsp` | Pyright (Python) | `pip install pyright` o `npm install -g pyright` |
| `gopls-lsp` | gopls (Go) | `go install golang.org/x/tools/gopls@latest` |
| `rust-analyzer-lsp` | rust-analyzer | [Instalacion](https://rust-analyzer.github.io/manual.html#installation) |
| `clangd-lsp` | clangd (C/C++) | Incluido con LLVM/Clang |
| `jdtls-lsp` | Eclipse JDT.LS (Java) | Via Eclipse o instalador independiente |
| `kotlin-lsp` | Kotlin Language Server | Via build del repositorio |
| `csharp-lsp` | csharp-ls (C#) | `dotnet tool install -g csharp-ls` |
| `php-lsp` | Intelephense (PHP) | `npm install -g intelephense` |
| `swift-lsp` | SourceKit-LSP (Swift) | Incluido con Swift toolchain |
| `lua-lsp` | Lua Language Server | Via build o package manager |

**Capacidades que obtiene Claude con LSP**:
- Diagnosticos automaticos (errores y warnings inmediatos tras cada edit)
- Navegacion de codigo (go to definition, find references, hover info)
- Informacion de tipos y documentacion de simbolos

### Integraciones Externas (MCP)

| Plugin | Servicio | Descripcion |
|---|---|---|
| `github` | GitHub | Gestion de repositorios, PRs, issues |
| `gitlab` | GitLab | Plataforma DevOps |
| `atlassian` | Jira / Confluence | Gestion de proyectos y documentacion |
| `asana` | Asana | Gestion de proyectos |
| `linear` | Linear | Issue tracking |
| `Notion` | Notion | Workspace e integracion |
| `slack` | Slack | Comunicacion del workspace |
| `figma` | Figma | Plataforma de diseno |
| `supabase` | Supabase | Operaciones de base de datos, auth, storage |
| `firebase` | Firebase | Google Firebase MCP |
| `vercel` | Vercel | Plataforma de deployment |
| `sentry` | Sentry | Monitoreo de errores |
| `stripe` | Stripe | Plataforma de pagos |
| `playwright` | Playwright | Automatizacion de browser y testing E2E (Microsoft) |
| `greptile` | Greptile | Busqueda de codigo con AI |
| `serena` | Serena | Analisis semantico de codigo (community-managed) |
| `context7` | Context7 | Lookup de documentacion (community-managed) |
| `laravel-boost` | Laravel | Toolkit de desarrollo Laravel |
| `pinecone` | Pinecone | Base de datos vectorial |
| `posthog` | PostHog | Plataforma de analytics |
| `firecrawl` | Firecrawl | Web scraping y crawling |
| `semgrep` | Semgrep | Deteccion de vulnerabilidades de seguridad |
| `coderabbit` | CodeRabbit | Code review con analizadores estaticos |
| `sonatype-guide` | Sonatype | Seguridad de supply chain |
| `circleback` | Circleback | Contexto conversacional |
| `huggingface-skills` | Hugging Face | Modelos AI open source |
| `qodo-skills` | Qodo | Capacidades reutilizables de agentes AI |
| `superpowers` | Superpowers | Brainstorming, subagentes y TDD |

### Flujos de Trabajo de Desarrollo

| Plugin | Descripcion |
|---|---|
| `commit-commands` | Comandos git commit: commit, push, creacion de PR |
| `pr-review-toolkit` | Agentes especializados en review de PRs (comments, tests, error handling, type design, code quality, simplification) |
| `code-review` | Code review automatizado con multiples agentes especializados |
| `code-simplifier` | Agente para simplificar y refinar codigo |
| `feature-dev` | Workflow completo de desarrollo de features con agentes para exploracion, arquitectura y review de calidad |
| `agent-sdk-dev` | Kit de desarrollo para Claude Agent SDK |
| `plugin-dev` | Toolkit completo para desarrollar plugins de Claude Code |
| `skill-creator` | Crear, mejorar y medir rendimiento de skills |
| `claude-code-setup` | Analizar codebases y recomendar automations de Claude Code |
| `claude-md-management` | Herramientas para mantener y mejorar archivos CLAUDE.md |
| `hookify` | Crear custom hooks facilmente para prevenir comportamientos no deseados |
| `security-guidance` | Hook de recordatorio de seguridad al editar archivos |
| `frontend-design` | Crear interfaces frontend production-grade con alta calidad de diseno |
| `playground` | Crear playgrounds HTML interactivos con controles visuales y live preview |
| `ralph-loop` | Loops auto-referenciales interactivos de AI para desarrollo iterativo |

### Output Styles

| Plugin | Descripcion |
|---|---|
| `explanatory-output-style` | Insights educativos sobre decisiones de implementacion y patrones |
| `learning-output-style` | Modo de aprendizaje interactivo que solicita contribuciones de codigo |
