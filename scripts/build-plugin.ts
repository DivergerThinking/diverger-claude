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

## Steps

1. Call the \`detect_stack\` MCP tool with the current project root directory.
2. Present the detected technologies to the user in a clear table format.
3. Ask the user to confirm proceeding with generation.
4. If confirmed, call the \`generate_config\` MCP tool with \`pluginMode: true\`.
5. Show a summary of the generated files and applied profiles.
6. If any issues arise, suggest running \`/diverger-status\` to validate.
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

## Steps

1. Call the \`detect_stack\` MCP tool with the current project root directory.
2. Call the \`check_config\` MCP tool with the same directory.
3. Present a combined status report:
   - Detected technologies (name, version, confidence)
   - Configuration validation result (valid/invalid)
   - Any issues found (severity, file, message)
4. If issues are found, suggest running \`/diverger-sync\` to fix them.
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

## Steps

1. Call the \`sync_config\` MCP tool with the current project root directory.
2. Report the results:
   - Files updated automatically
   - Conflicts that were auto-resolved
   - Files skipped (no changes)
3. Optionally call \`check_config\` to verify the configuration is healthy after sync.
4. Show summary counts (updated, conflicts, skipped).
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

for (const skill of mcpSkills) {
  const skillDir = path.join(PLUGIN_DIR, 'skills', skill.name);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(path.join(skillDir, 'SKILL.md'), skill.content);
}
console.log(`  MCP skills: ${mcpSkills.length} directories`);

console.log(`\nPlugin built at: ${PLUGIN_DIR}`);
