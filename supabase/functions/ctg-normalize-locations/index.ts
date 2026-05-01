// ── Geo Normalization for Cohort Trial Sites ──
// Resolves each trial's site list (City, State) to a real county FIPS code.
//
// Pipeline:
//   1. Load cohort_trials → NCT IDs (owner-gated)
//   2. For each trial, fetch site list from CTG.gov v2
//   3. For each US site:
//      a. Call Nominatim (OpenStreetMap) for "city, state, USA" → returns county name + state
//      b. Look up state_fips + county_fips_lookup tables → 5-digit FIPS
//   4. Insert one normalized_locations row per site
//
// Sources (all real, citable):
//   - Trial sites: https://clinicaltrials.gov/api/v2
//   - Geocoding: https://nominatim.openstreetmap.org (OSM, no key, 1 req/sec)
//   - State FIPS: https://www2.census.gov/geo/docs/reference/state.txt
//   - County FIPS: https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt
//
// Nominatim usage policy requires:
//   - Identifying User-Agent
//   - Max 1 request per second
//   - No bulk geocoding (we cap at 50 sites/trial × 10 trials/request = 500 max, throttled)
//
// POST /ctg-normalize-locations { cohortId, sessionId? }

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ClinicalTrialDiversityStudio/1.0 (research; clinical trial site geocoding)";
const NOMINATIM_THROTTLE_MS = 1100; // OSM requires ≤1 req/sec; 1.1s for safety

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface GeoHit {
  county_fips: string | null;
  county_name: string | null;
  state_code: string | null;
  zip3: string | null;
  method: "nominatim_county" | "nominatim_no_county" | "state_only" | "unresolved";
  confidence: number;
}

// ── In-memory caches for one invocation ──
// Avoid re-querying Nominatim and DB for the same (city,state) twice.
const geoCache = new Map<string, GeoHit>();
let stateFipsByCode: Map<string, string> | null = null;
let stateFipsByName: Map<string, string> | null = null;

async function loadStateLookups() {
  if (stateFipsByCode) return;
  const { data } = await sb.from("state_fips").select("state_code, state_fips, state_name");
  stateFipsByCode = new Map();
  stateFipsByName = new Map();
  for (const r of data ?? []) {
    stateFipsByCode.set(r.state_code.toUpperCase(), r.state_fips);
    stateFipsByName.set(r.state_name.toLowerCase(), r.state_code);
  }
}

// Normalize a state input that may be "California" or "CA"
function toStateCode(stateInput: string): string | null {
  if (!stateInput) return null;
  const s = stateInput.trim();
  if (s.length === 2 && stateFipsByCode?.has(s.toUpperCase())) return s.toUpperCase();
  return stateFipsByName?.get(s.toLowerCase()) ?? null;
}

async function lookupCountyFips(stateCode: string, rawCountyName: string): Promise<{ fips: string; name: string } | null> {
  // Nominatim returns names like "Los Angeles County", "New York County", "Baltimore city".
  // The Census file uses the same casing, so a case-insensitive match works.
  const cleaned = rawCountyName.trim();
  const { data } = await sb
    .from("county_fips_lookup")
    .select("fips, county_name")
    .eq("state_code", stateCode)
    .ilike("county_name", cleaned)
    .maybeSingle();
  if (data) return { fips: data.fips, name: data.county_name };

  // Fallback: try without trailing " County" suffix mismatch
  const stripped = cleaned.replace(/\s+(County|Parish|Borough|Census Area|Municipality|City and Borough)$/i, "");
  const { data: data2 } = await sb
    .from("county_fips_lookup")
    .select("fips, county_name")
    .eq("state_code", stateCode)
    .ilike("county_name", `${stripped}%`)
    .limit(1)
    .maybeSingle();
  return data2 ? { fips: data2.fips, name: data2.county_name } : null;
}

let lastNominatimAt = 0;
async function nominatimGeocode(city: string, state: string): Promise<{ county?: string; state?: string; postcode?: string } | null> {
  // Throttle to honor OSM 1 req/sec policy
  const wait = NOMINATIM_THROTTLE_MS - (Date.now() - lastNominatimAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimAt = Date.now();

  const params = new URLSearchParams({
    city,
    state,
    country: "USA",
    format: "json",
    addressdetails: "1",
    limit: "1",
  });
  try {
    const res = await fetch(`${NOMINATIM_BASE}?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`nominatim ${res.status} for ${city}, ${state}`);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0]?.address ?? null;
  } catch (e) {
    console.error("nominatim exception", e);
    return null;
  }
}

async function resolveUSLocation(city: string, state: string): Promise<GeoHit> {
  const stateCode = toStateCode(state);
  if (!stateCode) {
    return { county_fips: null, county_name: null, state_code: null, zip3: null, method: "unresolved", confidence: 0 };
  }
  if (!city) {
    return { county_fips: null, county_name: null, state_code: stateCode, zip3: null, method: "state_only", confidence: 40 };
  }

  // Check in-memory cache first
  const key = `${city.toLowerCase()}|${stateCode}`;
  const cached = geoCache.get(key);
  if (cached) return cached;

  const addr = await nominatimGeocode(city, state);
  let hit: GeoHit;
  if (!addr) {
    hit = { county_fips: null, county_name: null, state_code: stateCode, zip3: null, method: "state_only", confidence: 40 };
  } else if (addr.county) {
    const found = await lookupCountyFips(stateCode, addr.county);
    const zip3 = addr.postcode ? addr.postcode.replace(/\D/g, "").slice(0, 3) : null;
    if (found) {
      hit = {
        county_fips: found.fips,
        county_name: found.name,
        state_code: stateCode,
        zip3: zip3 || null,
        method: "nominatim_county",
        confidence: 90,
      };
    } else {
      hit = { county_fips: null, county_name: addr.county, state_code: stateCode, zip3: zip3 || null, method: "nominatim_no_county", confidence: 60 };
    }
  } else {
    // OSM matched but no county (e.g., independent city, DC). Still useful — keep state.
    hit = { county_fips: null, county_name: null, state_code: stateCode, zip3: null, method: "state_only", confidence: 40 };
  }
  geoCache.set(key, hit);
  return hit;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cohortId = (body.cohortId ?? "").toString().trim();
    const sessionId = (body.sessionId ?? "").toString().trim().slice(0, 64);

    if (!cohortId) return json({ error: "cohortId is required" }, 400);
    if (!sessionId) return json({ error: "sessionId is required" }, 400);

    const { data: cohort, error: cohortErr } = await sb
      .from("saved_cohorts")
      .select("id, session_id")
      .eq("id", cohortId)
      .maybeSingle();
    if (cohortErr || !cohort) return json({ error: "Cohort not found" }, 404);
    if (cohort.session_id !== sessionId) {
      return json({ error: "Not owner of this cohort" }, 403);
    }

    const { data: trials, error: trialsErr } = await sb
      .from("cohort_trials")
      .select("nct_id")
      .eq("cohort_id", cohortId);
    if (trialsErr) return json({ error: "Failed to load cohort trials" }, 500);
    const nctIds = (trials ?? []).map((t) => t.nct_id);
    if (nctIds.length === 0) {
      return json({ ok: true, normalized: 0, total: 0, locations: 0 });
    }

    // Cap to first 10 trials per request to bound runtime (1 req/sec geocoding)
    const targetNctIds = nctIds.slice(0, 10);

    await loadStateLookups();

    let totalLocations = 0;
    let resolvedLocations = 0;
    let countyResolved = 0;
    const errors: string[] = [];

    for (const nctId of targetNctIds) {
      try {
        const { count } = await sb
          .from("normalized_locations")
          .select("id", { count: "exact", head: true })
          .eq("nct_id", nctId);
        if ((count ?? 0) > 0) continue;

        const ctgRes = await fetch(
          `${CTG_BASE}/studies/${nctId}?fields=ContactsLocationsModule&format=json`,
          { headers: { Accept: "application/json" } },
        );
        if (!ctgRes.ok) {
          errors.push(`${nctId}: CTG ${ctgRes.status}`);
          continue;
        }
        const study = await ctgRes.json();
        const locs = (study.protocolSection?.contactsLocationsModule?.locations ?? []) as Array<{
          facility?: string; city?: string; state?: string; country?: string;
        }>;

        const cappedLocs = locs.slice(0, 30);
        totalLocations += cappedLocs.length;

        const rows = [];
        for (const loc of cappedLocs) {
          const country = (loc.country ?? "").trim();
          const city = (loc.city ?? "").trim();
          const state = (loc.state ?? "").trim();

          let geo: GeoHit;
          if (country.toLowerCase() === "united states" || country === "US") {
            geo = await resolveUSLocation(city, state);
            if (geo.method !== "unresolved") resolvedLocations++;
            if (geo.county_fips) countyResolved++;
          } else {
            geo = {
              county_fips: null, county_name: null,
              state_code: state || null, zip3: null,
              method: "unresolved", confidence: 0,
            };
          }

          rows.push({
            nct_id: nctId,
            raw_facility: loc.facility ?? null,
            raw_city: city || null,
            raw_state: state || null,
            raw_country: country || "Unknown",
            state_code: geo.state_code,
            county_name: geo.county_name,
            county_fips: geo.county_fips,
            zip3: geo.zip3,
            resolution_method: geo.method,
            resolution_confidence: geo.confidence,
          });
        }

        if (rows.length > 0) {
          const { error: insErr } = await sb.from("normalized_locations").insert(rows);
          if (insErr) errors.push(`${nctId}: insert ${insErr.message}`);
        }
      } catch (e) {
        errors.push(`${nctId}: ${e instanceof Error ? e.message : "ex"}`);
      }
    }

    return json({
      ok: true,
      cohortId,
      processedTrials: targetNctIds.length,
      totalTrialsInCohort: nctIds.length,
      totalLocations,
      resolvedLocations,
      countyResolved,
      countyResolutionRate: totalLocations > 0 ? Math.round((countyResolved / totalLocations) * 100) : 0,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    console.error("ctg-normalize-locations error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
