# Sub-Agentes - Agentes Especializados
> Referencia oficial: https://code.claude.com/docs/en/sub-agents
> Última actualización: 2026-02-28

## Sub-Agentes Built-in

| Agente | Modelo | Herramientas | Propósito |
|---|---|---|---|
| **Explore** | Haiku | Solo lectura (no Write/Edit) | Búsqueda rápida en codebase |
| **Plan** | Hereda | Solo lectura | Investigación para planificación |
| **general-purpose** | Hereda | Todas | Tareas complejas multi-paso |
| **Bash** | Hereda | Comandos de terminal | Contexto separado |

## Ubicaciones de Sub-Agentes (orden de prioridad)

| Ubicación | Alcance | Prioridad |
|---|---|---|
| `--agents` CLI flag | Solo sesión | 1 (más alta) |
| `.claude/agents/` | Proyecto | 2 |
| `~/.claude/agents/` | Todos los proyectos | 3 |
| Plugin `agents/` | Donde esté habilitado | 4 (más baja) |

## Formato de Archivo de Sub-Agente

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

## Referencia de Campos del Frontmatter

| Campo | Requerido | Descripción |
|---|---|---|
| `name` | Sí | Identificador único (lowercase + guiones) |
| `description` | Sí | Cuándo delegar a este subagente |
| `tools` | No | Allowlist de herramientas (hereda todas si se omite) |
| `disallowedTools` | No | Herramientas a denegar |
| `model` | No | `sonnet`, `opus`, `haiku`, `inherit` (default: `inherit`) |
| `permissionMode` | No | Override de modo de permiso |
| `maxTurns` | No | Máximo de turnos agénticos |
| `skills` | No | Skills precargados en contexto al inicio |
| `mcpServers` | No | Servidores MCP disponibles para este subagente |
| `hooks` | No | Hooks de ciclo de vida con alcance |
| `memory` | No | `user`, `project`, o `local` para memoria persistente |
| `background` | No | Siempre ejecutar como tarea de fondo (default: false) |
| `isolation` | No | `worktree` para worktree git aislado |

## Sub-Agentes vía CLI

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

## Memoria Persistente

| Alcance | Ubicación |
|---|---|
| `user` | `~/.claude/agent-memory/<name>/` |
| `project` | `.claude/agent-memory/<name>/` |
| `local` | `.claude/agent-memory-local/<name>/` |

Cuando está habilitada, las herramientas `Read`, `Write`, `Edit` se auto-habilitan. Las primeras 200 líneas de `MEMORY.md` se inyectan en el system prompt.

## Restringir Spawning de Sub-Agentes

En el campo `tools` del agente:
```yaml
tools: Task(worker, researcher), Read, Bash
```

Solo `worker` y `researcher` pueden ser spawneados. Para bloquear agentes específicos:
```json
{ "permissions": { "deny": ["Task(Explore)", "Task(my-agent)"] } }
```
