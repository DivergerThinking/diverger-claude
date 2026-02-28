# Guía de Uso

## Flujo básico

### 1. Detección y generación

```bash
cd mi-proyecto
npx diverger-claude init
```

diverger-claude:
1. Escanea archivos de manifiesto (package.json, pyproject.toml, etc.)
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

### 6. Eject

```bash
npx diverger-claude eject
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
