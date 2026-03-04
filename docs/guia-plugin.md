# Guía del Plugin diverger-claude

## ¿Qué es el plugin?

El plugin diverger-claude extiende Claude Code con agentes, skills, hooks y un servidor MCP especializados en desarrollo de software. Detecta automáticamente tu stack tecnológico y proporciona herramientas adaptadas.

## Qué incluye

### 8 Agentes universales

- **code-reviewer**: Revisa código aplicando estándares del stack detectado
- **test-writer**: Genera tests según el framework de testing del proyecto
- **security-checker**: Auditoría de seguridad OWASP adaptada al stack
- **doc-writer**: Genera documentación técnica
- **refactor-assistant**: Sugiere refactorings con patrones del framework
- **migration-helper**: Asiste en migraciones de versiones y frameworks
- **evolution-advisor**: Analiza cambios del proyecto y recomienda actualizaciones de configuración
- **audit-reviewer**: Revisión exhaustiva de calidad y conformidad

### 24 Skills universales

#### Configuración y gestión
- `/diverger-init` — Detecta stack y genera configuración .claude/
- `/diverger-status` — Muestra estado del stack y validación de configuración
- `/diverger-sync` — Sincroniza configuración con cambios detectados
- `/diverger-check` — Valida la configuración existente y detecta issues de gobernanza

#### Inteligencia y aprendizaje
- `/diverger-learn` — Revisa patrones aprendidos, anti-patterns y best practices
- `/diverger-repair` — Diagnostica y repara configuración .claude/
- `/diverger-health` — Verifica salud completa del plugin
- `/diverger-evolve` — Analiza evolución del proyecto y recomienda actualizaciones
- `/diverger-ci-learn` — Analiza fallos de CI recientes y extrae aprendizajes

#### Workflows de alta calidad
- `/diverger-audit` — Auditoría integral de calidad, seguridad y conformidad
- `/diverger-audit-deep` — Auditoría manual multi-perspectiva (Seguridad, Calidad, Rendimiento, Arquitectura) con patrones stack-aware
- `/diverger-test-suite` — Analiza cobertura y genera tests faltantes
- `/diverger-pr-review` — Review exhaustivo de PR con checklist adaptado al stack
- `/diverger-onboard` — Genera documentación de onboarding para nuevos developers
- `/diverger-migrate` — Planifica y ejecuta migraciones tecnológicas
- `/diverger-release` — Checklist de release completo (tests, changelog, version, tag, publish)

#### Diagnóstico de proyecto
- `/diverger-doctor` — Score de salud del proyecto 0-100 con recomendaciones
- `/diverger-quickstart` — Guía post-init de 5 minutos para sacar partido a la configuración

#### Bienvenida y gestión de contribuciones
- `/diverger-welcome` — Briefing de proyecto: identidad, git status, comandos, directorios clave, salud
- `/diverger-triage` — Triage de issues de GitHub: clasifica, evalúa y genera planes de implementación
- `/diverger-develop` — Evalúa e implementa contribuciones triageadas de partners via branch + PR

#### Referencia universal
- `/architecture-style-guide` — Guía de estilo de arquitectura
- `/git-workflow-guide` — Guía de flujo de trabajo Git
- `/security-guide` — Guía de seguridad

### 30+ Skills de referencia por tecnología (v3.0)

Al detectar tecnologías, el plugin genera skills de referencia específicos. Son guías estáticas de ~100-200 líneas con patrones correctos, anti-patrones y ejemplos de código. No consumen API.

| Tecnología | Skills generados |
|-----------|-----------------|
| TypeScript | `/ts-conventions-guide`, `/ts-naming-guide`, `/ts-async-guide` |
| Python | `/python-typing-guide`, `/python-async-guide` |
| Go | `/go-concurrency-guide`, `/go-error-handling-guide` |
| Rust | `/rust-ownership-guide`, `/rust-error-handling-guide` |
| Java | `/java-patterns-guide`, `/java-concurrency-guide` |
| React | `/react-hooks-guide`, `/react-patterns-guide`, `/react-performance-guide` |
| Next.js | `/nextjs-caching-guide`, `/nextjs-server-actions-guide` |
| Django | `/django-orm-guide`, `/django-security-guide` |
| NestJS | `/nestjs-di-guide`, `/nestjs-testing-guide` |
| Vue | `/vue-composition-guide`, `/vue-reactivity-guide` |
| Angular | `/angular-signals-guide`, `/angular-testing-guide` |
| Express | `/express-middleware-guide`, `/express-security-guide` |
| FastAPI | `/fastapi-di-guide`, `/fastapi-testing-guide` |
| Spring Boot | `/spring-di-guide`, `/spring-testing-guide` |
| Docker | `/docker-security-guide`, `/dockerfile-best-practices` |
| Kubernetes | `/k8s-security-guide`, `/k8s-debugging-guide` |
| GitHub Actions | `/github-actions-guide` |

### 8 Hooks de protección (cross-platform, sin dependencia de jq)

Los hooks se activan automáticamente via eventos de Claude Code:
- **PreToolUse/Write**: Secret scanner — detecta credenciales antes de escribir archivos
- **PreToolUse/Bash**: Destructive command blocker — bloquea comandos peligrosos (`rm -rf /`, `DROP TABLE`, etc.)
- **PreToolUse/Bash**: Pre-commit validator — bloquea commits si el plugin build está desactualizado o hay errores TypeScript
- **PostToolUse/Write**: Long lines checker — verifica que no se generen líneas excesivamente largas
- **PostToolUse/Write**: Trailing newline checker — asegura que los archivos terminen con newline
- **PostToolUse/Write, Edit, Bash**: Error tracker — captura errores para el sistema de aprendizaje
- **SessionStart**: Issue triage checker — detecta issues de GitHub sin triagear al iniciar sesión
- **SessionEnd**: Session learner — señaliza errores pendientes para procesamiento

### Servidor MCP (14 tools)

Acceso programático al motor de diverger-claude:

#### Configuración
- `detect_stack` — Detecta tecnologías del proyecto
- `generate_config` — Genera configuración .claude/ completa
- `check_config` — Valida configuración existente
- `sync_config` — Sincroniza configuración (soporta `resolveConflicts`: ours/theirs/report y `dryRun`)
- `list_profiles` — Lista profiles disponibles (59 profiles)
- `get_profile` — Detalle de un profile
- `cleanup_project` — Elimina componentes duplicados del plugin (soporta `dryRun`)
- `eject_project` — Eyecta el plugin manteniendo configuración local

#### Inteligencia
- `get_memory` — Consulta la memoria del proyecto (secciones: errors, repairs, antiPatterns, bestPractices, stats, all)
- `record_learning` — Registra aprendizajes manuales (anti-pattern, best-practice, error-pattern)
- `extract_learnings` — Procesa errores de sesión y extrae patrones bajo demanda
- `repair_config` — Diagnóstico y reparación de .claude/ (modos: auto, report-only)
- `check_plugin_health` — Diagnóstico de salud del plugin (9 checks + auto-fix)
- `ingest_ci_errors` — Ingesta errores de CI (GitHub Actions / GitLab CI) al sistema de aprendizaje

## Instalación

### Via CLI (recomendado)

Si ya tienes el CLI de diverger-claude instalado:

```bash
# Requiere: GitHub CLI autenticado (repo privado)
gh auth login    # si no lo has hecho antes

diverger plugin install
```

Esto descarga automáticamente la última versión del plugin desde GitHub Releases y lo instala en `~/.claude/plugins/diverger-claude/`.

> **Nota:** El comando usa `gh auth token` para autenticarse con la API de GitHub. Alternativamente, configura la variable de entorno `GITHUB_TOKEN`.

### Registro del plugin

Al ejecutar `diverger plugin install`, el plugin se registra automáticamente en `~/.claude/settings.json` bajo `enabledPlugins`. Esto es necesario para que Claude Code descubra las skills, hooks y agentes del plugin.

Si las skills no aparecen, verificar:
1. `diverger plugin status` — confirma instalación
2. Reiniciar Claude Code (los plugins se cargan al inicio de sesión)
3. Verificar que `~/.claude/settings.json` contiene `"diverger-claude": true` en `enabledPlugins`

Para instalar una versión específica:

```bash
diverger plugin install --tag v1.0.0
```

Verificar el estado de la instalación:

```bash
diverger plugin status
```

### Via marketplace

Desde una sesión de Claude Code:

```bash
/plugin marketplace add DivergerThinking/diverger-claude
/plugin install diverger-claude@divergerthinking-tools
```

### Instalación local (desarrollo)

Para desarrollo o pruebas:

```bash
# Clonar el repositorio
git clone https://github.com/DivergerThinking/diverger-claude.git
cd diverger-claude

# Construir el plugin
npm ci
npm run build:plugin

# Instalar en tu proyecto
cd /tu/proyecto
/plugin install /ruta/a/diverger-claude/plugin
```

## Post-instalación

Tras instalar el plugin, regenera la configuración de tu proyecto para activar el modo plugin:

```bash
diverger init --force    # Regenera config en modo plugin
diverger cleanup         # Elimina componentes duplicados de .claude/
```

## Uso recomendado

### 1. Inicializar un proyecto

```
/diverger-init
```

Detecta automáticamente tu stack (TypeScript, React, Docker, etc.) y genera una configuración `.claude/` con reglas, agentes, skills y hooks adaptados.

### 2. Briefing de proyecto (nuevo en v3.3)

```
/diverger-welcome
```

Briefing compacto (<40 líneas): identidad del proyecto, estado de git, comandos disponibles, directorios clave e indicadores de salud. Ideal como primer comando en cada sesión.

### 3. Tour guiado (nuevo en v3.0)

```
/diverger-quickstart
```

Guía post-init de 5 minutos: verificar configuración, explorar reglas generadas, listar skills disponibles para tu stack, probar un code review.

### 4. Score de salud del proyecto (nuevo en v3.0)

```
/diverger-doctor
```

Evalúa tu proyecto con score 0-100 en 6 categorías: Config Health, Plugin Health, Dependencies, Test Coverage, Security, Code Quality. Muestra recomendaciones accionables por categoría.

### 5. Verificar estado

```
/diverger-status
```

Muestra las tecnologías detectadas, detecta stack drift y valida que la configuración esté actualizada.

### 6. Sincronizar tras cambios

```
/diverger-sync
```

Si agregaste una nueva dependencia (ej: instalaste Prisma), sync actualiza la configuración para incluir los profiles correspondientes.

### 7. Consultar guías de referencia

```
/go-concurrency-guide     # Si tu proyecto usa Go
/react-hooks-guide         # Si tu proyecto usa React
/django-orm-guide          # Si tu proyecto usa Django
```

Guías estáticas de ~100-200 líneas con patrones correctos, anti-patrones y ejemplos de código. No consumen API.

## Hooks de protección

Los hooks se ejecutan automáticamente. No requieren configuración adicional. Proporcionan:

- Validación de archivos modificados antes de commit
- Verificación de tests antes de push
- Detección de problemas de seguridad comunes
- Actualización de configuración al cambiar de rama

## Gestión del plugin

### Verificar estado

```bash
diverger plugin status
```

Muestra: ubicación, versión del plugin, versión del CLI, y si están sincronizadas.

### Actualizar

```bash
diverger plugin install
```

El comando detecta si ya existe una instalación y ofrece reinstalar/actualizar.

### Desinstalar

```bash
diverger plugin uninstall
```

Elimina el plugin. Después ejecuta `diverger init --force` para regenerar la configuración completa sin plugin.

## Referencia MCP Tools

### detect_stack

Detecta el stack tecnológico del proyecto.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto

**Retorna:** Lista de tecnologías con nombre, versión y confianza.

### generate_config

Genera configuración `.claude/` completa.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto
- `pluginMode` (boolean, opcional): Si genera como plugin (default: false)
- `fetchKnowledge` (boolean, opcional): Si consulta la API de Anthropic para best practices adicionales (default: false — los profiles ya incluyen conocimiento embebido)

**Retorna:** Lista de archivos generados.

### check_config

Valida la configuración existente.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto

**Retorna:** Estado de validación y lista de issues.

### sync_config

Sincroniza configuración con el stack actual.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto
- `resolveConflicts` (string, opcional): Estrategia de resolución: `'ours'` (default, mantiene versión nueva), `'theirs'` (mantiene versión del equipo), `'report'` (devuelve conflictos sin escribir)
- `dryRun` (boolean, opcional): Si `true`, muestra cambios sin aplicarlos (default: `false`)

**Retorna:** Archivos actualizados, conflictos resueltos, archivos sin cambios.

### list_profiles

Lista todos los profiles disponibles (59 profiles en 5 capas).

**Retorna:** Lista con nombre, capa, descripción de cada profile.

### get_profile

Obtiene detalles completos de un profile.

**Parámetros:**
- `profileId` (string): ID del profile

**Retorna:** Contenido completo del profile.

### cleanup_project

Elimina componentes universales duplicados cuando el plugin está instalado.

**Parámetros:**
- `projectDir` (string): Directorio raíz del proyecto
- `force` (boolean, opcional): Incluir archivos modificados por el equipo (default: `false`)
- `dryRun` (boolean, opcional): Mostrar sin borrar (default: `false`)

**Retorna:** Lista de archivos eliminados, archivos preservados, estadísticas.

### eject_project

Eyecta el plugin manteniendo toda la configuración generada como archivos locales.

**Parámetros:**
- `projectDir` (string): Directorio raíz del proyecto

**Retorna:** Estado de eyección, archivos conservados.

### get_memory

Consulta la memoria conductual del proyecto.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto
- `section` (string): Sección a consultar: `errors`, `repairs`, `antiPatterns`, `bestPractices`, `stats`, `all`

**Retorna:** Datos de la sección solicitada del memory store.

### record_learning

Registra un aprendizaje manual en la memoria.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto
- `type` (string): Tipo de aprendizaje: `anti-pattern`, `best-practice`, `error-pattern`
- `data` (object): Datos del aprendizaje (varían según el tipo)

**Retorna:** Confirmación del registro.

### extract_learnings

Procesa errores de sesión y extrae patrones bajo demanda.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto

**Retorna:** Resultado con errores procesados, patrones actualizados y reglas generadas.

### repair_config

Diagnóstico y reparación de configuración .claude/.

**Parámetros:**
- `rootDir` (string): Directorio raíz del proyecto
- `mode` (string, opcional): `auto` (default) para reparar, `report-only` para solo diagnosticar

**Retorna:** Lista de diagnósticos con severidad, confianza y acciones tomadas/sugeridas.

### check_plugin_health

Diagnóstico de salud del plugin.

**Parámetros:**
- `pluginDir` (string, opcional): Directorio del plugin
- `cliVersion` (string, opcional): Versión actual del CLI

**Retorna:** Reporte de salud con status global (healthy/degraded/unhealthy) y resultados individuales de 9 checks.

### ingest_ci_errors

Ingesta errores de CI al sistema de aprendizaje.

**Parámetros:**
- `projectDir` (string): Directorio raíz del proyecto
- `source` (string): Proveedor de CI: `github-actions` o `gitlab-ci`
- `logContent` (string): Contenido del log de CI a analizar

**Retorna:** Resumen con errores encontrados, patrones actualizados y reglas generadas.
