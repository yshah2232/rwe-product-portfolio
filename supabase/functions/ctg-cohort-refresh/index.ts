// ── Cohort refresh ──
// Re-pulls each NCT in a cohort from CTG.gov v2, applies canonicalization,
// upserts cohort_trials snapshots, bumps refreshed_at on saved_cohorts.
//
// Auth model: client passes { cohortId, sessionId }. Service role validates
// session_id matches the cohort's owner before writing. Cap of 200 trials per cohort.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { cleanSponsor, cleanIndication, cleanAsset } from "../_shared/canonicalize.ts";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const ipMinuteCount = new Map<string, { count: number; resetAt: number }>();
const MINUTE_CAP = 4;
const MAX_TRIALS = 200;

function checkRateLimit(ip: string): { ok: boolean; reason?: string } {
  const now = Date.now();
  const minute = ipMinuteCount.get(ip);
  if (!minute || now > minute.resetAt) {
    ipMinuteCount.set(ip, { count: 1, resetAt: now + 60_000 });
    return { ok: true };
  }
  minute.count += 1;
  if (minute.count > MINUTE_CAP) {
    return { ok: false, reason: `Slow down — max ${MINUTE_CAP} cohort refreshes per minute.` };
  }
  return { ok: true };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) return json({ error: rl.reason }, 429);

    const body = await req.json();
    const cohortId = String(body?.cohortId ?? "").trim();
    const sessionId = String(body?.sessionId ?? "").trim().slice(0, 64);
    if (!cohortId || !sessionId) return json({ error: "cohortId and sessionId required" }, 400);
    if (!/^[0-9a-f-]{36}$/i.test(cohortId)) return json({ error: "Invalid cohortId" }, 400);

    // 1. Validate ownership
    const { data: cohort, error: cohortErr } = await sb
      .from("saved_cohorts")
      .select("id, session_id")
      .eq("id", cohortId)
      .single();
    if (cohortErr || !cohort) return json({ error: "Cohort not found" }, 404);
    if (cohort.session_id !== sessionId) return json({ error: "Not authorized" }, 403);

    // 2. Pull current NCT list
    const { data: trials, error: trialsErr } = await sb
      .from("cohort_trials")
      .select("nct_id")
      .eq("cohort_id", cohortId);
    if (trialsErr) return json({ error: "Failed to read cohort trials" }, 500);
    const nctIds = (trials ?? []).map((t) => t.nct_id).slice(0, MAX_TRIALS);
    if (nctIds.length === 0) return json({ error: "Cohort is empty" }, 400);

    // 3. Pull each from CTG.gov (parallel, capped)
    const results = await Promise.allSettled(
      nctIds.map((nct) =>
        fetch(`${CTG_BASE}/studies/${nct}?format=json`).then((r) => (r.ok ? r.json() : null)),
      ),
    );

    let refreshed = 0;
    let failed = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const nct = nctIds[i];
      if (r.status !== "fulfilled" || !r.value) {
        failed += 1;
        continue;
      }
      const study = r.value;
      const ps = study.protocolSection ?? {};
      const id = ps.identificationModule ?? {};
      const status = ps.statusModule ?? {};
      const design = ps.designModule ?? {};
      const cond = ps.conditionsModule ?? {};
      const arms = ps.armsInterventionsModule ?? {};
      const sponsor = ps.sponsorCollaboratorsModule?.leadSponsor ?? {};
      const contacts = ps.contactsLocationsModule ?? {};
      const locs = (contacts.locations ?? []) as any[];

      const sponsorRaw = sponsor.name ?? "";
      const condsRaw: string[] = (cond.conditions ?? []) as string[];
      const intvRaw: string[] = ((arms.interventions ?? []) as any[]).map((i) => i.name).filter(Boolean);

      const sponsorClean = cleanSponsor(sponsorRaw).clean;
      const condsClean = condsRaw.map((c) => cleanIndication(c).clean);
      const intvClean = intvRaw.map((i) => cleanAsset(i).clean);

      const { error: upErr } = await sb
        .from("cohort_trials")
        .update({
          brief_title: id.briefTitle ?? null,
          overall_status: status.overallStatus ?? null,
          phase: (design.phases ?? []) as string[],
          sponsor_raw: sponsorRaw,
          sponsor_clean: sponsorClean,
          conditions_raw: condsRaw,
          conditions_clean: condsClean,
          interventions_raw: intvRaw,
          interventions_clean: intvClean,
          enrollment: design.enrollmentInfo?.count ?? null,
          countries: Array.from(new Set(locs.map((l: any) => l.country).filter(Boolean))) as string[],
        })
        .eq("cohort_id", cohortId)
        .eq("nct_id", nct);
      if (upErr) {
        console.error("update cohort_trial", nct, upErr);
        failed += 1;
      } else {
        refreshed += 1;
      }
    }

    await sb
      .from("saved_cohorts")
      .update({ refreshed_at: new Date().toISOString(), trial_count: nctIds.length })
      .eq("id", cohortId);

    return json({ ok: true, refreshed, failed, total: nctIds.length });
  } catch (err) {
    console.error("ctg-cohort-refresh error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
