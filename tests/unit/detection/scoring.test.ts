import { describe, it, expect } from 'vitest';
import { ConfidenceScorer } from '../../../src/detection/scoring.js';
import type { DetectedTechnology, DetectionEvidence } from '../../../src/core/types.js';

function makeEvidence(weight: number, source = 'test'): DetectionEvidence {
  return {
    source,
    type: 'manifest',
    description: `Test evidence (weight ${weight})`,
    weight,
  };
}

function makeTech(
  id: string,
  name: string,
  confidence: number,
  evidence: DetectionEvidence[] = [],
): DetectedTechnology {
  return {
    id,
    name,
    category: 'framework',
    confidence,
    evidence,
    profileIds: [],
  };
}

describe('ConfidenceScorer', () => {
  const scorer = new ConfidenceScorer();

  // ── calculateConfidence ──────────────────────────────────────────────

  describe('calculateConfidence', () => {
    it('should return 0 for empty evidence', () => {
      expect(scorer.calculateConfidence([])).toBe(0);
    });

    it('should return the single weight for one piece of evidence', () => {
      const evidence = [makeEvidence(85)];
      expect(scorer.calculateConfidence(evidence)).toBe(85);
    });

    it('should boost beyond max weight for multiple evidence', () => {
      const evidence = [makeEvidence(85), makeEvidence(50)];
      const result = scorer.calculateConfidence(evidence);
      // max=85, additional=50 with boost 50*0.3/1 = 15 → 85+15=100
      expect(result).toBe(100);
    });

    it('should apply diminishing returns for each additional evidence', () => {
      const evidence = [makeEvidence(70), makeEvidence(30), makeEvidence(20)];
      const result = scorer.calculateConfidence(evidence);
      // max=70, additional sorted = [30, 20]
      // boost = 30*0.3/1 + 20*0.3/2 = 9 + 3 = 12
      // total = 70+12 = 82
      expect(result).toBe(82);
    });

    it('should cap result at 100', () => {
      const evidence = [makeEvidence(95), makeEvidence(90), makeEvidence(80)];
      const result = scorer.calculateConfidence(evidence);
      expect(result).toBeLessThanOrEqual(100);
      expect(result).toBe(100);
    });

    it('should handle all evidence with the same weight', () => {
      // When all weights are equal, only the first max is excluded; the rest are additional
      const evidence = [makeEvidence(50), makeEvidence(50), makeEvidence(50)];
      const result = scorer.calculateConfidence(evidence);
      // max=50, additional = [50, 50] (only first max excluded)
      // boost = 50*0.3/1 + 50*0.3/2 = 15 + 7.5 = 22.5
      // total = 50 + 22.5 = 72.5 → round → 73
      expect(result).toBe(73);
    });

    it('should round the result', () => {
      // Construct evidence that produces a non-integer
      const evidence = [makeEvidence(60), makeEvidence(10)];
      // max=60, additional=[10], boost = 10*0.3/1 = 3 → 63 (already integer)
      const result = scorer.calculateConfidence(evidence);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(63);
    });

    it('should handle many low-weight evidence pieces', () => {
      const evidence = [
        makeEvidence(40),
        makeEvidence(10),
        makeEvidence(10),
        makeEvidence(5),
        makeEvidence(5),
      ];
      const result = scorer.calculateConfidence(evidence);
      // max=40, additional sorted=[10, 5, 5] (two 10s → one is max-equal? no, 10 != 40)
      // additional = [10, 10, 5, 5]
      // boost = 10*0.3/1 + 10*0.3/2 + 5*0.3/3 + 5*0.3/4
      //       = 3 + 1.5 + 0.5 + 0.375 = 5.375
      // total = 40 + 5.375 = 45.375 → round → 45
      expect(result).toBe(45);
    });
  });

  // ── applyBoosting ────────────────────────────────────────────────────

  describe('applyBoosting', () => {
    it('should boost react when typescript is present with sufficient confidence', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('react', 'React', 85, [makeEvidence(85)]),
        makeTech('typescript', 'TypeScript', 80, [makeEvidence(80)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const react = result.find((t) => t.id === 'react');
      // react has a boost rule: ifPresent=typescript, minConfidence=70, boost=3
      expect(react!.confidence).toBe(88); // 85 + 3
      expect(react!.evidence.some((e) => e.description.includes('TypeScript'))).toBe(true);
    });

    it('should not boost react when typescript confidence is below threshold', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('react', 'React', 85, [makeEvidence(85)]),
        makeTech('typescript', 'TypeScript', 60, [makeEvidence(60)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const react = result.find((t) => t.id === 'react');
      // typescript confidence (60) < minConfidence (70) → no boost
      expect(react!.confidence).toBe(85);
    });

    it('should boost jest when typescript is present', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('jest', 'Jest', 90, [makeEvidence(90)]),
        makeTech('typescript', 'TypeScript', 85, [makeEvidence(85)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const jest = result.find((t) => t.id === 'jest');
      // jest has boost: ifPresent=typescript, minConfidence=70, boost=3
      expect(jest!.confidence).toBe(93);
    });

    it('should boost vitest when vite is present', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('vitest', 'Vitest', 90, [makeEvidence(90)]),
        makeTech('vite', 'Vite', 80, [makeEvidence(80)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const vitest = result.find((t) => t.id === 'vitest');
      // vitest has boost: ifPresent=vite, minConfidence=70, boost=5
      expect(vitest!.confidence).toBe(95);
    });

    it('should boost nextjs when react is present', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('nextjs', 'Next.js', 90, [makeEvidence(90)]),
        makeTech('react', 'React', 85, [makeEvidence(85)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const nextjs = result.find((t) => t.id === 'nextjs');
      // nextjs has boost: ifPresent=react, minConfidence=70, boost=5
      expect(nextjs!.confidence).toBe(95);
    });

    it('should cap boosted confidence at 100', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('nextjs', 'Next.js', 98, [makeEvidence(98)]),
        makeTech('react', 'React', 95, [makeEvidence(95)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const nextjs = result.find((t) => t.id === 'nextjs');
      // 98 + 5 = 103 → capped at 100
      expect(nextjs!.confidence).toBe(100);
    });

    it('should not boost when the booster technology is absent', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('vitest', 'Vitest', 90, [makeEvidence(90)]),
        // vite is NOT present
      ];

      const result = scorer.applyBoosting(technologies);
      const vitest = result.find((t) => t.id === 'vitest');
      expect(vitest!.confidence).toBe(90);
    });

    it('should not modify technologies without boosting rules', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('express', 'Express', 90, [makeEvidence(90)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const express = result.find((t) => t.id === 'express');
      expect(express!.confidence).toBe(90);
      expect(express!.evidence).toHaveLength(1);
    });

    it('should apply multiple boosts to the same technology', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('nextjs', 'Next.js', 85, [makeEvidence(85)]),
        makeTech('react', 'React', 90, [makeEvidence(90)]),
        makeTech('nextconfig', 'Next Config', 80, [makeEvidence(80)]),
      ];

      const result = scorer.applyBoosting(technologies);
      const nextjs = result.find((t) => t.id === 'nextjs');
      // nextjs boosts: ifPresent=react (+5) and ifPresent=nextconfig (+9)
      expect(nextjs!.confidence).toBe(99); // 85 + 5 + 9
      expect(nextjs!.evidence.length).toBe(3); // original + 2 cross-reference
    });

    it('should add cross-reference evidence for each boost applied', () => {
      const technologies: DetectedTechnology[] = [
        makeTech('react', 'React', 85, [makeEvidence(85)]),
        makeTech('typescript', 'TypeScript', 80, [makeEvidence(80)]),
      ];

      scorer.applyBoosting(technologies);
      const react = technologies.find((t) => t.id === 'react');
      const crossRef = react!.evidence.find((e) => e.source === 'cross-reference');
      expect(crossRef).toBeDefined();
      expect(crossRef!.type).toBe('content');
      expect(crossRef!.weight).toBe(3);
    });
  });
});
