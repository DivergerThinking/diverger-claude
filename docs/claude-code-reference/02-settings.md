# Settings - Configuración Completa
> Referencia oficial: https://code.claude.com/docs/en/settings
> Última actualización: 2026-02-28

## Sistema de 4 Niveles de Alcance (orden de precedencia)

| Alcance | Ubicación | Precedencia | Compartible |
|---|---|---|---|
| **Managed** | Server/MDM/Registry/`managed-settings.json` | 1 (más alta) | Sí (desplegado por IT) |
| **CLI args** | Línea de comandos | 2 | No |
| **Local project** | `.claude/settings.local.json` | 3 | No (gitignored) |
| **Shared project** | `.claude/settings.json` | 4 | Sí (committed) |
| **User** | `~/.claude/settings.json` | 5 (más baja) | No |

**Los arrays** entre alcances se **concatenan y deduplican** (no reemplazan).

## Ubicaciones de Archivos

```
Alcance de usuario:
  ~/.claude/settings.json
  ~/.claude/settings.local.json
  ~/.claude/agents/
  ~/.claude/CLAUDE.md
  ~/.claude/rules/
  ~/.claude/skills/
  ~/.claude.json                    # Servidores MCP, preferencias, estado

Alcance de proyecto:
  .claude/settings.json             # Committed
  .claude/settings.local.json       # Gitignored
  .claude/agents/
  .claude/skills/
  .claude/CLAUDE.md
  .claude/CLAUDE.local.md
  .claude/rules/
  .mcp.json                        # Servidores MCP del proyecto (committed)

Alcance managed:
  macOS: /Library/Application Support/ClaudeCode/managed-settings.json
  Linux/WSL: /etc/claude-code/managed-settings.json
  Windows: C:\Program Files\ClaudeCode\managed-settings.json

  Políticas MDM:
    macOS: com.anthropic.claudecode (configuration profiles)
    Windows Admin: HKLM\SOFTWARE\Policies\ClaudeCode (Group Policy/Intune)
    Windows User: HKCU\SOFTWARE\Policies\ClaudeCode
```

## Schema Completo de settings.json

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "apiKeyHelper": "/bin/generate_temp_api_key.sh",
  "cleanupPeriodDays": 30,
  "companyAnnouncements": ["Welcome!"],
  "env": { "FOO": "bar" },
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <ai@example.com>",
    "pr": "Generated with Claude Code"
  },
  "permissions": {
    "allow": ["Bash(npm run *)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Bash(curl *)", "Read(./.env)"],
    "additionalDirectories": ["../docs/"],
    "defaultMode": "acceptEdits",
    "disableBypassPermissionsMode": "disable"
  },
  "hooks": {},
  "disableAllHooks": false,
  "allowManagedHooksOnly": false,
  "allowedHttpHookUrls": ["https://hooks.example.com/*"],
  "httpHookAllowedEnvVars": ["MY_TOKEN"],
  "allowManagedPermissionRulesOnly": false,
  "allowManagedMcpServersOnly": false,
  "model": "claude-sonnet-4-6",
  "availableModels": ["sonnet", "haiku"],
  "statusLine": { "type": "command", "command": "~/.claude/statusline.sh" },
  "fileSuggestion": { "type": "command", "command": "~/.claude/file-suggestion.sh" },
  "respectGitignore": true,
  "outputStyle": "Explanatory",
  "forceLoginMethod": "claudeai",
  "forceLoginOrgUUID": "uuid-here",
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["memory", "github"],
  "disabledMcpjsonServers": ["filesystem"],
  "allowedMcpServers": [{ "serverName": "github" }],
  "deniedMcpServers": [{ "serverName": "filesystem" }],
  "autoMemoryEnabled": true,
  "alwaysThinkingEnabled": true,
  "plansDirectory": "./plans",
  "showTurnDuration": true,
  "spinnerVerbs": { "mode": "append", "verbs": ["Pondering"] },
  "language": "japanese",
  "autoUpdatesChannel": "stable",
  "spinnerTipsEnabled": true,
  "terminalProgressBarEnabled": true,
  "prefersReducedMotion": false,
  "fastModePerSessionOptIn": false,
  "teammateMode": "auto"
}
```

## Configuración de Sandbox

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker", "git"],
    "allowUnsandboxedCommands": true,
    "filesystem": {
      "allowWrite": ["//tmp/build", "~/.kube"],
      "denyWrite": ["//etc", "//usr/local/bin"],
      "denyRead": ["~/.aws/credentials", "~/.ssh/keys/**"]
    },
    "network": {
      "allowUnixSockets": ["~/.ssh/agent-socket"],
      "allowAllUnixSockets": false,
      "allowLocalBinding": true,
      "allowedDomains": ["github.com", "*.npmjs.org"],
      "allowManagedDomainsOnly": false,
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    },
    "enableWeakerNestedSandbox": false
  }
}
```

Prefijos de ruta: `//` = absoluto desde raíz, `~/` = home, `/` = relativo al directorio del settings.

## Variables de Entorno Clave

| Variable | Propósito |
|---|---|
| `ANTHROPIC_API_KEY` | API key |
| `ANTHROPIC_MODEL` | Nombre del modelo |
| `CLAUDE_CODE_ENABLE_TELEMETRY` | OpenTelemetry |
| `CLAUDE_CODE_SHELL` | Override shell |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Max output tokens (default: 32000, max: 64000) |
| `CLAUDE_CODE_EFFORT_LEVEL` | `low`, `medium`, `high` |
| `CLAUDE_CODE_SIMPLE` | Prompt mínimo + solo Bash/Read/Edit |
| `CLAUDE_CONFIG_DIR` | Ubicación custom de config |
| `CLAUDE_CODE_DISABLE_FAST_MODE` | Desactivar fast mode |
| `CLAUDE_CODE_AUTOCOMPACT_PCT_OVERRIDE` | % de contexto para auto-compactación (1-100, default: 95) |
| `BASH_DEFAULT_TIMEOUT_MS` | Timeout default de bash |
| `BASH_MAX_TIMEOUT_MS` | Timeout máximo de bash |
| `BASH_MAX_OUTPUT_LENGTH` | Max chars antes de truncar |
| `MCP_TIMEOUT` | Timeout de inicio de servidor MCP |
| `MAX_MCP_OUTPUT_TOKENS` | Max output MCP (default: 25000) |
| `ENABLE_TOOL_SEARCH` | `auto`, `auto:N%`, `true`, `false` |

## Settings Solo Managed

| Setting | Propósito |
|---|---|
| `allowManagedHooksOnly` | Forzar solo hooks managed/SDK |
| `allowManagedPermissionRulesOnly` | Forzar solo reglas de permisos managed |
| `allowManagedMcpServersOnly` | Forzar solo servidores MCP definidos por admin |
| `disableBypassPermissionsMode` | Prevenir modo bypass |
| `strictKnownMarketplaces` | Allowlist de fuentes de marketplace |
| `blockedMarketplaces` | Blocklist de fuentes de marketplace |
| `sandbox.network.allowManagedDomainsOnly` | Solo dominios managed |
