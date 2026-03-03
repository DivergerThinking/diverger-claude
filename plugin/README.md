# diverger-claude Plugin

Plugin universal de desarrollo para Claude Code por DivergerThinking.

## Qué incluye

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| Agentes | 6 | code-reviewer, test-writer, security-checker, doc-writer, refactor-assistant, migration-helper |
| Skills | 6+ | diverger-check, diverger-sync, diverger-init, diverger-status, diverger-sync (MCP) y más |
| Hooks | 4 | Protecciones pre-commit, pre-push, post-checkout, file-save |
| MCP Server | 1 | 6 tools: detect_stack, generate_config, check_config, sync_config, list_profiles, get_profile |

## Instalación

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

El servidor MCP expone 6 herramientas para acceso programático:

- `detect_stack` — Detecta tecnologías del proyecto
- `generate_config` — Genera configuración .claude/ completa
- `check_config` — Valida configuración existente
- `sync_config` — Sincroniza con cambios del stack
- `list_profiles` — Lista profiles disponibles
- `get_profile` — Obtiene detalles de un profile

## Requisitos

- Claude Code CLI
- Node.js 20+

## Licencia

Propietario - DivergerThinking
