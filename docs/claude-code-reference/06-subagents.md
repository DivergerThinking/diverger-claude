# Sub-Agentes - Agentes Especializados
> Referencia oficial: https://code.claude.com/docs/en/sub-agents
> Ultima actualizacion: 2026-03-03

## Vision General

Los sub-agentes son asistentes de IA especializados que operan en su propia ventana de contexto independiente. Cada sub-agente recibe un system prompt personalizado, tiene permisos independientes y puede usar un subconjunto controlado de herramientas. Son ideales para delegar tareas paralelas o especializadas sin consumir el contexto de la conversacion principal.

## Sub-Agentes Built-in

| Agente | Modelo | Herramientas | Proposito |
|---|---|---|---|
| **Explore** | Haiku | Solo lectura (Read, Grep, Glob) | Busqueda rapida en codebase |
| **Plan** | Hereda | Solo lectura | Investigacion para planificacion |
| **general-purpose** | Hereda | Todas | Tareas complejas multi-paso |
| **Bash** | Hereda | Terminal (Bash) | Ejecucion de comandos en contexto separado |
| **statusline-setup** | Sonnet | Lectura + Bash | Configuracion de statusline |
| **Claude Code Guide** | Haiku | Solo lectura | Guia de uso de Claude Code |

## Formato de Archivo

Los sub-agentes se definen como archivos `.md` con YAML frontmatter. El cuerpo del markdown constituye el system prompt del agente.

**Importante**: El sub-agente recibe UNICAMENTE el cuerpo markdown + detalles del entorno como system prompt. NO recibe el system prompt completo de Claude Code.

## Ubicaciones de Sub-Agentes (orden de prioridad)

| Prioridad | Ubicacion | Alcance |
|---|---|---|
| 1 (mas alta) | `--agents` CLI flag | Solo esa sesion |
| 2 | `.claude/agents/` | Proyecto (committed) |
| 3 | `~/.claude/agents/` | Todos los proyectos del usuario |
| 4 (mas baja) | Plugin `agents/` | Donde el plugin este habilitado |

## Referencia Completa de Campos del Frontmatter

```markdown
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
  - error-handling-patterns
mcpServers:
  - slack
  - database-server:
      command: "./servers/db"
      args: ["--readonly"]
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
memory: user
background: false
isolation: worktree
---

You are a code reviewer. Analyze code and provide
actionable feedback on quality, security, and best practices.
```

### Tabla de Campos

| Campo | Requerido | Tipo | Descripcion |
|---|---|---|---|
| `name` | Si | string | Identificador unico (lowercase + guiones) |
| `description` | Si | string | Descripcion de cuando delegar a este sub-agente |
| `tools` | No | lista | Allowlist de herramientas (hereda todas si se omite) |
| `disallowedTools` | No | lista | Herramientas a denegar explicitamente |
| `model` | No | enum | `sonnet`, `opus`, `haiku`, `inherit` (default: `inherit`) |
| `permissionMode` | No | enum | Override del modo de permisos |
| `maxTurns` | No | number | Maximo de turnos agénticos |
| `skills` | No | lista | Skills precargados; el contenido completo se inyecta al inicio |
| `mcpServers` | No | lista | Referencia a servidores MCP existentes o definicion inline |
| `hooks` | No | objeto | Hooks de ciclo de vida con alcance |
| `memory` | No | enum | `user`, `project`, o `local` para memoria persistente |
| `background` | No | boolean | Ejecutar siempre como tarea de fondo (default: `false`) |
| `isolation` | No | enum | `worktree` para worktree git aislado |

### Modos de Permiso

| Modo | Descripcion |
|---|---|
| `default` | Pide permiso para cada herramienta segun las reglas normales |
| `acceptEdits` | Auto-acepta ediciones de archivos, pide permiso para el resto |
| `dontAsk` | No pide permisos; deniega silenciosamente lo que no esta permitido |
| `bypassPermissions` | Acepta todo sin preguntar (requiere configuracion de admin) |
| `plan` | Solo lectura; no puede modificar archivos ni ejecutar comandos |

## Sub-Agentes via CLI

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer.",
    "prompt": "You are a senior code reviewer.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

El formato JSON permite definir multiples agentes en una sola invocacion sin necesidad de archivos en disco.

## Control de Acceso a Herramientas

### Allowlist (tools)

Restringe a un conjunto especifico de herramientas:
```yaml
tools: Read, Grep, Glob
```

### Denylist (disallowedTools)

Bloquea herramientas especificas, permitiendo el resto:
```yaml
disallowedTools: Write, Edit, NotebookEdit
```

### Restringir Sub-Agentes Spawneables

Usar la sintaxis `Agent()` en el campo `tools` para controlar que sub-agentes puede invocar:
```yaml
tools: Agent(worker, researcher), Read, Bash
```

Solo `worker` y `researcher` pueden ser spawneados por este agente.

## Memoria Persistente

| Alcance | Ubicacion en disco |
|---|---|
| `user` | `~/.claude/agent-memory/<name>/` |
| `project` | `.claude/agent-memory/<name>/` |
| `local` | `.claude/agent-memory-local/<name>/` |

Cuando la memoria esta habilitada:
- Las herramientas `Read`, `Write`, `Edit` se auto-habilitan para el directorio de memoria.
- Las primeras 200 lineas de `MEMORY.md` se inyectan automaticamente en el system prompt del sub-agente.

## Aislamiento con Worktree

Cuando `isolation: worktree` esta configurado:
- El sub-agente trabaja en un worktree git aislado.
- Los cambios no afectan el arbol de trabajo principal.
- Si el sub-agente no realiza ningun cambio, el worktree se limpia automaticamente al terminar.

## Foreground vs Background

- Los sub-agentes se inician en **foreground** por defecto.
- Usa **Ctrl+B** para enviar un sub-agente al background durante la ejecucion.
- En modo background, los permisos se **deniegan automaticamente** (no hay interaccion con el usuario).
- Un sub-agente en background puede **reanudarse en foreground** para recuperar la interactividad.
- El campo `background: true` en el frontmatter fuerza la ejecucion en background desde el inicio.

## Hooks en Sub-Agentes

### Hooks dentro del frontmatter del sub-agente

Los sub-agentes soportan tres eventos de hook en su frontmatter:

| Evento | Descripcion |
|---|---|
| `PreToolUse` | Antes de cada llamada a herramienta |
| `PostToolUse` | Despues de cada llamada exitosa a herramienta |
| `Stop` | Cuando el sub-agente termina (se convierte internamente en `SubagentStop`) |

### Hooks en settings.json para sub-agentes

En `settings.json` se pueden configurar hooks globales que reaccionan a sub-agentes:

| Evento | Descripcion |
|---|---|
| `SubagentStart` | Se dispara cuando un sub-agente se inicia |
| `SubagentStop` | Se dispara cuando un sub-agente termina |

## Deshabilitar Sub-Agentes

Para bloquear sub-agentes especificos, usar reglas de denegacion en permisos:

```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

## Auto-Compactacion

- Los sub-agentes se auto-compactan al **95%** de la ventana de contexto por defecto.
- Se puede ajustar con la variable de entorno `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`.

## Persistencia de Transcripts

Los transcripts de sub-agentes se guardan en:
```
~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl
```

Esto permite auditar y revisar la actividad de cada sub-agente despues de la sesion.

## Restricciones Importantes

- Los sub-agentes **no pueden** spawner otros sub-agentes (no hay anidacion).
- Los sub-agentes **no reciben** el historial de conversacion del agente padre.
- Los sub-agentes **no heredan** los skills del agente padre (deben declararse explicitamente en el frontmatter).
