# diverger-claude Plugin

Plugin de desarrollo experto para Claude Code por DivergerThinking. Detecta tu stack tecnológico y genera una configuración `.claude/` con reglas, agentes, skills y hooks adaptados — todo el conocimiento embebido directamente, sin dependencia de API externa.

## Qué incluye

| Categoría | Cantidad | Descripción |
|-----------|----------|-------------|
| Agentes | 8 | code-reviewer, test-writer, security-checker, doc-writer, refactor-assistant, migration-helper, evolution-advisor, audit-reviewer |
| Skills universales | 20 | 4 configuración + 5 inteligencia + 6 workflows + 2 diagnóstico + 3 referencia |
| Skills por tecnología | 30+ | Reference guides específicos por stack detectado (Go, Python, React, Docker, etc.) |
| Hooks | 7 | PreToolUse (secret-scanner, destructive-cmd-blocker, pre-commit-validator) + PostToolUse (long-lines, trailing-newline, error-tracker) + SessionEnd (session-learner) |
| MCP Server | 1 | 14 tools: 8 configuración + 6 inteligencia |
| Profiles | 59 | 1 base + 9 lenguajes + 27 frameworks + 9 testing + 13 infra |

## Instalación

### Via CLI (recomendado)

```bash
# Requiere: gh auth login (GitHub CLI autenticado)
diverger plugin install
```

Descarga automáticamente la última versión desde GitHub Releases. Para una versión específica: `diverger plugin install --tag v2.4.0`

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

### Configuración

| Skill | Descripción |
|-------|-------------|
| `/diverger-init` | Detecta stack y genera configuración .claude/ |
| `/diverger-status` | Verifica estado del stack y configuración |
| `/diverger-sync` | Sincroniza configuración con cambios del stack |
| `/diverger-check` | Valida la configuración existente |

### Inteligencia

| Skill | Descripción |
|-------|-------------|
| `/diverger-learn` | Revisa patrones aprendidos, anti-patterns y best practices |
| `/diverger-repair` | Diagnostica y repara configuración .claude/ |
| `/diverger-health` | Verifica salud completa del plugin (9 checks) |
| `/diverger-evolve` | Analiza evolución del proyecto y recomienda actualizaciones |
| `/diverger-ci-learn` | Analiza fallos de CI recientes y extrae aprendizajes |

### Workflows

| Skill | Descripción |
|-------|-------------|
| `/diverger-audit` | Auditoría integral de calidad, seguridad y conformidad |
| `/diverger-test-suite` | Analiza cobertura y genera tests faltantes |
| `/diverger-pr-review` | Review exhaustivo de PR con checklist adaptado al stack |
| `/diverger-onboard` | Genera documentación de onboarding para nuevos developers |
| `/diverger-migrate` | Planifica y ejecuta migraciones tecnológicas |
| `/diverger-release` | Checklist de release completo (tests, changelog, version, tag, publish) |

### Diagnóstico

| Skill | Descripción |
|-------|-------------|
| `/diverger-doctor` | Score de salud del proyecto 0-100 con recomendaciones accionables |
| `/diverger-quickstart` | Guía post-init de 5 minutos para sacar partido a la configuración |

### Referencia universal

| Skill | Descripción |
|-------|-------------|
| `/architecture-style-guide` | Guía de estilo de arquitectura |
| `/git-workflow-guide` | Guía de flujo de trabajo Git |
| `/security-guide` | Guía de seguridad |

### Referencia por tecnología (generados según stack detectado)

Al ejecutar `/diverger-init`, el plugin genera skills de referencia específicos para tu stack. Ejemplos:

- Go: `/go-concurrency-guide`, `/go-error-handling-guide`
- Python: `/python-typing-guide`, `/python-async-guide`
- React: `/react-hooks-guide`, `/react-patterns-guide`, `/react-performance-guide`
- Next.js: `/nextjs-caching-guide`, `/nextjs-server-actions-guide`
- Vue: `/vue-composition-guide`, `/vue-reactivity-guide`
- Y 20+ más según las tecnologías detectadas

## Agentes disponibles

| Agente | Descripción |
|--------|-------------|
| `code-reviewer` | Revisión de código con estándares del stack |
| `test-writer` | Generación de tests según framework detectado |
| `security-checker` | Auditoría de seguridad OWASP |
| `doc-writer` | Documentación técnica adaptada al stack |
| `refactor-assistant` | Refactoring con patrones del framework |
| `migration-helper` | Migraciones de versiones y frameworks |
| `evolution-advisor` | Analiza cambios del proyecto y recomienda actualizaciones |
| `audit-reviewer` | Revisión exhaustiva de calidad y conformidad |

## Hooks de protección

Los hooks se ejecutan automáticamente. No requieren configuración adicional.

| Hook | Evento | Qué hace |
|------|--------|----------|
| `secret-scanner` | PreToolUse/Write | Detecta credenciales antes de escribir archivos |
| `destructive-cmd-blocker` | PreToolUse/Bash | Bloquea comandos peligrosos (rm -rf /, DROP TABLE, etc.) |
| `pre-commit-validator` | PreToolUse/Bash | Bloquea commits si el build está desactualizado o hay errores TypeScript |
| `check-long-lines` | PostToolUse/Write | Advierte sobre líneas excesivamente largas |
| `check-trailing-newline` | PostToolUse/Write | Asegura que los archivos terminen con newline |
| `error-tracker` | PostToolUse/Write,Edit,Bash | Captura errores para el sistema de aprendizaje |
| `session-learner` | SessionEnd | Señaliza errores pendientes para procesamiento |

## MCP Tools

El servidor MCP expone 14 herramientas para acceso programático:

### Configuración (8 tools)

- `detect_stack` — Detecta tecnologías del proyecto
- `generate_config` — Genera configuración .claude/ completa
- `check_config` — Valida configuración existente
- `sync_config` — Sincroniza con cambios del stack (soporta `resolveConflicts` y `dryRun`)
- `list_profiles` — Lista 59 profiles disponibles
- `get_profile` — Obtiene detalles de un profile
- `cleanup_project` — Elimina componentes duplicados del plugin (soporta `dryRun`)
- `eject_project` — Eyecta el plugin manteniendo configuración local

### Inteligencia (6 tools)

- `get_memory` — Consulta la memoria del proyecto
- `record_learning` — Registra aprendizajes manuales
- `extract_learnings` — Procesa errores de sesión y extrae patrones
- `repair_config` — Diagnóstico y reparación de .claude/
- `check_plugin_health` — Diagnóstico de salud del plugin (9 checks + auto-fix)
- `ingest_ci_errors` — Ingesta errores de CI (GitHub Actions / GitLab CI)

## Gestión

```bash
diverger plugin status      # Ver estado y versión
diverger plugin install     # Instalar o actualizar
diverger plugin uninstall   # Desinstalar
```

## Troubleshooting

### Skills no aparecen (Unknown skill)

1. Verificar instalación: `diverger plugin status`
2. Verificar registro: `~/.claude/settings.json` debe contener `"diverger-claude": true` en `enabledPlugins`
3. Reiniciar Claude Code (los plugins se cargan al inicio de sesión)
4. Si el plugin se instaló manualmente (sin el CLI), registrarlo ejecutando `diverger plugin install` de nuevo

### Hooks no se ejecutan

Los hooks del plugin requieren que el plugin esté registrado en `enabledPlugins`. Si instalaste una versión anterior del CLI que no registraba el plugin automáticamente, ejecuta `diverger plugin install` para actualizar y registrar.

### Plugin desinstalado pero skills siguen apareciendo

Reinicia Claude Code. Los plugins se cargan al inicio de sesión.

## Requisitos

- Claude Code CLI
- Node.js 20+
- GitHub CLI autenticado (`gh auth login`) para `diverger plugin install`

## Licencia

Propietario - DivergerThinking
