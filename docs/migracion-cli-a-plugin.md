# Migración de CLI a Plugin

Guía para migrar de la instalación CLI (`npm install -g @divergerthinking/diverger-claude`) al plugin de Claude Code.

## Prerrequisitos

- Claude Code CLI instalado
- Node.js 20+
- Acceso al repositorio DivergerThinking/diverger-claude (para marketplace)

## Paso 1: Instalar el plugin

### Via marketplace (recomendado)

```bash
/plugin marketplace add DivergerThinking/diverger-claude
/plugin install diverger-claude@divergerthinking-tools
```

### Manualmente

```bash
git clone https://github.com/DivergerThinking/diverger-claude.git
cd diverger-claude
npm ci && npm run build:plugin
/plugin install /ruta/a/diverger-claude/plugin
```

## Paso 2: Re-generar configuración con modo plugin

En tu proyecto, ejecuta:

```
/diverger-init
```

Esto usa el skill del plugin (que internamente llama al MCP tool `detect_stack` + `generate_config` con `pluginMode: true`).

Alternativamente, si usas el CLI con el plugin instalado, se activa `pluginMode` automáticamente:

```bash
diverger init                    # Auto-detecta el plugin, activa pluginMode
diverger init --no-plugin        # Fuerza modo completo (legacy)
```

La diferencia con el modo legacy es que en `pluginMode` solo se generan los archivos tech-specific (rules, CLAUDE.md, settings.json), ya que los componentes universales (agentes, skills, hooks) los proporciona el plugin.

## Paso 3: Verificar

```
/diverger-status
```

Confirma que:
- Las tecnologías se detectan correctamente
- La configuración es válida
- No hay issues reportados

## Paso 4: Limpiar duplicados

Si antes usabas el CLI, puede que tengas archivos duplicados:

| CLI generaba | Plugin genera |
|-------------|---------------|
| `.claude/agents/*.md` | `plugin/agents/*.md` |
| `.claude/skills/*/SKILL.md` | `plugin/skills/*/SKILL.md` |
| `.claude/hooks/hooks.json` | `plugin/hooks/hooks.json` |

**Archivos que NO se duplican** (siempre en `.claude/`):
- `.claude/CLAUDE.md` — Instrucciones del proyecto
- `.claude/settings.json` — Configuración de permisos
- `.claude/rules/*.md` — Reglas del stack

Revisa y elimina manualmente los agentes/skills/hooks que el CLI generó en `.claude/` si el plugin ya los proporciona.

## Paso 5: Desinstalar CLI (opcional)

Si el plugin cubre todas tus necesidades:

```bash
npm uninstall -g @divergerthinking/diverger-claude
```

## Rollback

Si necesitas volver al CLI:

1. Desinstalar el plugin:
   ```
   /plugin uninstall diverger-claude@divergerthinking-tools
   ```

2. Reinstalar el CLI:
   ```bash
   npm install -g @divergerthinking/diverger-claude --@divergerthinking:registry=https://npm.pkg.github.com
   ```

3. Re-generar configuración:
   ```bash
   diverger init --force
   ```

## Diferencias clave CLI vs Plugin

| Aspecto | CLI | Plugin |
|---------|-----|--------|
| Instalación | `npm install -g` | `/plugin install` |
| Ejecución | `diverger init` | `/diverger-init` |
| Agentes | En `.claude/agents/` | Via plugin system |
| Skills | En `.claude/skills/` | Via plugin system |
| Hooks | En `.claude/hooks/` | Via plugin system |
| MCP | Requiere config manual | Auto-registrado |
| Actualización | `diverger update` | `/plugin update` |
| Detección stack | Igual | Igual |
| Profiles | Igual | Igual |
| Rules | En `.claude/rules/` | En `.claude/rules/` (sin cambio) |
