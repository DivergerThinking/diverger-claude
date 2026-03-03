# diverger-claude

Herramienta interna (CLI + Plugin) para configuración automática de Claude Code adaptada al stack tecnológico del proyecto.

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

### 1. Instalar el CLI

```bash
npm install -g @divergerthinking/diverger-claude
```

Tras instalar, `diverger` queda disponible como comando global en cualquier terminal.

### 2. Instalar el plugin (recomendado)

El plugin extiende Claude Code con agentes, skills, hooks y MCP server universales. Es la vía recomendada.

```bash
# Requiere: gh auth login (GitHub CLI autenticado)
diverger plugin install
```

Tras instalar el plugin, regenera la configuración de tus proyectos:

```bash
cd tu-proyecto
diverger init --force    # Regenera en modo plugin (solo tech-specific)
diverger cleanup         # Elimina duplicados de .claude/
```

> Ver [guía del plugin](docs/guia-plugin.md) para más detalles o [migración CLI a plugin](docs/migracion-cli-a-plugin.md) si ya tenías el CLI configurado.

### Alternativas de instalación del CLI

```bash
# Como dependencia de desarrollo (para equipos)
npm install @divergerthinking/diverger-claude --save-dev

# Ejecución directa con npx (sin instalar)
npx @divergerthinking/diverger-claude init
```

## Uso rápido

```bash
cd mi-proyecto
diverger init            # Detectar stack y generar .claude/
diverger plugin status   # Verificar estado del plugin
```

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `diverger` | Mostrar banner con estado del proyecto |
| `diverger init` | Detectar stack y generar configuración |
| `diverger diff` | Mostrar cambios propuestos (dry-run) |
| `diverger status` | Mostrar stack detectado y estado |
| `diverger sync` | Actualizar con three-way merge |
| `diverger check` | Validar configuración existente |
| `diverger cleanup` | Eliminar componentes duplicados (con plugin) |
| `diverger plugin install` | Descargar e instalar el plugin |
| `diverger plugin status` | Estado de instalación del plugin |
| `diverger plugin uninstall` | Desinstalar el plugin |
| `diverger update` | Actualizar CLI a la última versión |
| `diverger update --all` | Actualizar CLI + plugin en un solo comando |
| `diverger update --check` | Verificar si hay actualización disponible |
| `diverger telemetry` | Gestionar telemetría local (enable/disable/show/clear) |
| `diverger eject` | Desconectar manteniendo configs |
| `diverger --version` | Mostrar versión instalada |

### Opciones globales

| Flag | Descripción |
|------|-------------|
| `-q, --quiet` | Modo silencioso |
| `--json` | Salida en JSON (para CI/CD) |
| `-f, --force` | Sin confirmaciones |
| `-d, --dry-run` | Solo mostrar, no escribir |

## Tecnologías soportadas (59 profiles)

### Lenguajes (9)
TypeScript, Python, Java, Go, Rust, C#, Kotlin, Swift, Dart

### Frameworks (27)
React, Next.js, Angular, Vue.js, Svelte, Nuxt, Remix, Astro, Express, NestJS, Flask, FastAPI, Django, Spring Boot, Gin, Echo, Fiber, Actix-web, Axum, Rocket, Prisma, tRPC, React Native, Expo, Flutter, SwiftUI, Jetpack Compose

### Testing (9)
Jest, Vitest, Pytest, JUnit, Cypress, Playwright, Detox, XCTest, Espresso

### Infraestructura (13)
Docker, Kubernetes, GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure Pipelines, AWS, Terraform, Vercel, Fastlane, Bun, Deno

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

## CLI vs Plugin

| Aspecto | CLI solo | CLI + Plugin |
|---------|----------|--------------|
| Agentes universales | En `.claude/agents/` | Plugin los provee |
| Skills universales | En `.claude/skills/` | Plugin los provee |
| Hooks universales | En `.claude/hooks/` | Plugin los provee |
| MCP server | No disponible | Auto-registrado |
| Rules tech-specific | En `.claude/rules/` | En `.claude/rules/` (igual) |
| Actualización CLI | `diverger update` | `diverger update` (igual) |
| Actualización plugin | N/A | `diverger plugin install` o `diverger update --all` |
| MCP tools | No disponible | 8 tools programáticas |
| Telemetría local | No disponible | `diverger telemetry enable` |

## Desarrollo

```bash
npm install          # Instalar dependencias
npm run dev          # Modo desarrollo
npm test             # Ejecutar tests
npm run typecheck    # Type check
npm run build        # Build
```

## Licencia

Uso interno - DivergerThinking.
