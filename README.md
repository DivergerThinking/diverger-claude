# diverger-claude

Herramienta interna para configuración automática de Claude Code adaptada al stack tecnológico del proyecto.

## Qué hace

diverger-claude detecta automáticamente las tecnologías de tu proyecto y genera una configuración `.claude/` completa y optimizada, incluyendo:

- **CLAUDE.md** con convenciones específicas del stack
- **Rules** (reglas) adaptadas al lenguaje, framework y herramientas
- **Agents** (agentes) enriquecidos con conocimiento del stack
- **Settings** con permisos y seguridad configurados
- **Configs externas** alineadas (ESLint, Prettier, tsconfig)

## Instalación

> **Nota:** Este es un paquete privado en GitHub Packages. Necesitas autenticarte primero.
> Consulta la [guía de instalación](docs/guia-instalacion.md) para configurar el acceso.

```bash
npm install @divergerthinking/diverger-claude --save-dev
```

O directamente con npx:

```bash
npx @divergerthinking/diverger-claude init
```

## Uso rápido

### Detectar y generar configuración

```bash
# Ver qué se generaría (dry-run)
npx diverger-claude diff

# Generar configuración
npx diverger-claude init

# Forzar regeneración
npx diverger-claude init --force
```

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `diverger init` | Detectar stack y generar configuración |
| `diverger diff` | Mostrar cambios propuestos (dry-run) |
| `diverger status` | Mostrar stack detectado y estado |
| `diverger sync` | Actualizar con three-way merge |
| `diverger check` | Validar configuración existente |
| `diverger eject` | Desconectar manteniendo configs |

### Opciones globales

| Flag | Descripción |
|------|-------------|
| `-q, --quiet` | Modo silencioso |
| `--json` | Salida en JSON (para CI/CD) |
| `-f, --force` | Sin confirmaciones |
| `-d, --dry-run` | Solo mostrar, no escribir |

## Tecnologías soportadas

### Lenguajes
TypeScript, Python, Java, Go, Rust, C#

### Frameworks
React, Next.js, Angular, Vue.js, Svelte, Nuxt, Express, NestJS, Flask, FastAPI, Django, Spring Boot, Gin, Echo, Fiber, Actix-web, Axum, Rocket

### Testing
Jest, Vitest, Pytest, JUnit, Cypress, Playwright

### Infraestructura
Docker, Kubernetes, GitHub Actions, AWS, Terraform, Vercel

## Sistema de profiles

diverger-claude usa un sistema de 5 capas composables:

1. **Base** (siempre activa): Reglas universales de calidad y seguridad
2. **Lenguaje**: Convenciones específicas del lenguaje
3. **Framework**: Patrones y best practices del framework
4. **Testing**: Configuración del framework de testing
5. **Infraestructura**: CI/CD, containers, cloud

Los profiles se componen automáticamente: las secciones se concatenan, los settings se mergean, y los agentes se enriquecen con conocimiento específico del stack.

## Gobernanza

Las reglas tienen dos niveles de gobernanza:

- **Mandatory** (🔒): No se pueden modificar ni eliminar. Representan estándares corporativos.
- **Recommended** (💡): Se pueden personalizar por equipo.

## Three-way merge

Al actualizar (`diverger sync`), se aplica un merge inteligente:

- Si solo la librería cambió → se actualiza automáticamente
- Si solo el equipo cambió → se respetan sus cambios
- Si ambos cambiaron → merge inteligente o resolución manual

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## Licencia

Uso interno.
