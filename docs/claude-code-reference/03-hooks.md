# Hooks - Sistema de Eventos y Automatización
> Referencia oficial: https://code.claude.com/docs/en/hooks
> Ultima actualizacion: 2026-03-03

## Eventos de Hooks (17 Eventos)

| Evento | Cuando se dispara | Puede bloquear | Filtros matcher |
|---|---|---|---|
| `SessionStart` | Sesion inicia, se reanuda, clear o compact | No | `startup`, `resume`, `clear`, `compact` |
| `UserPromptSubmit` | Usuario envia un prompt | Si (exit 2) | Sin soporte de matcher |
| `PreToolUse` | Antes de ejecutar una herramienta | Si (exit 2) | Nombre de herramienta (ej. `Bash`, `Edit`, `Write`) |
| `PermissionRequest` | Se muestra dialogo de permiso al usuario | Si (exit 2) | Nombre de herramienta |
| `PostToolUse` | Despues de herramienta ejecutada con exito | Si (decision block) | Nombre de herramienta |
| `PostToolUseFailure` | Despues de herramienta fallida | No | Nombre de herramienta |
| `Notification` | Claude envia notificacion al sistema | No | `permission_prompt`, `idle_prompt`, `task_completed`, etc. |
| `SubagentStart` | Un subagente se inicia | No | Nombre del tipo de agente (ej. `Explore`, `Code`) |
| `SubagentStop` | Un subagente termina | Si (decision block) | Nombre del tipo de agente |
| `Stop` | Claude termina de generar su respuesta | Si (decision block) | Sin soporte de matcher |
| `TeammateIdle` | Un teammate del equipo queda idle | Si | Sin soporte de matcher |
| `TaskCompleted` | Una tarea se marca como completada | Si | Sin soporte de matcher |
| `ConfigChange` | Un archivo de configuracion cambia | Si | `user_settings`, `project_settings`, `local_settings`, `mcp_json` |
| `WorktreeCreate` | Se crea un worktree | Si | Sin soporte de matcher |
| `WorktreeRemove` | Se elimina un worktree | No | Sin soporte de matcher |
| `PreCompact` | Antes de compactar la conversacion | No | `manual`, `auto` |
| `SessionEnd` | La sesion termina | No | `clear`, `logout`, `exit`, `interrupt` |

## Tipos de Handler

| Tipo | Descripcion | Timeout Default | Recibe stdin JSON | Retorna JSON |
|---|---|---|---|---|
| `command` | Comando shell ejecutado en proceso hijo | 600s | Si | Si (stdout) |
| `http` | HTTP POST a una URL, JSON en body | 600s | No (body es el JSON) | Si (response body) |
| `prompt` | Evaluacion LLM single-turn, retorna `{ok, reason}` | 30s | No | Si (evaluacion) |
| `agent` | Subagente multi-turn con acceso a herramientas | 60s | No | Si |

### Detalle de handler `command`

El proceso hijo recibe el JSON del evento por stdin. El stdout se parsea como JSON. El stderr se loguea (en verbose mode para errores no bloqueantes, visible para exit 2).

### Detalle de handler `http`

Envia HTTP POST con el JSON del evento como body. Headers personalizados soportados. Variables de entorno expandidas en headers via `allowedEnvVars`.

### Detalle de handler `prompt`

Envia un prompt al LLM en modo single-turn (sin herramientas). El LLM responde con `{ok: boolean, reason: string}`. Si `ok` es false, se trata como bloqueo.

### Detalle de handler `agent`

Lanza un subagente multi-turn con acceso a herramientas. El prompt puede usar `$ARGUMENTS` y otras sustituciones. Ideal para validaciones complejas.

## Schema de Input JSON (stdin/body)

### Campos comunes a todos los eventos

```json
{
  "session_id": "abc123-def456",
  "transcript_path": "/home/user/.claude/projects/.../transcript.jsonl",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse"
}
```

### Campos por evento

**SessionStart**
```json
{
  "hook_event_name": "SessionStart",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "type": "startup"
}
```
`type`: uno de `"startup"`, `"resume"`, `"clear"`, `"compact"`.

**UserPromptSubmit**
```json
{
  "hook_event_name": "UserPromptSubmit",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "prompt": "Fix the bug in auth.ts"
}
```

**PreToolUse**
```json
{
  "hook_event_name": "PreToolUse",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

**PermissionRequest**
```json
{
  "hook_event_name": "PermissionRequest",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf dist/"
  }
}
```

**PostToolUse**
```json
{
  "hook_event_name": "PostToolUse",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/src/index.ts",
    "old_string": "...",
    "new_string": "..."
  },
  "tool_output": "File edited successfully"
}
```

**PostToolUseFailure**
```json
{
  "hook_event_name": "PostToolUseFailure",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test" },
  "tool_error": "Process exited with code 1"
}
```

**Notification**
```json
{
  "hook_event_name": "Notification",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "type": "permission_prompt",
  "message": "Claude is requesting permission to run Bash"
}
```

**SubagentStart / SubagentStop**
```json
{
  "hook_event_name": "SubagentStart",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "agent_type": "Explore",
  "agent_id": "sub-123"
}
```
Para `SubagentStop` incluye ademas `agent_output`.

**Stop**
```json
{
  "hook_event_name": "Stop",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "stop_hook_active": false,
  "response": "I've completed the task..."
}
```

**TeammateIdle**
```json
{
  "hook_event_name": "TeammateIdle",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "teammate_id": "...",
  "idle_duration_ms": 30000
}
```

**TaskCompleted**
```json
{
  "hook_event_name": "TaskCompleted",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "task_description": "..."
}
```

**ConfigChange**
```json
{
  "hook_event_name": "ConfigChange",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "config_type": "project_settings",
  "config_path": "/home/user/project/.claude/settings.json"
}
```

**WorktreeCreate**
```json
{
  "hook_event_name": "WorktreeCreate",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "worktree_path": "/home/user/project/.claude/worktrees/feature-x",
  "branch_name": "feature-x"
}
```

**WorktreeRemove**
```json
{
  "hook_event_name": "WorktreeRemove",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "worktree_path": "/home/user/project/.claude/worktrees/feature-x"
}
```

**PreCompact**
```json
{
  "hook_event_name": "PreCompact",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "type": "auto",
  "conversation_length": 150000
}
```
`type`: `"manual"` o `"auto"`.

**SessionEnd**
```json
{
  "hook_event_name": "SessionEnd",
  "session_id": "...",
  "transcript_path": "...",
  "cwd": "...",
  "type": "exit",
  "duration_ms": 3600000
}
```
`type`: uno de `"clear"`, `"logout"`, `"exit"`, `"interrupt"`.

## Codigos de Salida (Exit Code Protocol)

| Exit Code | Significado | Comportamiento |
|---|---|---|
| **0** | Exito | La accion procede. Stdout se parsea como JSON para output estructurado |
| **2** | Error bloqueante | La accion se bloquea. Stderr se envia a Claude como mensaje de error |
| **Otro** | Error no bloqueante | Stderr se loguea en modo verbose. La accion procede normalmente |

## Estructura de Output JSON (stdout)

### Campos generales de output

```json
{
  "continue": true,
  "stopReason": "Mensaje para el usuario cuando continue=false",
  "suppressOutput": false,
  "systemMessage": "Mensaje de advertencia inyectado en conversacion",
  "hookSpecificOutput": { }
}
```

| Campo | Tipo | Descripcion |
|---|---|---|
| `continue` | boolean | Si es `false`, detiene la sesion con `stopReason` |
| `stopReason` | string | Mensaje mostrado al usuario al detener |
| `suppressOutput` | boolean | Si es `true`, no muestra el output del hook al usuario |
| `systemMessage` | string | Mensaje de sistema inyectado en la conversacion |
| `hookSpecificOutput` | object | Output especifico por tipo de evento (ver abajo) |

### hookSpecificOutput para PreToolUse

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Usa rg en lugar de grep para mejor rendimiento",
    "updatedInput": {
      "command": "rg 'pattern' src/"
    },
    "additionalContext": "Nota: este proyecto usa ripgrep en lugar de grep"
  }
}
```

| Campo | Valores | Descripcion |
|---|---|---|
| `permissionDecision` | `"allow"`, `"deny"`, `"ask"` | Decide si la herramienta puede ejecutarse |
| `permissionDecisionReason` | string | Razon mostrada a Claude/usuario |
| `updatedInput` | object | Reemplaza el input original de la herramienta |
| `additionalContext` | string | Contexto adicional inyectado para Claude |

### hookSpecificOutput para PermissionRequest

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    },
    "updatedInput": {
      "command": "npm test -- --coverage"
    },
    "updatedPermissions": {
      "allow": ["Bash(npm test:*)"],
      "deny": []
    }
  }
}
```

| Campo | Valores | Descripcion |
|---|---|---|
| `decision.behavior` | `"allow"`, `"deny"` | Responde automaticamente al dialogo de permiso |
| `updatedInput` | object | Modifica el input antes de ejecutar |
| `updatedPermissions` | object | Actualiza reglas de permiso para la sesion |

### hookSpecificOutput para PostToolUse / Stop / SubagentStop

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "decision": "block",
    "reason": "El archivo editado tiene errores de lint. Corregir antes de continuar."
  }
}
```

| Campo | Valores | Descripcion |
|---|---|---|
| `decision` | `"block"` | Bloquea la accion, el motivo se envia a Claude |
| `reason` | string | Razon del bloqueo inyectada como mensaje de error |

## Schema de Configuracion de Hooks

### En settings.json

```json
{
  "hooks": {
    "<EventName>": [
      {
        "matcher": "regex_pattern",
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.sh",
            "timeout": 30,
            "async": false,
            "statusMessage": "Ejecutando validacion...",
            "once": false
          }
        ]
      }
    ]
  }
}
```

### Campos del hook entry

| Campo | Tipo | Default | Descripcion |
|---|---|---|---|
| `matcher` | string | (ninguno) | Regex para filtrar (ej. `"Edit\|Write"` para herramientas) |
| `hooks` | array | (requerido) | Lista de handlers a ejecutar |

### Campos del handler

| Campo | Tipo | Default | Descripcion |
|---|---|---|---|
| `type` | string | (requerido) | `"command"`, `"http"`, `"prompt"`, `"agent"` |
| `command` | string | - | Comando shell (solo type command) |
| `url` | string | - | URL destino (solo type http) |
| `prompt` | string | - | Prompt para LLM (solo type prompt/agent) |
| `model` | string | - | Modelo a usar (solo type prompt/agent) |
| `timeout` | number | Depende del tipo | Timeout en segundos |
| `async` | boolean | `false` | Ejecutar en background (solo type command) |
| `statusMessage` | string | - | Mensaje mostrado mientras el hook se ejecuta |
| `once` | boolean | `false` | Ejecutar solo una vez por sesion |
| `headers` | object | - | Headers HTTP (solo type http) |
| `allowedEnvVars` | array | - | Variables de entorno permitidas en headers (solo type http) |

## Patrones de Matcher por Evento

| Evento | Matcher soporta | Ejemplos |
|---|---|---|
| `SessionStart` | Tipo de inicio | `startup`, `resume`, `clear`, `compact` |
| `UserPromptSubmit` | No soporta matcher | - |
| `PreToolUse` | Nombre de herramienta (regex) | `Bash`, `Edit\|Write`, `mcp__.*` |
| `PermissionRequest` | Nombre de herramienta (regex) | `Bash`, `Edit` |
| `PostToolUse` | Nombre de herramienta (regex) | `Edit\|Write`, `Bash` |
| `PostToolUseFailure` | Nombre de herramienta (regex) | `Bash`, `.*` |
| `Notification` | Tipo de notificacion | `permission_prompt`, `idle_prompt` |
| `SubagentStart` | Tipo de agente | `Explore`, `Code` |
| `SubagentStop` | Tipo de agente | `Explore`, `Code` |
| `Stop` | No soporta matcher | - |
| `TeammateIdle` | No soporta matcher | - |
| `TaskCompleted` | No soporta matcher | - |
| `ConfigChange` | Tipo de config | `user_settings`, `project_settings`, `local_settings`, `mcp_json` |
| `WorktreeCreate` | No soporta matcher | - |
| `WorktreeRemove` | No soporta matcher | - |
| `PreCompact` | Tipo de compactacion | `manual`, `auto` |
| `SessionEnd` | Tipo de finalizacion | `clear`, `logout`, `exit`, `interrupt` |

## Ubicaciones de Hooks (Tabla de Precedencia)

| Ubicacion | Ruta | Alcance | Gestionado por |
|---|---|---|---|
| User (personal) | `~/.claude/settings.json` | Todos los proyectos del usuario | Usuario |
| Project (committed) | `.claude/settings.json` | Proyecto, compartido con equipo | Equipo |
| Local (gitignored) | `.claude/settings.local.json` | Proyecto, solo local | Usuario |
| Managed (enterprise) | Policy managed settings | Toda la organizacion | Admin IT |
| Plugin | `<plugin>/hooks/hooks.json` | Cuando el plugin esta habilitado | Autor del plugin |
| Skill/Agent frontmatter | Dentro del SKILL.md o AGENT.md | Mientras el skill/agent esta activo | Autor del skill |

Los hooks de todas las ubicaciones se combinan (no se sobreescriben). Todos los hooks configurados se ejecutan.

## Formato hooks.json de Plugin

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh"
          }
        ]
      }
    ]
  }
}
```

La variable `${CLAUDE_PLUGIN_ROOT}` se expande al directorio raiz del plugin.

## Hooks en Frontmatter de Skill/Agent

```yaml
---
name: my-skill
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/lint-file.sh"
---
```

Los hooks definidos en frontmatter solo estan activos mientras el skill o agente esta en ejecucion.

## Hooks Asincronos

Solo los handlers de tipo `command` soportan ejecucion asincrona:

```json
{
  "type": "command",
  "command": "./scripts/notify-slack.sh",
  "async": true
}
```

Cuando `async: true`:
- El hook se ejecuta en background sin bloquear la sesion
- No se espera su resultado
- Los codigos de salida no afectan el flujo
- Ideal para notificaciones, logging, telemetria

## Comportamiento de statusMessage

```json
{
  "type": "command",
  "command": "./scripts/lint.sh",
  "statusMessage": "Ejecutando linter..."
}
```

- Se muestra como spinner/status al usuario mientras el hook se ejecuta
- Desaparece cuando el hook termina
- Si no se especifica, no se muestra indicador visual al usuario
- Util para hooks que toman tiempo (formatting, testing, etc.)

## Variables de Entorno

| Variable | Descripcion | Disponible en |
|---|---|---|
| `$CLAUDE_PROJECT_DIR` | Directorio raiz del proyecto | Todos los hooks command |
| `${CLAUDE_PLUGIN_ROOT}` | Directorio raiz del plugin | Hooks de plugin |
| `$CLAUDE_ENV_FILE` | Ruta al archivo de env de Claude | Todos los hooks command |
| `$CLAUDE_CODE_REMOTE` | `"true"` si Claude Code corre en entorno remoto web | Todos los hooks command |

Las variables de entorno se expanden en:
- `command` (tipo command)
- `url` (tipo http)
- `headers` valores (tipo http, requiere `allowedEnvVars`)

## Seguridad

### Snapshot al inicio

Los hooks se leen y se congelan al inicio de la sesion. Cambios en archivos de configuracion durante la sesion no afectan los hooks activos hasta reiniciar.

### Deshabilitar todos los hooks

```bash
claude --disableAllHooks
```

Deshabilita todos los hooks de todas las ubicaciones. Util para depuracion o si un hook causa problemas.

### Solo hooks managed

```bash
claude --allowManagedHooksOnly
```

Solo ejecuta hooks definidos en managed settings (enterprise). Ignora hooks de usuario, proyecto, plugin y skill.

### Prevencion de bucles infinitos en Stop hooks

El campo `stop_hook_active` en el input JSON del evento `Stop` indica si el hook Stop ya esta en ejecucion. Los hooks Stop deben verificar este campo para evitar loops infinitos:

```bash
#!/bin/bash
input=$(cat)
active=$(echo "$input" | jq -r '.stop_hook_active')
if [ "$active" = "true" ]; then
  exit 0  # No re-ejecutar, evitar loop
fi
# ... logica normal del hook
```

Si un hook Stop genera que Claude responda de nuevo, el siguiente disparo de Stop tendra `stop_hook_active: true`, permitiendo al hook decidir no actuar.

### Deduplicacion

Si multiples ubicaciones definen hooks identicos (mismo evento, matcher y handler), Claude Code los deduplica para evitar ejecucion redundante. Dos handlers se consideran identicos si tienen el mismo tipo y configuracion.

## Ejemplos Completos

### Auto-formatear archivos editados

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
            "statusMessage": "Formateando archivo..."
          }
        ]
      }
    ]
  }
}
```

### Bloquear uso de grep (forzar ripgrep)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "grep_check=$(jq -r '.tool_input.command' | grep -q '^grep ' && echo 'yes' || echo 'no'); if [ \"$grep_check\" = \"yes\" ]; then echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"Usa rg en lugar de grep\"}}'; exit 2; fi"
          }
        ]
      }
    ]
  }
}
```

### Hook HTTP con autenticacion

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "http",
            "url": "https://hooks.company.com/claude/pre-tool-use",
            "timeout": 10,
            "headers": {
              "Authorization": "Bearer $COMPANY_HOOK_TOKEN"
            },
            "allowedEnvVars": ["COMPANY_HOOK_TOKEN"]
          }
        ]
      }
    ]
  }
}
```

### Hook prompt para verificar completitud

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review Claude's response. Did it fully address the user's request? Check for missing items, incomplete code, or unresolved questions. Respond with ok=true if complete, ok=false with reason if not.",
            "model": "haiku"
          }
        ]
      }
    ]
  }
}
```

### Hook agente para validacion compleja

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Run the test suite and verify all tests pass. If any test fails, report which tests failed and why.",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

### Notificacion asincrona a Slack

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "curl -s -X POST $SLACK_WEBHOOK_URL -H 'Content-Type: application/json' -d '{\"text\":\"Claude ha completado una tarea\"}'",
            "async": true
          }
        ]
      }
    ]
  }
}
```
