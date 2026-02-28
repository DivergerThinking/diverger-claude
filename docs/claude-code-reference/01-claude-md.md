# CLAUDE.md - Sistema de Memoria e Instrucciones
> Referencia oficial: https://code.claude.com/docs/en/claude-md
> Última actualización: 2026-02-28

## Jerarquía de Archivos (mayor a menor prioridad)

| Tipo de Memoria | Ubicación | Propósito | Compartido con |
|---|---|---|---|
| **Managed policy** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux: `/etc/claude-code/CLAUDE.md`; Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Instrucciones org-wide gestionadas por IT/DevOps | Todos los usuarios de la org |
| **Project memory** | `./CLAUDE.md` o `./.claude/CLAUDE.md` | Instrucciones compartidas del equipo | Equipo vía control de versiones |
| **Project rules** | `./.claude/rules/*.md` | Instrucciones modulares por tema | Equipo vía control de versiones |
| **User memory** | `~/.claude/CLAUDE.md` | Preferencias personales para todos los proyectos | Solo tú (todos los proyectos) |
| **Project memory (local)** | `./CLAUDE.local.md` | Preferencias personales del proyecto (auto-gitignored) | Solo tú (proyecto actual) |
| **Auto memory** | `~/.claude/projects/<project>/memory/` | Notas y aprendizajes automáticos de Claude | Solo tú (por proyecto) |

## Comportamiento de Carga

- Archivos en directorios **superiores** al directorio de trabajo se cargan completos al inicio.
- Archivos en directorios **hijo** se cargan bajo demanda cuando Claude lee archivos en esos directorios.
- Auto memory carga solo las **primeras 200 líneas** de `MEMORY.md`.
- Instrucciones más específicas tienen precedencia sobre las más generales.
- Reglas de usuario (`~/.claude/rules/`) se cargan antes que las del proyecto, dando mayor prioridad a las del proyecto.

## Estructura del Directorio Auto Memory

```
~/.claude/projects/<project>/memory/
  MEMORY.md          # Índice conciso, cargado cada sesión (primeras 200 líneas)
  debugging.md       # Archivos por tema, cargados bajo demanda
  api-conventions.md
  ...
```

Desactivar auto memory:
```json
// ~/.claude/settings.json o .claude/settings.json
{ "autoMemoryEnabled": false }
```

O vía variable de entorno (sobreescribe todo):
```bash
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=1  # Forzar off
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=0  # Forzar on
```

## Sintaxis de Importación

Los archivos CLAUDE.md pueden importar otros archivos usando `@path/to/import`:
```markdown
See @README.md for project overview and @package.json for available npm commands.
# Instrucciones Adicionales
- git workflow @docs/git-instructions.md
- Personal: @~/.claude/my-project-instructions.md
```

- Rutas relativas y absolutas permitidas. Relativas se resuelven respecto al archivo que contiene el import.
- Profundidad máxima de imports: **5 niveles** (imports recursivos soportados).
- Los imports no se evalúan dentro de spans/bloques de código markdown.
- El primer encuentro dispara un diálogo de aprobación (una vez por proyecto).

## Reglas Modulares con `.claude/rules/`

```
your-project/
  .claude/
    CLAUDE.md
    rules/
      code-style.md
      testing.md
      security.md
      frontend/
        react.md
        styles.md
      backend/
        api.md
```

Todos los archivos `.md` se descubren recursivamente. Soporta symlinks. Reglas específicas por ruta usan frontmatter YAML:

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/**/*.{ts,tsx}"
---
# Reglas de Desarrollo API
...
```

Patrones glob soportados: `**/*.ts`, `src/**/*`, `*.md`, `{src,lib}/**/*.ts`.

## Directorios Adicionales

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

## Mejores Prácticas para CLAUDE.md

- Ejecutar `/init` para generar un archivo inicial, luego refinar.
- Mantenerlo conciso. Para cada línea preguntar: "¿Eliminar esto causaría que Claude cometa errores?"
- Incluir: comandos bash que Claude no puede adivinar, estilo de código diferente a defaults, instrucciones de testing, etiqueta del repo.
- Excluir: cosas que Claude puede deducir del código, convenciones estándar del lenguaje, explicaciones largas.
- Usar énfasis ("IMPORTANT", "YOU MUST") para mejorar adherencia.
- Hacer check-in en git para compartir con el equipo.
