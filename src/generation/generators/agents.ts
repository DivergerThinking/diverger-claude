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

const DEFAULT_TOOLS = ['Read', 'Grep', 'Glob', 'Bash'];

function formatAgentFile(agent: AgentDefinition): string {
  const parts: string[] = [];

  // YAML frontmatter
  parts.push('---');
  parts.push(`name: ${agent.name}`);
  parts.push(`description: ${agent.description || agent.name}`);
  if (agent.model) {
    parts.push(`model: ${agent.model}`);
  }
  parts.push('tools:');
  for (const tool of DEFAULT_TOOLS) {
    parts.push(`  - ${tool}`);
  }
  parts.push('---');
  parts.push('');
  parts.push(agent.prompt);
  parts.push('');

  return parts.join('\n');
}
