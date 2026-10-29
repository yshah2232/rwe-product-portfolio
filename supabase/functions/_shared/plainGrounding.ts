/** Reject newly invented quantities; this does not certify prose or clinical meaning. */
export function supportedNumbers(text: string, source: unknown): boolean {
  const numbers = (value: string) => value.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/g) ?? [];
  const known = new Set(numbers(JSON.stringify(source)));
  return numbers(text).every((number) => known.has(number));
}

export function enrollmentStatement(count: unknown, type: unknown): string | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  return type === 'ACTUAL' ? `${count} participants reported as actual enrollment` : type === 'ESTIMATED' ? `${count} participants planned as estimated enrollment` : `${count} participants listed; actual or estimated enrollment is not specified`;
}

/** Clinical meaning cannot be certified by number overlap. Preserve source wording instead. */
export function sourceClinicalView(source: {
  title?: string; brief_summary?: string; detailed_description?: string;
  eligibility_criteria?: string; conditions?: string[];
  interventions?: { name?: string }[]; study_type?: string;
  enrollment_count?: number; enrollment_type?: string | null; listed_site_count?: number | null;
}) {
  const missing = 'Not specified by the study';
  const criteria = source.eligibility_criteria?.trim() || missing;
  const criterionLines = criteria === missing ? [] : criteria.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 25 && !/^(?:inclusion|exclusion) criteria:?$/i.test(line));
  const enrollment = enrollmentStatement(source.enrollment_count, source.enrollment_type);
  return {
    plain_title: source.title || missing,
    plain_summary: source.brief_summary || missing,
    plain_condition: source.conditions?.join('; ') || missing,
    plain_intervention: source.interventions?.flatMap((item) => item.name ? [item.name] : []).join('; ') || missing,
    plain_eligibility: criteria,
    plain_design: source.study_type || missing,
    plain_time_commitment: 'Individual timing is not summarized. Verify the exact courses, durations and conditions in the original registry description.',
    plain_what_happens: source.detailed_description || source.brief_summary || missing,
    key_numbers: [...(enrollment ? [enrollment] : []), ...(source.listed_site_count ? [`${source.listed_site_count} facility listings on the registry record`] : [])],
    journey_steps: [],
    doc_checklist: criterionLines.slice(0, 6).map((line, index) => ({ label: `Registry criterion ${index + 1}`, why: line })),
    source_wording: true,
  };
}