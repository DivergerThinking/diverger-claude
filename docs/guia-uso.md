# Guía de Uso

## Flujo básico

### 1. Detección y generación

```bash
cd mi-proyecto
npx diverger-claude init
```

diverger-claude:
1. Escanea archivos de manifiesto (package.json, pyproject.toml, etc.) **en la raíz y subdirectorios**
2. Detecta tecnologías con nivel de confianza
3. Si la confianza es < 90%, te pregunta
4. Compone profiles por capas
5. Genera `.claude/` completo

### 2. Dry-run (vista previa)

```bash
npx diverger-claude diff
```

Muestra exactamente qué archivos se crearían/modificarían con diffs coloreados.

### 3. Estado actual

```bash
npx diverger-claude status
```

Muestra:
- Stack detectado con niveles de confianza
- Profiles aplicados
- Información de monorepo (si aplica)
- Arquitectura detectada

### 4. Sincronización

```bash
npx diverger-claude sync
```

Después de actualizar diverger-claude o modificar dependencias:
- Re-detecta el stack
- Aplica three-way merge
- Respeta cambios del equipo
- Muestra conflictos para resolución manual

### 5. Validación

```bash
npx diverger-claude check
```

Verifica:
- Archivos de configuración existen
- Reglas obligatorias no modificadas
- Integridad de hashes

### 6. Gestión del plugin

```bash
# Instalar el plugin (requiere gh auth login)
diverger plugin install

# Verificar estado del plugin
diverger plugin status

# Actualizar el plugin
diverger plugin install

# Desinstalar
diverger plugin uninstall
```

Con el plugin instalado, `diverger init` auto-detecta el plugin y genera solo la configuración tech-specific (rules, CLAUDE.md, settings.json). Los componentes universales (agentes, skills, hooks) los provee el plugin.

### 7. Cleanup

```bash
diverger cleanup
```

Elimina componentes universales duplicados de `.claude/` que ahora provee el plugin. Solo actúa cuando el plugin está instalado.

Opciones: `--dry-run` (ver sin borrar), `--force` (incluir archivos modificados), `--json`.

> **Nota:** `diverger update` ejecuta cleanup automáticamente tras actualizar si el plugin está instalado.

### 8. Versión y actualización

```bash
# Ver versión instalada
diverger --version

# Verificar si hay actualización disponible
diverger update --check

# Actualizar CLI + plugin
diverger update
diverger plugin install
```

### 9. Eject

```bash
diverger eject
```

Desconecta diverger-claude manteniendo la configuración generada. Útil si decides gestionar la configuración manualmente.

## Uso en CI/CD

```bash
# Validar en CI
npx diverger-claude check --json

# Modo silencioso
npx diverger-claude check --quiet
```

El exit code es 1 si hay errores, 0 si todo está correcto.

## Proyectos con manifiestos en subdirectorios

diverger-claude detecta automáticamente manifiestos en subdirectorios hasta 3 niveles de profundidad. Esto cubre escenarios comunes:

| Estructura | Qué detecta |
|-----------|-------------|
| `app/package.json` | Node.js + frameworks del subdirectorio |
| `frontend/package.json` + `backend/requirements.txt` | React + FastAPI (full-stack multi-lang) |
| `frontend/package.json` + `backend/package.json` | React + Express (full-stack mismo lenguaje) |
| `apps/web/package.json` | Proyectos con anidación profunda |
| `app/Dockerfile.dev` | Docker en subdirectorios |

Cada tecnología detectada incluye el path real en su evidence (ej: `frontend/package.json`), lo que facilita identificar de dónde viene cada detección.

> **Nota:** Algunos archivos de configuración como `Jenkinsfile`, `.gitlab-ci.yml`, `turbo.json`, `vercel.json`, etc. solo se buscan en la raíz del proyecto, ya que por convención solo existen ahí.

## Monorepos

diverger-claude detecta automáticamente monorepos (npm workspaces, Turborepo, Nx, Lerna, pnpm) y genera:
- Configuración raíz compartida
- Configuración específica por paquete

## Proyectos nuevos (greenfield)

Si no se detecta stack, diverger-claude ofrece un wizard interactivo con templates predefinidos:
- Next.js Full Stack
- Express API
- FastAPI
- Spring Boot
- React SPA
- Angular
- Go API
- Rust CLI
