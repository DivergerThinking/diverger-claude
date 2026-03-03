# MCP - Model Context Protocol
> Referencia oficial: https://code.claude.com/docs/en/mcp
> Ultima actualizacion: 2026-03-03

## Tipos de Transporte

| Transporte | Comando CLI | Caso de Uso | Estado |
|---|---|---|---|
| HTTP (streamable) | `claude mcp add --transport http <name> <url>` | Servidores remotos | Recomendado |
| SSE | `claude mcp add --transport sse <name> <url>` | Servidores remotos legacy | Deprecado |
| stdio | `claude mcp add <name> -- <command> [args...]` | Procesos locales | Estable |

HTTP es el transporte recomendado para servidores remotos. SSE sigue funcionando pero esta marcado como deprecado y sera removido en versiones futuras.

## Alcances de Configuracion MCP

| Alcance | Almacenamiento | Proposito | Compartido |
|---|---|---|---|
| `local` (default) | `~/.claude.json` bajo clave de ruta del proyecto | Personal, solo proyecto actual | No |
| `project` | `.mcp.json` en raiz del proyecto | Compartido con equipo via git | Si |
| `user` | `~/.claude.json` seccion global `mcpServers` | Personal, todos los proyectos | No |

```bash
# Agregar con alcance especifico
claude mcp add --transport http stripe --scope project https://mcp.stripe.com
claude mcp add --transport http personal-api --scope user https://api.example.com/mcp
claude mcp add my-local-server -- node ./server.js  # default: scope local
```

## Schema de .mcp.json

El archivo `.mcp.json` en la raiz del proyecto define servidores MCP compartidos con el equipo:

```json
{
  "mcpServers": {
    "stdio-server": {
      "command": "node",
      "args": ["./tools/mcp-server.js", "--port", "3000"],
      "env": {
        "NODE_ENV": "development",
        "API_KEY": "${API_KEY}"
      },
      "cwd": "${CLAUDE_PROJECT_DIR}/tools"
    },
    "http-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}",
        "X-Custom-Header": "value"
      }
    },
    "http-with-oauth": {
      "type": "http",
      "url": "https://mcp.service.com/v1",
      "oauth": {
        "clientId": "my-client-id",
        "callbackPort": 8080
      }
    },
    "sse-legacy": {
      "type": "sse",
      "url": "https://legacy.example.com/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${SSE_TOKEN}"
      }
    }
  }
}
```

### Campos para transporte stdio

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `command` | string | Si | Comando a ejecutar |
| `args` | string[] | No | Argumentos del comando |
| `env` | object | No | Variables de entorno para el proceso |
| `cwd` | string | No | Directorio de trabajo del proceso |

### Campos para transporte HTTP/SSE

| Campo | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `type` | string | Si | `"http"` o `"sse"` |
| `url` | string | Si | URL del servidor MCP |
| `headers` | object | No | Headers HTTP personalizados |
| `oauth` | object | No | Configuracion OAuth (solo HTTP) |

### Configuracion OAuth

| Campo | Tipo | Descripcion |
|---|---|---|
| `clientId` | string | ID de cliente OAuth |
| `callbackPort` | number | Puerto para el callback de OAuth (default: puerto aleatorio) |

## Expansion de Variables de Entorno

En `command`, `args`, `env`, `url`, `headers` y `cwd` se soporta expansion de variables:

| Sintaxis | Descripcion | Ejemplo |
|---|---|---|
| `${VAR}` | Expande la variable de entorno `VAR` | `${API_KEY}` |
| `${VAR:-default}` | Usa `default` si `VAR` no esta definida | `${API_BASE:-https://api.example.com}` |

```json
{
  "mcpServers": {
    "example": {
      "type": "http",
      "url": "${MCP_URL:-https://localhost:3000}/mcp",
      "headers": {
        "Authorization": "Bearer ${MCP_TOKEN}"
      }
    }
  }
}
```

Si una variable requerida no esta definida, el servidor MCP fallara al conectarse con un error descriptivo.

## Comandos CLI de Gestion

```bash
# Agregar servidores
claude mcp add <name> -- <command> [args...]           # stdio (default)
claude mcp add --transport http <name> <url>           # HTTP
claude mcp add --transport sse <name> <url>            # SSE (deprecado)
claude mcp add-json <name> '<json-config>'             # Desde JSON directo

# Importar desde Claude Desktop
claude mcp add-from-claude-desktop                     # Importa servidores de Claude Desktop

# Listar y consultar
claude mcp list                                        # Lista todos los servidores MCP
claude mcp get <name>                                  # Detalle de un servidor

# Eliminar
claude mcp remove <name>                               # Elimina un servidor

# Resetear decisiones de permisos del proyecto
claude mcp reset-project-choices                       # Resetea allow/deny de .mcp.json

# Claude Code como servidor MCP
claude mcp serve                                       # Inicia Claude Code como server MCP
```

### claude mcp add - Opciones

| Flag | Descripcion |
|---|---|
| `--transport <type>` | Tipo de transporte: `http`, `sse`, `stdio` (default) |
| `--scope <scope>` | Alcance: `local` (default), `project`, `user` |
| `--header <key:value>` | Header HTTP (puede repetirse) |
| `--env <KEY=VALUE>` | Variable de entorno (puede repetirse, solo stdio) |

## Nomenclatura de Herramientas MCP

Las herramientas expuestas por servidores MCP siguen el formato:

```
mcp__<server-name>__<tool-name>
```

Ejemplo: un servidor llamado `github` que expone la herramienta `create_issue`:
```
mcp__github__create_issue
```

Este nombre se usa en:
- Permisos (`allowedTools`, `deniedTools`)
- Matchers de hooks (`PreToolUse` matcher: `mcp__github__.*`)
- Logs y transcripts

## Tool Search

Cuando hay muchos servidores MCP con muchas herramientas, las definiciones pueden consumir demasiado contexto. Tool Search optimiza esto:

```bash
# Auto-activar cuando herramientas MCP superan umbral (default 10%)
ENABLE_TOOL_SEARCH=auto claude

# Auto con umbral personalizado (5%)
ENABLE_TOOL_SEARCH=auto:5 claude

# Siempre activado
ENABLE_TOOL_SEARCH=true claude

# Desactivado
ENABLE_TOOL_SEARCH=false claude
```

| Valor | Comportamiento |
|---|---|
| `auto` (default) | Se activa cuando definiciones MCP superan 10% de la ventana de contexto |
| `auto:N` | Se activa cuando superan N% de la ventana |
| `true` | Siempre activado |
| `false` | Siempre desactivado |

Requisitos:
- Requiere modelo **Sonnet 4** o superior
- Cuando esta activo, Claude busca herramientas relevantes por nombre/descripcion en vez de cargar todas las definiciones

## Limites de Output MCP

| Variable | Default | Descripcion |
|---|---|---|
| `MAX_MCP_OUTPUT_TOKENS` | 25000 | Maximo de tokens en respuesta de herramienta MCP |

- Las respuestas que superan el limite se truncan
- Se muestra un warning cuando la respuesta supera **10000 tokens** (indicando que se acerca al limite)
- Override con variable de entorno:

```bash
MAX_MCP_OUTPUT_TOKENS=50000 claude
```

## MCP Managed (Enterprise)

Los administradores pueden configurar servidores MCP gestionados centralmente:

### Ubicaciones de managed-mcp.json

| Plataforma | Ruta |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/managed-mcp.json` |
| Linux/WSL | `/etc/claude-code/managed-mcp.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-mcp.json` |

### Formato managed-mcp.json

Mismo formato que `.mcp.json`:

```json
{
  "mcpServers": {
    "company-tools": {
      "type": "http",
      "url": "https://mcp.company.com/tools",
      "headers": {
        "Authorization": "Bearer ${COMPANY_MCP_TOKEN}"
      }
    }
  }
}
```

Los servidores en `managed-mcp.json` tienen **control exclusivo**: los usuarios no pueden modificar, deshabilitar ni sobreescribir estos servidores.

### Allowlist y Denylist (en managed settings)

Los administradores pueden restringir que servidores MCP pueden o no usar los usuarios:

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem"] },
    { "serverUrl": "https://mcp.company.com/*" }
  ],
  "deniedMcpServers": [
    { "serverName": "dangerous-server" },
    { "serverUrl": "https://*.untrusted.com/*" }
  ]
}
```

| Regla | Descripcion |
|---|---|
| Denylist tiene precedencia absoluta | Si un servidor esta en deny, no se conecta aunque este en allow |
| Cada entrada usa exactamente un campo | `serverName`, `serverCommand`, o `serverUrl` |
| `serverName` | Coincide por nombre del servidor MCP |
| `serverCommand` | Coincide por comando exacto (array de strings) |
| `serverUrl` | Coincide por URL (soporta wildcards `*`) |

## Settings Relacionados en settings.json

| Setting | Tipo | Descripcion |
|---|---|---|
| `enableAllProjectMcpServers` | boolean | Si `true`, habilita todos los servidores de `.mcp.json` sin preguntar |
| `enabledMcpjsonServers` | string[] | Lista de nombres de servidores de `.mcp.json` habilitados |
| `disabledMcpjsonServers` | string[] | Lista de nombres de servidores de `.mcp.json` deshabilitados |

```json
{
  "enableAllProjectMcpServers": false,
  "enabledMcpjsonServers": ["github", "stripe"],
  "disabledMcpjsonServers": ["experimental-server"]
}
```

Al encontrar un servidor en `.mcp.json` que no esta en ninguna lista, Claude Code pregunta al usuario si desea habilitarlo. `reset-project-choices` limpia estas decisiones.

## Consideraciones para Windows

En Windows nativo (no WSL), servidores MCP locales que usan `npx` u otros comandos npm requieren wrapper con `cmd /c`:

```bash
# Incorrecto en Windows
claude mcp add my-server -- npx -y @some/mcp-package

# Correcto en Windows
claude mcp add my-server -- cmd /c npx -y @some/mcp-package
```

Esto es necesario porque `npx` en Windows es un script batch (`.cmd`) que requiere el shell de Windows para ejecutarse.

Para servidores HTTP remotos, no se necesita ningun ajuste especial en Windows.

## MCP en Plugins con ${CLAUDE_PLUGIN_ROOT}

Los plugins pueden incluir servidores MCP referenciando rutas relativas al plugin:

```json
{
  "mcpServers": {
    "plugin-tools": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/server.js"],
      "env": {
        "CONFIG_PATH": "${CLAUDE_PLUGIN_ROOT}/config/mcp.json"
      }
    }
  }
}
```

`${CLAUDE_PLUGIN_ROOT}` se expande al directorio raiz del plugin, permitiendo rutas portables.

## Claude Code como Servidor MCP

Claude Code puede exponerse como servidor MCP para otras herramientas:

```bash
claude mcp serve
```

Esto inicia Claude Code en modo servidor MCP, exponiendo sus herramientas (Read, Write, Edit, Bash, Glob, Grep, etc.) para que otros clientes MCP las consuman.

Caso de uso: integrar Claude Code como backend de herramientas para otros LLMs o aplicaciones.

## MCP Prompts como Slash Commands

Los servidores MCP pueden exponer **prompts** que aparecen como slash commands en Claude Code:

- Los prompts MCP se listan en el menu `/` junto con los skills
- Se invocan con `/mcp-prompt-name`
- Los argumentos del prompt se pasan como argumentos del slash command
- Utiles para workflows predefinidos del servidor (ej. `/github-create-pr`, `/jira-create-issue`)

## MCP Resources via @

Los servidores MCP pueden exponer **resources** que se referencian con `@` en los prompts:

- Escribir `@` muestra las resources disponibles de los servidores MCP conectados
- Las resources proporcionan contexto adicional (archivos, datos, configuraciones)
- Ejemplo: `@github:repo/file.ts` podria inyectar el contenido de un archivo de GitHub

## Ejemplos Completos

### Configuracion .mcp.json para equipo

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${CLAUDE_PROJECT_DIR}"]
    },
    "company-api": {
      "type": "http",
      "url": "${COMPANY_MCP_URL:-https://mcp.company.com}/v1",
      "headers": {
        "Authorization": "Bearer ${COMPANY_API_KEY}"
      },
      "oauth": {
        "clientId": "claude-code-integration",
        "callbackPort": 9876
      }
    }
  }
}
```

### Configuracion enterprise managed

**managed-mcp.json:**
```json
{
  "mcpServers": {
    "company-compliance": {
      "type": "http",
      "url": "https://mcp-internal.company.com/compliance",
      "headers": {
        "Authorization": "Bearer ${COMPANY_SSO_TOKEN}"
      }
    }
  }
}
```

**managed settings (allowlist):**
```json
{
  "allowedMcpServers": [
    { "serverName": "company-compliance" },
    { "serverName": "github" },
    { "serverUrl": "https://mcp.company.com/*" },
    { "serverUrl": "https://mcp-internal.company.com/*" }
  ],
  "deniedMcpServers": [
    { "serverUrl": "https://*.untrusted-domain.com/*" }
  ]
}
```

### Servidor MCP local para desarrollo

```bash
# Agregar servidor stdio local
claude mcp add dev-db -- node ./tools/db-mcp-server.js --connection "${DB_URL:-postgresql://localhost:5432/dev}"

# Agregar servidor HTTP local
claude mcp add --transport http dev-api http://localhost:8080/mcp

# Ver configuracion
claude mcp get dev-db
claude mcp list
```
