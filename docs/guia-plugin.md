# Guía del Plugin diverger-claude

## ¿Qué es el plugin?

El plugin diverger-claude extiende Claude Code con agentes, skills, hooks y un servidor MCP especializados en desarrollo de software. Detecta automáticamente tu stack tecnológico y proporciona herramientas adaptadas.

## Qué incluye

### 6 Agentes universales

- **code-reviewer**: Revisa código aplicando estándares del stack detectado
- **test-writer**: Genera tests según el framework de testing del proyecto
- **security-checker**: Auditoría de seguridad OWASP adaptada al stack
- **doc-writer**: Genera documentación técnica
- **refactor-assistant**: Sugiere refactorings con patrones del framework
- **migration-helper**: Asiste en migraciones de versiones y frameworks

### 7 Skills

- `/diverger-init` — Detecta stack y genera configuración .claude/
- `/diverger-status` — Muestra estado del stack y validación de configuración
- `/diverger-sync` — Sincroniza configuración con cambios detectados
- `/diverger-check` — Valida la configuración existente y detecta issues de gobernanza
- `/architecture-style-guide` — Guía de estilo de arquitectura
- `/git-workflow-guide` — Guía de flujo de trabajo Git
- `/security-guide` — Guía de seguridad

### 4 Hooks de protección

Los hooks se activan automáticamente via eventos de Claude Code:
- **PreToolUse/Write**: Secret scanner — detecta credenciales antes de escribir archivos
- **PreToolUse/Bash**: Destructive command blocker — bloquea comandos peligrosos (`rm -rf /`, `DROP TABLE`, etc.)
- **PostToolUse/Write**: Long lines checker — verifica que no se generen líneas excesivamente largas
- **PostToolUse/Write**: Trailing newline checker — asegura que los archivos terminen con newline

### Servidor MCP (8 tools)

Acceso programático al motor de diverger-claude:
- `detect_stack` — Detecta tecnologías del proyecto
- `generate_config` — Genera configuración .claude/ completa
- `check_config` — Valida configuración existente
- `sync_config` — Sincroniza configuración (soporta `resolveConflicts`: ours/theirs/report y `dryRun`)
- `list_profiles` — Lista profiles disponibles (59 profiles)
- `get_profile` — Detalle de un profile
- `cleanup_project` — Elimina componentes duplicados del plugin (soporta `dryRun`)
- `eject_project` — Eyecta el plugin manteniendo configuración local

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

## Uso de Skills

### Inicializar un proyecto

```
/diverger-init
```

Esto detecta automáticamente tu stack (TypeScript, React, Docker, etc.) y genera una configuración `.claude/` optimizada.

### Verificar estado

```
/diverger-status
```

Muestra las tecnologías detectadas y valida que la configuración esté actualizada.

### Sincronizar tras cambios

```
/diverger-sync
```

Si agregaste una nueva dependencia (ej: instalaste Prisma), sync actualiza la configuración para incluir los profiles correspondientes.

### Validar configuración

```
/diverger-check
```

Verifica que la configuración `.claude/` sea válida y coherente con el stack actual.

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
