import chalk from 'chalk';
import type { DetectionResult, ComposedConfig, KnowledgeResult } from '../../core/types.js';
import type { WriteResult } from '../../generation/file-writer.js';
import { confidenceColor } from './logger.js';

const teal = chalk.hex('#2dd4bf');

/** Box-drawing characters */
const BOX = {
  tl: '┌', tr: '┐', bl: '└', br: '┘',
  h: '─', v: '│', sep: '├', sepR: '┤',
} as const;

/** Build a detailed summary box after init completes */
export function buildSummary(
  detection: DetectionResult,
  composed: ComposedConfig,
  writeResults: WriteResult[],
  knowledgeResults?: KnowledgeResult[],
): string {
  const W = 50;
  const lines: string[] = [];

  const border = (left: string, right: string, fill = BOX.h) =>
    teal(left + fill.repeat(W) + right);

  const row = (content: string) => {
    // content is already formatted — we just frame it
    return `${teal(BOX.v)}  ${content}`;
  };

  const emptyRow = () => row('');

  // Top border + title
  lines.push(border(BOX.tl, BOX.tr));
  lines.push(row(chalk.bold.green('Configuración generada exitosamente')));
  lines.push(border(BOX.sep, BOX.sepR));

  // Stack detectado
  lines.push(row(chalk.bold('Stack detectado:')));
  const techStr = detection.technologies
    .map((t) => `${t.name} ${chalk.dim('(')}${confidenceColor(t.confidence)}${chalk.dim(')')}`)
    .join(chalk.dim(' · '));
  lines.push(row(`  ${techStr}`));
  lines.push(emptyRow());

  // Profiles aplicados
  lines.push(row(chalk.bold(`Profiles aplicados: ${composed.appliedProfiles.length}`)));
  for (const profileId of composed.appliedProfiles) {
    const parts = profileId.split('/');
    const name = parts[parts.length - 1];
    const category = parts.length > 1 ? parts[0] : 'base';
    lines.push(row(`  ${teal(name)} ${chalk.dim(`(${category})`)}`));
  }
  lines.push(emptyRow());

  // Archivos generados
  const created = writeResults.filter((r) => r.action === 'created').length;
  const updated = writeResults.filter((r) => r.action === 'updated').length;
  const total = created + updated;
  lines.push(row(chalk.bold(`Archivos generados: ${total}`)));
  lines.push(row(`  ${chalk.green(String(created))} creados, ${chalk.yellow(String(updated))} actualizados`));

  // Categorize files
  const ruleCount = writeResults.filter((r) => r.path.includes('/rules/')).length;
  const agentCount = writeResults.filter((r) => r.path.includes('/agents/')).length;
  const skillCount = writeResults.filter((r) => r.path.includes('/skills/')).length;
  const parts: string[] = [];
  if (ruleCount > 0) parts.push(`${ruleCount} reglas`);
  if (agentCount > 0) parts.push(`${agentCount} agentes`);
  if (skillCount > 0) parts.push(`${skillCount} skills`);
  if (parts.length > 0) {
    lines.push(row(`  ${chalk.dim(parts.join(', '))}`));
  }
  lines.push(emptyRow());

  // Reglas activas
  if (composed.rules.length > 0) {
    lines.push(row(chalk.bold(`Reglas activas: ${composed.rules.length}`)));
    const ruleNames = composed.rules
      .map((r) => r.path.replace(/\.md$/, '').split('/').pop())
      .slice(0, 6);
    const ruleStr = ruleNames.join(chalk.dim(', '));
    const suffix = composed.rules.length > 6 ? chalk.dim(`, +${composed.rules.length - 6} más`) : '';
    lines.push(row(`  ${ruleStr}${suffix}`));
    lines.push(emptyRow());
  }

  // Agentes configurados
  if (composed.agents.length > 0) {
    lines.push(row(chalk.bold(`Agentes configurados: ${composed.agents.length}`)));
    const agentNames = composed.agents.map((a) => a.name).join(chalk.dim(', '));
    lines.push(row(`  ${agentNames}`));
    lines.push(emptyRow());
  }

  // Knowledge
  if (knowledgeResults && knowledgeResults.length > 0) {
    lines.push(row(chalk.bold(`Knowledge: ${knowledgeResults.length} tecnologías consultadas`)));
    const knNames = knowledgeResults.map((kr) => {
      const label = kr.fromCache ? chalk.dim('(caché)') : chalk.dim('(web)');
      return `${kr.technology} ${label}`;
    }).join(chalk.dim(', '));
    lines.push(row(`  ${knNames}`));
    lines.push(emptyRow());
  }

  // Siguiente paso
  lines.push(row(chalk.bold('Siguiente paso:')));
  lines.push(row(`  ${teal('diverger check')}  ${chalk.dim('— validar configuración')}`));
  lines.push(row(`  ${teal('diverger sync')}   ${chalk.dim('— sincronizar cambios')}`));

  // Bottom border
  lines.push(border(BOX.bl, BOX.br));

  return lines.join('\n');
}
