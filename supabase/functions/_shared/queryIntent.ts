// Deterministic query interpretation + evidence grounding for ctg-search.
// Pure TypeScript (no Deno APIs) so it is unit-tested from vitest.
// Nothing here invents data: it only parses the user's words and checks
// whether concepts literally appear in fields returned by ClinicalTrials.gov.

import { queryStatus } from './trialStatus.ts';

export interface QueryIntent {
  conditionTerms: string[];
  biomarkers: string[];
  location: string | null;
  locationConfidence: 'high' | 'low' | null; // low = guessed from position, user should confirm
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

const FILLER = new Set([
  "a","an","the","and","or","of","in","on","for","with","who","that","is","are","to","by","at","as","trial","trials",
  "study","studies","patients","patient","people","adults","near","me","my","phase","recruiting","currently","open",
  "enrolling","mutation","mutant","mutated","positive","carriers","carrier","line","second","third","first","therapy",
  "treatment","prior","previously","treated","after","already","had","refractory","failed","progressed","pill","drug",
  "medicine","for","looking","find","any","new","not","yet","completed","early","late","advanced","elderly","mild","moderate","severe","stage",
]);

export function parseQuery(raw: string): QueryIntent {
  let q = ` ${raw.toLowerCase().replace(/[^\p{L}\p{N}\s\-,.;]/gu, " ").replace(/\s+/g, " ").trim()} `;
  const subtype = q.match(/\b(?:type[ -]*([12])\s+diabetes|diabetes(?:\s+mellitus)?[ ,]*type[ -]*([12])|t([12])d(?:m)?)\b/i);
  const subtypeTerm = subtype ? `type ${subtype[1] ?? subtype[2] ?? subtype[3]} diabetes` : null;
  if (subtype) q = q.replace(subtype[0], ' ');

  const parsedStatus = queryStatus(raw);
  const status = parsedStatus.status;
  if (status) q = queryStatus(q).remainder;

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
  let locationConfidence: 'high' | 'low' | null = null;
  const LOC_STOP = /^(phase|patients?|adults?|children|kids|people|women|men|the|a|an|my|elderly|trials?|studies|recruiting|early|late|stage|after|with|for|who|that|and|or)$/i;
  // Words that are medical terms, not places — guards the no-cue fallback below.
  const GENERIC_MEDICAL = new Set(["cancer", "carcinoma", "tumor", "tumour", "lymphoma", "leukemia", "leukaemia", "disease", "syndrome", "diabetes", "alzheimer", "alzheimers", "parkinson", "parkinsons", "asthma", "melanoma", "myeloma", "sarcoma", "infection", "obesity", "stroke", "copd", "hiv", "covid"]);
  const rawNoQual = raw.replace(/\b(rural|urban|suburban|small[- ]town)\s+/gi, "");
  const locM = rawNoQual.match(/\b(?:near|in|around|within)\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,2})/);
  if (locM && !LOC_STOP.test(locM[1].split(/\s+/)[0])) { location = locM[1].trim(); locationConfidence = 'high'; }
  if (!location) {
    // lowercase "near boston" / "around tulsa": "near"/"around" are unambiguous location cues
    const lowM = rawNoQual.match(/\b(?:near|around)\s+([a-z][a-z.'-]+(?:\s+[a-z][a-z.'-]+){0,2})/i);
    if (lowM) {
      const words: string[] = [];
      for (const w of lowM[1].split(/\s+/)) { if (LOC_STOP.test(w)) break; words.push(w); }
      if (words.length) { location = words.join(" ").replace(/\b\w/g, (c) => c.toUpperCase()); locationConfidence = 'high'; }
    }
  }
  if (!location) {
    // A US state named anywhere in the query, no cue word needed: "breast cancer New Jersey".
    // Longest names first so "west virginia" wins over "virginia".
    const qNoQual = q.replace(/\b(rural|urban|suburban)\s+/g, "");
    const st = [...US_STATES].sort((a, b) => b.length - a.length).find((s) => new RegExp(`\\b${s}\\b`).test(qNoQual));
    if (st) {
      const stateName = st.replace(/\b\w/g, (c) => c.toUpperCase());
      // A capitalized city directly before the state is part of the location: "diabetes Dallas Texas".
      const cityM = rawNoQual.match(new RegExp(`([A-Z][A-Za-z.'-]+(?:\\s+[A-Z][A-Za-z.'-]+){0,1})\\s+${stateName.replace(/\s+/g, "\\s+")}\\b`));
      const cityWords = cityM ? cityM[1].split(/\s+/) : [];
      const cityOk = cityWords.length > 0 && cityWords.every((w) =>
        !LOC_STOP.test(w) && !GENERIC_MEDICAL.has(w.toLowerCase().replace(/['’]s$/, "")) &&
        !BIOMARKER_WORDS.includes(w.toLowerCase()) && !FILLER.has(w.toLowerCase()));
      location = cityOk ? `${cityM![1]} ${stateName}` : stateName;
      locationConfidence = 'high';
    }
  }
  if (!location) {
    // Trailing capitalized place with no cue word: "lung cancer Boston". Uncertain —
    // surfaced as "Possible location" so the user can confirm or remove it.
    const tailM = rawNoQual.match(/([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,1})\s*[,.;]?\s*$/);
    if (tailM && tailM.index !== undefined) {
      const words = tailM[1].split(/\s+/);
      const ok = words.every((w) =>
        !LOC_STOP.test(w) && !GENERIC_MEDICAL.has(w.toLowerCase()) &&
        !BIOMARKER_WORDS.includes(w.toLowerCase()) && !MUTATION_RE.test(w) && !FILLER.has(w.toLowerCase()));
      const remaining = rawNoQual.slice(0, tailM.index).trim().split(/\s+/).filter(Boolean);
      if (ok && remaining.length >= 2) { location = tailM[1]; locationConfidence = 'low'; }
    }
  }
  if (location) {
    const escLoc = location.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    q = q.replace(new RegExp(`\\b(near|in|around|within)\\s+(?:(?:rural|urban|suburban)\\s+)?${escLoc}\\b`), " ");
    q = q.replace(new RegExp(`\\b${escLoc}\\b`), " "); // no-cue match
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

  const conditionTerms = Array.from(new Set([...(subtypeTerm ? [subtypeTerm] : []), ...rest])).slice(0, 6);
  const complexity = [conditionTerms.length > 0, biomarkers.length > 0, !!location, !!status, !!phase, priorTreatments.length > 0]
    .filter(Boolean).length;

  return { conditionTerms, biomarkers: Array.from(new Set(biomarkers)), location, locationConfidence, status, phase, priorTreatments, complexity, droppedTokens: dropped };
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
  sites?: SiteLocation[]; // structured city/state/country from contactsLocationsModule
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
    const words = norm(needle).split(" ").filter((w) => w.length >= 4 || /^\d+$/.test(w));
    if (words.length < 2 || !words.every((w) => nt.includes(w))) return null;
    idx = nt.indexOf(words[0]);
    needle = words[0];
  }
  // norm() keeps length 1:1 except collapsed whitespace; approximate on original.
  const start = Math.max(0, idx - 40);
  return (start > 0 ? "…" : "") + text.slice(start, idx + needle.length + 40).replace(/\s+/g, " ").trim() + "…";
}

/** Standard registry spellings for common abbreviations (lookup only, never shown as data). */
const CONDITION_ALIASES: Record<string, string> = {
  nsclc: "non small cell lung", sclc: "small cell lung", t2d: "type 2 diabetes", t1d: "type 1 diabetes",
  copd: "chronic obstructive pulmonary", mbc: "metastatic breast", crc: "colorectal", hcc: "hepatocellular",
  aml: "acute myeloid", cll: "chronic lymphocytic", ad: "alzheimer",
};

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
  intent.conditionTerms.forEach((c) => {
    const before = evidence.length;
    check(c, "condition", ["conditions", "title", "keywords", "eligibility"]);
    const alias = CONDITION_ALIASES[c.toLowerCase()];
    if (evidence.length === before && alias) {
      notFound.pop();
      for (const field of ["conditions", "title", "keywords"] as FieldName[]) {
        const sn = snippetAround(fieldText(f, field), alias);
        if (sn) { evidence.push({ concept: c, type: "condition", field, snippet: sn }); return; }
      }
      notFound.push({ concept: c, type: "condition" });
    }
  });
  intent.biomarkers.forEach((b) => check(b, "biomarker", ["title", "conditions", "keywords", "eligibility", "interventions"]));
  intent.priorTreatments.forEach((p) => {
    // Only count prior treatment when the term sits next to a prior-therapy cue in eligibility or title.
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cue = "(prior|previous(ly)?|after|following|progress\\w*|refractory|resistant|received|failed|failure|pretreated|treated with)";
    const re = new RegExp(`${cue}[^.;]{0,60}\\b${esc}|\\b${esc}[^.;]{0,40}\\b(prior|previous(ly)?|progress\\w*|failure|refractory)`, "i");
    for (const field of ["eligibility", "title"] as FieldName[]) {
      const t = fieldText(f, field); const m = t.match(re);
      if (m && m.index !== undefined) { evidence.push({ concept: p, type: "prior treatment", field, snippet: `…${t.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20).replace(/\s+/g, " ").trim()}…` }); return; }
    }
    notFound.push({ concept: p, type: "prior treatment" });
  });
  if (intent.location) {
    if (f.sites) {
      const m = matchLocation(intent.location, f.sites);
      if (m.confirmed) evidence.push({ concept: intent.location, type: "location", field: "locations", snippet: `${m.matchedSites} listed site${m.matchedSites === 1 ? "" : "s"} in ${intent.location}` });
      else notFound.push({ concept: intent.location, type: "location" });
    } else check(intent.location, "location", ["locations"]);
  }
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

// ── Location evidence (structured facility fields) ──

export interface SiteLocation { city?: string; state?: string; country?: string; status?: string }

const lc = (s?: string) => (s ?? "").trim().toLowerCase();
const COUNTRY_ALIASES: Record<string, string> = { us: "united states", usa: "united states", "u.s.": "united states", "u.s.a.": "united states", america: "united states" };

/** Sites whose city, state or country matches the interpreted location. "Dallas Texas" splits into city + state. */
export function matchLocation(location: string | null, sites: SiteLocation[]): { confirmed: boolean; matchedSites: number; recruitingMatched: number } {
  if (!location) return { confirmed: false, matchedSites: 0, recruitingMatched: 0 };
  const target = COUNTRY_ALIASES[lc(location)] ?? lc(location);
  const words = target.split(" ");
  let city: string | null = null;
  let state: string | null = null;
  for (let n = Math.min(2, words.length - 1); n >= 1; n--) {
    const maybeState = words.slice(-n).join(" ");
    if (US_STATES.includes(maybeState)) { state = maybeState; city = words.slice(0, -n).join(" ") || null; break; }
  }
  let hits: SiteLocation[];
  if (state && city) {
    hits = sites.filter((s) => lc(s.city) === city && lc(s.state) === state);
    if (hits.length === 0) hits = sites.filter((s) => lc(s.state) === state); // city not listed; state still confirms
  } else {
    hits = sites.filter((s) => lc(s.city) === target || lc(s.state) === target || lc(s.country) === target);
  }
  return { confirmed: hits.length > 0, matchedSites: hits.length, recruitingMatched: hits.filter((s) => s.status === "RECRUITING").length };
}

export function locationSentence(location: string, confirmed: boolean, trialRecruiting: boolean): string {
  return confirmed
    ? `${trialRecruiting ? "Recruiting trial" : "Trial"} with one or more listed sites in ${location}.`
    : `The available registry record does not confirm a site in ${location}.`;
}

/** Remove LLM sentences that talk about geography: the reranker never sees site data. */
export function stripLocationClaims(reason: string, location: string | null): string {
  const geo = /\b(locat\w*|sites?|state|country|region|city|u\.s\.?|usa|united states|geograph\w*)\b/i;
  const sentences = reason.split(/(?<=[.!?])\s+/);
  const kept = sentences
    .map((s) => s.replace(/,?\s*(but|and|although|though|while)\s+(the\s+)?(location|site)[^.]*\./i, "."))
    .filter((s) => !/\b(impl(y|ies|ied)|not (necessarily|explicitly)|does not mention|not stated)\b/i.test(s))
    .filter((s) => !geo.test(s) && !(location && s.toLowerCase().includes(location.toLowerCase())));
  return kept.join(" ").trim();
}

export type MatchLabel = "Condition match" | "Recruiting status match" | "Location confirmed" | "Phase match" | "Biomarker match" | "Prior-treatment match";

export function matchLabels(evidence: Evidence[], locationConfirmed: boolean): MatchLabel[] {
  const types = new Set(evidence.map((e) => e.type));
  const out: MatchLabel[] = [];
  if (types.has("condition")) out.push("Condition match");
  if (evidence.some((e) => e.type === "status" && e.concept === "RECRUITING")) out.push("Recruiting status match");
  if (locationConfirmed) out.push("Location confirmed");
  if (types.has("phase")) out.push("Phase match");
  if (types.has("biomarker")) out.push("Biomarker match");
  if (types.has("prior treatment")) out.push("Prior-treatment match");
  return out;
}

// ── Evidence deduplication ──
// Display priority: condition/biomarker → status → location → phase → prior treatment → quotes.
const EVIDENCE_PRIORITY: Record<string, number> = {
  condition: 1, biomarker: 1, status: 2, location: 3, phase: 4, "prior treatment": 5, quote: 6,
};

/**
 * Normalize and deduplicate match evidence before display.
 * Drops repeated source-field/snippet pairs and repeated concept+type pairs,
 * then keeps at most `max` items in priority order.
 */
export function dedupeEvidence(evidence: Evidence[], max = 3): Evidence[] {
  const seenSnippet = new Set<string>();
  const seenConcept = new Set<string>();
  const seenTypeField = new Set<string>();
  const out: Evidence[] = [];
  const sorted = [...evidence].sort((a, b) => (EVIDENCE_PRIORITY[a.type] ?? 9) - (EVIDENCE_PRIORITY[b.type] ?? 9));
  for (const e of sorted) {
    const snippetKey = `${e.field}|${norm(e.snippet)}`;
    const conceptKey = `${e.type}|${norm(e.concept)}`;
    // Condition terms are words of one phrase ("non", "small", "cell"…): one row per field is enough.
    const typeFieldKey = `${e.type}|${e.field}`;
    if (seenSnippet.has(snippetKey) || seenConcept.has(conceptKey)) continue;
    if (e.type === "condition" && seenTypeField.has(typeFieldKey)) continue;
    seenSnippet.add(snippetKey);
    seenConcept.add(conceptKey);
    seenTypeField.add(typeFieldKey);
    out.push(e);
    if (out.length >= max) break;
  }
  return out;
}

/** A numeric score is shown only when it actually separates results. */
export function scoresAreDifferentiated(scores: number[]): boolean {
  if (scores.length < 2) return scores.length === 1;
  const distinct = new Set(scores).size;
  const spread = Math.max(...scores) - Math.min(...scores);
  return distinct >= Math.min(3, scores.length) && spread >= 10;
}
