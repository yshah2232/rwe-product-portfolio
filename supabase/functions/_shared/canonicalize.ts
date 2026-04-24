// Deterministic canonicalization rules used at fetch-time on the server.
// Keeps the trust drawer honest: every cleaned value has a rule + confidence.

export interface MappingHit {
  raw: string;
  clean: string;
  confidence: number;
  source: "rule" | "passthrough";
  note: string;
}

const SPONSOR_RULES: Array<[RegExp, (m: RegExpMatchArray) => string, string]> = [
  [/^(.+?)\s+A\/S$/i, (m) => m[1], "Trim Danish legal suffix A/S"],
  [/^(.+?),?\s+(Inc|LLC|Ltd|Corp|Corporation|Limited|GmbH|S\.A\.|SA|Co\.,? Ltd\.?)\.?$/i, (m) => m[1], "Trim corporate legal suffix"],
  [/^(.+?)\s+and Company$/i, (m) => m[1], 'Trim "and Company"'],
  [/^F\.\s*Hoffmann-La Roche/i, () => "Roche", "Roche canonical"],
  [/^Genentech/i, () => "Genentech (Roche)", "Roche subsidiary"],
  [/^Merck Sharp & Dohme/i, () => "Merck", "MSD subsidiary"],
  [/^Janssen/i, () => "Janssen (J&J)", "J&J subsidiary"],
  [/^GlaxoSmithKline/i, () => "GSK", "Trade name"],
];

const INDICATION_RULES: Array<[RegExp, string, string]> = [
  [/^(non[ -]?small[ -]?cell\s+lung\s+cancer|carcinoma,?\s*non[ -]?small[ -]?cell\s+lung)$/i, "NSCLC", "Standard abbreviation"],
  [/^small[ -]?cell\s+lung\s+cancer$/i, "SCLC", "Standard abbreviation"],
  [/^lung\s+neoplasms?$/i, "Lung cancer", "MeSH → plain term"],
  [/^alzheimer'?s?\s+disease$/i, "Alzheimer's disease", "Possessive standard"],
  [/^mild\s+cognitive\s+impairment$/i, "MCI", "Standard abbreviation"],
  [/^(diabetes\s+mellitus,?\s*type\s*2|type\s*2\s+diabetes(\s+mellitus)?)$/i, "Type 2 diabetes", 'Drop "mellitus"'],
  [/^breast\s+neoplasms?$/i, "Breast cancer", "MeSH → plain term"],
  [/^cardiovascular\s+diseases?$/i, "Cardiovascular disease", "Singular form"],
];

const ASSET_RULES: Array<[RegExp, string, string]> = [
  [/^semaglutide$/i, "Semaglutide (GLP-1)", "GLP-1 agonist class tag"],
  [/^tirzepatide$/i, "Tirzepatide (GIP/GLP-1)", "Dual agonist class tag"],
  [/^liraglutide$/i, "Liraglutide (GLP-1)", "GLP-1 agonist class tag"],
  [/^pembrolizumab$/i, "Pembrolizumab (anti-PD-1)", "Checkpoint class"],
  [/^nivolumab$/i, "Nivolumab (anti-PD-1)", "Checkpoint class"],
  [/^atezolizumab$/i, "Atezolizumab (anti-PD-L1)", "Checkpoint class"],
  [/^durvalumab$/i, "Durvalumab (anti-PD-L1)", "Checkpoint class"],
  [/^lecanemab$/i, "Lecanemab (anti-amyloid)", "AD class"],
  [/^donanemab$/i, "Donanemab (anti-amyloid)", "AD class"],
  [/^aducanumab$/i, "Aducanumab (anti-amyloid)", "AD class"],
];

export function cleanSponsor(raw: string): MappingHit {
  if (!raw) return { raw, clean: "", confidence: 0, source: "passthrough", note: "Empty input" };
  for (const [re, fn, note] of SPONSOR_RULES) {
    const m = raw.match(re);
    if (m) {
      const clean = fn(m).trim();
      if (clean && clean !== raw) return { raw, clean, confidence: 95, source: "rule", note };
    }
  }
  return { raw, clean: raw, confidence: 70, source: "passthrough", note: "No mapping rule matched — raw value shown" };
}

export function cleanIndication(raw: string): MappingHit {
  if (!raw) return { raw, clean: "", confidence: 0, source: "passthrough", note: "Empty input" };
  for (const [re, clean, note] of INDICATION_RULES) {
    if (re.test(raw)) return { raw, clean, confidence: 95, source: "rule", note };
  }
  return { raw, clean: raw, confidence: 70, source: "passthrough", note: "No mapping rule matched — raw value shown" };
}

export function cleanAsset(raw: string): MappingHit {
  if (!raw) return { raw, clean: "", confidence: 0, source: "passthrough", note: "Empty input" };
  for (const [re, clean, note] of ASSET_RULES) {
    if (re.test(raw)) return { raw, clean, confidence: 95, source: "rule", note };
  }
  return { raw, clean: raw, confidence: 70, source: "passthrough", note: "No mapping rule matched — raw value shown" };
}
