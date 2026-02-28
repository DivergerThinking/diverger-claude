# Permissions - Sistema de Permisos
> Referencia oficial: https://code.claude.com/docs/en/settings
> Última actualización: 2026-02-28

## Sintaxis de Reglas de Permiso

Formato: `Tool` o `Tool(specifier)`

Orden de evaluación: **Deny -> Ask -> Allow** (primer match gana).

## Reglas Específicas por Herramienta

| Herramienta | Ejemplos de Regla |
|---|---|
| **Bash** | `Bash(npm run *)`, `Bash(git commit *)`, `Bash(* --version)` |
| **Read** | `Read(./.env)`, `Read(//Users/alice/secrets/**)`, `Read(~/Documents/*.pdf)` |
| **Edit** | `Edit(/src/**/*.ts)`, `Edit(//tmp/scratch.txt)` |
| **WebFetch** | `WebFetch(domain:example.com)` |
| **MCP** | `mcp__puppeteer`, `mcp__github__search_repositories` |
| **Task** | `Task(Explore)`, `Task(my-agent)` |
| **Skill** | `Skill(commit)`, `Skill(review-pr *)` |

## Prefijos de Patrón de Ruta (Read/Edit)

| Prefijo | Significado |
|---|---|
| `//path` | Absoluto desde raíz del filesystem |
| `~/path` | Relativo al home |
| `/path` | Relativo a la raíz del proyecto |
| `path` o `./path` | Relativo al directorio actual |

Usa especificación gitignore: `*` coincide en un directorio, `**` coincide recursivamente.

## Modos de Permiso

| Modo | Descripción |
|---|---|
| `default` | Pide permiso |
| `acceptEdits` | Auto-acepta ediciones de archivo |
| `plan` | Solo lectura (sin modificaciones) |
| `dontAsk` | Auto-deniega salvo pre-aprobados |
| `bypassPermissions` | Salta todas las verificaciones (usar en entornos seguros) |
