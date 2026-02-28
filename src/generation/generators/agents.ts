import type { AgentDefinition, ComposedConfig, GeneratedFile } from '../../core/types.js';
import { CLAUDE_DIR, AGENTS_DIR } from '../../core/constants.js';
import path from 'path';

/** Generate all .claude/agents/*.md files from composed config */
export function generateAgents(
  config: ComposedConfig,
  projectRoot: string,
): GeneratedFile[] {
  return config.agents.map((agent) => ({
    path: path.join(projectRoot, CLAUDE_DIR, AGENTS_DIR, `${agent.name}.md`),
    content: formatAgentFile(agent),
  }));
}

function formatAgentFile(agent: AgentDefinition): string {
  const parts: string[] = [];

  parts.push(`# ${agent.description || agent.name}`);
  parts.push('');

  if (agent.model) {
    parts.push(`Model: ${agent.model}`);
    parts.push('');
  }

  if (agent.skills.length > 0) {
    parts.push('## Skills');
    for (const skill of agent.skills) {
      parts.push(`- ${skill}`);
    }
    parts.push('');
  }

  parts.push('## Instructions');
  parts.push('');
  parts.push(agent.prompt);
  parts.push('');

  return parts.join('\n');
}
