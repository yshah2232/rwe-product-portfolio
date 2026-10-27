// Deterministic query interpretation + evidence grounding for ctg-search.
// Pure TypeScript (no Deno APIs) so it is unit-tested from vitest.
// Nothing here invents data: it only parses the user's words and checks
// whether concepts literally appear in fields returned by ClinicalTrials.gov.

export interface QueryIntent {
  conditionTerms: string[];
  biomarkers: string[];
  location: string | null;
  status: string | null; // CTG overallStatus enum
  phase: string | null; // CTG phase enum
  priorTreatments: string[];
  complexity: number; // number of distinct concept types detected
  droppedTokens: string[];
}

const PHASE_MAP: Record<string, string> = {
  "1": "PHASE1", i: "PHASE1", "2": "PHASE2", ii: "PHASE2",
  "3": "PHASE3", iii: "PHASE3", "4": "PHASE4", iv: "PHASE4",
};

const BIOMARKER_WORDS = [
  "kras", "egfr", "alk", "ros1", "braf", "her2", "erbb2", "pd-l1", "pdl1", "pd-1", "apoe4", "apoe",
  "brca1", "brca2", "brca", "met", "ret", "ntrk", "msi-h", "dmmr", "tmb", "flt3", "idh1", "idh2",
  "npm1", "bcr-abl", "jak2", "pik3ca", "esr1", "fgfr2", "fgfr3", "cd19", "cd20", "bcma", "claudin",
  "tp53", "stk11", "keap1", "amyloid", "tau", "hla-a2", "glp-1", "gip", "ctdna",
];
// Mutation tokens like G12C, V600E, L858R, T790M, or exon20
const MUTATION_RE = /^([a-z]\d{2,4}[a-z]|exon\d{1,2})$/i;

const US_STATES = [
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware","florida","georgia",
  "hawaii","idaho","illinois","indiana","iowa","kansas","kentucky","louisiana","maine","maryland","massachusetts",
  "michigan","minnesota","mississippi","missouri","montana","nebraska","nevada","new hampshire","new jersey",
  "new mexico","new york","north carolina","north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island",
  "south carolina","south dakota","tennessee","texas","utah","vermont","virginia","washington","west virginia",
  "wisconsin","wyoming",
];

const PRIOR_TRIGGERS = /\b(?:prior|previously treated with|previously treated|pretreated with|after|already had|refractory to|resistant to|progressed on|progression on|failed|following)\s+([a-z0-9\- ]{3,40}?)(?=$|[,.;]| and | in | near | who | phase| recruiting)/gi;

const STATUS_PATTERNS: [RegExp, string][] = [
  [/\bnot yet recruiting\b/i, "NOT_YET_RECRUITING"],
  [/\b(currently )?recruiting\b|\benrolling\b|\bopen trials?\b/i, "RECRUITING"],
  [/\bcompleted\b/i, "COMPLETED"],
  [/\bactive,? not recruiting\b/i, "ACTIVE_NOT_RECRUITING"],
];

const FILLER = new Set([
  "a","an","the","and","or","of","in","on","for","with","who","that","is","are","to","by","at","as","trial","trials",
  "study","studies","patients","patient","people","adults","near","me","my","phase","recruiting","currently","open",
  "enrolling","mutation","mutant","mutated","positive","carriers","carrier","line","second","third","first","therapy",
  "treatment","prior","previously","treated","after","already","had","refractory","failed","progressed","pill","drug",
  "medicine","for","looking","find","any","new","not","yet","completed","early","late","advanced","elderly","mild","moderate","severe","stage",
]);

export function parseQuery(raw: string): QueryIntent {
  let q = ` ${raw.toLowerCase().replace(/[^\p{L}\p{N}\s\-,.;]/gu, " ").replace(/\s+/g, " ").trim()} `;

  let status: string | null = null;
  for (const [re, val] of STATUS_PATTERNS) if (re.test(q)) { status = val; break; }

  let phase: string | null = null;
  const pm = q.match(/\bphase\s*(iii|ii|iv|i|[1-4])\b/i);
  if (pm) phase = PHASE_MAP[pm[1].toLowerCase()] ?? null;

  const priorTreatments: string[] = [];
  for (const m of q.matchAll(PRIOR_TRIGGERS)) {
    const t = m[1].trim().replace(/\b(therapy|treatment)\b/g, "").trim();
    if (t && !priorTreatments.includes(t)) priorTreatments.push(t);
  }
  for (const t of priorTreatments) q = q.replace(t, " ");

  // Location: "near X" / "in X" where X is a US state, "us", or a place name (urban or rural).
  // "rural"/"urban" qualifiers are skipped; the place itself is sent to CTG.gov as query.locn.
  let location: string | null = null;
  const LOC_STOP = /^(phase|patients?|adults?|children|kids|people|women|men|the|a|an|my|elderly|trials?|studies|recruiting|early|late|stage|after|with|for|who|that|and|or)$/i;
  const rawNoQual = raw.replace(/\b(rural|urban|suburban|small[- ]town)\s+/gi, "");
  const locM = rawNoQual.match(/\b(?:near|in|around|within)\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,2})/);
  if (locM && !LOC_STOP.test(locM[1].split(/\s+/)[0])) location = locM[1].trim();
  if (!location) {
    // lowercase "near boston" / "around tulsa": "near"/"around" are unambiguous location cues
    const lowM = rawNoQual.match(/\b(?:near|around)\s+([a-z][a-z.'-]+(?:\s+[a-z][a-z.'-]+){0,2})/i);
    if (lowM) {
      const words: string[] = [];
      for (const w of lowM[1].split(/\s+/)) { if (LOC_STOP.test(w)) break; words.push(w); }
      if (words.length) location = words.join(" ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  if (!location) {
    const qNoQual = q.replace(/\b(rural|urban|suburban)\s+/g, "");
    const st = US_STATES.find((s) => new RegExp(`\\b(?:near|in|around) ${s}\\b`).test(qNoQual));
    if (st) location = st.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (location) {
    q = q.replace(new RegExp(`\\b(near|in|around|within)\\s+(?:(?:rural|urban|suburban)\\s+)?${location.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), " ");
    q = q.replace(/\b(rural|urban|suburban)\b/g, " ");
  }

  const tokens = q.split(/[\s,.;]+/).filter(Boolean);
  const biomarkers: string[] = [];
  const rest: string[] = [];
  const dropped: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (BIOMARKER_WORDS.includes(t)) {
      const next = tokens[i + 1];
      if (next && MUTATION_RE.test(next)) { biomarkers.push(`${t} ${next}`); i++; }
      else biomarkers.push(t);
    } else if (MUTATION_RE.test(t)) {
      biomarkers.push(t);
    } else if (/^(i{1,3}|iv|[1-4])$/.test(t) && tokens[i - 1] === "phase") {
      // consumed by phase
    } else if (FILLER.has(t) || t.length < 2) {
      if (!["phase","recruiting","near","in"].includes(t)) dropped.push(t);
    } else rest.push(t);
  }

  const conditionTerms = Array.from(new Set(rest)).slice(0, 6);
  const complexity = [conditionTerms.length > 0, biomarkers.length > 0, !!location, !!status, !!phase, priorTreatments.length > 0]
    .filter(Boolean).length;

  return { conditionTerms, biomarkers: Array.from(new Set(biomarkers)), location, status, phase, priorTreatments, complexity, droppedTokens: dropped };
}

// ── Grounding ──

export interface GroundFields {
  briefTitle: string;
  officialTitle: string;
  conditions: string[];
  interventions: string[];
  keywords: string[];
  eligibility: string;
  locations: string[]; // "City, State, Country"
  status: string;
  phase: string[];
}

export type FieldName = "title" | "conditions" | "interventions" | "keywords" | "eligibility" | "locations" | "status" | "phase";

export interface Evidence { concept: string; type: string; field: FieldName; snippet: string }

export function fieldText(f: GroundFields, field: FieldName): string {
  switch (field) {
    case "title": return `${f.briefTitle} ${f.officialTitle}`;
    case "conditions": return f.conditions.join("; ");
    case "interventions": return f.interventions.join("; ");
    case "keywords": return f.keywords.join("; ");
    case "eligibility": return f.eligibility;
    case "locations": return f.locations.join("; ");
    case "status": return f.status;
    case "phase": return f.phase.join(", ");
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[\s\-]+/g, " ");

function snippetAround(text: string, needle: string): string | null {
  const nt = norm(text);
  let idx = nt.indexOf(norm(needle));
  if (idx < 0) {
    // Multi word concept: every significant word must appear in the field.
    const words = norm(needle).split(" ").filter((w) => w.length >= 4);
    if (words.length < 2 || !words.every((w) => nt.includes(w))) return null;
    idx = nt.indexOf(words[0]);
    needle = words[0];
  }
  // norm() keeps length 1:1 except collapsed whitespace; approximate on original.
  const start = Math.max(0, idx - 40);
  return (start > 0 ? "…" : "") + text.slice(start, idx + needle.length + 40).replace(/\s+/g, " ").trim() + "…";
}

export function groundConcepts(intent: QueryIntent, f: GroundFields): { evidence: Evidence[]; notFound: { concept: string; type: string }[] } {
  const evidence: Evidence[] = [];
  const notFound: { concept: string; type: string }[] = [];
  const check = (concept: string, type: string, fields: FieldName[]) => {
    for (const field of fields) {
      const s = snippetAround(fieldText(f, field), concept);
      if (s) { evidence.push({ concept, type, field, snippet: s }); return; }
    }
    notFound.push({ concept, type });
  };
  intent.conditionTerms.forEach((c) => check(c, "condition", ["conditions", "title", "keywords", "eligibility"]));
  intent.biomarkers.forEach((b) => check(b, "biomarker", ["title", "conditions", "keywords", "eligibility", "interventions"]));
  intent.priorTreatments.forEach((p) => check(p, "prior treatment", ["eligibility", "title"]));
  if (intent.location) check(intent.location, "location", ["locations"]);
  if (intent.status) {
    if (f.status === intent.status) evidence.push({ concept: intent.status, type: "status", field: "status", snippet: f.status });
    else notFound.push({ concept: intent.status, type: "status" });
  }
  if (intent.phase) {
    if (f.phase.includes(intent.phase)) evidence.push({ concept: intent.phase, type: "phase", field: "phase", snippet: f.phase.join(", ") });
    else notFound.push({ concept: intent.phase, type: "phase" });
  }
  return { evidence, notFound };
}

/** Accept an LLM reason only when every quote it cites appears verbatim in the named CTG field. */
export function verifyQuotes(quotes: { field: string; quote: string }[] | undefined, f: GroundFields): boolean {
  if (!quotes || quotes.length === 0) return false;
  const allowed: FieldName[] = ["title", "conditions", "interventions", "keywords", "eligibility", "locations", "status", "phase"];
  return quotes.every((q) =>
    allowed.includes(q.field as FieldName) && q.quote.trim().length >= 3 &&
    norm(fieldText(f, q.field as FieldName)).includes(norm(q.quote.trim())));
}

const FIELD_LABEL: Record<FieldName, string> = {
  title: "title", conditions: "listed conditions", interventions: "interventions", keywords: "keywords",
  eligibility: "eligibility criteria", locations: "site locations", status: "recruitment status", phase: "phase",
};

export function groundedReason(evidence: Evidence[], notFound: { concept: string; type: string }[]): string {
  if (evidence.length === 0 && notFound.length === 0) return "No specific query concepts detected; ranked by overall registry text similarity.";
  const parts = evidence.map((e) => `"${e.concept}" in ${FIELD_LABEL[e.field]}`);
  let s = parts.length ? `Registry record matches ${parts.join(", ")}.` : "No query concept found verbatim in this registry record.";
  if (notFound.length) s += ` Not found in record: ${notFound.map((n) => n.concept).join(", ")}.`;
  return s;
}

/** Retrieval is weak when few candidates came back or few mention the key concepts. */
export function isWeak(candidateCount: number, coverage: number): boolean {
  return candidateCount < 10 || coverage < 0.3;
}

export const RETRIEVAL_LIMITS = { PAGE_SIZE: 25, MAX_CANDIDATES: 75, MAX_CTG_CALLS: 3 } as const;

/** US-first ordering: the query names the US / a US state, or the visitor's browser region is US (hint, never stored). */
export function prefersUS(raw: string, intent: QueryIntent, browserRegionUS: boolean): boolean {
  if (browserRegionUS) return true;
  if (/\b(us|u\.s\.?|usa|u\.s\.a\.?|united states|america)\b/i.test(raw)) return true;
  const loc = intent.location?.toLowerCase();
  return !!loc && US_STATES.includes(loc);
}

/** Ranking key: US-site trials move ahead of non-US trials of similar relevance; displayed scores stay unchanged. */
export const US_PRIORITY_BOOST = 15;
export function rankKey(score: number, countries: string[], preferUS: boolean): number {
  return score + (preferUS && countries.includes("United States") ? US_PRIORITY_BOOST : 0);
}
