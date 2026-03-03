# diverger-claude Plugin

Plugin universal de desarrollo para Claude Code por DivergerThinking.

## Qué incluye

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| Agentes | 6 | code-reviewer, test-writer, security-checker, doc-writer, refactor-assistant, migration-helper |
| Skills | 7 | 4 diverger (init, status, sync, check) + 3 guías (architecture, git-workflow, security) |
| Hooks | 4 | PreToolUse (secret-scanner, destructive-cmd-blocker) + PostToolUse (long-lines, trailing-newline) |
| MCP Server | 1 | 8 tools: detect_stack, generate_config, check_config, sync_config, list_profiles, get_profile, cleanup_project, eject_project |

## Instalación

### Via CLI (recomendado)

```bash
# Requiere: gh auth login (GitHub CLI autenticado)
diverger plugin install
```

Descarga automáticamente la última versión desde GitHub Releases. Para una versión específica: `diverger plugin install --tag v1.6.0`

Tras instalar, el CLI ofrece automáticamente inicializar la configuración y limpiar duplicados. También puedes hacerlo manualmente:

```bash
diverger init --force    # Regenera config en modo plugin
diverger cleanup         # Elimina duplicados de .claude/
```

### Via marketplace

```bash
/plugin marketplace add DivergerThinking/diverger-claude
/plugin install diverger-claude@divergerthinking-tools
```

### Local (desarrollo)

```bash
git clone https://github.com/DivergerThinking/diverger-claude.git
cd diverger-claude
npm ci && npm run build:plugin
# En tu proyecto:
/plugin install /ruta/a/diverger-claude/plugin
```

## Skills disponibles

| Skill | Descripción |
|-------|-------------|
| `/diverger-init` | Detecta stack y genera configuración .claude/ |
| `/diverger-status` | Verifica estado del stack y configuración |
| `/diverger-sync` | Sincroniza configuración con cambios del stack |
| `/diverger-check` | Valida la configuración existente |
| `/architecture-style-guide` | Guía de estilo de arquitectura |
| `/git-workflow-guide` | Guía de flujo de trabajo Git |
| `/security-guide` | Guía de seguridad |

## Agentes disponibles

| Agente | Descripción |
|--------|-------------|
| `code-reviewer` | Revisión de código con estándares del stack |
| `test-writer` | Generación de tests según framework detectado |
| `security-checker` | Auditoría de seguridad OWASP |
| `doc-writer` | Documentación técnica adaptada al stack |
| `refactor-assistant` | Refactoring con patrones del framework |
| `migration-helper` | Migraciones de versiones y frameworks |

## MCP Tools

El servidor MCP expone 8 herramientas para acceso programático:

- `detect_stack` — Detecta tecnologías del proyecto
- `generate_config` — Genera configuración .claude/ completa
- `check_config` — Valida configuración existente
- `sync_config` — Sincroniza con cambios del stack (soporta `resolveConflicts`: ours/theirs/report y `dryRun`)
- `list_profiles` — Lista profiles disponibles
- `get_profile` — Obtiene detalles de un profile
- `cleanup_project` — Elimina componentes duplicados del plugin (soporta `dryRun`)
- `eject_project` — Eyecta el plugin manteniendo configuración local

## Gestión

```bash
diverger plugin status      # Ver estado y versión
diverger plugin install     # Instalar o actualizar
diverger plugin uninstall   # Desinstalar
```

## Requisitos

- Claude Code CLI
- Node.js 20+
- GitHub CLI autenticado (`gh auth login`) para `diverger plugin install`

## Licencia

Propietario - DivergerThinking
