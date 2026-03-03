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

### 6+ Skills

- `/diverger-init` — Detecta stack y genera configuración .claude/
- `/diverger-status` — Muestra estado del stack y validación de configuración
- `/diverger-sync` — Sincroniza configuración con cambios detectados
- `/diverger-check` — Valida la configuración existente

### 4 Hooks de protección

Los hooks se activan automáticamente para proteger la calidad del código:
- **Pre-commit**: Validaciones antes de cada commit
- **Pre-push**: Verificaciones antes de push
- **Post-checkout**: Actualización tras cambio de rama
- **File-save**: Validaciones al guardar archivos

### Servidor MCP (6 tools)

Acceso programático al motor de diverger-claude:
- `detect_stack` — Detecta tecnologías
- `generate_config` — Genera configuración
- `check_config` — Valida configuración
- `sync_config` — Sincroniza configuración
- `list_profiles` — Lista profiles disponibles
- `get_profile` — Detalle de un profile

## Instalación

### Via marketplace (recomendado)

```bash
/plugin marketplace add DivergerThinking/diverger-claude
/plugin install diverger-claude@divergerthinking-tools
```

### Instalación local

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

**Retorna:** Archivos actualizados, conflictos resueltos, archivos sin cambios.

### list_profiles

Lista todos los profiles disponibles.

**Retorna:** Lista con nombre, capa, descripción de cada profile.

### get_profile

Obtiene detalles completos de un profile.

**Parámetros:**
- `profileId` (string): ID del profile

**Retorna:** Contenido completo del profile.

## Actualización

### Via marketplace

```bash
/plugin update diverger-claude@divergerthinking-tools
```

### Manual

```bash
cd /ruta/a/diverger-claude
git pull
npm ci
npm run build:plugin
```

El plugin se actualiza automáticamente en los proyectos que lo usen.
