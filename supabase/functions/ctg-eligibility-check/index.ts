// ── AI eligibility self-check ──
// Accepts: { nctId, files: [{ name, mimeType, dataBase64 }], notes?, sessionId }
// Returns: per-checklist-item verdict (likely_meets | unclear | likely_does_not_meet)
//   plus an overall signal.
//
// HARD RULES:
// - Files are NEVER persisted (no storage bucket touched).
// - We log only the structured outcome to eligibility_checks for analytics.
// - Output is framed as "informational, talk to your doctor" — never a medical
//   recommendation or a definitive yes/no.
// - Uses cached plain_language_trials.doc_checklist + the trial's eligibility
//   criteria as the rubric. The model only checks docs against THAT rubric —
//   it does not search the web or invent criteria.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash"; // multimodal; can read images / pdf pages
const MAX_FILES = 6;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024; // 8 MB combined

const ipMinuteCount = new Map<string, { count: number; resetAt: number }>();
const MINUTE_CAP = 4;

function checkRateLimit(ip: string): { ok: boolean; reason?: string } {
  const now = Date.now();
  const m = ipMinuteCount.get(ip);
  if (!m || now > m.resetAt) {
    ipMinuteCount.set(ip, { count: 1, resetAt: now + 60_000 });
    return { ok: true };
  }
  m.count += 1;
  if (m.count > MINUTE_CAP) return { ok: false, reason: `Slow down — max ${MINUTE_CAP} eligibility checks per minute.` };
  return { ok: true };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You are an assistant helping a patient (or their family) self-check whether the documents they have *might* indicate they meet a clinical trial's eligibility criteria. You are NOT a doctor and you NEVER make a medical recommendation.

STRICT RULES:
- For each checklist item provided, return one of three verdicts:
   - "likely_meets" — the documents clearly mention info matching the criterion.
   - "likely_does_not_meet" — the documents clearly contradict the criterion.
   - "unclear" — the documents do not contain enough information to judge.
- DEFAULT to "unclear" when in doubt. Never guess.
- For each item, return a "evidence" field (≤140 chars): one short, neutral sentence that quotes or paraphrases what the document said. Empty string if no evidence.
- Never recommend joining or avoiding the trial.
- Never invent eligibility criteria not in the input.
- Always end with: "Final eligibility must be confirmed by the trial site's medical team."
- Return JSON only:
{
  "items": [{"label": "string (echo back)", "verdict": "likely_meets|unclear|likely_does_not_meet", "evidence": "string"}],
  "overall_signal": "likely_eligible|unclear|likely_not_eligible|no_docs",
  "summary": "string (≤200 chars, neutral)"
}`;

interface FilePayload { name: string; mimeType: string; dataBase64: string }
interface ReqBody {
  nctId: string;
  sessionId?: string;
  notes?: string;
  files: FilePayload[];
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

    const body = (await req.json()) as ReqBody;
    const nctId = (body.nctId ?? "").trim().toUpperCase();
    if (!/^NCT\d{8}$/.test(nctId)) return json({ error: "Invalid NCT ID" }, 400);

    const files = Array.isArray(body.files) ? body.files.slice(0, MAX_FILES) : [];
    const totalBytes = files.reduce((s, f) => s + Math.ceil((f.dataBase64?.length ?? 0) * 0.75), 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return json({ error: `Combined files exceed ${MAX_TOTAL_BYTES / 1024 / 1024} MB` }, 413);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Pull cached plain-language record (must already exist with doc_checklist)
    const { data: pl } = await supabase
      .from("plain_language_trials")
      .select("doc_checklist, plain_eligibility")
      .eq("nct_id", nctId)
      .maybeSingle();

    let checklist: Array<{ label: string; why?: string }> = [];
    if (pl?.doc_checklist && Array.isArray(pl.doc_checklist) && pl.doc_checklist.length > 0) {
      checklist = pl.doc_checklist as any;
    } else {
      // Fallback: pull eligibility criteria from CTG and ask AI to derive a checklist on-the-fly.
      const r = await fetch(`${CTG_BASE}/studies/${nctId}?format=json`);
      if (!r.ok) return json({ error: "Could not load trial criteria" }, 502);
      const study = await r.json();
      const criteria = study?.protocolSection?.eligibilityModule?.eligibilityCriteria ?? "";
      if (!criteria) return json({ error: "Trial has no published eligibility criteria" }, 400);
      checklist = [{ label: "General eligibility criteria", why: criteria.slice(0, 500) }];
    }

    // No files? Return the checklist with all items "no_docs"
    if (files.length === 0) {
      return json({
        items: checklist.map((c) => ({ label: c.label, verdict: "no_docs", evidence: "" })),
        overall_signal: "no_docs",
        summary: "Upload up to 6 documents (pathology, imaging report, treatment history) so the AI can compare them to this trial's criteria. Nothing is stored.",
        disclaimer: "Final eligibility must be confirmed by the trial site's medical team.",
      });
    }

    // Build multimodal message content for the AI.
    const contentParts: any[] = [
      {
        type: "text",
        text: `Trial: ${nctId}\n\nCHECKLIST (the items to evaluate):\n${checklist.map((c, i) => `${i + 1}. ${c.label}${c.why ? ` — why: ${c.why}` : ""}`).join("\n")}\n\nELIGIBILITY (background context, do not re-derive):\n${(pl?.plain_eligibility ?? "").slice(0, 800)}\n\nUSER NOTES: ${(body.notes ?? "").slice(0, 400) || "(none)"}\n\nNow review the attached documents and return JSON per the rules.`,
      },
    ];

    for (const f of files) {
      const mime = f.mimeType || "application/octet-stream";
      // Gemini supports image_url with data URLs for images and PDFs
      if (mime.startsWith("image/") || mime === "application/pdf") {
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${mime};base64,${f.dataBase64}` },
        });
      } else if (mime.startsWith("text/")) {
        // Inline text directly (truncate to keep prompt sane)
        try {
          const decoded = atob(f.dataBase64).slice(0, 8000);
          contentParts.push({ type: "text", text: `--- File: ${f.name} ---\n${decoded}` });
        } catch { /* skip */ }
      }
    }

    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contentParts },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "AI rate limited, try again in a moment" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiRes.ok) return json({ error: `AI error ${aiRes.status}` }, 502);

    const aiBody = await aiRes.json();
    const text = aiBody.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch { return json({ error: "AI returned malformed JSON" }, 502); }

    const items = Array.isArray(parsed.items)
      ? parsed.items.slice(0, 8).map((it: any) => ({
          label: String(it.label ?? "").slice(0, 120),
          verdict: ["likely_meets","unclear","likely_does_not_meet","no_docs"].includes(it.verdict) ? it.verdict : "unclear",
          evidence: String(it.evidence ?? "").slice(0, 200),
        }))
      : [];
    const overall = ["likely_eligible","unclear","likely_not_eligible","no_docs"].includes(parsed.overall_signal)
      ? parsed.overall_signal
      : "unclear";
    const summary = String(parsed.summary ?? "").slice(0, 400);

    // Log structured outcome only — never the file content.
    if (body.sessionId) {
      await supabase.from("eligibility_checks").insert({
        session_id: body.sessionId,
        nct_id: nctId,
        files_count: files.length,
        total_bytes: totalBytes,
        checklist: items,
        overall_signal: overall,
        notes: (body.notes ?? "").slice(0, 1000) || null,
      });
    }

    return json({
      items,
      overall_signal: overall,
      summary,
      disclaimer: "Final eligibility must be confirmed by the trial site's medical team. This is not medical advice.",
    });
  } catch (err) {
    console.error("ctg-eligibility-check error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
