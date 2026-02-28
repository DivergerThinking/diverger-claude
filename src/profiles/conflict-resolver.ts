import type { Profile } from '../core/types.js';

export interface ConflictInfo {
  type: 'permission' | 'rule-path' | 'agent-model';
  profileA: string;
  profileB: string;
  description: string;
  resolution: string;
}

/** Detect and report potential conflicts between profiles */
export function detectConflicts(profiles: Profile[]): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i]!;
      const b = profiles[j]!;

      // Check rule path overlaps
      const aRules = a.contributions.rules ?? [];
      const bRules = b.contributions.rules ?? [];
      for (const ar of aRules) {
        for (const br of bRules) {
          if (ar.path === br.path) {
            conflicts.push({
              type: 'rule-path',
              profileA: a.id,
              profileB: b.id,
              description: `Both define rule at path "${ar.path}"`,
              resolution: 'Higher layer profile takes precedence',
            });
          }
        }
      }

      // Check agent model conflicts
      const aAgents = a.contributions.agents ?? [];
      const bAgents = b.contributions.agents ?? [];
      for (const aa of aAgents) {
        for (const ba of bAgents) {
          if (aa.name === ba.name && aa.model && ba.model && aa.model !== ba.model) {
            conflicts.push({
              type: 'agent-model',
              profileA: a.id,
              profileB: b.id,
              description: `Both set model for agent "${aa.name}": ${aa.model} vs ${ba.model}`,
              resolution: 'Higher layer profile wins',
            });
          }
        }
      }
    }
  }

  return conflicts;
}
