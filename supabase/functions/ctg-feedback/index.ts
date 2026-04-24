// ── Search Registry: learning-signal ingest ──
// Single endpoint that captures all customer interaction signals so the
// platform can adapt over time. Writes to RLS-locked tables via service role.
//
// Accepted event types:
//   • interaction      → click on result card, dwell, or CTG.gov deep-link follow
//   • feedback         → thumbs up/down + optional reason on a single result
//   • outcome          → end-of-session "was this useful?" rating + optional testimonial
//   • refinement       → user pivoted from one query to another inside the same session
//
// Guardrails:
//   • Rate limit per IP: 60 events / minute (more lenient than search; events are cheap)
//   • Payload <2KB
//   • All writes are best-effort: silently no-op on failure (never block UX)

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const ipMinute = new Map<string, { count: number; resetAt: number }>();
const MINUTE_CAP = 60;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const m = ipMinute.get(ip);
  if (!m || now > m.resetAt) {
    ipMinute.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  m.count += 1;
  return m.count <= MINUTE_CAP;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";
    if (!rateLimit(ip)) return json({ error: "Rate limited" }, 429);

    const raw = await req.text();
    if (raw.length > 2048) return json({ error: "Payload too large" }, 413);

    const body = JSON.parse(raw);
    const type = String(body.type ?? "");
    const sessionId = String(body.sessionId ?? "").slice(0, 64);
    if (!sessionId) return json({ error: "sessionId required" }, 400);

    switch (type) {
      case "interaction": {
        const eventType = String(body.eventType ?? "");
        if (!["card_click", "ctg_link_click", "dwell"].includes(eventType)) {
          return json({ error: "invalid eventType" }, 400);
        }
        await sb.from("result_interactions").insert({
          search_event_id: body.searchEventId ?? null,
          session_id: sessionId,
          nct_id: String(body.nctId ?? "").slice(0, 32),
          rank_position: Number.isFinite(body.rankPosition) ? body.rankPosition : null,
          semantic_score: Number.isFinite(body.semanticScore) ? body.semanticScore : null,
          event_type: eventType,
          dwell_ms: Number.isFinite(body.dwellMs) ? body.dwellMs : null,
        });
        break;
      }
      case "feedback": {
        const rating = String(body.rating ?? "");
        if (!["up", "down"].includes(rating)) return json({ error: "invalid rating" }, 400);
        await sb.from("result_feedback").insert({
          search_event_id: body.searchEventId ?? null,
          session_id: sessionId,
          nct_id: String(body.nctId ?? "").slice(0, 32),
          rating,
          reason: body.reason ? String(body.reason).slice(0, 280) : null,
        });
        break;
      }
      case "outcome": {
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          return json({ error: "rating 1-5 required" }, 400);
        }
        // Upsert by session
        await sb.from("session_outcomes").upsert({
          session_id: sessionId,
          rating,
          testimonial: body.testimonial ? String(body.testimonial).slice(0, 500) : null,
          role: body.role ? String(body.role).slice(0, 80) : null,
          use_case: body.useCase ? String(body.useCase).slice(0, 120) : null,
          consent_to_show: !!body.consentToShow,
        }, { onConflict: "session_id" });
        break;
      }
      case "refinement": {
        await sb.from("search_refinements").insert({
          session_id: sessionId,
          prior_search_event_id: body.priorSearchEventId ?? null,
          next_search_event_id: body.nextSearchEventId ?? null,
          prior_query: body.priorQuery ? String(body.priorQuery).slice(0, 200) : null,
          next_query: body.nextQuery ? String(body.nextQuery).slice(0, 200) : null,
          seconds_between: Number.isFinite(body.secondsBetween) ? body.secondsBetween : null,
        });
        break;
      }
      default:
        return json({ error: "unknown type" }, 400);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("ctg-feedback error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
