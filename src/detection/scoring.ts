import type { DetectedTechnology, DetectionEvidence } from '../core/types.js';

/**
 * Confidence scoring engine.
 * Combines evidence weights with boosting rules.
 */
export class ConfidenceScorer {
  /** Calculate final confidence from evidence array */
  calculateConfidence(evidence: DetectionEvidence[]): number {
    if (evidence.length === 0) return 0;

    // Base: maximum single evidence weight
    const maxWeight = Math.max(...evidence.map((e) => e.weight));

    // Boost: each additional evidence adds diminishing returns
    const additionalEvidence = evidence
      .filter((e) => e.weight !== maxWeight)
      .sort((a, b) => b.weight - a.weight);

    let boost = 0;
    for (let i = 0; i < additionalEvidence.length; i++) {
      const e = additionalEvidence[i]!;
      // Each additional piece of evidence adds less (diminishing returns)
      boost += e.weight * (0.3 / (i + 1));
    }

    return Math.min(100, Math.round(maxWeight + boost));
  }

  /** Apply cross-technology boosting rules */
  applyBoosting(technologies: DetectedTechnology[]): DetectedTechnology[] {
    const techMap = new Map(technologies.map((t) => [t.id, t]));

    for (const tech of technologies) {
      const boosts = BOOSTING_RULES[tech.id];
      if (!boosts) continue;

      for (const rule of boosts) {
        const booster = techMap.get(rule.ifPresent);
        if (booster && booster.confidence >= rule.minConfidence) {
          tech.confidence = Math.min(100, tech.confidence + rule.boost);
          tech.evidence.push({
            source: 'cross-reference',
            type: 'content',
            description: `Boosted by presence of ${booster.name}`,
            weight: rule.boost,
          });
        }
      }
    }

    return technologies;
  }
}

interface BoostingRule {
  ifPresent: string;
  minConfidence: number;
  boost: number;
}

/** Cross-technology boosting rules */
const BOOSTING_RULES: Record<string, BoostingRule[]> = {
  typescript: [
    { ifPresent: 'tsconfig', minConfidence: 50, boost: 9 },
  ],
  nextjs: [
    { ifPresent: 'react', minConfidence: 70, boost: 5 },
    { ifPresent: 'nextconfig', minConfidence: 50, boost: 9 },
  ],
  react: [
    { ifPresent: 'typescript', minConfidence: 70, boost: 3 },
  ],
  jest: [
    { ifPresent: 'typescript', minConfidence: 70, boost: 3 },
  ],
  vitest: [
    { ifPresent: 'vite', minConfidence: 70, boost: 5 },
  ],
  fastapi: [
    { ifPresent: 'python', minConfidence: 70, boost: 5 },
  ],
  'spring-boot': [
    { ifPresent: 'java', minConfidence: 70, boost: 5 },
  ],
};
