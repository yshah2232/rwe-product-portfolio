// Owner-gated cohort deletion. Validates session_id ownership using the service
// role, then deletes the cohort (cohort_trials cascades). Replaces direct
// client-side DELETE which used overly permissive RLS.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const cohortId = (body.cohortId ?? "").toString().trim();
    const sessionId = (body.sessionId ?? "").toString().trim().slice(0, 64);

    if (!cohortId) return json({ error: "cohortId is required" }, 400);
    if (!sessionId) return json({ error: "sessionId is required" }, 400);

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: cohort, error: cErr } = await sb
      .from("saved_cohorts")
      .select("id, session_id")
      .eq("id", cohortId)
      .maybeSingle();

    if (cErr) return json({ error: "Lookup failed" }, 500);
    if (!cohort) return json({ error: "Cohort not found" }, 404);
    if (cohort.session_id !== sessionId) {
      return json({ error: "Not owner of this cohort" }, 403);
    }

    const { error: delErr } = await sb.from("saved_cohorts").delete().eq("id", cohortId);
    if (delErr) return json({ error: "Delete failed" }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
