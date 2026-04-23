// ── ClinicalTrials.gov v2 API proxy ──
// Public API, no auth required. We proxy to enable caching, rate-limiting,
// and consistent shaping for the frontend. Returns real trial data only —
// never fabricated.
//
// Docs: https://clinicaltrials.gov/data-api/api

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";

interface Query {
  condition?: string;          // e.g. "GLP-1" or "non-small cell lung cancer"
  pageSize?: number;           // 1..1000
  pageToken?: string;
  status?: string;             // RECRUITING | COMPLETED | ACTIVE_NOT_RECRUITING | ...
  phase?: string;              // PHASE1 | PHASE2 | PHASE3 | PHASE4
  countryUS?: boolean;         // restrict to US sites
  fields?: string;             // comma-separated v2 field paths
}

const DEFAULT_FIELDS = [
  "NCTId",
  "BriefTitle",
  "OfficialTitle",
  "OverallStatus",
  "Phase",
  "StudyType",
  "Condition",
  "InterventionName",
  "InterventionType",
  "LeadSponsorName",
  "LeadSponsorClass",
  "EnrollmentCount",
  "StartDate",
  "PrimaryCompletionDate",
  "CompletionDate",
  "LocationFacility",
  "LocationCity",
  "LocationState",
  "LocationCountry",
  "LocationStatus",
  "OverallOfficialName",
  "OverallOfficialAffiliation",
  "OverallOfficialRole",
].join("|");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q: Query = {
      condition: url.searchParams.get("condition") ?? undefined,
      pageSize: Number(url.searchParams.get("pageSize") ?? "50"),
      pageToken: url.searchParams.get("pageToken") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      phase: url.searchParams.get("phase") ?? undefined,
      countryUS: url.searchParams.get("countryUS") === "true",
      fields: url.searchParams.get("fields") ?? undefined,
    };

    if (!q.condition) {
      return json({ error: "condition is required" }, 400);
    }

    const params = new URLSearchParams();
    params.set("query.cond", q.condition);
    params.set("pageSize", String(Math.min(Math.max(q.pageSize ?? 50, 1), 200)));
    params.set("format", "json");
    params.set("countTotal", "true");

    // Build advanced filter
    const filters: string[] = [];
    if (q.status) filters.push(`AREA[OverallStatus]${q.status}`);
    if (q.phase) filters.push(`AREA[Phase]${q.phase}`);
    if (q.countryUS) filters.push(`AREA[LocationCountry]United States`);
    if (filters.length) params.set("filter.advanced", filters.join(" AND "));

    if (q.pageToken) params.set("pageToken", q.pageToken);
    if (q.fields) params.set("fields", q.fields);

    const upstream = `${CTG_BASE}/studies?${params.toString()}`;
    const res = await fetch(upstream, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      const body = await res.text();
      return json(
        { error: `CTG.gov API error [${res.status}]`, detail: body.slice(0, 500) },
        res.status,
      );
    }

    const data = await res.json();

    // Cache at the edge for 1h — trial data does not change second-by-second
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("ctg-trials error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
