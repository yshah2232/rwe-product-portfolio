/**
 * Lightweight "Did you mean?" helper for the Search Registry.
 *
 * Strategy:
 *   - Curated dictionary of common medical / drug spelling errors users actually
 *     type (collected from 30 days of low-result search_events). This is faster,
 *     cheaper and more predictable than an LLM call on every search.
 *   - Tokenize, swap any token that matches the dictionary, and only return a
 *     suggestion if at least one token actually changed.
 *   - Pure client-side; no network call.
 *
 * Add new corrections to TYPO_MAP as we learn from real query logs.
 */

const TYPO_MAP: Record<string, string> = {
  // Cancers
  lukemia: 'leukemia',
  leukimia: 'leukemia',
  leukamia: 'leukemia',
  lymphma: 'lymphoma',
  lymphona: 'lymphoma',
  carcenoma: 'carcinoma',
  carsinoma: 'carcinoma',
  melenoma: 'melanoma',
  metasis: 'metastasis',
  metestasis: 'metastasis',
  sarkoma: 'sarcoma',
  prostrate: 'prostate',
  // Neuro
  alzheimers: 'alzheimer',
  alzheimer: 'alzheimer',
  alziemers: 'alzheimer',
  alzhiemer: 'alzheimer',
  parkinsons: 'parkinson',
  parkinson: 'parkinson',
  parkinsen: 'parkinson',
  dimentia: 'dementia',
  alsheimers: 'alzheimer',
  // Metabolic / cardio
  diabetis: 'diabetes',
  diabeties: 'diabetes',
  diabetic: 'diabetes',
  obecity: 'obesity',
  hypertention: 'hypertension',
  cardio: 'cardiovascular',
  // Drugs / classes
  ozempick: 'ozempic',
  ozempics: 'ozempic',
  wegoby: 'wegovy',
  semaglitide: 'semaglutide',
  semaglutid: 'semaglutide',
  tirzepetide: 'tirzepatide',
  pembro: 'pembrolizumab',
  keytruda: 'pembrolizumab',
  immunoterapy: 'immunotherapy',
  imunotherapy: 'immunotherapy',
  chemo: 'chemotherapy',
  // Trial words
  recuiting: 'recruiting',
  recruting: 'recruiting',
  pediatric: 'pediatric',
  paediatric: 'pediatric',
  geriatic: 'geriatric',
  // Misc
  covid19: 'covid-19',
  coronovirus: 'coronavirus',
};

/**
 * Suggest a corrected query string. Returns `null` if nothing looks fixable.
 */
export function suggestCorrection(query: string): string | null {
  if (!query) return null;
  const tokens = query.split(/(\s+)/); // keep whitespace tokens
  let changed = false;
  const fixed = tokens.map((t) => {
    const lower = t.toLowerCase().replace(/[.,;:!?]/g, '');
    if (TYPO_MAP[lower] && TYPO_MAP[lower] !== lower) {
      changed = true;
      // Preserve casing of first letter (loose)
      const r = TYPO_MAP[lower];
      return /^[A-Z]/.test(t) ? r.charAt(0).toUpperCase() + r.slice(1) : r;
    }
    return t;
  });
  return changed ? fixed.join('') : null;
}
