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
              resolution: 'Later profile in composition order takes precedence; validator will reject duplicates',
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

      // Check permission conflicts (same pattern in both allow and deny across profiles)
      const aAllow = new Set(a.contributions.settings?.permissions?.allow ?? []);
      const aDeny = new Set(a.contributions.settings?.permissions?.deny ?? []);
      const bAllow = new Set(b.contributions.settings?.permissions?.allow ?? []);
      const bDeny = new Set(b.contributions.settings?.permissions?.deny ?? []);

      for (const pattern of aAllow) {
        if (bDeny.has(pattern)) {
          conflicts.push({
            type: 'permission',
            profileA: a.id,
            profileB: b.id,
            description: `"${pattern}" is in allow (${a.id}) and deny (${b.id})`,
            resolution: 'Deny takes precedence',
          });
        }
      }
      for (const pattern of bAllow) {
        if (aDeny.has(pattern)) {
          conflicts.push({
            type: 'permission',
            profileA: a.id,
            profileB: b.id,
            description: `"${pattern}" is in allow (${b.id}) and deny (${a.id})`,
            resolution: 'Deny takes precedence',
          });
        }
      }
    }
  }

  return conflicts;
}
