export type EvaluationBucket = 'Approved run' | 'Okay to be accepted run' | 'Risky run' | 'False run';
export type EvaluationEvidence = { grounding: number; constraints: number; safety: number; clarity: number; contradiction?: boolean; unsupportedMaterialClaim?: boolean };

/** Source review, not cosine similarity, decides factual correctness. */
export function evaluateRun(evidence: EvaluationEvidence): { score: number; bucket: EvaluationBucket } {
  const caps = { grounding: 50, constraints: 25, safety: 20, clarity: 5 };
  let score = 0;
  for (const key of Object.keys(caps) as (keyof typeof caps)[]) {
    const value = evidence[key];
    if (!Number.isFinite(value) || value < 0 || value > caps[key]) throw new Error(`Invalid ${key} score`);
    score += value;
  }
  const bucket = evidence.contradiction ? 'False run' : evidence.unsupportedMaterialClaim || score < 75 ? 'Risky run' : score >= 90 ? 'Approved run' : 'Okay to be accepted run';
  return { score, bucket };
}