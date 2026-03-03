import type { AgentDefinition, ComposedConfig, GeneratedFile } from '../../core/types.js';
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

/** Generate all .claude/agents/*.md files from composed config */
export function generateAgents(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile[] {
  const agentsBase = path.join(projectRoot, CLAUDE_DIR, AGENTS_DIR);
  return config.agents.map((agent) => {
    validateAgentName(agent.name);
    const fullPath = path.join(agentsBase, `${agent.name}.md`);
    assertPathWithin(fullPath, agentsBase);
    return {
      path: fullPath,
      content: formatAgentFile(agent),
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
