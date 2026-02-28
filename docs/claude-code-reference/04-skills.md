# Skills - Comandos Slash Personalizados
> Referencia oficial: https://code.claude.com/docs/en/skills
> Última actualización: 2026-02-28

## Estructura de Archivos

```
.claude/skills/<skill-name>/
  SKILL.md           # Instrucciones principales (requerido)
  template.md        # Template para que Claude rellene
  examples/
    sample.md
  scripts/
    validate.sh
```

## Ubicaciones de Skills (orden de prioridad)

| Ubicación | Ruta | Aplica a |
|---|---|---|
| Enterprise | Managed settings | Todos los usuarios de la org |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | Todos tus proyectos |
| Project | `.claude/skills/<skill-name>/SKILL.md` | Solo este proyecto |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md` | Donde el plugin esté habilitado |

Ubicaciones de mayor prioridad ganan en conflictos de nombre.

## Referencia de Frontmatter de SKILL.md

```yaml
---
name: my-skill                    # Letras minúsculas, números, guiones (max 64 chars)
description: What this skill does # Recomendado; usado para auto-invocación
argument-hint: [issue-number]     # Mostrado en autocompletado
disable-model-invocation: true    # Solo invocación manual /name (default: false)
user-invocable: false             # Ocultar del menú / (default: true)
allowed-tools: Read, Grep, Glob   # Herramientas sin prompt de permiso
model: sonnet                     # Modelo a usar
context: fork                     # Ejecutar en subagente forked
agent: Explore                    # Tipo de subagente cuando context: fork
hooks:                            # Hooks de ciclo de vida con alcance
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/check.sh"
---
```

## Sustituciones de String

| Variable | Descripción |
|---|---|
| `$ARGUMENTS` | Todos los argumentos pasados |
| `$ARGUMENTS[N]` o `$N` | Argumento específico por índice base-0 |
| `${CLAUDE_SESSION_ID}` | ID de sesión actual |

## Inyección de Contexto Dinámico

```yaml
---
name: pr-summary
context: fork
agent: Explore
---
## Contexto del pull request
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
```

La sintaxis `` !`command` `` ejecuta comandos shell antes de que el contenido del skill se envíe a Claude.

## Matriz de Control de Invocación

| Frontmatter | Tú invocas | Claude invoca | Cargado en contexto |
|---|---|---|---|
| (default) | Sí | Sí | Descripción siempre, completo al invocar |
| `disable-model-invocation: true` | Sí | No | No en contexto |
| `user-invocable: false` | No | Sí | Descripción siempre |

## Budget de Skills

El budget de caracteres escala al 2% de la ventana de contexto (fallback: 16,000 chars). Override con `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var.
