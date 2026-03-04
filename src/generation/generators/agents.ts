import type { AgentDefinition, ComposedConfig, GeneratedFile, ProjectMetadata } from '../../core/types.js';
import { CLAUDE_DIR, AGENTS_DIR } from '../../core/constants.js';
import { assertPathWithin } from '../../utils/fs.js';
import { yamlEscape } from './yaml-utils.js';
import path from 'path';

/** Validate an agent name is safe for use as a filename */
function validateAgentName(name: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Nombre de agente inválido "${name}": solo se permiten alfanuméricos, guiones y guiones bajos`);
  }
}

/** Inject project context into agent prompt if metadata is available */
export function injectProjectContext(agent: AgentDefinition, metadata: ProjectMetadata): AgentDefinition {
  if (!metadata.name && !metadata.description) return agent;

  const ctx: string[] = ['## Project Context'];
  ctx.push(`You are working on **${metadata.name ?? 'this project'}**${metadata.description ? ` — ${metadata.description}` : ''}.`);

  if (metadata.keyDirectories.length > 0) {
    ctx.push(`Key directories: ${metadata.keyDirectories.map(d => '`' + d + '/`').join(', ')}`);
  }
  if (metadata.architecture) {
    ctx.push(`Architecture: ${metadata.architecture}`);
  }
  ctx.push('');

  return { ...agent, prompt: ctx.join('\n') + '\n' + agent.prompt };
}

/** Generate all .claude/agents/*.md files from composed config */
export function generateAgents(
  config: ComposedConfig,
  projectRoot: string,
  metadata?: ProjectMetadata,
): GeneratedFile[] {
  const agentsBase = path.join(projectRoot, CLAUDE_DIR, AGENTS_DIR);
  return config.agents.map((agent) => {
    validateAgentName(agent.name);
    const fullPath = path.join(agentsBase, `${agent.name}.md`);
    assertPathWithin(fullPath, agentsBase);

    // Inject project context into agent prompt
    const enrichedAgent = metadata ? injectProjectContext(agent, metadata) : agent;

    return {
      path: fullPath,
      content: formatAgentFile(enrichedAgent),
    };
  });
}

export const DEFAULT_TOOLS = ['Read', 'Grep', 'Glob', 'Bash'];

export function formatAgentFile(agent: AgentDefinition): string {
  const parts: string[] = [];
  const tools = agent.tools ?? DEFAULT_TOOLS;

  // YAML frontmatter with proper escaping
  parts.push('---');
  parts.push(`name: ${yamlEscape(agent.name)}`);
  parts.push(`description: ${yamlEscape(agent.description || agent.name)}`);
  if (agent.model) {
    parts.push(`model: ${yamlEscape(agent.model)}`);
  }
  if (agent.memory) {
    parts.push(`memory: ${agent.memory}`);
  }
  parts.push('tools:');
  for (const tool of tools) {
    parts.push(`  - ${tool}`);
  }
  if (agent.skills.length > 0) {
    parts.push('skills:');
    for (const skill of agent.skills) {
      parts.push(`  - ${skill}`);
    }
  }
  parts.push('---');
  parts.push('');
  parts.push(agent.prompt);
  parts.push('');

  return parts.join('\n');
}
