import type { GovernanceLevel } from '../core/types.js';

/** Check if a governance level can be overridden */
export function canOverride(level: GovernanceLevel): boolean {
  return level === 'recommended';
}

/** Get the display label for a governance level */
export function governanceLabel(level: GovernanceLevel): string {
  switch (level) {
    case 'mandatory':
      return '🔒 Obligatoria (no modificable)';
    case 'recommended':
      return '💡 Recomendada (personalizable)';
    default: {
      const _exhaustive: never = level;
      return String(_exhaustive);
    }
  }
}

/** Determine which governance level wins in a conflict */
export function resolveGovernanceConflict(
  a: GovernanceLevel,
  b: GovernanceLevel,
): GovernanceLevel {
  // Mandatory always wins
  if (a === 'mandatory' || b === 'mandatory') return 'mandatory';
  return 'recommended';
}
