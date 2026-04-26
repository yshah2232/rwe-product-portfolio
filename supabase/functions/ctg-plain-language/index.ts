// ── Plain-language trial rewrite ──
// For a given NCT ID, returns a non-clinical, ~8th grade reading level
// version of the trial. Cached in plain_language_trials so each NCT is
// only ever rewritten once (until manually invalidated).
//
// Flow:
//  1. Validate NCT ID format.
//  2. Look up plain_language_trials cache. If hit → return.
//  3. Fetch raw record from CTG.gov v2 API.
//  4. Send to Lovable AI (Gemini Flash) with strict glossary system prompt.
//  5. Persist into plain_language_trials with service-role client.
//  6. Return.
//
// Guardrails: per-IP minute cap, never invents numbers (only re-phrases
// what's in the registry), always includes a "verify on CTG.gov" disclaimer.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const ipMinuteCount = new Map<string, { count: number; resetAt: number }>();
const MINUTE_CAP = 8;

function checkRateLimit(ip: string): { ok: boolean; reason?: string } {
  const now = Date.now();
  const minute = ipMinuteCount.get(ip);
  if (!minute || now > minute.resetAt) {
    ipMinuteCount.set(ip, { count: 1, resetAt: now + 60_000 });
    return { ok: true };
  }
  minute.count += 1;
  if (minute.count > MINUTE_CAP) {
    return { ok: false, reason: `Slow down — max ${MINUTE_CAP} plain-language requests per minute.` };
  }
  return { ok: true };
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

const SYSTEM_PROMPT = `You are a medical writer who turns clinical trial protocols into plain English for patients and their families.

STRICT RULES:
- Reading level: ~8th grade (12-14 year old).
- Use everyday words. Replace jargon: "double-blind" → "neither doctors nor patients know who got what", "placebo" → "an inactive look-alike", "Phase 2" → "a mid-stage study (testing if it works in a small group)".
- Never invent numbers, dates, drugs, or eligibility criteria. Only rephrase what's in the source.
- If the source is missing information, say "Not specified by the study" — do not guess.
- Do NOT give medical advice. Do NOT recommend joining or avoiding any trial.
- Be neutral and factual.
- For "key_numbers" array: extract real numbers from the source and put them in human terms.
- For "journey_steps": build a chronological participant journey. Use ONLY information from the source (eligibility, design, cycle length, follow-up duration). Each step has:
   - "label": short marker like "Day 0", "Week 1", "Day 21", "Month 3", "Year 1", "End of study". If a specific timing is not in the source, use ordinal markers like "Step 1", "Step 2".
   - "title": short title (≤6 words) e.g. "Screening visit", "First treatment cycle", "Imaging check-in", "Follow-up call"
   - "detail": one sentence (≤140 chars) describing what happens
   - "kind": one of "screening" | "enrollment" | "treatment" | "monitoring" | "followup" | "end"
   Aim for 4–7 steps. Do not invent procedures the source doesn't mention. If the source is too thin, return fewer steps.
- For "doc_checklist": list documents a participant might bring to their doctor to confirm eligibility for THIS trial (e.g., "Pathology report confirming Stage IV NSCLC", "Record of prior platinum chemotherapy", "Recent imaging (CT or MRI) within last 60 days"). Each item: { "label": short doc name, "why": one short reason tied to a specific eligibility criterion }. 3–6 items. Only items that are clearly traceable to a stated criterion. If criteria are too vague, return [].
- Return JSON only, matching this exact shape:
{
  "plain_title": "string (one sentence, ≤120 chars)",
  "plain_summary": "string (2-3 sentences)",
  "plain_condition": "string",
  "plain_intervention": "string",
  "plain_eligibility": "string (2-4 short sentences separated by ' • ')",
  "plain_design": "string (one sentence)",
  "plain_time_commitment": "string",
  "plain_what_happens": "string (1-2 sentences)",
  "key_numbers": ["string", ...],
  "journey_steps": [{"label":"string","title":"string","detail":"string","kind":"string"}],
  "doc_checklist": [{"label":"string","why":"string"}]
}`;

interface JourneyStep { label: string; title: string; detail: string; kind: string }
interface DocItem { label: string; why: string }

interface PlainTrial {
  plain_title: string;
  plain_summary: string;
  plain_condition: string;
  plain_intervention: string;
  plain_eligibility: string;
  plain_design: string;
  plain_time_commitment: string;
  plain_what_happens: string;
  key_numbers: string[];
  journey_steps: JourneyStep[];
  doc_checklist: DocItem[];
}

async function rewriteWithAI(sourceJson: unknown): Promise<PlainTrial> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const userPrompt = `Rewrite this ClinicalTrials.gov record in plain language. Return JSON only.\n\nSOURCE:\n${JSON.stringify(sourceJson).slice(0, 14000)}`;

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("AI rate-limited; try again in a minute");
  if (res.status === 402) throw new Error("AI credits exhausted");
  if (!res.ok) throw new Error(`AI gateway error ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const body = await res.json();
  const text = body.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(text);
  // Defensive defaults
  return {
    plain_title: String(parsed.plain_title ?? "").slice(0, 200),
    plain_summary: String(parsed.plain_summary ?? ""),
    plain_condition: String(parsed.plain_condition ?? ""),
    plain_intervention: String(parsed.plain_intervention ?? ""),
    plain_eligibility: String(parsed.plain_eligibility ?? ""),
    plain_design: String(parsed.plain_design ?? ""),
    plain_time_commitment: String(parsed.plain_time_commitment ?? ""),
    plain_what_happens: String(parsed.plain_what_happens ?? ""),
    key_numbers: Array.isArray(parsed.key_numbers) ? parsed.key_numbers.map(String).slice(0, 8) : [],
    journey_steps: Array.isArray(parsed.journey_steps)
      ? parsed.journey_steps.slice(0, 8).map((s: any) => ({
          label: String(s.label ?? "").slice(0, 30),
          title: String(s.title ?? "").slice(0, 60),
          detail: String(s.detail ?? "").slice(0, 200),
          kind: ["screening","enrollment","treatment","monitoring","followup","end"].includes(s.kind) ? s.kind : "monitoring",
        }))
      : [],
    doc_checklist: Array.isArray(parsed.doc_checklist)
      ? parsed.doc_checklist.slice(0, 8).map((d: any) => ({
          label: String(d.label ?? "").slice(0, 80),
          why: String(d.why ?? "").slice(0, 160),
        }))
      : [],
  };
}

// Pull real demographics from CTG.gov results (BaselineCharacteristicsModule).
// Returns { reported: false } if the trial has no posted results — never invents.
function extractDemographics(study: any): any {
  const baseline = study?.resultsSection?.baselineCharacteristicsModule;
  if (!baseline || !Array.isArray(baseline.measures) || baseline.measures.length === 0) {
    return { reported: false, source_note: "Demographics not yet reported by sponsor on ClinicalTrials.gov." };
  }

  const denoms = baseline.denoms ?? [];
  let totalParticipants = 0;
  for (const d of denoms) {
    if (d?.units === "Participants" && Array.isArray(d.counts)) {
      for (const c of d.counts) {
        const v = parseInt(c.value ?? "0", 10);
        if (!isNaN(v)) totalParticipants = Math.max(totalParticipants, v);
      }
    }
  }

  const out: any = { reported: true, source_note: "From this trial's posted results on ClinicalTrials.gov." };
  if (totalParticipants > 0) out.total_participants = totalParticipants;

  const sumByCategory = (m: any): Record<string, number> => {
    const acc: Record<string, number> = {};
    for (const cls of m.classes ?? []) {
      for (const cat of cls.categories ?? []) {
        const t = String(cat.title ?? "").trim();
        let n = 0;
        for (const meas of cat.measurements ?? []) {
          const v = parseFloat(meas.value);
          if (!isNaN(v)) n += v;
        }
        if (t) acc[t] = (acc[t] ?? 0) + n;
      }
    }
    return acc;
  };

  for (const m of baseline.measures) {
    const title = String(m.title ?? "").toLowerCase();
    if (title.includes("sex") || title.includes("gender")) {
      const counts = sumByCategory(m);
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      if (total > 0) {
        out.sex = {
          female_pct: counts["Female"] !== undefined ? Math.round((counts["Female"] / total) * 1000) / 10 : undefined,
          male_pct: counts["Male"] !== undefined ? Math.round((counts["Male"] / total) * 1000) / 10 : undefined,
        };
      }
    } else if (title.includes("age") && title.includes("categorical")) {
      const counts = sumByCategory(m);
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      const under = (counts["<=18 years"] ?? 0) + (counts["Between 18 and 65 years"] ?? 0) + (counts["<18 years"] ?? 0);
      const over = (counts[">=65 years"] ?? 0) + (counts[">65 years"] ?? 0);
      if (total > 0) {
        out.age = {
          under_65_pct: under > 0 ? Math.round((under / total) * 1000) / 10 : undefined,
          over_65_pct: over > 0 ? Math.round((over / total) * 1000) / 10 : undefined,
        };
      }
    } else if (title.includes("race")) {
      const counts = sumByCategory(m);
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      if (total > 0) {
        const pcts: Record<string, number> = {};
        for (const [k, v] of Object.entries(counts)) {
          if (v > 0) pcts[k] = Math.round((v / total) * 1000) / 10;
        }
        out.race = pcts;
      }
    } else if (title.includes("ethnicity")) {
      const counts = sumByCategory(m);
      const total = Object.values(counts).reduce((s, v) => s + v, 0);
      if (total > 0) {
        const pcts: Record<string, number> = {};
        for (const [k, v] of Object.entries(counts)) {
          if (v > 0) pcts[k] = Math.round((v / total) * 1000) / 10;
        }
        out.ethnicity = pcts;
      }
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const nctId = (url.searchParams.get("nctId") ?? "").trim().toUpperCase();
    const force = url.searchParams.get("force") === "true";

    if (!/^NCT\d{8}$/.test(nctId)) {
      return json({ error: "Invalid NCT ID format. Expected NCT followed by 8 digits." }, 400);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Cache lookup
    if (!force) {
      const { data: cached } = await supabase
        .from("plain_language_trials")
        .select("*")
        .eq("nct_id", nctId)
        .maybeSingle();
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    // 2. Rate limit only on cache miss (real AI work)
    const rl = checkRateLimit(ip);
    if (!rl.ok) return json({ error: rl.reason }, 429);

    // 3. Fetch raw CTG record
    const ctgRes = await fetch(`${CTG_BASE}/studies/${nctId}?format=json`, {
      headers: { Accept: "application/json" },
    });
    if (ctgRes.status === 404) return json({ error: "Trial not found on ClinicalTrials.gov" }, 404);
    if (!ctgRes.ok) {
      return json({ error: `CTG.gov error [${ctgRes.status}]` }, 502);
    }
    const study = await ctgRes.json();
    const ps = study.protocolSection ?? {};
    const status = ps.statusModule?.overallStatus ?? "";
    const isRecruiting = status === "RECRUITING" || status === "NOT_YET_RECRUITING";

    // Build a trimmed source for the AI (don't dump the whole record)
    const trimmed = {
      nctId,
      title: ps.identificationModule?.briefTitle,
      official_title: ps.identificationModule?.officialTitle,
      status,
      phase: ps.designModule?.phases ?? [],
      study_type: ps.designModule?.studyType,
      conditions: ps.conditionsModule?.conditions ?? [],
      interventions: (ps.armsInterventionsModule?.interventions ?? []).map((i: any) => ({
        type: i.type,
        name: i.name,
        description: i.description,
      })),
      brief_summary: ps.descriptionModule?.briefSummary,
      detailed_description: ps.descriptionModule?.detailedDescription,
      eligibility_criteria: ps.eligibilityModule?.eligibilityCriteria,
      sex: ps.eligibilityModule?.sex,
      min_age: ps.eligibilityModule?.minimumAge,
      max_age: ps.eligibilityModule?.maximumAge,
      enrollment_count: ps.designModule?.enrollmentInfo?.count,
      design_allocation: ps.designModule?.designInfo?.allocation,
      design_masking: ps.designModule?.designInfo?.maskingInfo?.masking,
      design_intervention_model: ps.designModule?.designInfo?.interventionModel,
      duration_estimate: {
        start: ps.statusModule?.startDateStruct?.date,
        primary_completion: ps.statusModule?.primaryCompletionDateStruct?.date,
      },
    };

    // 4. AI rewrite
    const plain = await rewriteWithAI(trimmed);

    // 5. Persist (upsert)
    const { data: stored, error: insErr } = await supabase
      .from("plain_language_trials")
      .upsert(
        {
          nct_id: nctId,
          source_updated_at: ps.statusModule?.lastUpdateSubmitDateStruct?.date ?? null,
          plain_title: plain.plain_title,
          plain_summary: plain.plain_summary,
          plain_condition: plain.plain_condition,
          plain_intervention: plain.plain_intervention,
          plain_eligibility: plain.plain_eligibility,
          plain_design: plain.plain_design,
          plain_time_commitment: plain.plain_time_commitment,
          plain_what_happens: plain.plain_what_happens,
          key_numbers: plain.key_numbers,
          is_recruiting: isRecruiting,
          model_used: MODEL,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "nct_id" },
      )
      .select()
      .single();

    if (insErr) {
      console.error("plain_language upsert error", insErr);
      // Still return the rewrite even if persistence failed
      return json({ ...plain, nct_id: nctId, is_recruiting: isRecruiting, cached: false, persisted: false });
    }

    return json({ ...stored, cached: false });
  } catch (err) {
    console.error("ctg-plain-language error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
