# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript via tsup (output: dist/)
npm run dev          # Watch mode build
npm test             # Run all tests (vitest)
npm run test:watch   # Tests in watch mode
npm run typecheck    # Type check without emitting
npm run lint         # ESLint on src/
npm run build:plugin # Build + bundle the plugin artifact
```

Run a single test file:
```bash
npx vitest run tests/unit/detection/node.test.ts
```

Run tests matching a pattern:
```bash
npx vitest run -t "three-way merge"
```

## Architecture

diverger-claude is a CLI that scans a project's filesystem, detects its tech stack, and generates a `.claude/` configuration directory (CLAUDE.md, rules, agents, skills, hooks, settings, MCP configs, external tool configs).

### Core pipeline (`diverger init`)

```
DetectionEngine → ProfileEngine → GenerationEngine → FileWriter
                                        ↓
                              GovernanceEngine (sync/three-way merge)
                              KnowledgeEngine  (optional Claude API enrichment)
```

**`DivergerEngine`** (`src/core/engine.ts`) orchestrates everything. CLI commands create an `EngineContext` and call engine methods; the engine never touches the UI.

### Detection (`src/detection/`)

- `DetectionEngine` runs all analyzers in parallel, then resolves monorepo and architecture patterns.
- Each analyzer (e.g., `NodeAnalyzer`, `PythonAnalyzer`) extends `BaseAnalyzer` and returns `AnalyzerResult` with `DetectedTechnology[]` + `evidence[]`.
- Technologies have a `confidence` score (0–100). Below `CONFIDENCE_THRESHOLD` (from `src/core/constants.ts`) the user is asked to confirm in interactive mode; in `--force`/CI modes they are filtered out automatically.

### Profiles (`src/profiles/`)

- A **Profile** is a static data object (`Profile` type) declaring what it contributes: CLAUDE.md sections, settings, rules, agents, skills, hooks, MCP configs, external tool configs.
- Profiles are composed in 5 ordered layers: **Base (0) → Language (10) → Framework (20) → Testing (30) → Infra (40)**.
- `ProfileComposer` (`src/profiles/composer.ts`) selects applicable profiles from `ALL_PROFILES` (registry in `src/profiles/index.ts`) based on detected technology IDs, then deep-merges contributions in layer order.
- To add a new technology: create a profile file in the appropriate registry folder and register it in `src/profiles/index.ts`.

### Generation (`src/generation/`)

- `GenerationEngine.generateFiles()` calls individual generators (one per output file type) and returns `GeneratedFile[]` — in-memory, not written yet.
- In `--plugin-mode`, `filterUniversalComponents()` strips agents/skills/hooks/MCP that the plugin already provides.
- `FileWriter.writeAll()` writes files to disk, skipping unchanged files and respecting `--force`.

### Governance (`src/governance/`)

- **`diverger sync`** performs a three-way merge: `base` (original generated content stored in `.diverger-meta.json`) ← `theirs` (current on-disk file) ← `ours` (newly generated content).
- `DivergentMeta` is stored in `.diverger-meta.json` at the project root. It tracks file hashes, original content, detected stack, applied profiles, and rule governance levels.
- Rules marked `mandatory` cannot be overwritten by team customizations.

### Knowledge (`src/knowledge/`)

- Optional: during `init`, users can consent to Claude API calls that fetch best practices per detected framework/language.
- Results are cached locally (TTL-based) and injected as CLAUDE.md sections at order=50.
- API errors (including `ApiKeyError`, `BillingError`) are caught and logged as warnings; the pipeline continues without knowledge results.

### MCP server (`src/mcp/`)

- Exposes CLI operations as MCP tools for Claude Code integration.
- Entry point: `dist/mcp/server.js` (registered as `diverger-mcp` binary).

### Plugin (`plugin/`)

- The plugin bundles universal agents, skills, hooks, and MCP config — tech-agnostic components that apply to all projects.
- Built via `npm run build:plugin` (`scripts/build-plugin.ts`), which assembles the `plugin/` directory and updates `plugin/.claude-plugin/plugin.json`.
- Installed by end-users via `diverger plugin install` (downloads from GitHub releases).

## Conventions

- **All shared types** live in `src/core/types.ts` — import from there, not from individual modules.
- **Error classes** live in `src/core/errors.ts` — use `DivergerError` subclasses, not raw `Error`.
- **File paths**: always `path.join()` / `path.resolve()`, never string concatenation.
- **ESM only**: `import`/`export`, no `require()`. All imports within `src/` must use `.js` extension.
- **Functional patterns** preferred; analyzers are the exception (abstract class `BaseAnalyzer`).
- **User-facing strings**: Spanish. Code identifiers, comments, and rule content: English.
- **No `any`** without an explanatory comment.
