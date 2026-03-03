# Migración de CLI a Plugin

Guía para migrar de la instalación CLI (`npm install -g @divergerthinking/diverger-claude`) al plugin de Claude Code.

## Prerrequisitos

- CLI diverger-claude instalado (`diverger --version` funciona)
- Node.js 20+

## Migración rápida (3 comandos)

```bash
diverger plugin install      # Descarga e instala el plugin
diverger init --force        # Regenera config en modo plugin
diverger cleanup             # Elimina duplicados de .claude/
```

## Paso a paso detallado

### Paso 1: Instalar el plugin

```bash
diverger plugin install
```

Esto descarga la última versión del plugin desde GitHub Releases y lo instala en `~/.claude/plugins/diverger-claude/`.

Para verificar que se instaló correctamente:

```bash
diverger plugin status
```

**Alternativas:**

Via marketplace (desde una sesión de Claude Code):
```
/plugin marketplace add DivergerThinking/diverger-claude
```

### Paso 2: Re-generar configuración en modo plugin

```bash
diverger init --force
```

El CLI auto-detecta el plugin y activa `pluginMode`. En este modo solo genera los archivos tech-specific (rules, CLAUDE.md, settings.json), ya que los componentes universales (agentes, skills, hooks) los proporciona el plugin.

Para forzar el modo completo (legacy):
```bash
diverger init --force --no-plugin
```

### Paso 3: Limpiar duplicados

```bash
diverger cleanup
```

Elimina automáticamente los archivos que el CLI generaba en `.claude/` y que ahora provee el plugin:

| Antes (CLI) | Ahora (Plugin) | Acción |
|-------------|----------------|--------|
| `.claude/agents/*.md` | Plugin los provee | Eliminados por cleanup |
| `.claude/skills/*/SKILL.md` | Plugin los provee | Eliminados por cleanup |
| `.claude/hooks/*.sh` | Plugin los provee | Eliminados por cleanup |
| Hooks en `settings.json` | Plugin los provee | Limpiados por cleanup |

**Archivos que NO se tocan** (siempre en `.claude/`):
- `.claude/CLAUDE.md` — Instrucciones del proyecto
- `.claude/settings.json` — Configuración de permisos
- `.claude/rules/*.md` — Reglas del stack

Los archivos modificados por el equipo se preservan. Usa `--force` para eliminar también los modificados, o `--dry-run` para ver qué se eliminaría.

### Paso 4: Verificar

```bash
diverger plugin status    # Plugin instalado, versión sincronizada
diverger status           # Stack detectado, config válida
```

## Actualización del plugin

Cuando hay nueva versión:

```bash
diverger update           # Actualiza el CLI (incluye auto-cleanup)
diverger plugin install   # Actualiza el plugin
diverger sync             # Sincroniza config con nuevos profiles
```

## Desinstalar el plugin

```bash
diverger plugin uninstall
diverger init --force         # Regenera config completa sin plugin
```

## Rollback al CLI sin plugin

1. Desinstalar el plugin:
   ```bash
   diverger plugin uninstall
   ```

2. Re-generar configuración completa:
   ```bash
   diverger init --force
   ```

Todo vuelve a funcionar como antes — el CLI genera todos los archivos en `.claude/`.

## Diferencias clave CLI vs Plugin

| Aspecto | CLI solo | CLI + Plugin |
|---------|----------|--------------|
| Agentes universales | En `.claude/agents/` | Plugin los provee |
| Skills universales | En `.claude/skills/` | Plugin los provee |
| Hooks universales | En `.claude/hooks/` | Plugin los provee |
| MCP server | No disponible | Auto-registrado |
| Rules tech-specific | En `.claude/rules/` | En `.claude/rules/` (igual) |
| settings.json | En `.claude/` | En `.claude/` (igual) |
| CLAUDE.md | En raíz | En raíz (igual) |
| Actualización CLI | `diverger update` | `diverger update` (igual) |
| Actualización plugin | N/A | `diverger plugin install` |
| Detección de stack | Igual | Igual |
| Profiles | Igual | Igual |
