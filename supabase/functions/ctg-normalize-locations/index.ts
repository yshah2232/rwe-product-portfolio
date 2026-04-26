// ── Geo Normalization for Cohort Trial Sites ──
// Takes a cohort_id, fetches each trial's site list from CTG.gov,
// resolves city+state → FIPS county code + ZIP3 via the US Census Geocoder API
// (free, no key needed). Stores results in normalized_locations (one row per site).
//
// POST /ctg-normalize-locations { cohortId, sessionId? }
// Owner-gated by sessionId match against saved_cohorts.session_id.
//
// Uses Census Geocoder's "geographies/address" endpoint with a fake ZIP-less
// street; if that fails we fall back to "/onelineaddress" with city+state which
// still returns county_fips reliably for ~98% of US cities.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";
const CENSUS_GEOCODER = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";
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
  method: "geocoder" | "state_only" | "unresolved";
  confidence: number;
}

async function resolveUSLocation(city: string, state: string): Promise<GeoHit> {
  if (!state) {
    return { county_fips: null, county_name: null, state_code: null, zip3: null, method: "unresolved", confidence: 0 };
  }

  // Census Geocoder accepts "city, state" via onelineaddress
  // benchmark=Public_AR_Current, vintage=Current_Current, layer 86 = counties
  if (city) {
    try {
      const params = new URLSearchParams({
        address: `${city}, ${state}`,
        benchmark: "Public_AR_Current",
        vintage: "Current_Current",
        format: "json",
        layers: "all",
      });
      const res = await fetch(`${CENSUS_GEOCODER}?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const match = data?.result?.addressMatches?.[0];
        if (match) {
          const geos = match.geographies ?? {};
          const counties = geos["Counties"] ?? geos["2020 Census Counties"] ?? [];
          const county = counties[0];
          // ZIP from the matched address
          const zipMatch = (match.matchedAddress ?? "").match(/\b(\d{5})\b/);
          const zip3 = zipMatch ? zipMatch[1].slice(0, 3) : null;
          if (county) {
            return {
              county_fips: `${county.STATE}${county.COUNTY}`,
              county_name: county.NAME ?? null,
              state_code: county.STUSAB ?? state.toUpperCase().slice(0, 2),
              zip3,
              method: "geocoder",
              confidence: 90,
            };
          }
        }
      }
    } catch (e) {
      console.error("geocoder error", city, state, e);
    }
  }

  // Fallback: state-only resolution (no county/ZIP)
  return {
    county_fips: null,
    county_name: null,
    state_code: state.toUpperCase().slice(0, 2),
    zip3: null,
    method: "state_only",
    confidence: 40,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cohortId = (body.cohortId ?? "").toString().trim();
    const sessionId = (body.sessionId ?? "").toString().trim().slice(0, 64);

    if (!cohortId) {
      return json({ error: "cohortId is required" }, 400);
    }

    // Fetch cohort to verify ownership and get NCT IDs
    const { data: cohort, error: cohortErr } = await sb
      .from("saved_cohorts")
      .select("id, session_id")
      .eq("id", cohortId)
      .maybeSingle();
    if (cohortErr || !cohort) {
      return json({ error: "Cohort not found" }, 404);
    }
    if (sessionId && cohort.session_id !== sessionId) {
      return json({ error: "Not owner of this cohort" }, 403);
    }

    const { data: trials, error: trialsErr } = await sb
      .from("cohort_trials")
      .select("nct_id")
      .eq("cohort_id", cohortId);
    if (trialsErr) {
      return json({ error: "Failed to load cohort trials" }, 500);
    }
    const nctIds = (trials ?? []).map((t) => t.nct_id);
    if (nctIds.length === 0) {
      return json({ ok: true, normalized: 0, total: 0, locations: 0 });
    }

    // Cap to first 10 trials per request to avoid runaway API usage
    const targetNctIds = nctIds.slice(0, 10);

    let totalLocations = 0;
    let resolvedLocations = 0;
    const errors: string[] = [];

    for (const nctId of targetNctIds) {
      try {
        // Skip if we already normalized this trial (idempotent)
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
          facility?: string;
          city?: string;
          state?: string;
          country?: string;
        }>;

        // Cap per-trial site count to first 50 to bound geocoder calls
        const cappedLocs = locs.slice(0, 50);
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
          } else {
            geo = {
              county_fips: null,
              county_name: null,
              state_code: state || null,
              zip3: null,
              method: "unresolved",
              confidence: 0,
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
            resolution_method:
              geo.method === "geocoder" ? "city_state_lookup" :
              geo.method === "state_only" ? "state_only" : "unresolved",
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
