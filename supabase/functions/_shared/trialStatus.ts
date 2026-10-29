export const TRIAL_STATUSES = [
  ['NOT_YET_RECRUITING', 'Not yet recruiting'],
  ['RECRUITING', 'Recruiting'],
  ['ENROLLING_BY_INVITATION', 'Enrolling by invitation'],
  ['ACTIVE_NOT_RECRUITING', 'Active, not recruiting'],
  ['SUSPENDED', 'Suspended'],
  ['TERMINATED', 'Terminated'],
  ['COMPLETED', 'Completed'],
  ['WITHDRAWN', 'Withdrawn'],
  ['UNKNOWN', 'Unknown'],
] as const;

export const isTrialStatus = (value: string) => TRIAL_STATUSES.some(([id]) => id === value);
export const restrictToRecruiting = (audience: string) => audience === 'patient';
export const audienceStatus = (audience: string, selected: string) => restrictToRecruiting(audience) ? 'RECRUITING' : selected;

export function queryStatus(text: string): { status: string | null; remainder: string } {
  const patterns: [RegExp, string][] = [
    [/\bnot[ _-]+yet[ _-]+recruiting\b/i, 'NOT_YET_RECRUITING'],
    [/\bactive[ ,_-]+not[ _-]+recruiting\b/i, 'ACTIVE_NOT_RECRUITING'],
    [/\benrolling[ _-]+by[ _-]+invitation\b/i, 'ENROLLING_BY_INVITATION'],
    [/\bsuspended\b/i, 'SUSPENDED'], [/\bterminated\b/i, 'TERMINATED'],
    [/\bcompleted\b/i, 'COMPLETED'], [/\bwithdrawn\b/i, 'WITHDRAWN'],
    [/\bunknown(?:[ _-]+status)?\b/i, 'UNKNOWN'],
    [/\b(?:currently )?recruiting\b|\benrolling\b|\bopen trials?\b/i, 'RECRUITING'],
  ];
  for (const [pattern, status] of patterns) if (pattern.test(text)) return { status, remainder: text.replace(pattern, ' ') };
  return { status: null, remainder: text };
}