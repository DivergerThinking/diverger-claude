# Plugins - Sistema de Extensiones
> Referencia oficial: https://code.claude.com/docs/en/plugins
> Última actualización: 2026-02-28

## Estructura de Directorio de Plugin

```
my-plugin/
  .claude-plugin/
    plugin.json          # Manifiesto (solo esto va aquí)
  commands/              # Comandos slash como archivos .md
  agents/                # Definiciones de agentes custom
  skills/                # Skills de agente con SKILL.md
  hooks/
    hooks.json           # Configuraciones de hooks
  .mcp.json              # Configuraciones de servidor MCP
  .lsp.json              # Configuraciones de servidor LSP
  settings.json          # Settings por defecto (solo clave "agent" soportada)
```

## Manifiesto del Plugin (`plugin.json`)

```json
{
  "name": "my-plugin",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": { "name": "Your Name" },
  "homepage": "https://...",
  "repository": "https://...",
  "license": "MIT"
}
```

## Plugin vs Standalone

| Standalone (`.claude/`) | Plugin |
|---|---|
| `/hello` | `/plugin-name:hello` |
| Específico del proyecto | Compartible vía marketplaces |
| Archivos en `.claude/commands/` | Archivos en `plugin/commands/` |
| Hooks en `settings.json` | Hooks en `hooks/hooks.json` |

## Tipos de Fuente de Marketplace

```json
{ "source": "github", "repo": "org/repo", "ref": "v2.0", "path": "marketplace" }
{ "source": "git", "url": "https://gitlab.example.com/repo.git" }
{ "source": "url", "url": "https://plugins.example.com/marketplace.json", "headers": {} }
{ "source": "npm", "package": "@org/claude-plugins" }
{ "source": "file", "path": "/path/to/marketplace.json" }
{ "source": "directory", "path": "/path/to/plugins-dir" }
{ "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
```

## Configuración LSP (`.lsp.json`)

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": { ".go": "go" }
  }
}
```

## Settings del Plugin

```json
{ "agent": "security-reviewer" }
```

Activa un agente del plugin como hilo principal.
