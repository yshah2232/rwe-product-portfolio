// ── Semantic Trial Search ──
// Architecture B: CTG.gov v2 keyword search → LLM-as-reranker (semantic).
//
// Pipeline:
//   1. Validate + rate-limit request
//   2. Pull up to 25 candidate trials from CTG.gov v2 using the user's query
//      as the condition term + optional structured filters
//   3. Send the query + candidate titles/conditions to a cheap LLM
//      (gemini-2.5-flash-lite) which returns a relevance score 0-100 per NCT
//   4. Re-rank candidates by that score, return top 10 with score + reason
//
// GUARDRAILS (cost protection — this is a portfolio demo, not a SaaS):
//   • Query length: 3-200 chars
//   • Max candidates fetched: 25
//   • Max returned: 10
//   • Per-IP daily cap: 30 requests (in-memory; resets on cold start)
//   • Per-IP minute cap: 6 requests (burst protection)
//   • Edge cache: 1h on identical queries
//   • Single LLM call per search (not per trial)

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { cleanSponsor, cleanIndication, cleanAsset } from "../_shared/canonicalize.ts";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Hash an IP so we never store the raw value
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + "::ctg-salt");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

// ── In-memory rate limiter ──
// NOTE: edge functions can be cold-started, so this resets periodically.
// Acceptable for a portfolio demo; not production-grade.
const ipDailyCount = new Map<string, { count: number; resetAt: number }>();
const ipMinuteCount = new Map<string, { count: number; resetAt: number }>();
const DAILY_CAP = 30;
const MINUTE_CAP = 6;

function checkRateLimit(ip: string): { ok: boolean; reason?: string } {
  const now = Date.now();

  // Per-minute burst
  const minute = ipMinuteCount.get(ip);
  if (!minute || now > minute.resetAt) {
    ipMinuteCount.set(ip, { count: 1, resetAt: now + 60_000 });
  } else {
    minute.count += 1;
    if (minute.count > MINUTE_CAP) {
      return { ok: false, reason: `Slow down — max ${MINUTE_CAP} searches per minute.` };
    }
  }

  // Per-day cap
  const day = ipDailyCount.get(ip);
  if (!day || now > day.resetAt) {
    ipDailyCount.set(ip, { count: 1, resetAt: now + 86_400_000 });
  } else {
    day.count += 1;
    if (day.count > DAILY_CAP) {
      return { ok: false, reason: `Daily demo limit reached (${DAILY_CAP} searches). Try again tomorrow.` };
    }
  }

  return { ok: true };
}

interface RankedTrial {
  nctId: string;
  briefTitle: string;
  officialTitle: string;
  status: string;
  phase: string[];
  conditions: string[];
  conditionsClean: string[];
  interventions: string[];
  interventionsClean: string[];
  leadSponsor: string;
  leadSponsorClean: string;
  enrollment: number | null;
  startDate: string;
  countries: string[];
  semanticScore: number;
  semanticReason: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return json({ error: "Server misconfigured: LOVABLE_API_KEY missing" }, 500);
    }

    const url = new URL(req.url);
    const query = (url.searchParams.get("q") ?? "").trim();
    const phase = url.searchParams.get("phase") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const countryUS = url.searchParams.get("countryUS") === "true";
    const sessionId = (url.searchParams.get("sid") ?? "").trim().slice(0, 64) || crypto.randomUUID();
    const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 200);

    // ── Input validation ──
    if (query.length < 3) {
      return json({ error: "Query must be at least 3 characters." }, 400);
    }
    if (query.length > 200) {
      return json({ error: "Query too long (max 200 characters)." }, 400);
    }

    // ── Bot / scraper mitigation ──
    // Cheap, non-CAPTCHA filter that blocks the worst offenders BEFORE we
    // spend an LLM call. Real browsers always send a non-empty user-agent
    // and an Accept-Language header. Headless scrapers usually don't.
    const acceptLang = req.headers.get("accept-language") ?? "";
    const uaLower = userAgent.toLowerCase();
    const KNOWN_BOTS = [
      "bot", "crawler", "spider", "scrapy", "curl/", "wget", "python-requests",
      "httpclient", "axios/", "go-http-client", "java/", "okhttp", "headlesschrome",
      "phantomjs", "selenium", "puppeteer", "playwright",
    ];
    if (!userAgent || !acceptLang || KNOWN_BOTS.some((b) => uaLower.includes(b))) {
      // Silent 200 with empty results — don't tip off scrapers that we filtered them.
      return json({
        query, totalCount: 0, candidatesFetched: 0, results: [],
        sessionId, searchEventId: null,
        usage: { rateLimitRemaining: 0 },
      });
    }

    // ── Rate limit ──
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return json({ error: rl.reason }, 429);
    }

    // ── 1. Fetch candidates from CTG.gov ──
    // CTG's query.cond does keyword matching, not NL understanding.
    // We strip stopwords/filler so a natural-language query still finds candidates;
    // semantic re-rank then handles the meaning.
    const ctgQuery = simplifyForCTG(query);

    const ctgParams = new URLSearchParams();
    ctgParams.set("query.cond", ctgQuery);
    ctgParams.set("pageSize", "25");
    ctgParams.set("format", "json");
    ctgParams.set("countTotal", "true");

    const filters: string[] = [];
    if (status) filters.push(`AREA[OverallStatus]${status}`);
    if (phase) filters.push(`AREA[Phase]${phase}`);
    if (countryUS) filters.push(`AREA[LocationCountry]United States`);
    if (filters.length) ctgParams.set("filter.advanced", filters.join(" AND "));

    const ctgRes = await fetch(`${CTG_BASE}/studies?${ctgParams.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!ctgRes.ok) {
      const text = await ctgRes.text();
      return json({ error: `CTG.gov error [${ctgRes.status}]`, detail: text.slice(0, 300) }, 502);
    }
    const ctgData = await ctgRes.json();
    const studies = (ctgData.studies ?? []) as any[];
    const totalCount = ctgData.totalCount ?? studies.length;

    if (studies.length === 0) {
      return json({
        query,
        totalCount: 0,
        candidatesFetched: 0,
        results: [],
        usage: { rateLimitRemaining: DAILY_CAP - (ipDailyCount.get(ip)?.count ?? 0) },
      });
    }

    // ── 2. Shape candidates ──
    const candidates = studies.map((s) => {
      const id = s.protocolSection?.identificationModule ?? {};
      const status = s.protocolSection?.statusModule ?? {};
      const design = s.protocolSection?.designModule ?? {};
      const cond = s.protocolSection?.conditionsModule ?? {};
      const arms = s.protocolSection?.armsInterventionsModule ?? {};
      const sponsor = s.protocolSection?.sponsorCollaboratorsModule?.leadSponsor ?? {};
      const contacts = s.protocolSection?.contactsLocationsModule ?? {};
      const locs = (contacts.locations ?? []) as any[];

      const conditions = (cond.conditions ?? []) as string[];
      const interventions = (arms.interventions ?? []).map((i: any) => i.name).filter(Boolean) as string[];
      const sponsorRaw = sponsor.name ?? "";

      return {
        nctId: id.nctId ?? "",
        briefTitle: id.briefTitle ?? "",
        officialTitle: id.officialTitle ?? "",
        status: status.overallStatus ?? "",
        phase: (design.phases ?? []) as string[],
        conditions,
        conditionsClean: conditions.map((c) => cleanIndication(c).clean),
        interventions,
        interventionsClean: interventions.map((i) => cleanAsset(i).clean),
        leadSponsor: sponsorRaw,
        leadSponsorClean: cleanSponsor(sponsorRaw).clean,
        enrollment: design.enrollmentInfo?.count ?? null,
        startDate: status.startDateStruct?.date ?? "",
        countries: Array.from(new Set(locs.map((l: any) => l.country).filter(Boolean))) as string[],
      };
    });

    // ── 3. Single LLM call to score all candidates ──
    const compactList = candidates.map((c, idx) => ({
      idx,
      nct: c.nctId,
      title: c.briefTitle.slice(0, 200),
      conds: c.conditions.slice(0, 4).join("; ").slice(0, 160),
      intv: c.interventions.slice(0, 4).join("; ").slice(0, 160),
    }));

    const systemPrompt = `You are a clinical trial relevance scorer. Given a user's search intent and a list of trial candidates, score each candidate 0-100 for how well it matches the *meaning* of the query (not just keyword overlap). Consider synonyms, abbreviations, drug class relationships, disease equivalents, and clinical context. Be strict: 90+ only for excellent matches, 60-89 for solid matches, 30-59 for tangential, <30 for poor matches.`;

    const userPrompt = `User query: "${query}"

Candidates:
${compactList
  .map((c) => `[${c.idx}] ${c.nct} | ${c.title} | conditions: ${c.conds} | interventions: ${c.intv}`)
  .join("\n")}

Return a relevance score and a one-sentence reason for each candidate.`;

    const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_candidates",
              description: "Return a relevance score and reason for each candidate trial.",
              parameters: {
                type: "object",
                properties: {
                  rankings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        idx: { type: "integer" },
                        score: { type: "integer", minimum: 0, maximum: 100 },
                        reason: { type: "string" },
                      },
                      required: ["idx", "score", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["rankings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_candidates" } },
      }),
    });

    if (llmRes.status === 429) {
      return json({ error: "AI gateway rate limit. Try again in a moment." }, 429);
    }
    if (llmRes.status === 402) {
      return json({ error: "AI credits exhausted on the demo workspace." }, 402);
    }
    if (!llmRes.ok) {
      const text = await llmRes.text();
      console.error("LLM error", llmRes.status, text);
      // Fall back to unranked: return CTG order with neutral score
      const fallback: RankedTrial[] = candidates.slice(0, 10).map((c) => ({
        ...c,
        semanticScore: 50,
        semanticReason: "Semantic ranking unavailable — showing CTG.gov default order.",
      }));
      const ipHashFb = await hashIp(ip);
      const searchEventIdFb = await logSearchEvent({
        sessionId, ipHash: ipHashFb, query, ctgQuery, phase, status, countryUS,
        candidatesFetched: candidates.length, resultsReturned: fallback.length,
        totalCount, usedFallback: true, userAgent,
      });
      return json(
        {
          query,
          totalCount,
          candidatesFetched: candidates.length,
          results: fallback,
          fallback: true,
          sessionId,
          searchEventId: searchEventIdFb,
          usage: { rateLimitRemaining: DAILY_CAP - (ipDailyCount.get(ip)?.count ?? 0) },
        },
        200,
      );
    }

    const llmData = await llmRes.json();
    const toolCall = llmData.choices?.[0]?.message?.tool_calls?.[0];
    let rankings: { idx: number; score: number; reason: string }[] = [];
    try {
      const args = JSON.parse(toolCall?.function?.arguments ?? "{}");
      rankings = args.rankings ?? [];
    } catch (e) {
      console.error("Failed to parse rankings", e);
    }

    // Map scores back to candidates
    const scored: RankedTrial[] = candidates.map((c, idx) => {
      const r = rankings.find((x) => x.idx === idx);
      return {
        ...c,
        semanticScore: r?.score ?? 50,
        semanticReason: r?.reason ?? "Not scored.",
      };
    });

    scored.sort((a, b) => b.semanticScore - a.semanticScore);
    const top = scored.slice(0, 10);

    const ipHash = await hashIp(ip);
    const searchEventId = await logSearchEvent({
      sessionId, ipHash, query, ctgQuery, phase, status, countryUS,
      candidatesFetched: candidates.length, resultsReturned: top.length,
      totalCount, usedFallback: false, userAgent,
    });

    return new Response(
      JSON.stringify({
        query,
        totalCount,
        candidatesFetched: candidates.length,
        results: top,
        sessionId,
        searchEventId,
        usage: { rateLimitRemaining: DAILY_CAP - (ipDailyCount.get(ip)?.count ?? 0) },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600",
        },
      },
    );
  } catch (err) {
    console.error("ctg-search error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

async function logSearchEvent(p: {
  sessionId: string; ipHash: string; query: string; ctgQuery: string;
  phase: string; status: string; countryUS: boolean;
  candidatesFetched: number; resultsReturned: number; totalCount: number;
  usedFallback: boolean; userAgent: string;
}): Promise<string | null> {
  try {
    const { data, error } = await sb.from("search_events").insert({
      session_id: p.sessionId,
      ip_hash: p.ipHash,
      query: p.query,
      query_normalized: p.query.toLowerCase().trim(),
      ctg_query: p.ctgQuery,
      filter_phase: p.phase || null,
      filter_status: p.status || null,
      filter_country_us: p.countryUS,
      candidates_fetched: p.candidatesFetched,
      results_returned: p.resultsReturned,
      total_count: p.totalCount,
      used_fallback: p.usedFallback,
      user_agent: p.userAgent,
    }).select("id").single();
    if (error) { console.error("logSearchEvent", error); return null; }
    return data.id;
  } catch (e) {
    console.error("logSearchEvent ex", e);
    return null;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Lightweight NL → keyword condition cleaner.
// CTG.gov's query.cond is keyword based; long natural-language queries
// often return 0 hits. We strip filler words so candidates can be fetched,
// then the LLM re-ranks by full semantic meaning of the original query.
const STOPWORDS = new Set([
  "a","an","the","and","or","but","of","in","on","for","with","without","who","that","which","is","are","was","were",
  "be","been","being","to","from","by","at","as","it","this","these","those","i","we","you","they","them","their",
  "patient","patients","trial","trials","study","studies","subject","subjects","participant","participants",
  "already","had","have","has","not","no","do","does","did","can","could","would","should","may","might",
  "advanced","early","late","mild","moderate","severe","new","old","over","under","more","less","than",
  "people","person","adult","adults","group","groups","using","use","used","about","across","into","versus","vs",
]);

function simplifyForCTG(q: string): string {
  const tokens = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t) && t.length > 1);
  // Keep up to 6 most meaningful tokens to avoid CTG over-narrowing
  const cleaned = tokens.slice(0, 6).join(" ");
  return cleaned || q; // fallback to original if everything got stripped
}
