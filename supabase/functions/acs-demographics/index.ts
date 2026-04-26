// ── ACS Demographics Fetcher + Cache ──
// Pulls Census ACS 5-year data (B03002 race/ethnicity, B01001 age, B19013 income)
// for a given geography, caching results for 30 days.
//
// POST /acs-demographics { geos: [{ type: 'county'|'zip3'|'state'|'national', id: '06037' }] }
// Returns { results: [...], cacheStats: { hits, misses } }
//
// Census API: api.census.gov — no key required for low volume.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const CENSUS_BASE = "https://api.census.gov/data/2022/acs/acs5";
const ACS_YEAR = 2022;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ACS variables we need (subset of B03002 + B01001 + B19013)
const VARS = [
  "B03002_001E", // Total
  "B03002_003E", // White alone, non-Hispanic
  "B03002_004E", // Black alone, non-Hispanic
  "B03002_005E", // AIAN alone, non-Hispanic
  "B03002_006E", // Asian alone, non-Hispanic
  "B03002_007E", // NHPI alone, non-Hispanic
  "B03002_008E", // Some other race, non-Hispanic
  "B03002_009E", // Two or more, non-Hispanic
  "B03002_012E", // Hispanic or Latino
  // Age (B01001) — sum males + females
  "B01001_003E","B01001_004E","B01001_005E","B01001_006E", // M under 5..15-17
  "B01001_027E","B01001_028E","B01001_029E","B01001_030E", // F under 5..15-17
  "B01001_020E","B01001_021E","B01001_022E","B01001_023E","B01001_024E","B01001_025E", // M 65+
  "B01001_044E","B01001_045E","B01001_046E","B01001_047E","B01001_048E","B01001_049E", // F 65+
  "B19013_001E", // Median household income
];

interface GeoRequest { type: "county" | "zip3" | "state" | "national"; id: string; }

function buildCensusUrl(geo: GeoRequest): string | null {
  const get = `NAME,${VARS.join(",")}`;
  if (geo.type === "national") {
    return `${CENSUS_BASE}?get=${get}&for=us:1`;
  }
  if (geo.type === "state") {
    // state=FIPS state code (2 digits)
    return `${CENSUS_BASE}?get=${get}&for=state:${encodeURIComponent(geo.id)}`;
  }
  if (geo.type === "county") {
    // id is 5-digit FIPS: state(2)+county(3)
    const stateFips = geo.id.slice(0, 2);
    const countyFips = geo.id.slice(2);
    if (stateFips.length !== 2 || countyFips.length !== 3) return null;
    return `${CENSUS_BASE}?get=${get}&for=county:${countyFips}&in=state:${stateFips}`;
  }
  if (geo.type === "zip3") {
    // ZIP3 isn't a native Census geography. Approximate by querying the
    // first ZCTA5 starting with the ZIP3, then aggregate up to ZIP3 if needed.
    // For simplicity, query all ZCTAs (national) starting with that prefix.
    const zip3 = geo.id.padStart(3, "0").slice(0, 3);
    return `${CENSUS_BASE}?get=${get}&for=zip%20code%20tabulation%20area:${zip3}*`;
  }
  return null;
}

function parseRow(headers: string[], row: string[]) {
  const get = (col: string) => {
    const idx = headers.indexOf(col);
    if (idx < 0) return null;
    const v = row[idx];
    if (v === null || v === undefined || v === "" || v === "-") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const sum = (cols: string[]) =>
    cols.reduce((acc, c) => {
      const v = get(c);
      return v != null && v >= 0 ? acc + v : acc;
    }, 0);

  const total = get("B03002_001E");
  const pop_white_nh = get("B03002_003E");
  const pop_black_nh = get("B03002_004E");
  const pop_aian_nh = get("B03002_005E");
  const pop_asian_nh = get("B03002_006E");
  const pop_nhpi_nh = get("B03002_007E");
  const pop_other_nh = get("B03002_008E");
  const pop_multi_nh = get("B03002_009E");
  const pop_hispanic = get("B03002_012E");

  const pop_under18 = sum([
    "B01001_003E","B01001_004E","B01001_005E","B01001_006E",
    "B01001_027E","B01001_028E","B01001_029E","B01001_030E",
  ]);
  const pop_65plus = sum([
    "B01001_020E","B01001_021E","B01001_022E","B01001_023E","B01001_024E","B01001_025E",
    "B01001_044E","B01001_045E","B01001_046E","B01001_047E","B01001_048E","B01001_049E",
  ]);
  const pop_18_64 = total != null ? Math.max(0, total - pop_under18 - pop_65plus) : null;

  return {
    total_population: total,
    pop_white_nh, pop_black_nh, pop_asian_nh, pop_aian_nh, pop_nhpi_nh,
    pop_other_nh, pop_multi_nh, pop_hispanic,
    pop_age_under18: pop_under18,
    pop_age_18_64: pop_18_64,
    pop_age_65plus: pop_65plus,
    median_household_income: get("B19013_001E"),
  };
}

function aggregateRows(rows: ReturnType<typeof parseRow>[]) {
  // Sum populations; weight median income by total population.
  const out: Record<string, number | null> = {
    total_population: 0,
    pop_white_nh: 0, pop_black_nh: 0, pop_asian_nh: 0, pop_aian_nh: 0, pop_nhpi_nh: 0,
    pop_other_nh: 0, pop_multi_nh: 0, pop_hispanic: 0,
    pop_age_under18: 0, pop_age_18_64: 0, pop_age_65plus: 0,
  };
  let incomeWeightedSum = 0;
  let incomeWeightTotal = 0;
  for (const r of rows) {
    for (const k of Object.keys(out)) {
      const v = (r as any)[k];
      if (typeof v === "number" && v >= 0) (out[k] as number) += v;
    }
    if (r.median_household_income != null && r.total_population && r.total_population > 0) {
      incomeWeightedSum += r.median_household_income * r.total_population;
      incomeWeightTotal += r.total_population;
    }
  }
  return {
    ...out,
    median_household_income: incomeWeightTotal > 0 ? Math.round(incomeWeightedSum / incomeWeightTotal) : null,
  };
}

async function fetchOneGeo(geo: GeoRequest) {
  const url = buildCensusUrl(geo);
  if (!url) return { error: `Invalid geo ${geo.type}:${geo.id}` };
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    return { error: `Census ${res.status}` };
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2) {
    return { error: "Empty Census response" };
  }
  const headers = data[0] as string[];
  const rows = (data.slice(1) as string[][]).map((r) => parseRow(headers, r));
  const agg = rows.length === 1 ? rows[0] : aggregateRows(rows);
  return { url, ...agg };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const geos = (body.geos ?? []) as GeoRequest[];
    if (!Array.isArray(geos) || geos.length === 0) {
      return json({ error: "geos array is required" }, 400);
    }
    if (geos.length > 30) {
      return json({ error: "Max 30 geographies per request" }, 400);
    }

    const results: any[] = [];
    let hits = 0, misses = 0, errors = 0;

    for (const geo of geos) {
      if (!geo.id || !geo.type) continue;

      // 1. Cache lookup
      const { data: cached } = await sb
        .from("acs_cache")
        .select("*")
        .eq("geo_type", geo.type)
        .eq("geo_id", geo.id)
        .eq("acs_year", ACS_YEAR)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached) {
        hits++;
        results.push({ geo, cached: true, data: cached });
        continue;
      }

      // 2. Fetch from Census
      const fetched = await fetchOneGeo(geo);
      if ("error" in fetched && fetched.error) {
        errors++;
        results.push({ geo, error: fetched.error });
        continue;
      }
      misses++;

      // 3. Store in cache (upsert by unique key)
      const row = {
        geo_type: geo.type,
        geo_id: geo.id,
        acs_year: ACS_YEAR,
        total_population: (fetched as any).total_population,
        pop_white_nh: (fetched as any).pop_white_nh,
        pop_black_nh: (fetched as any).pop_black_nh,
        pop_asian_nh: (fetched as any).pop_asian_nh,
        pop_aian_nh: (fetched as any).pop_aian_nh,
        pop_nhpi_nh: (fetched as any).pop_nhpi_nh,
        pop_other_nh: (fetched as any).pop_other_nh,
        pop_multi_nh: (fetched as any).pop_multi_nh,
        pop_hispanic: (fetched as any).pop_hispanic,
        pop_age_under18: (fetched as any).pop_age_under18,
        pop_age_18_64: (fetched as any).pop_age_18_64,
        pop_age_65plus: (fetched as any).pop_age_65plus,
        median_household_income: (fetched as any).median_household_income,
        source_url: (fetched as any).url ?? CENSUS_BASE,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
      };
      const { data: upserted, error: upErr } = await sb
        .from("acs_cache")
        .upsert(row, { onConflict: "geo_type,geo_id,acs_year" })
        .select()
        .single();
      if (upErr) console.error("acs cache upsert", upErr);
      results.push({ geo, cached: false, data: upserted ?? row });
    }

    return json({ results, cacheStats: { hits, misses, errors }, acsYear: ACS_YEAR });
  } catch (err) {
    console.error("acs-demographics error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
