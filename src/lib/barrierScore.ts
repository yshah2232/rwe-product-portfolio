// Barriers & Access (Module 3) — deterministic composite barrier scoring.
//
// Every input is an observed rate from US Census ACS 5-year (2022):
//   - lepPct: members of limited-English-speaking households, pop 5+ (ACS Table C16002)
//   - povertyPct: income below poverty level (ACS Table B17001)
// A component's "ratio" is the county rate relative to the US national rate,
// capped at 100 (so "2x the national rate" and "5x the national rate" both
// saturate rather than letting one county dwarf the composite).
//
// Levels (relative to national rate):
//   high      ratio >= 150  (county rate >= 1.5x national)
//   moderate  ratio >= 100  (county rate >= national)
//   low       ratio <  100
//   unknown   component unavailable
//
// barrierScore = rounded mean of available component ratios; null when neither
// component is available. Never invented — unknown inputs propagate as null.

export interface BarrierComponentInput {
  pct: number | null;
  nationalPct: number | null;
}

export interface BarrierComponent {
  pct: number | null;
  nationalPct: number | null;
  ratio: number | null; // 0-100, county rate vs national rate, capped
  level: 'low' | 'moderate' | 'high' | 'unknown';
}

export interface BarrierResult {
  languageAccess: BarrierComponent;
  socioeconomicStrain: BarrierComponent;
  barrierScore: number | null;
}

function capRatio(pct: number | null, nationalPct: number | null): number | null {
  if (pct == null || nationalPct == null || nationalPct <= 0 || pct < 0) return null;
  return Math.min(100, (pct / nationalPct) * 100);
}

function toComponent(pct: number | null, nationalPct: number | null): BarrierComponent {
  const ratio = capRatio(pct, nationalPct);
  let level: BarrierComponent['level'] = 'unknown';
  if (ratio != null) {
    if (ratio >= 150) level = 'high';
    else if (ratio >= 100) level = 'moderate';
    else level = 'low';
  }
  return { pct, nationalPct, ratio, level };
}

export function computeBarrierScore(
  lep: BarrierComponentInput,
  poverty: BarrierComponentInput,
): BarrierResult {
  const languageAccess = toComponent(lep.pct, lep.nationalPct);
  const socioeconomicStrain = toComponent(poverty.pct, poverty.nationalPct);
  const ratios = [languageAccess.ratio, socioeconomicStrain.ratio].filter(
    (r): r is number => r != null,
  );
  const barrierScore =
    ratios.length > 0
      ? Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length)
      : null;
  return { languageAccess, socioeconomicStrain, barrierScore };
}

export function barrierLevelLabel(level: BarrierComponent['level']): string {
  switch (level) {
    case 'high': return 'High';
    case 'moderate': return 'Moderate';
    case 'low': return 'Low';
    default: return 'Unknown';
  }
}
