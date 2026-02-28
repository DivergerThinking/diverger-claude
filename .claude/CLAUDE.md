# diverger-claude - Proyecto de configuración automática de Claude Code

## Sobre el proyecto
diverger-claude es una herramienta interna (CLI + Plugin) que detecta automáticamente el stack tecnológico de un proyecto y genera una configuración `.claude/` completa y adaptada.

## Stack tecnológico
- **Lenguaje**: TypeScript (strict mode)
- **Runtime**: Node.js 20+
- **Build**: tsup (ESM)
- **Tests**: vitest
- **CLI Framework**: Commander.js
- **UI**: chalk, ora, inquirer

## Convenciones de código
- ESM modules (`import`/`export`, no `require`)
- Functional patterns preferred over classes (except analyzers which use abstract base class)
- All types in `src/core/types.ts` - import from there
- Error handling: use custom error classes from `src/core/errors.ts`
- File paths: always use `path.join()` or `path.resolve()`, never string concatenation
- Async/await preferred over `.then()` chains

## Estructura del proyecto
- `src/core/` - Tipos, constantes, errores, orquestador
- `src/detection/` - Escáner de filesystem y analizadores por tecnología
- `src/profiles/` - Sistema de perfiles por capas (5 capas composables)
- `src/generation/` - Generadores de archivos de configuración
- `src/governance/` - Three-way merge y gobernanza de reglas
- `src/knowledge/` - Cliente Claude API para buscar best practices
- `src/adaptation/` - Adaptación continua (hooks de sesión)
- `src/cli/` - Interfaz de línea de comandos
- `tests/` - Unit, integration, e2e

## Reglas de desarrollo
- Tests obligatorios para toda lógica de negocio
- No `any` type salvo casos justificados con comment
- Exports explícitos, no barrel re-exports de todo
- Strings user-facing en español, código y reglas internas en inglés
- Documentar interfaces públicas con JSDoc

## Plan detallado
Ver `docs/plan-diverger-claude.md` para el plan completo del proyecto.
