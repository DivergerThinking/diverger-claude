# Hooks - Sistema de Eventos y Automatización
> Referencia oficial: https://code.claude.com/docs/en/hooks
> Última actualización: 2026-02-28

## Eventos de Hooks (Lista Completa)

| Evento | Cuándo se dispara | ¿Puede bloquear? | Filtros matcher |
|---|---|---|---|
| `SessionStart` | Sesión inicia/se reanuda | No | `startup`, `resume`, `clear`, `compact` |
| `UserPromptSubmit` | Usuario envía prompt | Sí | Sin soporte de matcher |
| `PreToolUse` | Antes de llamada a herramienta | Sí | Nombre de herramienta |
| `PermissionRequest` | Diálogo de permiso | Sí | Nombre de herramienta |
| `PostToolUse` | Después de herramienta exitosa | No | Nombre de herramienta |
| `PostToolUseFailure` | Después de herramienta fallida | No | Nombre de herramienta |
| `Notification` | Claude envía notificación | No | `permission_prompt`, `idle_prompt`, etc. |
| `SubagentStart` | Subagente se inicia | No | Nombre del tipo de agente |
| `SubagentStop` | Subagente termina | Sí | Nombre del tipo de agente |
| `Stop` | Claude termina de responder | Sí | Sin soporte de matcher |
| `TeammateIdle` | Teammate del equipo idle | Sí | Sin soporte de matcher |
| `TaskCompleted` | Tarea marcada completada | Sí | Sin soporte de matcher |
| `ConfigChange` | Archivo de config cambia | Sí | `user_settings`, `project_settings`, etc. |
| `WorktreeCreate` | Creación de worktree | Sí | Sin soporte de matcher |
| `WorktreeRemove` | Eliminación de worktree | No | Sin soporte de matcher |
| `PreCompact` | Antes de compactación | No | `manual`, `auto` |
| `SessionEnd` | Sesión termina | No | `clear`, `logout`, etc. |

## Tipos de Handler

| Tipo | Descripción | Timeout Default |
|---|---|---|
| `command` | Comando shell, recibe JSON en stdin | 600s |
| `http` | HTTP POST a URL, JSON en body | 30s |
| `prompt` | Evaluación LLM single-turn, retorna `{ok, reason}` | 30s |
| `agent` | Subagente multi-turn con acceso a herramientas | 60s |

## Schema de Configuración de Hooks

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write",
            "timeout": 30,
            "async": false,
            "statusMessage": "Formatting...",
            "once": false
          }
        ]
      }
    ]
  }
}
```

## Input del Hook (JSON en stdin)

Campos comunes en cada evento:
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test" }
}
```

## Códigos de Salida

- **Exit 0**: La acción procede. Stdout se parsea como JSON.
- **Exit 2**: Error bloqueante. Stderr se envía a Claude como mensaje de error.
- **Cualquier otro**: Error no bloqueante. Stderr se loguea en modo verbose.

## Estructura de Output JSON

```json
{
  "continue": true,
  "stopReason": "message for user",
  "suppressOutput": false,
  "systemMessage": "warning message",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Use rg instead of grep"
  }
}
```

Valores de `permissionDecision` para `PreToolUse`: `"allow"`, `"deny"`, `"ask"`.

## Ubicaciones de Hooks

| Ubicación | Alcance |
|---|---|
| `~/.claude/settings.json` | Todos los proyectos |
| `.claude/settings.json` | Proyecto único (committed) |
| `.claude/settings.local.json` | Proyecto único (gitignored) |
| Managed policy settings | Toda la organización |
| Plugin `hooks/hooks.json` | Cuando el plugin está habilitado |
| Skill/Agent frontmatter | Mientras el componente está activo |

## Hook HTTP

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:8080/hooks/pre-tool-use",
            "timeout": 30,
            "headers": { "Authorization": "Bearer $MY_TOKEN" },
            "allowedEnvVars": ["MY_TOKEN"]
          }
        ]
      }
    ]
  }
}
```

## Hook basado en Prompt

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all tasks are complete.",
            "model": "haiku"
          }
        ]
      }
    ]
  }
}
```

## Hook basado en Agente

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify all unit tests pass. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

## Variables de Entorno en Hooks

- `$CLAUDE_PROJECT_DIR`: Directorio raíz del proyecto
- `${CLAUDE_PLUGIN_ROOT}`: Directorio raíz del plugin
- `$CLAUDE_CODE_REMOTE`: `"true"` en entornos remotos web
