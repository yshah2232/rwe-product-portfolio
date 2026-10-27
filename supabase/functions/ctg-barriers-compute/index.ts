// ── Module 3: Barriers & Access compute ──
// Scores each US trial site of a cohort on two access barriers, both from
// Census ACS 2022 5-year (real, citable, key-gated API):
//   - Language access: members of limited-English-speaking households, pop 5+
//     (ACS Table C16002: 004E + 007E + 010E + 013E over 001E)
//   - Socioeconomic strain: income below poverty level
//     (ACS Table B17001: 002E over 001E)
// Composite barrier score is relative to the US national rate (see
// src/lib/barrierScore.ts for the same formula, unit-tested).
//
// POST /ctg-barriers-compute { cohortId, sessionId }
// Requires the CENSUS_API_KEY secret (Census API began requiring keys in 2026).

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5";
const ACS_YEAR = 2022;
const CACHE_TTL_MS = 30 * 86400_000;   // acs_barriers_cache: 30 days (matches acs_cache)
const SITE_TTL_MS = 7 * 86400_000;     // site_barriers: 7 days
const MAX_COUNTIES_PER_RUN = 30;       // bound Census calls per invocation

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CENSUS_KEY = (Deno.env.get("CENSUS_API_KEY") ?? "").trim();

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const VARS = [
  "C16002_001E", // Total pop 5+
  "C16002_004E", // Spanish: limited English speaking household
  "C16002_007E", // Other Indo-European: limited English speaking household
  "C16002_010E", // Asian and Pacific Island languages: limited English speaking household
  "C16002_013E", // Other languages: limited English speaking household
  "B17001_001E", // Population for whom poverty status determined
  "B17001_002E", // Income below poverty level
];

interface CountyMeasures {
  lep_population: number | null;
  lep_total_population: number | null;
  poverty_population: number | null;
  poverty_below_level: number | null;
  lep_pct: number | null;
  poverty_pct: number | null;
}

function num(v: string | undefined): number | null {
  if (v == null || v === "" || v === "-" || v === "(X)" || v === "null") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function pct(numer: number | null, denom: number | null): number | null {
  if (numer == null || denom == null || denom <= 0) return null;
  return Math.round((numer / denom) * 10000) / 100; // 2 decimals
}

async function fetchCensusMeasures(geoType: "county" | "national", geoId: string): Promise<{ url: string; measures: CountyMeasures } | { error: string }> {
  if (!CENSUS_KEY) return { error: "census_key_required" };
  let url = `${CENSUS_BASE}?get=NAME,${VARS.join(",")}&`;
  if (geoType === "national") url += "for=us:1";
  else url += `for=county:${geoId.slice(2)}&in=state:${geoId.slice(0, 2)}`;
  const publicUrl = url; // citable source link, never includes the key
  const keyedUrl = `${url}&key=${encodeURIComponent(CENSUS_KEY)}`;
  try {
    const res = await fetch(keyedUrl, { headers: { Accept: "application/json" } });
    if (!res.ok) return { error: `Census ${res.status}` };
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch {
      return { error: /invalid key|missing/i.test(text) ? "census_key_invalid" : "census_bad_response" };
    }
    if (!Array.isArray(data) || data.length < 2) return { error: "Empty Census response" };
    const headers = data[0] as string[];
    const row = data[1] as string[];
    const get = (col: string) => num(row[headers.indexOf(col)]);
    const lepParts = ["C16002_004E", "C16002_007E", "C16002_010E", "C16002_013E"].map(get);
    const lepSum = lepParts.reduce((a: number | null, v) => (v != null ? (a ?? 0) + v : a), null);
    const measures: CountyMeasures = {
      lep_population: lepSum,
      lep_total_population: get("C16002_001E"),
      poverty_population: get("B17001_001E"),
      poverty_below_level: get("B17001_002E"),
      lep_pct: pct(lepSum, get("C16002_001E")),
      poverty_pct: pct(get("B17001_002E"), get("B17001_001E")),
    };
    return { url: publicUrl, measures };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Census fetch failed" };
  }
}

async function getMeasuresWithCache(geoType: "county" | "national", geoId: string): Promise<{ measures: CountyMeasures; sourceUrl: string; cached: boolean } | { error: string }> {
  const { data: cached } = await sb
    .from("acs_barriers_cache")
    .select("*")
    .eq("geo_type", geoType)
    .eq("geo_id", geoId)
    .eq("acs_year", ACS_YEAR)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (cached) {
    return {
      cached: true,
      sourceUrl: cached.source_url,
      measures: {
        lep_population: cached.lep_population,
        lep_total_population: cached.lep_total_population,
        poverty_population: cached.poverty_population,
        poverty_below_level: cached.poverty_below_level,
        lep_pct: cached.lep_pct != null ? Number(cached.lep_pct) : null,
        poverty_pct: cached.poverty_pct != null ? Number(cached.poverty_pct) : null,
      },
    };
  }
  const fetched = await fetchCensusMeasures(geoType, geoId);
  if ("error" in fetched) return fetched;
  const row = {
    geo_type: geoType,
    geo_id: geoId,
    acs_year: ACS_YEAR,
    ...fetched.measures,
    source_url: fetched.url,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
  };
  const { data: upserted, error: upErr } = await sb
    .from("acs_barriers_cache")
    .upsert(row, { onConflict: "geo_type,geo_id,acs_year" })
    .select()
    .single();
  if (upErr) console.error("acs_barriers_cache upsert", upErr);
  return { cached: false, sourceUrl: fetched.url, measures: (upserted ?? row) as CountyMeasures };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!CENSUS_KEY) {
      return json({
        error: "census_key_required",
        message: "Census API key is not configured. Add the CENSUS_API_KEY secret to enable live ACS barrier data.",
      }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const cohortId = (body.cohortId ?? "").toString().trim();
    const sessionId = (body.sessionId ?? "").toString().trim().slice(0, 64);
    if (!cohortId) return json({ error: "cohortId is required" }, 400);
    if (!sessionId) return json({ error: "sessionId is required" }, 400);

    // Ownership gate (same contract as ctg-normalize-locations)
    const { data: cohort, error: cohortErr } = await sb
      .from("saved_cohorts")
      .select("id, session_id")
      .eq("id", cohortId)
      .maybeSingle();
    if (cohortErr || !cohort) return json({ error: "Cohort not found" }, 404);
    if (cohort.session_id !== sessionId) return json({ error: "Not owner of this cohort" }, 403);

    const { data: trials, error: trialsErr } = await sb
      .from("cohort_trials")
      .select("nct_id")
      .eq("cohort_id", cohortId);
    if (trialsErr) return json({ error: "Failed to load cohort trials" }, 500);
    const nctIds = (trials ?? []).map((t) => t.nct_id);
    if (nctIds.length === 0) return json({ ok: true, scored: 0, totalUSCountySites: 0 });

    const { data: locs, error: locsErr } = await sb
      .from("normalized_locations")
      .select("id, nct_id, raw_city, raw_state, county_fips")
      .in("nct_id", nctIds);
    if (locsErr) return json({ error: "Failed to load normalized locations" }, 500);

    const usCountyLocs = (locs ?? []).filter(
      (l: any) => l.county_fips && String(l.county_fips).length === 5,
    );

    // National baseline (cached like counties)
    const national = await getMeasuresWithCache("national", "US");
    if ("error" in national) {
      return json({ error: national.error === "census_key_required" ? "census_key_required" : `National baseline failed: ${national.error}` }, national.error === "census_key_required" ? 503 : 502);
    }
    const nationalLepPct = national.measures.lep_pct;
    const nationalPovertyPct = national.measures.poverty_pct;

    // Fresh site rows first
    const { data: existing } = await sb
      .from("site_barriers")
      .select("*")
      .eq("cohort_id", cohortId);
    const freshByKey = new Map<string, any>();
    for (const r of existing ?? []) {
      if (new Date(r.expires_at).getTime() > Date.now()) freshByKey.set(r.normalized_location_id, r);
    }

    // Counties needing measures
    const countySet = new Set<string>();
    for (const l of usCountyLocs) {
      if (!freshByKey.has(l.id)) countySet.add(l.county_fips);
    }
    const countyIds = Array.from(countySet).slice(0, MAX_COUNTIES_PER_RUN);
    const countyMeasures = new Map<string, CountyMeasures & { sourceUrl: string }>();
    const errors: string[] = [];
    for (const fips of countyIds) {
      const got = await getMeasuresWithCache("county", fips);
      if ("error" in got) {
        errors.push(`${fips}: ${got.error}`);
        continue;
      }
      countyMeasures.set(fips, { ...got.measures, sourceUrl: got.sourceUrl });
    }

    // Score + upsert stale/missing locations
    let scored = 0;
    const skipped: string[] = [];
    for (const l of usCountyLocs) {
      if (freshByKey.has(l.id)) continue;
      const m = countyMeasures.get(l.county_fips);
      if (!m) {
        skipped.push(l.id);
        continue;
      }
      const lepRatio = nationalLepPct && nationalLepPct > 0 && m.lep_pct != null
        ? Math.min(100, (m.lep_pct / nationalLepPct) * 100)
        : null;
      const povRatio = nationalPovertyPct && nationalPovertyPct > 0 && m.poverty_pct != null
        ? Math.min(100, (m.poverty_pct / nationalPovertyPct) * 100)
        : null;
      const ratios = [lepRatio, povRatio].filter((r): r is number => r != null);
      const barrierScore = ratios.length > 0
        ? Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length)
        : null;
      const row = {
        cohort_id: cohortId,
        nct_id: l.nct_id,
        normalized_location_id: l.id,
        county_fips: l.county_fips,
        lep_pct: m.lep_pct,
        poverty_pct: m.poverty_pct,
        barrier_score: barrierScore,
        computed_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + SITE_TTL_MS).toISOString(),
      };
      const { error: upErr } = await sb
        .from("site_barriers")
        .upsert(row, { onConflict: "cohort_id,normalized_location_id" });
      if (upErr) errors.push(`${l.nct_id}: upsert ${upErr.message}`);
      else scored++;
    }

    return json({
      ok: true,
      cohortId,
      totalUSCountySites: usCountyLocs.length,
      scored,
      freshSkipped: usCountyLocs.length - usCountyLocs.filter((l: any) => !freshByKey.has(l.id)).length,
      countiesFetched: countyMeasures.size,
      national: { lepPct: nationalLepPct, povertyPct: nationalPovertyPct, sourceUrl: national.sourceUrl },
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("ctg-barriers-compute error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
