// Barriers & Access (Module 3) — deterministic composite barrier scoring.
//
// Every input is an observed rate from US Census ACS 5-year (2022):
//   - lepPct: members of limited-English-speaking households, pop 5+ (ACS Table C16002)
//   - povertyPct: income below poverty level (ACS Table B17001)
//
// A component's ratio is the county rate relative to the US national rate:
//   ratio = county_pct / national_pct * 100 (uncapped, drives the level)
//
// Levels (relative to national rate):
//   high      ratio >= 150  (county rate >= 1.5x national)
//   moderate  ratio >= 100  (county rate >= national)
//   low       ratio <  100
//   unknown   component unavailable
//
// barrierScore = rounded mean of each component's contribution, where a
// contribution is the ratio capped at 100 (so a county at 5x national cannot
// dwarf the composite). Null when neither component is available. Unknown
// inputs propagate as null — nothing is ever fabricated.

export interface BarrierComponentInput {
  pct: number | null;
  nationalPct: number | null;
}

export interface BarrierComponent {
  pct: number | null;
  nationalPct: number | null;
  ratio: number | null; // uncapped county-vs-national percentage
  level: 'low' | 'moderate' | 'high' | 'unknown';
}

export interface BarrierResult {
  languageAccess: BarrierComponent;
  socioeconomicStrain: BarrierComponent;
  barrierScore: number | null;
}

function rawRatio(pct: number | null, nationalPct: number | null): number | null {
  if (pct == null || nationalPct == null || nationalPct <= 0 || pct < 0) return null;
  return (pct / nationalPct) * 100;
}

function toComponent(pct: number | null, nationalPct: number | null): BarrierComponent {
  const ratio = rawRatio(pct, nationalPct);
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
  const contributions = [
    languageAccess.ratio != null ? Math.min(100, languageAccess.ratio) : null,
    socioeconomicStrain.ratio != null ? Math.min(100, socioeconomicStrain.ratio) : null,
  ].filter((r): r is number => r != null);
  const barrierScore =
    contributions.length > 0
      ? Math.round(contributions.reduce((a, b) => a + b, 0) / contributions.length)
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
