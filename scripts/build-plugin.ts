/**
 * Build script for the diverger-claude plugin directory.
 *
 * Composes the universal profile alone and writes the plugin/ structure:
 *   plugin/
 *   ├── .claude-plugin/plugin.json
 *   ├── agents/{name}.md
 *   ├── skills/{name}/SKILL.md
 *   ├── hooks/hooks.json
 *   └── hooks/scripts/{name}.sh
 *
 * Run with: npx tsx scripts/build-plugin.ts
 */

import { writeFileSync, mkdirSync, readFileSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { universalProfile } from '../src/profiles/registry/base/universal.profile.js';
import { ProfileComposer } from '../src/profiles/composer.js';
import { formatAgentFile } from '../src/generation/generators/agents.js';
import { formatSkillFile } from '../src/generation/generators/skills.js';
import type { DetectionResult, HookDefinition } from '../src/core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PLUGIN_DIR = path.join(ROOT, 'plugin');

// Read version from package.json
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
  version: string;
  repository: { url: string };
};
const version = pkg.version;

// Compose universal profile alone (empty detection = only base layer)
const composer = new ProfileComposer();
const emptyDetection: DetectionResult = {
  technologies: [],
  rootDir: ROOT,
  detectedAt: new Date().toISOString(),
};
const composed = composer.compose([universalProfile], emptyDetection);

// --- Create directory structure ---
const dirs = [
  path.join(PLUGIN_DIR, '.claude-plugin'),
  path.join(PLUGIN_DIR, 'agents'),
  path.join(PLUGIN_DIR, 'hooks', 'scripts'),
  path.join(PLUGIN_DIR, 'mcp'),
];
for (const skillDef of composed.skills) {
  dirs.push(path.join(PLUGIN_DIR, 'skills', skillDef.name));
}
for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
}

// --- Write agents ---
for (const agent of composed.agents) {
  const content = formatAgentFile(agent);
  writeFileSync(path.join(PLUGIN_DIR, 'agents', `${agent.name}.md`), content);
}
console.log(`  agents: ${composed.agents.length} files`);

// --- Write skills ---
for (const skill of composed.skills) {
  const content = formatSkillFile(skill);
  writeFileSync(path.join(PLUGIN_DIR, 'skills', skill.name, 'SKILL.md'), content);
}
console.log(`  skills: ${composed.skills.length} directories`);

// --- Write hook scripts ---
for (const script of composed.hookScripts) {
  writeFileSync(path.join(PLUGIN_DIR, 'hooks', 'scripts', script.filename), script.content);
}
console.log(`  hook scripts: ${composed.hookScripts.length} files`);

// --- Write hooks.json ---
// Rewrite hook commands to use ${CLAUDE_PLUGIN_ROOT} paths
function rewriteHookCommand(command: string): string {
  return command.replace(
    /(?:bash\s+)?\.claude\/hooks\//g,
    'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/',
  );
}

interface HooksJsonEntry {
  type: string;
  command: string;
  timeout?: number;
  statusMessage?: string;
}

interface HooksJson {
  [event: string]: {
    [matcher: string]: HooksJsonEntry[];
  } | HooksJsonEntry[];
}

const hooksJson: HooksJson = {};
for (const hook of composed.hooks as HookDefinition[]) {
  const key = hook.event;
  const entries: HooksJsonEntry[] = hook.hooks.map((h) => ({
    type: h.type,
    command: rewriteHookCommand(h.command),
    ...(h.timeout ? { timeout: h.timeout } : {}),
    ...(h.statusMessage ? { statusMessage: h.statusMessage } : {}),
  }));

  if (hook.matcher) {
    if (!hooksJson[key]) hooksJson[key] = {};
    const eventObj = hooksJson[key] as Record<string, HooksJsonEntry[]>;
    if (!eventObj[hook.matcher]) eventObj[hook.matcher] = [];
    eventObj[hook.matcher].push(...entries);
  } else {
    if (!hooksJson[key]) hooksJson[key] = [];
    (hooksJson[key] as HooksJsonEntry[]).push(...entries);
  }
}
writeFileSync(
  path.join(PLUGIN_DIR, 'hooks', 'hooks.json'),
  JSON.stringify(hooksJson, null, 2) + '\n',
);
console.log(`  hooks.json: written`);

// --- Write plugin.json manifest ---
const pluginManifest = {
  name: 'diverger-claude',
  version,
  description: 'Universal development agents, skills, and hooks by DivergerThinking',
  author: {
    name: 'DivergerThinking',
    url: 'https://github.com/DivergerThinking',
  },
  homepage: 'https://github.com/DivergerThinking/diverger-claude',
  repository: pkg.repository.url,
  license: 'UNLICENSED',
  keywords: ['claude-code', 'developer-tools', 'agents', 'skills', 'hooks', 'mcp'],
};
writeFileSync(
  path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json'),
  JSON.stringify(pluginManifest, null, 2) + '\n',
);
console.log(`  plugin.json: v${version}`);

// --- Copy bundled MCP server ---
const bundledServerSrc = path.join(ROOT, 'dist', 'mcp-bundled', 'server.js');
const bundledServerDst = path.join(PLUGIN_DIR, 'mcp', 'server.js');
if (existsSync(bundledServerSrc)) {
  copyFileSync(bundledServerSrc, bundledServerDst);
  console.log(`  mcp/server.js: copied (self-contained bundle)`);
} else {
  console.warn(`  WARNING: ${bundledServerSrc} not found — run 'npm run build' first`);
}

// --- Write .mcp.json ---
const mcpConfig = {
  mcpServers: {
    'diverger-claude': {
      command: 'node',
      args: ['${CLAUDE_PLUGIN_ROOT}/mcp/server.js'],
    },
  },
};
writeFileSync(
  path.join(PLUGIN_DIR, '.mcp.json'),
  JSON.stringify(mcpConfig, null, 2) + '\n',
);
console.log(`  .mcp.json: written`);

// --- Write MCP-backed skills ---
const mcpSkills = [
  {
    name: 'diverger-init',
    content: `---
name: diverger-init
description: Detect technology stack and generate .claude/ configuration
user-invocable: true
---

# diverger-init

Use the MCP tools provided by the diverger-claude server to initialize the project configuration.

## Pre-flight checks

Before starting, verify these conditions:
- You are in the root directory of the target project (look for package.json, go.mod, Cargo.toml, etc.)
- If a \`.claude/\` directory already exists, warn the user that it will be overwritten unless they use sync instead.

## Steps

1. Call the \`detect_stack\` MCP tool with the current project root directory.
2. Present the detected technologies to the user in a clear table format:
   - Technology name, version, confidence score, category
   - Highlight any low-confidence detections (<90%) with a warning.
3. Ask the user to confirm proceeding with generation.
4. If confirmed, call the \`generate_config\` MCP tool with \`pluginMode: true\`.
5. Show a summary of the generated files and applied profiles.
6. If any issues arise, suggest running \`/diverger-status\` to validate.

## Edge cases

- **\`.claude/\` already exists**: Ask user if they want to overwrite or use \`/diverger-sync\` instead.
- **No technologies detected**: Suggest checking if manifest files exist (package.json, go.mod, etc.) or if the working directory is correct.
- **Low confidence detections**: Explain that detections below 90% confidence may be inaccurate and ask user to confirm.

## Error recovery

- If \`detect_stack\` fails: Check that the MCP server is running (\`/diverger-health\`).
- If \`generate_config\` fails: Show the error, suggest running detection again, and check file permissions.

## Follow-up suggestions

After successful init, suggest:
1. Run \`/diverger-quickstart\` for a guided tour of the generated configuration.
2. Run \`/diverger-doctor\` to get a health score for the project.
3. Explore \`.claude/rules/\` to see the generated coding rules.
4. Try \`/commands\` to see all available skills for the detected stack.
`,
  },
  {
    name: 'diverger-status',
    content: `---
name: diverger-status
description: Check project stack and validate .claude/ configuration
user-invocable: true
---

# diverger-status

Use the MCP tools provided by the diverger-claude server to show project status.

## Prerequisites

- The project must have been initialized with \`/diverger-init\` (a \`.claude/\` directory must exist).
- If no \`.claude/\` directory exists, suggest running \`/diverger-init\` first.

## Steps

1. Call the \`detect_stack\` MCP tool with the current project root directory.
2. Call the \`check_config\` MCP tool with the same directory.
3. Present a combined status report:
   - **Detected technologies**: name, version, confidence, category
   - **Configuration health**: valid/invalid, number of files, last modified
   - **Issues found**: severity (error/warning), file path, message
   - **Stack drift**: technologies detected now vs. what was configured

## Stack drift detection

Compare the currently detected technologies with what the configuration was generated for:
- **New technologies**: Detected now but not in config → suggest \`/diverger-sync\`
- **Removed technologies**: In config but no longer detected → may need cleanup
- **Version changes**: Major version changes that may require config update

## Context-sensitive suggestions

Based on the status report, provide targeted suggestions:
- If issues are found → suggest \`/diverger-sync\` to fix configuration drift
- If stack has changed → suggest \`/diverger-sync\` to update profiles
- If config is healthy → confirm everything is up to date
- If health is degraded → suggest \`/diverger-doctor\` for a detailed health analysis
`,
  },
  {
    name: 'diverger-sync',
    content: `---
name: diverger-sync
description: Sync .claude/ configuration with latest detected stack
user-invocable: true
---

# diverger-sync

Use the MCP tools provided by the diverger-claude server to sync configuration.

## Pre-sync checks

Before syncing:
- Verify that \`.claude/\` directory exists. If not, suggest \`/diverger-init\` instead.
- Check if there are uncommitted changes to \`.claude/\` files. If so, warn the user that sync may overwrite manual edits.

## Steps

1. Call the \`sync_config\` MCP tool with the current project root directory.
2. Report the results clearly:
   - **Updated files**: list each file that was changed, with a brief description of what changed
   - **Conflicts resolved**: files where the three-way merge resolved differences automatically
   - **Files skipped**: files that were already up to date
3. Call \`check_config\` to verify the configuration is healthy after sync.
4. Show summary counts (updated, conflicts, skipped).

## Merge conflict handling

If the sync reports merge conflicts that couldn't be auto-resolved:
- Show the conflicting sections with context
- Ask the user to choose: keep their version, accept the new version, or merge manually
- After resolution, re-run \`check_config\` to verify

## Post-sync validation

After a successful sync:
1. Run \`check_config\` to verify the configuration is healthy.
2. If new technologies were detected, list the new rules and skills that were added.
3. If technologies were removed, list the rules and skills that were cleaned up.
4. Suggest running \`/diverger-doctor\` to verify overall project health.

## Error recovery

- If \`sync_config\` fails: Check MCP server health with \`/diverger-health\`, verify file permissions.
- If config is invalid after sync: Suggest running \`/diverger-init\` with force mode to regenerate from scratch.
`,
  },
  {
    name: 'diverger-check',
    content: `---
name: diverger-check
description: Validate .claude/ configuration governance and detect issues
user-invocable: true
---

# diverger-check

Use the MCP tools provided by the diverger-claude server to validate configuration.

## Steps

1. Call the \`check_config\` MCP tool with the current project root directory.
2. Present the validation result:
   - Overall validity (valid/invalid)
   - Issues found: severity (error/warning), file path, message
   - Governance violations (mandatory rules that are missing or modified)
3. If issues are found:
   - For missing files: suggest running \`/diverger-sync\` to regenerate.
   - For governance violations: explain what the rule enforces.
   - For warnings: note they are non-blocking but recommended to fix.
4. If no issues: confirm the configuration is healthy.
`,
  },
];

const intelligenceSkills = [
  {
    name: 'diverger-health',
    content: `---
name: diverger-health
description: Run a full health check on the diverger-claude plugin
user-invocable: true
---

# diverger-health

Use the MCP tools provided by the diverger-claude server to diagnose the plugin's health.

## Steps

1. Call the \`check_plugin_health\` MCP tool with the plugin directory and current CLI version.
2. Present the health report in a clear table format:
   - Overall status (healthy/degraded/unhealthy)
   - Individual check results with status indicators
   - Auto-fixable issues highlighted
3. If there are auto-fixable issues:
   - Suggest running \`diverger plugin install\` to reinstall the plugin.
4. If version inconsistency is detected:
   - Suggest running \`diverger update\` to update to the latest version.
5. If everything is healthy:
   - Confirm the plugin is fully operational.
`,
  },
  {
    name: 'diverger-repair',
    content: `---
name: diverger-repair
description: Diagnose and repair .claude/ configuration issues
user-invocable: true
---

# diverger-repair

Use the MCP tools provided by the diverger-claude server to diagnose and repair configuration issues.

## Steps

1. Call the \`repair_config\` MCP tool with the current project root directory and \`mode: "report-only"\` first.
2. Present the diagnosis report:
   - List each issue with severity, confidence, and whether it's auto-repairable
   - Group by severity (critical → warning → info)
3. If there are auto-repairable issues with confidence >= 70:
   - Ask the user if they want to auto-repair them
   - If confirmed, call \`repair_config\` with \`mode: "auto"\`
   - Report which repairs succeeded and which failed
4. For issues with confidence 50-69:
   - Explain the issue and suggest manual steps
5. For info-level issues:
   - Mention them as suggestions (e.g., "consider running \\\`diverger sync\\\`")
6. After repairs, optionally run \`check_config\` to verify the configuration is now healthy.
`,
  },
  {
    name: 'diverger-learn',
    content: `---
name: diverger-learn
description: Review learned error patterns and anti-patterns
user-invocable: true
---

# diverger-learn

Use the MCP tools provided by the diverger-claude server to review and manage learned patterns.

## Steps

1. Call the \`get_memory\` MCP tool with \`section: "all"\` for the current project root.
2. Present a comprehensive learning report:
   - **Error Patterns**: Top 10 most frequent, with occurrences and resolutions
   - **Anti-Patterns**: All learned anti-patterns with confidence scores
   - **Best Practices**: All discovered best practices
   - **Stats**: Total sessions, repairs, success rate
3. Highlight patterns that have generated auto-rules (in \`.claude/rules/learned/\`)
4. If the user wants to add a manual learning:
   - Use the \`record_learning\` MCP tool
   - Confirm the type (anti-pattern, best-practice, or error-pattern)
   - Provide all required fields
5. If session errors exist (\`.claude/session-errors.local.json\`):
   - Offer to process them with \`extract_learnings\` MCP tool
   - Show what patterns were found and if any rules were generated
`,
  },
  {
    name: 'diverger-evolve',
    content: `---
name: diverger-evolve
description: Review project evolution and get proactive configuration recommendations
user-invocable: true
---

# diverger-evolve

Use the MCP tools provided by the diverger-claude server to analyze project evolution.

## Steps

1. Call the \`detect_stack\` MCP tool with the current project root directory.
2. Call the \`get_memory\` MCP tool with \`section: "all"\` to review evolution history.
3. Compare detected stack against the memory's evolution log.
4. Present findings:
   - New technologies or frameworks detected since last sync
   - Removed dependencies that may have stale profiles
   - Architecture changes (Docker, CI/CD, monorepo additions)
   - Memory health: consolidation status, pattern counts
5. For each finding, explain:
   - What changed and when
   - Which profile(s) would be affected
   - Recommended action (sync, update, review)
6. If the project is up to date, confirm everything is aligned.
`,
  },
];

const workflowSkills = [
  {
    name: 'diverger-audit',
    content: `---
name: diverger-audit
description: Full project audit — code quality, security, testing coverage, and configuration health
user-invocable: true
disable-model-invocation: true
---

# Auditoria Completa del Proyecto

Ejecuta una auditoria exhaustiva del proyecto actual: $ARGUMENTS

## Pasos

1. **Detectar stack**: Llama a \`detect_stack\` MCP tool. Guarda las tecnologias detectadas.

2. **Auditoria de seguridad**:
   - Ejecuta el audit de dependencias del proyecto (npm audit / pip-audit / cargo audit / go vuln check segun stack)
   - Usa el subagente \`security-checker\` para revisar el codigo fuente buscando: inyecciones, secretos hardcodeados, permisos inseguros, dependencias vulnerables
   - Documenta cada hallazgo con severidad (critical/high/medium/low)

3. **Auditoria de calidad de codigo**:
   - Ejecuta el linter del proyecto si existe (eslint / ruff / golangci-lint / clippy segun stack)
   - Usa el subagente \`code-reviewer\` para revisar: complejidad ciclomatica, duplicacion, naming, errores de tipo, dead code
   - Si hay TypeScript, ejecuta \`tsc --noEmit\` para verificar tipos

4. **Auditoria de testing**:
   - Ejecuta los tests con cobertura (--coverage flag segun test runner)
   - Identifica archivos/funciones sin cobertura
   - Evalua calidad de tests: Prueban edge cases? Hay tests fragiles? Usan mocks excesivos?

5. **Auditoria de configuracion**:
   - Llama a \`check_config\` MCP tool para validar .claude/
   - Llama a \`check_plugin_health\` MCP tool para validar el plugin
   - Revisa .gitignore, .env.example, CI pipeline

6. **Consultar memoria del proyecto**:
   - Llama a \`get_memory\` MCP tool con section "all"
   - Incluye patrones de error recurrentes en el reporte
   - Incluye anti-patterns conocidos como advertencias

7. **Generar reporte**:
   - Crea \`.claude/audit-report.md\` con:
     - Resumen ejecutivo (score global, issues por severidad)
     - Tabla de hallazgos (severidad, archivo, linea, descripcion, remediacion)
     - Metricas de cobertura
     - Patrones de error recurrentes del proyecto
     - Recomendaciones priorizadas
   - Presenta el resumen al usuario

8. **Registrar aprendizajes**:
   - Si la auditoria descubrio anti-patterns nuevos, usa \`record_learning\` MCP tool para registrarlos
`,
  },
  {
    name: 'diverger-test-suite',
    content: `---
name: diverger-test-suite
description: Analyze test coverage gaps and generate comprehensive tests adapted to the project's stack
user-invocable: true
disable-model-invocation: true
---

# Generacion de Test Suite Completa

Analiza la cobertura de tests y genera tests faltantes: $ARGUMENTS

## Pasos

1. **Detectar stack**: Llama a \`detect_stack\` MCP tool. Identifica el framework de testing (vitest/jest/pytest/junit/go test/cargo test).

2. **Analizar cobertura actual**:
   - Ejecuta los tests con flag de cobertura
   - Identifica archivos y funciones sin cobertura o con cobertura baja (<80%)
   - Lista las funciones/metodos mas criticos sin tests (prioriza por complejidad y uso)

3. **Examinar patrones de testing existentes**:
   - Lee 2-3 archivos de test existentes del proyecto
   - Identifica: estilo de assertions, uso de mocks/stubs, organizacion (describe/it vs flat), fixtures, setup/teardown
   - Sigue exactamente el mismo estilo para tests nuevos

4. **Generar tests priorizados**:
   - Para cada archivo/funcion sin cobertura (ordenado por criticidad):
     - Genera unit tests siguiendo el patron del proyecto
     - Incluye: happy path, edge cases, error handling, boundary values
     - Usa la estrategia de mocking del proyecto (no inventa nuevas)
   - Si $ARGUMENTS especifica archivos concretos, enfocate en esos

5. **Ejecutar y validar**:
   - Ejecuta todos los tests nuevos
   - Si alguno falla, diagnostica y corrige
   - Re-ejecuta hasta que todos pasen
   - Muestra la nueva cobertura comparada con la anterior

6. **Reportar**:
   - Resumen: X tests anadidos, cobertura paso de Y% a Z%
   - Lista de archivos con tests nuevos
   - Gaps de cobertura restantes (si los hay) con explicacion
`,
  },
  {
    name: 'diverger-pr-review',
    content: `---
name: diverger-pr-review
description: Comprehensive pull request review with stack-adapted checklist
user-invocable: true
disable-model-invocation: true
---

# Review Exhaustivo de Pull Request

Revisa el PR indicado con una checklist adaptada al stack del proyecto: $ARGUMENTS

## Pasos

1. **Obtener contexto del PR**:
   - Si $ARGUMENTS es un numero, ejecuta \`gh pr view $ARGUMENTS --json title,body,files,additions,deletions,commits\`
   - Si $ARGUMENTS esta vacio, ejecuta \`gh pr view --json ...\` para el PR de la branch actual
   - Lee el diff completo: \`gh pr diff\`

2. **Detectar stack**: Llama a \`detect_stack\` MCP tool para adaptar los criterios de review.

3. **Consultar memoria**:
   - Llama a \`get_memory\` MCP tool para obtener anti-patterns del proyecto
   - Incluye estos anti-patterns como criterios adicionales de review

4. **Review de calidad**:
   - El codigo sigue las convenciones del proyecto? (naming, estructura, patterns)
   - Hay duplicacion con codigo existente?
   - Se han anadido o actualizado tests para los cambios?
   - El commit message es descriptivo?
   - Se han actualizado types/interfaces si hay cambios de API?

5. **Review de seguridad**:
   - Hay secretos o credenciales hardcodeados?
   - Los inputs del usuario se validan/sanitizan?
   - Hay SQL injection, XSS, path traversal, o SSRF posibles?
   - Se usan las APIs de auth correctamente?

6. **Review especifico del stack**:
   - **TypeScript**: Hay \`any\` innecesarios? Types correctos?
   - **React/Next.js**: Hooks con deps correctas? Server vs client correcto?
   - **Python**: Type hints? Manejo de excepciones?
   - **Go**: Error handling idiomatic? Context propagation?
   - (Claude adapta segun lo que detecto detect_stack)

7. **Generar review**:
   - Presenta hallazgos organizados por categoria: Critical, Major, Minor, Nit
   - Para cada hallazgo: archivo, linea, descripcion, sugerencia de fix
   - Veredicto final: Approve / Request Changes / Comment
   - Si el usuario lo pide, postea el review como comentario: \`gh pr review --body "..."\`
`,
  },
  {
    name: 'diverger-onboard',
    content: `---
name: diverger-onboard
description: Generate comprehensive onboarding documentation for new developers joining the project
user-invocable: true
disable-model-invocation: true
---

# Onboarding para Nuevos Desarrolladores

Genera documentacion de onboarding completa para este proyecto: $ARGUMENTS

## Pasos

1. **Detectar stack y arquitectura**:
   - Llama a \`detect_stack\` MCP tool
   - Identifica: lenguajes, frameworks, test runners, CI/CD, infra
   - Detecta patron arquitectonico (monolith, microservices, serverless, etc.)

2. **Mapear la estructura del proyecto**:
   - Lista los directorios principales y su proposito
   - Identifica los entry points (main, index, server, app)
   - Encuentra los archivos de configuracion clave
   - Detecta monorepo structure si existe

3. **Documentar flujos clave**:
   - Traza 3-5 flujos de negocio principales leyendo el codigo
   - Para cada flujo: entry point -> procesamiento -> output/side-effects
   - Incluye diagrama de secuencia en texto (mermaid o ASCII)

4. **Documentar setup local**:
   - Requisitos: versiones de runtime, herramientas externas
   - Pasos de instalacion (lee package.json scripts, Makefile, docker-compose)
   - Variables de entorno necesarias (busca .env.example, dotenv usage)
   - Como ejecutar tests, lint, build

5. **Documentar convenciones**:
   - Lee CLAUDE.md y .claude/rules/ para extraer convenciones del equipo
   - Naming conventions, branching strategy, commit format
   - Patrones de codigo preferidos (functional vs OOP, error handling, etc.)

6. **Consultar memoria del proyecto**:
   - Llama a \`get_memory\` MCP tool
   - Incluye errores comunes y anti-patterns conocidos como "Gotchas"

7. **Generar documentacion**:
   - Crea \`ONBOARDING.md\` en la raiz del proyecto con:
     - Vision general del proyecto (1 parrafo)
     - Stack tecnologico (tabla)
     - Arquitectura (diagrama + explicacion)
     - Setup local (paso a paso)
     - Flujos de negocio principales
     - Convenciones del equipo
     - Gotchas y errores comunes (de la memoria)
     - Recursos utiles (links a docs, skills disponibles)
`,
  },
  {
    name: 'diverger-migrate',
    content: `---
name: diverger-migrate
description: Plan and execute technology migration with step-by-step guidance adapted to your stack
user-invocable: true
disable-model-invocation: true
---

# Migracion Tecnologica Guiada

Planifica y ejecuta una migracion tecnologica: $ARGUMENTS

## Pasos

1. **Detectar estado actual**:
   - Llama a \`detect_stack\` MCP tool
   - Identifica versiones actuales de todas las tecnologias
   - Lee archivos de configuracion relevantes

2. **Identificar migracion**:
   - Si $ARGUMENTS especifica el target (ej: "React 19", "Next.js 15", "Python 3.12"):
     - Investiga los breaking changes entre version actual y target
     - Usa web search si necesitas documentacion actualizada de la migracion
   - Si $ARGUMENTS es generico (ej: "actualizar todo"):
     - Lista todas las dependencias con versiones outdated
     - Prioriza por impacto y riesgo

3. **Crear plan de migracion**:
   - Lista todos los cambios necesarios en orden de ejecucion
   - Para cada cambio: archivo, que cambiar, por que, riesgo (high/medium/low)
   - Identifica dependencias entre cambios (que debe ir primero)
   - Estima scope (cuantos archivos, cuantos patterns a cambiar)

4. **Presentar plan al usuario**:
   - Muestra el plan completo y pide confirmacion antes de ejecutar
   - Ofrece opciones: ejecutar todo, ejecutar por fases, solo dry-run

5. **Ejecutar migracion** (si confirmado):
   - Para cada paso del plan:
     - Aplica los cambios
     - Ejecuta tests para verificar que no se rompio nada
     - Si falla, diagnostica y corrige antes de continuar
   - Usa git commits incrementales (un commit por paso logico)

6. **Verificacion final**:
   - Ejecuta el test suite completo
   - Ejecuta type check (si aplica)
   - Ejecuta linter
   - Compara comportamiento antes/despues

7. **Registrar en memoria**:
   - Usa \`record_learning\` MCP tool para registrar:
     - Anti-patterns de la version anterior
     - Best practices de la version nueva
   - Sugiere ejecutar \`/diverger-sync\` para actualizar la configuracion .claude/
`,
  },
  {
    name: 'diverger-release',
    content: `---
name: diverger-release
description: Execute a complete release checklist — tests, changelog, version bump, tag, and publish
user-invocable: true
disable-model-invocation: true
---

# Release Checklist Completo

Ejecuta el proceso de release del proyecto: $ARGUMENTS

## Pasos

1. **Detectar stack y CI**:
   - Llama a \`detect_stack\` MCP tool
   - Identifica: gestor de paquetes, CI/CD pipeline, strategy de versionado
   - Lee package.json / pyproject.toml / Cargo.toml para version actual

2. **Pre-flight checks**:
   - Verifica que estas en la branch correcta (main/master)
   - Verifica que no hay cambios sin commitear (\`git status\`)
   - Ejecuta type check (tsc --noEmit / mypy / etc. segun stack)
   - Ejecuta linter
   - Ejecuta test suite completo con cobertura

3. **Validacion de consistencia** (OBLIGATORIO — no continuar si falla):
   - Ejecuta \`npm run build\` (incluye build:plugin)
   - Verifica que \`plugin/.claude-plugin/plugin.json\` version == \`package.json\` version
   - Ejecuta \`npm run typecheck\` — 0 errores
   - Ejecuta \`npm test\` con cobertura
   - Si ALGUNO falla → DETENER release y reportar errores
   - **No continuar al paso 4 hasta que todas las validaciones pasen**

4. **Determinar nueva version**:
   - Si $ARGUMENTS incluye version (ej: "v2.0.0"), usa esa
   - Si no, analiza los commits desde el ultimo tag para sugerir:
     - MAJOR: breaking changes (commits con "BREAKING" o "!")
     - MINOR: features (commits con "feat:")
     - PATCH: fixes (commits con "fix:")
   - Presenta sugerencia y pide confirmacion

5. **Actualizar changelog**:
   - Lee commits desde el ultimo tag: \`git log $(git describe --tags --abbrev=0)..HEAD --oneline\`
   - Agrupa por tipo (Anadido, Cambiado, Corregido, Eliminado)
   - Genera entrada en CHANGELOG.md siguiendo el formato existente
   - Presenta al usuario para revision/edits

6. **Bump de version**:
   - Actualiza version en el archivo de manifiesto (package.json / pyproject.toml / Cargo.toml)
   - Si hay otros archivos con version hardcodeada, actualiza tambien
   - Commit: "release: vX.Y.Z -- <descripcion breve>"

7. **Tag y push**:
   - Crea tag: \`git tag vX.Y.Z\`
   - Presenta al usuario el resumen de lo que se va a pushear
   - Si confirma: \`git push origin <branch> --tags\`

8. **Post-release**:
   - Verifica que el CI pipeline se ejecuto correctamente (si hay GitHub Actions: \`gh run list --limit 1\`)
   - Si hay publish automatico, verifica que el paquete se publico
   - Sugiere crear GitHub Release con \`gh release create\` si no es automatico
`,
  },
];

const ciSkills = [
  {
    name: 'diverger-ci-learn',
    content: `---
name: diverger-ci-learn
description: Analyze recent CI failures and learn from error patterns
user-invocable: true
disable-model-invocation: true
---

# Aprender de Errores de CI

Analiza los ultimos fallos de CI y extrae aprendizajes: $ARGUMENTS

## Pasos

1. **Detectar CI provider**:
   - Busca \`.github/workflows/\` -> GitHub Actions
   - Busca \`.gitlab-ci.yml\` -> GitLab CI

2. **Obtener fallos recientes**:
   - GitHub Actions: \`gh run list --status=failure --limit=5 --json databaseId,displayTitle,conclusion,createdAt\`
   - Para cada run fallido: \`gh run view {id} --log-failed\`

3. **Procesar con MCP tool**:
   - Llama a \`ingest_ci_errors\` con el log de cada run
   - Acumula resultados

4. **Analizar patrones**:
   - Hay errores recurrentes? (mismo patron en multiples runs)
   - Son prevenibles? (build stale, lint, types)
   - Requieren nueva regla? (>= 3 ocurrencias)

5. **Reportar**:
   - Resumen de errores procesados
   - Patrones descubiertos con frecuencia
   - Reglas auto-generadas (si threshold alcanzado)
   - Recomendaciones para prevencion
`,
  },
];

const allMcpSkills = [...mcpSkills, ...intelligenceSkills, ...workflowSkills, ...ciSkills];

for (const skill of allMcpSkills) {
  const skillDir = path.join(PLUGIN_DIR, 'skills', skill.name);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(path.join(skillDir, 'SKILL.md'), skill.content);
}
console.log(`  MCP skills: ${allMcpSkills.length} directories`);

// --- Write intelligence agent ---
const intelligenceAgents = [
  {
    name: 'audit-reviewer',
    content: `---
name: audit-reviewer
description: Deep code audit agent focused on quality, security, and conformity analysis
model: sonnet
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - mcp__diverger-claude__detect_stack
  - mcp__diverger-claude__get_memory
  - mcp__diverger-claude__record_learning
skills:
  - architecture-style-guide
  - security-guide
---

# Audit Reviewer

You are a specialized audit agent for diverger-claude managed projects. Your role is to perform deep code analysis focusing on quality, security, and conformity.

## Workflow

1. **Understand context**: Use \`detect_stack\` to know the project's technologies and \`get_memory\` to learn about known anti-patterns and error history.
2. **Security analysis**: Search for common vulnerabilities (OWASP Top 10), hardcoded secrets, insecure dependencies, and unsafe patterns specific to the detected stack.
3. **Quality analysis**: Review code for complexity, duplication, naming issues, dead code, and deviation from project conventions.
4. **Conformity analysis**: Check adherence to the project's established patterns, linting rules, and architectural conventions.
5. **Report findings**: Categorize each finding by severity (critical/high/medium/low) with file, line, and remediation suggestion.
6. **Record learnings**: Use \`record_learning\` to save any newly discovered anti-patterns.

## Guidelines

- Always explain the **impact** of each finding, not just what's wrong
- Prioritize security findings over style issues
- Reference specific lines and files in findings
- Suggest concrete fixes, not vague recommendations
- Be thorough but avoid false positives — only flag real issues
- Use the project's own conventions as the standard, not generic best practices
`,
  },
  {
    name: 'evolution-advisor',
    content: `---
name: evolution-advisor
description: Proactive advisor that analyzes project changes and recommends configuration updates
model: sonnet
memory: project
tools:
  - mcp__diverger-claude__detect_stack
  - mcp__diverger-claude__get_memory
  - mcp__diverger-claude__sync_config
  - Read
  - Glob
  - Grep
---

# Evolution Advisor

You are an evolution advisor for diverger-claude managed projects. Your role is to proactively analyze project changes and recommend configuration updates.

## Workflow

1. **Detect current stack** using the \`detect_stack\` MCP tool
2. **Check memory** using \`get_memory\` for recent evolution events and patterns
3. **Analyze changes**: Compare detected technologies against the memory's evolution log
4. **Recommend actions**: For each significant change, explain:
   - What changed (new dependency, architecture shift, etc.)
   - Why it matters (new profile available, configuration outdated, etc.)
   - What to do (run sync, update config, etc.)

## Guidelines

- Always explain the **why** behind each recommendation
- Prioritize high-impact changes (new frameworks, CI/CD, Docker)
- Be concise but informative
- If no changes are detected, confirm the project is up to date
- Never auto-apply changes — always recommend and explain
`,
  },
];

for (const agent of intelligenceAgents) {
  writeFileSync(path.join(PLUGIN_DIR, 'agents', `${agent.name}.md`), agent.content);
}
console.log(`  intelligence agents: ${intelligenceAgents.length} files`);

// --- Write intelligence hook scripts ---
const intelligenceHookScripts = [
  {
    filename: 'pre-commit-validator.sh',
    content: `#!/bin/bash
# PreToolUse blocker: Validate commit prerequisites before allowing git commit
# Blocks commits when plugin build is stale or TypeScript has errors
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=j[\\"tool_input\\"][\\"command\\"];console.log(v||'')}catch{console.log('')}})")

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^\\s*git\\s+commit'; then
  exit 0
fi

ERRORS=""

# Check 1: Plugin version consistency (package.json must match plugin.json)
if [ -f "package.json" ] && [ -f "plugin/.claude-plugin/plugin.json" ]; then
  PKG_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version||'')}catch{console.log('')}")
  PLUGIN_VERSION=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('plugin/.claude-plugin/plugin.json','utf8')).version||'')}catch{console.log('')}")
  if [ -n "$PKG_VERSION" ] && [ -n "$PLUGIN_VERSION" ] && [ "$PKG_VERSION" != "$PLUGIN_VERSION" ]; then
    ERRORS="\${ERRORS}Plugin build stale: package.json=\${PKG_VERSION} but plugin.json=\${PLUGIN_VERSION}. Run npm run build:plugin first. "
  fi
fi

# Check 2: TypeScript compilation (only if tsconfig.json exists)
if [ -f "tsconfig.json" ] && command -v npx >/dev/null 2>&1; then
  TSC_OUTPUT=$(npx tsc --noEmit --pretty false 2>&1 || true)
  TSC_EXIT=$?
  if echo "$TSC_OUTPUT" | grep -qE 'error TS[0-9]+'; then
    TSC_COUNT=$(echo "$TSC_OUTPUT" | grep -cE 'error TS[0-9]+' || echo "0")
    ERRORS="\${ERRORS}TypeScript compilation: \${TSC_COUNT} error(s) detected. Fix type errors before committing. "
  fi
fi

# If errors found, deny the commit
if [ -n "$ERRORS" ]; then
  node -e "console.log(JSON.stringify({hookSpecificOutput:{hookEventName:'PreToolUse',permissionDecision:'deny',permissionDecisionReason:'Pre-commit validation failed: '+process.argv[1]}}))" -- "$ERRORS"
  exit 0
fi

# All checks passed
exit 0
`,
  },
  {
    filename: 'error-tracker.sh',
    content: `#!/bin/bash
# PostToolUse hook: Capture tool errors to session error log
# Reads from stdin (Claude Code hook protocol) and appends failures to .claude/session-errors.local.json
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Check if the tool execution failed — extract tool_name and error using Node.js
TOOL_NAME=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.tool_name||'')}catch{console.log('')}})" || true)
ERROR=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.error||'')}catch{console.log('')}})" || true)

if [ -z "$ERROR" ]; then
  exit 0
fi

# Append error to session log using Node.js
SESSION_LOG=".claude/session-errors.local.json"
node -e "
const fs = require('fs');
const log = '$SESSION_LOG';
const entry = { message: process.argv[1], tool: process.argv[2], timestamp: new Date().toISOString() };
let entries = [];
try { entries = JSON.parse(fs.readFileSync(log, 'utf8')); } catch {}
entries.push(entry);
fs.writeFileSync(log, JSON.stringify(entries, null, 2));
" -- "$ERROR" "$TOOL_NAME"
`,
  },
  {
    filename: 'session-learner.sh',
    content: `#!/bin/bash
# SessionEnd hook: Signal pending errors for next session processing
# Errors will be processed by onSessionStart() in the next session
# Uses Node.js instead of jq for cross-platform compatibility (Windows)

set -euo pipefail

SESSION_LOG=".claude/session-errors.local.json"

# Skip if no session errors logged
if [ ! -f "$SESSION_LOG" ]; then
  exit 0
fi

# Clean up empty logs using Node.js
ERROR_COUNT=$(node -e "try{const d=JSON.parse(require('fs').readFileSync('$SESSION_LOG','utf8'));console.log(d.length)}catch{console.log('0')}")
if [ "$ERROR_COUNT" = "0" ]; then
  rm -f "$SESSION_LOG"
fi

# Errors will be processed by onSessionStart() in next session
`,
  },
];

for (const script of intelligenceHookScripts) {
  writeFileSync(path.join(PLUGIN_DIR, 'hooks', 'scripts', script.filename), script.content);
}
console.log(`  intelligence hook scripts: ${intelligenceHookScripts.length} files`);

// --- Update hooks.json with intelligence hooks ---
const intelligenceHooks: HooksJson = JSON.parse(
  readFileSync(path.join(PLUGIN_DIR, 'hooks', 'hooks.json'), 'utf-8'),
);

// Add pre-commit-validator to PreToolUse.Bash
if (!intelligenceHooks['PreToolUse']) intelligenceHooks['PreToolUse'] = {};
const preToolUse = intelligenceHooks['PreToolUse'] as Record<string, HooksJsonEntry[]>;
if (!preToolUse['Bash']) preToolUse['Bash'] = [];
const hasPreCommitValidator = preToolUse['Bash'].some((h) => h.command.includes('pre-commit-validator'));
if (!hasPreCommitValidator) {
  preToolUse['Bash'].push({
    type: 'command',
    command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pre-commit-validator.sh',
    timeout: 30,
    statusMessage: 'Validating commit prerequisites...',
  });
}

// Add error-tracker to PostToolUse.Bash, PostToolUse.Write, and PostToolUse.Edit
if (!intelligenceHooks['PostToolUse']) intelligenceHooks['PostToolUse'] = {};
const postToolUse = intelligenceHooks['PostToolUse'] as Record<string, HooksJsonEntry[]>;

// Bash
if (!postToolUse['Bash']) postToolUse['Bash'] = [];
const hasErrorTrackerBash = postToolUse['Bash'].some((h) => h.command.includes('error-tracker'));
if (!hasErrorTrackerBash) {
  postToolUse['Bash'].push({
    type: 'command',
    command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/error-tracker.sh',
    timeout: 5,
    statusMessage: 'Tracking errors for learning...',
  });
}

// Write
if (!postToolUse['Write']) postToolUse['Write'] = [];
const hasErrorTrackerWrite = postToolUse['Write'].some((h) => h.command.includes('error-tracker'));
if (!hasErrorTrackerWrite) {
  postToolUse['Write'].push({
    type: 'command',
    command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/error-tracker.sh',
    timeout: 5,
    statusMessage: 'Tracking errors...',
  });
}

// Edit
if (!postToolUse['Edit']) postToolUse['Edit'] = [];
const hasErrorTrackerEdit = postToolUse['Edit'].some((h) => h.command.includes('error-tracker'));
if (!hasErrorTrackerEdit) {
  postToolUse['Edit'].push({
    type: 'command',
    command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/error-tracker.sh',
    timeout: 5,
    statusMessage: 'Tracking errors...',
  });
}

// Add session-learner to SessionEnd
if (!intelligenceHooks['SessionEnd']) intelligenceHooks['SessionEnd'] = [];
const sessionEnd = intelligenceHooks['SessionEnd'] as HooksJsonEntry[];
const hasSessionLearner = sessionEnd.some((h) => h.command.includes('session-learner'));
if (!hasSessionLearner) {
  sessionEnd.push({
    type: 'command',
    command: 'bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-learner.sh',
    timeout: 10,
    statusMessage: 'Processing session learnings...',
  });
}

writeFileSync(
  path.join(PLUGIN_DIR, 'hooks', 'hooks.json'),
  JSON.stringify(intelligenceHooks, null, 2) + '\n',
);
console.log(`  hooks.json: updated with intelligence hooks`);

console.log(`\nPlugin built at: ${PLUGIN_DIR}`);
