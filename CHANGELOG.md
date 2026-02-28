# Changelog

## [0.1.0] - 2026-02-28

### Añadido
- Motor de detección de stack tecnológico (Node.js, Python, Java, Go, Rust, .NET, Docker, CI)
- Sistema de profiles de 5 capas (Base, Lenguaje, Framework, Testing, Infra)
- 27 profiles: 6 lenguajes, 9 frameworks, 6 testing, 6 infra
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
