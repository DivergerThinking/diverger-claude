# MCP - Model Context Protocol
> Referencia oficial: https://code.claude.com/docs/en/mcp
> Última actualización: 2026-02-28

## Tipos de Transporte

| Transporte | Comando | Caso de Uso |
|---|---|---|
| HTTP | `claude mcp add --transport http <name> <url>` | Servidores remotos (recomendado) |
| SSE | `claude mcp add --transport sse <name> <url>` | Remoto (deprecado) |
| stdio | `claude mcp add <name> -- <command> [args...]` | Procesos locales |

## Alcances de MCP

| Alcance | Almacenamiento | Propósito |
|---|---|---|
| `local` (default) | `~/.claude.json` bajo ruta del proyecto | Personal, proyecto actual |
| `project` | `.mcp.json` en raíz del proyecto (committed) | Compartido con equipo |
| `user` | `~/.claude.json` sección global | Personal, todos los proyectos |

```bash
claude mcp add --transport http stripe --scope project https://mcp.stripe.com
```

## Formato de `.mcp.json`

```json
{
  "mcpServers": {
    "shared-server": {
      "command": "/path/to/server",
      "args": [],
      "env": {}
    },
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

Soporta expansión de variables de entorno: `${VAR}` y `${VAR:-default}` en `command`, `args`, `env`, `url`, `headers`.

## Comandos de Gestión

```bash
claude mcp list
claude mcp get <name>
claude mcp remove <name>
claude mcp add-json <name> '<json>'
claude mcp add-from-claude-desktop
claude mcp reset-project-choices
claude mcp serve                    # Usar Claude Code como servidor MCP
```

## Configuración MCP Managed

Ubicaciones:
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Linux/WSL: `/etc/claude-code/managed-mcp.json`
- Windows: `C:\Program Files\ClaudeCode\managed-mcp.json`

Mismo formato que `.mcp.json`. Toma control exclusivo -- usuarios no pueden añadir/modificar servidores.

## MCP Allowlist/Denylist (en managed settings)

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

La denylist tiene precedencia absoluta. Cada entrada debe tener exactamente uno de `serverName`, `serverCommand`, o `serverUrl`.

## Tool Search

```bash
ENABLE_TOOL_SEARCH=auto:5 claude    # Umbral personalizado 5%
ENABLE_TOOL_SEARCH=false claude     # Desactivado
```

Se activa automáticamente cuando las definiciones de herramientas MCP superan el 10% de la ventana de contexto.

## Nota Windows

En Windows nativo (no WSL), servidores MCP locales usando `npx` requieren:
```bash
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```
