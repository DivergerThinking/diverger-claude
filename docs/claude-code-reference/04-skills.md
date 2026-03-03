# Skills - Comandos Slash Personalizados
> Referencia oficial: https://code.claude.com/docs/en/skills
> Ultima actualizacion: 2026-03-03

## Estructura de Archivos

```
.claude/skills/<skill-name>/
  SKILL.md           # Instrucciones principales (requerido)
  reference.md       # Material de referencia adicional
  examples.md        # Ejemplos de uso
  template.md        # Template para que Claude rellene
  scripts/
    validate.sh      # Scripts auxiliares
    setup.sh
```

El archivo `SKILL.md` es el unico requerido. Los demas archivos son opcionales y se incluyen automaticamente como contexto cuando el skill se invoca.

### Archivos de soporte

- **reference.md**: Documentacion de referencia, APIs, schemas. Se inyecta como contexto adicional.
- **examples.md**: Ejemplos concretos de entrada/salida esperada.
- **template.md**: Plantilla que Claude debe rellenar con los resultados.
- **scripts/**: Directorio para scripts auxiliares referenciados desde el SKILL.md o hooks.

## Ubicaciones de Skills (Orden de Prioridad)

| Prioridad | Ubicacion | Ruta | Aplica a |
|---|---|---|---|
| 1 (mayor) | Enterprise | Managed settings | Todos los usuarios de la organizacion |
| 2 | Personal | `~/.claude/skills/<skill-name>/SKILL.md` | Todos los proyectos del usuario |
| 3 | Project | `.claude/skills/<skill-name>/SKILL.md` | Solo este proyecto |
| 4 (menor) | Plugin | `<plugin>/skills/<skill-name>/SKILL.md` | Donde el plugin este habilitado |

Cuando hay conflicto de nombres entre ubicaciones, la de mayor prioridad gana. Los skills de diferentes ubicaciones con nombres distintos coexisten.

## Referencia Completa de Frontmatter SKILL.md

```yaml
---
name: my-skill                    # Letras minusculas, numeros, guiones (max 64 chars)
description: What this skill does # Max 1024 chars. Usado para auto-invocacion por Claude
argument-hint: [issue-number]     # Texto de ayuda mostrado en autocompletado del menu /
disable-model-invocation: true    # Solo invocacion manual /name (default: false)
user-invocable: false             # Ocultar del menu / y no invocable por usuario (default: true)
allowed-tools: Read, Grep, Glob   # Herramientas permitidas sin prompt de permiso
model: sonnet                     # Modelo a usar para este skill
context: fork                     # Ejecutar en subagente aislado (fork)
agent: Explore                    # Tipo de subagente cuando context: fork
hooks:                            # Hooks de ciclo de vida con alcance al skill
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/check.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/format.sh"
---
```

### Detalle de cada campo de frontmatter

| Campo | Tipo | Default | Descripcion |
|---|---|---|---|
| `name` | string | Nombre del directorio | Identificador unico. Solo letras minusculas, numeros y guiones. Maximo 64 caracteres |
| `description` | string | (ninguno) | Descripcion del skill. Maximo 1024 caracteres. Claude la usa para decidir si auto-invocar |
| `argument-hint` | string | (ninguno) | Texto mostrado en autocompletado (ej. `[file-path]`, `[issue-number]`) |
| `disable-model-invocation` | boolean | `false` | Si `true`, Claude no puede invocar el skill automaticamente. Solo `/name` manual |
| `user-invocable` | boolean | `true` | Si `false`, el usuario no puede invocar con `/name`. Solo Claude puede invocarlo |
| `allowed-tools` | string (CSV) | (ninguno) | Lista de herramientas que no requieren prompt de permiso al ejecutar el skill |
| `model` | string | (modelo actual) | Modelo especifico para ejecutar este skill (ej. `sonnet`, `haiku`, `opus`) |
| `context` | string | (ninguno) | Si es `"fork"`, ejecuta en subagente aislado sin historial de conversacion |
| `agent` | string | (ninguno) | Tipo de subagente para `context: fork` (ej. `Explore`, `Code`) |
| `hooks` | object | (ninguno) | Hooks activos solo durante la ejecucion del skill. Misma estructura que hooks en settings.json |

## Matriz de Control de Invocacion

| Configuracion | Usuario invoca con / | Claude invoca automaticamente | Cargado en contexto |
|---|---|---|---|
| (default, sin flags) | Si | Si | Descripcion siempre visible; contenido completo al invocar |
| `disable-model-invocation: true` | Si | No | No se carga en contexto de Claude |
| `user-invocable: false` | No | Si | Descripcion siempre visible para Claude |
| Ambos `true`/`false` | No | No | No se carga (skill deshabilitado efectivamente) |

### Logica de carga en contexto

- Si un skill tiene `description`, esta se incluye en el contexto de Claude (a menos que `disable-model-invocation: true`).
- El contenido completo del SKILL.md (body despues del frontmatter) solo se carga cuando el skill se invoca.
- Los archivos de soporte (reference.md, examples.md, etc.) se cargan junto con el body al invocar.

## Sustituciones de String

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `$ARGUMENTS` | Todos los argumentos pasados al skill como string completo | `/my-skill fix auth bug` -> `$ARGUMENTS` = `"fix auth bug"` |
| `$ARGUMENTS[0]` | Primer argumento (indice base-0) | `/my-skill 123 urgent` -> `$ARGUMENTS[0]` = `"123"` |
| `$ARGUMENTS[1]` | Segundo argumento | `/my-skill 123 urgent` -> `$ARGUMENTS[1]` = `"urgent"` |
| `$0` | Shorthand para `$ARGUMENTS[0]` | Equivalente a `$ARGUMENTS[0]` |
| `$1` | Shorthand para `$ARGUMENTS[1]` | Equivalente a `$ARGUMENTS[1]` |
| `${CLAUDE_SESSION_ID}` | ID de la sesion actual de Claude Code | `"abc123-def456-..."` |

Las sustituciones se aplican en todo el contenido del SKILL.md (tanto frontmatter como body).

## Inyeccion de Contexto Dinamico

La sintaxis `` !`command` `` ejecuta comandos shell como preprocesamiento antes de que el contenido del skill se envie a Claude:

```yaml
---
name: pr-summary
description: Resume un pull request con diff y comentarios
context: fork
agent: Explore
---
## Contexto del pull request

- PR diff:
!`gh pr diff`

- PR comments:
!`gh pr view --comments`

- Estado de CI:
!`gh pr checks`

## Instrucciones
Analiza el PR y genera un resumen conciso.
```

Comportamiento:
- Los comandos se ejecutan en el directorio del proyecto (`$CLAUDE_PROJECT_DIR`)
- Se ejecutan antes de enviar el contenido a Claude (preprocesamiento)
- El output del comando reemplaza la linea `` !`command` ``
- Si el comando falla, se incluye el error como contexto
- Util para inyectar informacion dinamica (estado de git, PRs, issues, etc.)

## context: fork - Ejecucion Aislada

Cuando `context: fork` esta configurado:

```yaml
---
name: review-code
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, Bash
---
Revisa el codigo en busca de problemas de seguridad.
```

Comportamiento:
- El skill se ejecuta en un **subagente aislado** (forked)
- El subagente **no tiene acceso al historial de conversacion** previo
- Recibe solo el contenido del SKILL.md mas los argumentos
- El resultado del subagente se inyecta de vuelta en la conversacion principal
- El campo `agent` controla el tipo de subagente (determina herramientas disponibles y comportamiento)
- Ideal para tareas autonomas que no necesitan contexto de la conversacion

## Modelo de Permisos

Los skills generan permisos con formato especifico en el dialogo de permisos:

| Patron | Significado |
|---|---|
| `Skill(name)` | Permiso para invocar el skill `name` |
| `Skill(name *)` | Permiso para invocar el skill `name` con cualquier argumento |

Ejemplo en `allowedTools` de settings.json:
```json
{
  "permissions": {
    "allow": [
      "Skill(deploy *)",
      "Skill(test)"
    ]
  }
}
```

## Budget de Contexto de Skills

- El budget de caracteres para skills escala al **2% de la ventana de contexto**
- Fallback default: **16,000 caracteres** si no se puede determinar el tamano de ventana
- Override con variable de entorno: `SLASH_COMMAND_TOOL_CHAR_BUDGET=32000`
- Si un skill excede el budget, su contenido se trunca
- Recomendacion: mantener los SKILL.md por debajo de **500 lineas** para garantizar carga completa

```bash
# Override del budget de caracteres
SLASH_COMMAND_TOOL_CHAR_BUDGET=50000 claude
```

## Extended Thinking

Para activar pensamiento extendido dentro de un skill, incluir la keyword `"ultrathink"` en el contenido del SKILL.md:

```yaml
---
name: deep-analysis
description: Analisis profundo con pensamiento extendido
context: fork
agent: Explore
---
Realiza un analisis exhaustivo del codigo. ultrathink

Revisa arquitectura, patrones, seguridad y rendimiento.
```

La presencia de `ultrathink` en el contenido activa el modo de extended thinking para la ejecucion de ese skill.

## Skills Incluidos por Defecto (Bundled)

Claude Code incluye skills predefinidos:

| Skill | Comando | Descripcion |
|---|---|---|
| `/simplify` | `/simplify` | Simplifica el ultimo bloque de codigo o respuesta |
| `/batch` | `/batch [patron] [instruccion]` | Aplica una operacion a multiples archivos |
| `/debug` | `/debug [error]` | Diagnostica y sugiere soluciones para errores |

Estos skills no se pueden sobreescribir pero se pueden complementar con skills personalizados.

## Compatibilidad con commands/

Para retrocompatibilidad, Claude Code sigue soportando la estructura anterior `commands/`:

```
.claude/commands/<command-name>.md
```

Los archivos en `commands/` se tratan como skills con un solo archivo SKILL.md (sin directorio, sin frontmatter, sin archivos de soporte). La estructura `skills/` es la recomendada para nuevos skills.

## Ejemplos Completos

### Skill de deploy con validacion

```yaml
---
name: deploy
description: Despliega la aplicacion al ambiente especificado
argument-hint: [environment]
allowed-tools: Bash, Read
context: fork
agent: Code
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-deploy-command.sh"
---
## Deploy a $ARGUMENTS[0]

### Pre-requisitos
!`git status --short`
!`npm test -- --bail 2>&1 | tail -5`

### Instrucciones
1. Verifica que no hay cambios sin commitear
2. Ejecuta el build de produccion
3. Despliega al ambiente `$0` usando los scripts en `./deploy/`
4. Verifica que el deploy fue exitoso
```

### Skill solo para invocacion por Claude

```yaml
---
name: suggest-tests
description: Sugiere tests unitarios para el codigo recien modificado
user-invocable: false
allowed-tools: Read, Grep, Glob
---
Analiza los archivos recientemente modificados y sugiere tests unitarios
que cubran los casos edge no contemplados.

!`git diff --name-only HEAD~1`
```

### Skill con disable-model-invocation

```yaml
---
name: release
description: Proceso completo de release
disable-model-invocation: true
argument-hint: [version]
allowed-tools: Bash, Read, Write, Edit
context: fork
agent: Code
---
## Release v$0

Sigue el proceso de release:
1. Bump version en package.json a $0
2. Actualiza CHANGELOG.md
3. Crea commit `release: v$0`
4. Crea tag `v$0`

No hagas push; espera confirmacion del usuario.
```
