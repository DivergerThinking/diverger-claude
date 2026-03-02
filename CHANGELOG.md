# Changelog

## [0.2.0] - 2026-03-02

### Añadido
- Detección de manifiestos en subdirectorios (`app/`, `frontend/`, `backend/`, `apps/web/`)
- Nuevo módulo `file-utils` con funciones de búsqueda por basename (`findFile`, `findFileEntry`, `findAllFileEntries`, `hasFile`)
- Soporte multi-manifiesto: Node y Python procesan TODOS los package.json / pyproject.toml encontrados
- Propiedad `rootOnlyPatterns` en BaseAnalyzer para proteger configs que solo deben buscarse en raíz
- Wildcard basename matching: `app/Dockerfile.dev` ahora matchea el patrón `Dockerfile.*`
- Scanner expande patterns con `**/` para buscar en subdirectorios (hasta profundidad 4)
- Nuevo banner wireframe globe 3D con paleta turquesa y saludo por hora del día
- Comando `welcome` en CLI
- Banner automático al ejecutar `diverger` sin argumentos
- Instalación global disponible: `npm install -g @divergerthinking/diverger-claude`
- 3 nuevos fixtures de integración (subdir-app, fullstack-multi, mixed-root-subdir)
- 95 tests nuevos (628 total)

### Mejorado
- Guía de instalación ampliada con instrucciones detalladas paso a paso
- Cada analyzer usa paths reales en evidence (ej: `frontend/package.json` en lugar de `package.json`)
- Docker analyzer usa `path.basename()` para detectar Dockerfiles en subdirectorios
- CI analyzer declara `rootOnlyPatterns` para Jenkinsfile, .gitlab-ci.yml, azure-pipelines.yml

## [0.1.0] - 2026-02-28

### Añadido
- Motor de detección de stack tecnológico (Node.js, Python, Java, Go, Rust, .NET, Docker, CI)
- Sistema de profiles de 5 capas (Base, Lenguaje, Framework, Testing, Infra)
- 37 profiles: 1 base + 6 lenguajes, 18 frameworks, 6 testing, 6 infra
- Algoritmo de composición por capas con enriquecimiento de agentes
- Generadores: CLAUDE.md, settings.json, rules, agents, skills, hooks, MCP
- Generador de seguridad (deny rules + sandbox)
- Generador de configs externas (ESLint, Prettier, tsconfig)
- CLI con comandos: init, diff, status, sync, check, eject
- UI rica: colores, spinners, menús interactivos
- Modos: --quiet, --json, --force, --dry-run
- Three-way merge para actualizaciones
- Sistema de gobernanza (mandatory vs recommended)
- Motor de conocimiento (Claude API + web search + caché)
- Adaptación continua (hook SessionStart + change detector)
- Soporte monorepo (npm workspaces, Turborepo, Nx, Lerna, pnpm)
- Wizard para proyectos greenfield con templates
- Plugin de Claude Code (commands, agents, skills, hooks)
- 6 agentes: code-reviewer, test-writer, security-checker, doc-writer, refactor-assistant, migration-helper
- Dogfooding: el propio proyecto usa .claude/ generado
- Documentación en español
- CI/CD con GitHub Actions
