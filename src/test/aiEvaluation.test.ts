import { describe, expect, it } from 'vitest';
import { evaluateRun } from '@/lib/aiEvaluation';
describe('source grounded evaluation categories', () => {
  it('approves a fully supported 100 point run', () => expect(evaluateRun({ grounding: 50, constraints: 25, safety: 20, clarity: 5 })).toEqual({ score: 100, bucket: 'Approved run' }));
  it('accepts minor defects at 75 points', () => expect(evaluateRun({ grounding: 40, constraints: 20, safety: 10, clarity: 5 }).bucket).toBe('Okay to be accepted run'));
  it('marks unsupported material claims risky even with high similarity', () => expect(evaluateRun({ grounding: 50, constraints: 25, safety: 20, clarity: 5, unsupportedMaterialClaim: true }).bucket).toBe('Risky run'));
  it('marks contradictions false regardless of aggregate score', () => expect(evaluateRun({ grounding: 50, constraints: 25, safety: 20, clarity: 5, contradiction: true }).bucket).toBe('False run'));
});