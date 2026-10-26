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
import { parseQuery, groundConcepts, verifyQuotes, groundedReason, isWeak, RETRIEVAL_LIMITS, type QueryIntent, type GroundFields } from "../_shared/queryIntent.ts";

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

interface _UnusedRankedTrial {
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
    // Layered defenses (cheapest → most expensive) so we drop scrapers
    // BEFORE spending an LLM call. None of this is foolproof, but it
    // raises the cost of trivial scraping that skews analytics + bills.
    const acceptLang = req.headers.get("accept-language") ?? "";
    const referer = (req.headers.get("referer") ?? req.headers.get("referrer") ?? "").toLowerCase();
    const origin = (req.headers.get("origin") ?? "").toLowerCase();
    const uaLower = userAgent.toLowerCase();

    // 1) User-agent blocklist — common scraper/library signatures.
    const KNOWN_BOTS = [
      "bot", "crawler", "spider", "scrapy", "curl/", "wget", "python-requests",
      "httpclient", "axios/", "go-http-client", "java/", "okhttp", "headlesschrome",
      "phantomjs", "selenium", "puppeteer", "playwright", "node-fetch", "libwww",
      "ahrefsbot", "semrushbot", "mj12bot", "dotbot", "petalbot", "bytespider",
      "facebookexternalhit", "embedly", "slurp", "yandex", "duckduckbot",
    ];

    // 2) Referrer blocklist — referrer-spam farms + scrapers seen in our analytics.
    const KNOWN_REFERRER_SPAM = [
      "excite.com", "lullar.com", "qsensei.com", "heapr.com",
      "magportal.com", "fooxx.com", "hispavista.com", "blindsearch.fejus.com",
      "fejus.com", "semalt.com", "buttons-for-website.com", "darodar.com",
      "ilovevitaly.com", "trafficmonetizer", "free-share-buttons", "best-seo-",
    ];

    // 3) Origin allowlist — accept only our own front-ends. Missing origin
    // (server-to-server tools) is treated as suspect.
    const ORIGIN_ALLOWLIST = [
      "lovable.app", "lovable.dev", "ysclin.xyz", "localhost", "127.0.0.1",
    ];

    const isBotUA = !userAgent || KNOWN_BOTS.some((b) => uaLower.includes(b));
    const missingHeaders = !acceptLang;
    const isReferrerSpam = !!referer && KNOWN_REFERRER_SPAM.some((r) => referer.includes(r));
    const isOriginOk = !!origin && ORIGIN_ALLOWLIST.some((o) => origin.includes(o));
    const isOriginSuspect = !isOriginOk;

    const suspicious = isBotUA || missingHeaders || isReferrerSpam || isOriginSuspect;

    if (suspicious) {
      // 4) Optional Turnstile escape hatch — if the client supplies a valid
      // Cloudflare Turnstile token AND TURNSTILE_SECRET is set, allow through.
      // Otherwise silently return empty results (don't tip off scrapers).
      const turnstileSecret = Deno.env.get("TURNSTILE_SECRET");
      const turnstileToken = req.headers.get("x-turnstile-token") ?? url.searchParams.get("ts") ?? "";
      let passedChallenge = false;
      if (turnstileSecret && turnstileToken) {
        try {
          const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ secret: turnstileSecret, response: turnstileToken }),
          });
          const vd = await v.json();
          passedChallenge = !!vd.success;
        } catch (e) {
          console.error("turnstile verify failed", e);
        }
      }

      if (!passedChallenge) {
        console.log("blocked suspicious request", {
          isBotUA, missingHeaders, isReferrerSpam, isOriginSuspect,
          uaSnippet: uaLower.slice(0, 60), referer: referer.slice(0, 80), origin,
        });
        return json({
          query, totalCount: 0, candidatesFetched: 0, results: [],
          sessionId, searchEventId: null,
          usage: { rateLimitRemaining: 0 },
          // Frontend may render a Turnstile widget when challenge === "turnstile".
          challenge: isOriginSuspect ? null : "turnstile",
        });
      }
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

    // ── 1. Interpret the query (deterministic, no LLM) ──
    const intent = parseQuery(query);
    const effStatus = status || intent.status || "";
    const effPhase = phase || intent.phase || "";
    const filters: string[] = [];
    if (effStatus) filters.push(`AREA[OverallStatus]${effStatus}`);
    if (effPhase) filters.push(`AREA[Phase]${effPhase}`);
    if (countryUS) filters.push(`AREA[LocationCountry]United States`);

    const broadTerm = simplifyForCTG(query);
    const ctgQuery = broadTerm;
    const hasTargeted = intent.conditionTerms.length > 0 || intent.biomarkers.length > 0;
    const isComplex = intent.complexity >= 2;

    type Pass = { label: string; cond?: string; term?: string; pageToken?: string };
    const buildParams = (p: Pass) => {
      const ps = new URLSearchParams();
      if (p.cond) ps.set("query.cond", p.cond);
      if (p.term) ps.set("query.term", p.term);
      if (intent.location) ps.set("query.locn", intent.location);
      ps.set("pageSize", String(RETRIEVAL_LIMITS.PAGE_SIZE));
      ps.set("format", "json");
      ps.set("countTotal", "true");
      if (filters.length) ps.set("filter.advanced", filters.join(" AND "));
      if (p.pageToken) ps.set("pageToken", p.pageToken);
      return ps;
    };
    const targeted: Pass = {
      label: "targeted",
      cond: intent.conditionTerms.join(" ") || undefined,
      term: intent.biomarkers.length ? intent.biomarkers.map((b) => `"${b}"`).join(" AND ") : undefined,
    };
    const broad: Pass = { label: "broad", term: broadTerm };

    const studyMap = new Map<string, any>();
    const passes: { label: string; returned: number; totalCount: number }[] = [];
    const adaptiveReasons: string[] = [];
    let totalCount = 0;
    let nextToken = null as { pass: Pass; token: string } | null;

    const runPass = async (p: Pass) => {
      if (passes.length >= RETRIEVAL_LIMITS.MAX_CTG_CALLS || studyMap.size >= RETRIEVAL_LIMITS.MAX_CANDIDATES) return;
      const r = await fetch(`${CTG_BASE}/studies?${buildParams(p).toString()}`, { headers: { Accept: "application/json" } });
      if (!r.ok) {
        const text = await r.text();
        passes.push({ label: p.label, returned: 0, totalCount: 0 });
        if (passes.length === 1) throw new CtgError(r.status, text);
        console.error("ctg pass failed", p.label, r.status);
        return;
      }
      const d = await r.json();
      const list = (d.studies ?? []) as any[];
      let added = 0;
      for (const s of list) {
        const id = s.protocolSection?.identificationModule?.nctId;
        if (id && !studyMap.has(id) && studyMap.size < RETRIEVAL_LIMITS.MAX_CANDIDATES) { studyMap.set(id, s); added++; }
      }
      totalCount = Math.max(totalCount, d.totalCount ?? list.length);
      passes.push({ label: p.label, returned: added, totalCount: d.totalCount ?? list.length });
      nextToken = d.nextPageToken ? { pass: p, token: d.nextPageToken } : null;
    };

    const shapeAll = () => Array.from(studyMap.values()).map(shapeStudy);
    const coverageOf = (cands: ReturnType<typeof shapeStudy>[]) => {
      if (!hasTargeted || cands.length === 0) return 1;
      const hit = cands.filter((c) => groundConcepts(intent, c.ground).evidence
        .some((e) => e.type === "condition" || e.type === "biomarker")).length;
      return hit / cands.length;
    };

    try {
      // Pass 1: targeted for complex queries, broad (original behaviour) for simple ones.
      await runPass(isComplex && hasTargeted ? targeted : broad);
      let cands = shapeAll();
      // Pass 2: only when the query is complex or the first pool is weak.
      if (isWeak(cands.length, coverageOf(cands)) || isComplex) {
        if (isWeak(cands.length, coverageOf(cands))) adaptiveReasons.push(`first pass weak (${cands.length} candidates)`);
        if (isComplex) adaptiveReasons.push(`complex query (${intent.complexity} concept types)`);
        const second = passes[0].label === "targeted" ? broad : (hasTargeted ? targeted : null);
        if (second) await runPass(second);
        else if (nextToken) await runPass({ ...nextToken.pass, label: `${nextToken.pass.label}-page2`, pageToken: nextToken.token });
        cands = shapeAll();
      }
      // Pass 3: one more page only if still weak.
      if (isWeak(cands.length, coverageOf(cands)) && nextToken && passes.length < RETRIEVAL_LIMITS.MAX_CTG_CALLS) {
        adaptiveReasons.push("still weak after second pass");
        await runPass({ ...nextToken.pass, label: `${nextToken.pass.label}-next`, pageToken: nextToken.token });
      }
    } catch (e) {
      if (e instanceof CtgError) return json({ error: `CTG.gov error [${e.status}]`, detail: e.detail.slice(0, 300) }, 502);
      throw e;
    }

    const candidates = shapeAll();
    const interpretation = {
      conditionTerms: intent.conditionTerms, biomarkers: intent.biomarkers, location: intent.location,
      priorTreatments: intent.priorTreatments, status: effStatus || null, phase: effPhase || null,
      statusFromQuery: !status && !!intent.status, phaseFromQuery: !phase && !!intent.phase,
      complexity: intent.complexity,
    };
    const retrieval = {
      passes, candidatesFetched: candidates.length, adaptive: passes.length > 1, reasons: adaptiveReasons,
      maxCandidates: RETRIEVAL_LIMITS.MAX_CANDIDATES,
    };

    if (candidates.length === 0) {
      return json({
        query, totalCount: 0, candidatesFetched: 0, results: [], interpretation, retrieval,
        warnings: buildWarnings({ intent, interpretation, totalCount: 0, candidates: [], results: [], fallback: false, countryUS }),
        usage: { rateLimitRemaining: DAILY_CAP - (ipDailyCount.get(ip)?.count ?? 0) },
      });
    }

    // ── 3. Single LLM call to score all candidates ──
    const compactList = candidates.map((c, idx) => ({
      idx,
      nct: c.nctId,
      title: c.briefTitle.slice(0, 180),
      conds: c.conditions.slice(0, 4).join("; ").slice(0, 140),
      intv: c.interventions.slice(0, 4).join("; ").slice(0, 140),
      elig: c.ground.eligibility.replace(/\s+/g, " ").slice(0, candidates.length > 40 ? 220 : 400),
    }));

    const systemPrompt = `You are a clinical trial relevance scorer. Score each candidate 0-100 for how well it matches the *meaning* of the query. Consider synonyms, abbreviations, drug classes, and disease equivalents. Be strict: 90+ excellent, 60-89 solid, 30-59 tangential, <30 poor.
GROUNDING RULES (mandatory): Your reason may only mention attributes that appear in the candidate's title, conditions, interventions or eligibility text shown to you. Never infer locations, biomarkers, eligibility requirements, phases or prior treatments that are not written there. For each candidate also return 1-3 short verbatim quotes (copied exactly) with the field they came from (title, conditions, interventions, eligibility). If a query concept is absent from the record, say it is not stated.`;

    const userPrompt = `User query: "${query}"

Candidates:
${compactList
  .map((c) => `[${c.idx}] ${c.nct} | title: ${c.title} | conditions: ${c.conds} | interventions: ${c.intv} | eligibility: ${c.elig}`)
  .join("\n")}

Return a relevance score, a one-sentence grounded reason, and verbatim quotes for each candidate.`;

    const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "rank_candidates",
            description: "Return a relevance score, grounded reason and verbatim quotes for each candidate trial.",
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
                      quotes: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            field: { type: "string", enum: ["title", "conditions", "interventions", "eligibility"] },
                            quote: { type: "string" },
                          },
                          required: ["field", "quote"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["idx", "score", "reason", "quotes"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["rankings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "rank_candidates" } },
      }),
    });

    if (llmRes.status === 429) return json({ error: "AI gateway rate limit. Try again in a moment." }, 429);
    if (llmRes.status === 402) return json({ error: "AI credits exhausted on the demo workspace." }, 402);

    let rankings: { idx: number; score: number; reason: string; quotes?: { field: string; quote: string }[] }[] = [];
    let usedFallback = false;
    if (!llmRes.ok) {
      console.error("LLM error", llmRes.status, await llmRes.text());
      usedFallback = true;
    } else {
      const llmData = await llmRes.json();
      const toolCall = llmData.choices?.[0]?.message?.tool_calls?.[0];
      try {
        rankings = JSON.parse(toolCall?.function?.arguments ?? "{}").rankings ?? [];
      } catch (e) {
        console.error("Failed to parse rankings", e);
      }
      if (rankings.length === 0) usedFallback = true;
    }

    // ── 4. Ground every explanation in CTG fields ──
    const HARD_TYPES = new Set(["biomarker", "location", "status", "phase"]);
    const scored = candidates.map((c, idx) => {
      const r = rankings.find((x) => x.idx === idx);
      const { evidence, notFound } = groundConcepts(intent, c.ground);
      const llmVerified = !!r && verifyQuotes(r.quotes, c.ground);
      let score = r?.score ?? 50;
      // A trial cannot score as a strong match when a hard concept is absent from its record.
      const missingHard = notFound.filter((n) => HARD_TYPES.has(n.type));
      if (missingHard.length && score > 59) score = 59;
      const deterministic = groundedReason(evidence, notFound);
      const reason = llmVerified
        ? `${r!.reason.trim()}${notFound.length ? ` Not found in record: ${notFound.map((n) => n.concept).join(", ")}.` : ""}`
        : usedFallback ? `Semantic ranking unavailable. ${deterministic}` : deterministic;
      const { ground, ...pub } = c;
      return {
        ...pub,
        semanticScore: score,
        semanticReason: reason,
        reasonSource: llmVerified ? "llm_verified" : "registry_fields",
        evidence: [
          ...evidence,
          ...(llmVerified ? r!.quotes!.slice(0, 3).map((q) => ({ concept: "reranker quote", type: "quote", field: q.field, snippet: q.quote })) : []),
        ],
        notFound,
      };
    });

    if (!usedFallback) scored.sort((a, b) => b.semanticScore - a.semanticScore);
    const top = scored.slice(0, 10);

    const ipHash = await hashIp(ip);
    const searchEventId = await logSearchEvent({
      sessionId, ipHash, query, ctgQuery, phase: effPhase, status: effStatus, countryUS,
      candidatesFetched: candidates.length, resultsReturned: top.length,
      totalCount, usedFallback, userAgent,
    });

    return new Response(
      JSON.stringify({
        query,
        totalCount,
        candidatesFetched: candidates.length,
        results: top,
        fallback: usedFallback || undefined,
        interpretation,
        retrieval,
        warnings: buildWarnings({ intent, interpretation, totalCount, candidates, results: top, fallback: usedFallback, countryUS }),
        sessionId,
        searchEventId,
        usage: { rateLimitRemaining: DAILY_CAP - (ipDailyCount.get(ip)?.count ?? 0) },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } },
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

// Lightweight NL → Essie keyword query.
// CTG.gov ANDs all tokens by default, so we strip filler and OR the rest.
// The LLM re-ranker tightens precision afterwards.
const STOPWORDS = new Set([
  "a","an","the","and","or","but","of","in","on","for","with","without","who","that","which","is","are","was","were",
  "be","been","being","to","from","by","at","as","it","this","these","those","i","we","you","they","them","their",
  "patient","patients","trial","trials","study","studies","subject","subjects","participant","participants",
  "already","had","have","has","not","no","do","does","did","can","could","would","should","may","might",
  "advanced","early","late","mild","moderate","severe","new","old","over","under","more","less","than",
  "people","person","adult","adults","group","groups","using","use","used","about","across","into","versus","vs",
  // colloquial filler that wrecks CTG keyword matching
  "near","me","my","mom","dad","mother","father","son","daughter","wife","husband","kid","child","children",
  "pill","drug","medicine","medication","cure","treatment","therapy","test","scan",
  "line","second","third","first","fourth","post","pre","after","before","during",
]);

function simplifyForCTG(q: string): string {
  // Preserve hyphenated alphanumerics (KRAS-G12C, GLP-1, APOE4, NSCLC)
  const tokens = q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t) && t.length > 1);
  if (tokens.length === 0) return q;
  const top = Array.from(new Set(tokens)).slice(0, 8);
  // 1 token → pass through. Multiple → OR-join so any-match wins.
  return top.length === 1 ? top[0] : top.map((t) => `"${t}"`).join(" OR ");
}

class CtgError extends Error {
  constructor(public status: number, public detail: string) { super(`CTG ${status}`); }
}

function shapeStudy(s: any) {
  const ps = s.protocolSection ?? {};
  const id = ps.identificationModule ?? {};
  const st = ps.statusModule ?? {};
  const design = ps.designModule ?? {};
  const cond = ps.conditionsModule ?? {};
  const arms = ps.armsInterventionsModule ?? {};
  const sponsor = ps.sponsorCollaboratorsModule?.leadSponsor ?? {};
  const locs = (ps.contactsLocationsModule?.locations ?? []) as any[];
  const conditions = (cond.conditions ?? []) as string[];
  const interventions = (arms.interventions ?? []).map((i: any) => i.name).filter(Boolean) as string[];
  const sponsorRaw = sponsor.name ?? "";
  const phases = (design.phases ?? []) as string[];
  return {
    nctId: id.nctId ?? "",
    briefTitle: id.briefTitle ?? "",
    officialTitle: id.officialTitle ?? "",
    status: st.overallStatus ?? "",
    phase: phases,
    conditions,
    conditionsClean: conditions.map((c) => cleanIndication(c).clean),
    interventions,
    interventionsClean: interventions.map((i) => cleanAsset(i).clean),
    leadSponsor: sponsorRaw,
    leadSponsorClean: cleanSponsor(sponsorRaw).clean,
    enrollment: design.enrollmentInfo?.count ?? null,
    startDate: st.startDateStruct?.date ?? "",
    countries: Array.from(new Set(locs.map((l: any) => l.country).filter(Boolean))) as string[],
    hasEligibilityText: !!ps.eligibilityModule?.eligibilityCriteria,
    locationCount: locs.length,
    ground: {
      briefTitle: id.briefTitle ?? "",
      officialTitle: id.officialTitle ?? "",
      conditions,
      interventions,
      keywords: (cond.keywords ?? []) as string[],
      eligibility: (ps.eligibilityModule?.eligibilityCriteria ?? "") as string,
      locations: locs.map((l: any) => [l.facility, l.city, l.state, l.country].filter(Boolean).join(", ")),
      status: st.overallStatus ?? "",
      phase: phases,
    } as GroundFields,
  };
}

type Warning = { code: string; message: string };

function buildWarnings(p: {
  intent: QueryIntent; interpretation: any; totalCount: number;
  candidates: any[]; results: any[]; fallback: boolean; countryUS: boolean;
}): Warning[] {
  const w: Warning[] = [];
  const { intent, interpretation, results, candidates } = p;
  const filterBits = [
    interpretation.status && `status ${interpretation.status}`,
    interpretation.phase && `phase ${interpretation.phase}`,
    intent.location && `location "${intent.location}"`,
    p.countryUS && "United States only",
  ].filter(Boolean);

  if (results.length === 0) {
    w.push({ code: "no_results", message: filterBits.length
      ? `No registry records matched with ${filterBits.join(", ")} applied. Try removing a filter or broadening terms.`
      : "No registry records matched these terms." });
    return w;
  }
  if (filterBits.length) w.push({ code: "filtered", message: `Results are limited by ${filterBits.join(", ")}. Trials outside these filters are not shown.` });
  if (interpretation.statusFromQuery || interpretation.phaseFromQuery)
    w.push({ code: "inferred_filter", message: "A status or phase filter was inferred from your wording. Check the interpretation below." });
  if (p.totalCount > candidates.length)
    w.push({ code: "partial_pool", message: `Ranked ${candidates.length} of ${p.totalCount.toLocaleString()} matching registry records. Lower ranked records were not reviewed.` });
  if (intent.conditionTerms.length === 0)
    w.push({ code: "no_condition", message: "No clear condition was recognised in the query, so interpretation is uncertain." });
  if (intent.priorTreatments.length) {
    const hits = results.filter((r) => r.evidence.some((e: any) => e.type === "prior treatment")).length;
    w.push({ code: "prior_treatment", message: `Prior treatment is only recorded in free text eligibility criteria. ${hits} of ${results.length} results mention "${intent.priorTreatments.join(", ")}" there.` });
  }
  for (const b of intent.biomarkers) {
    const hits = results.filter((r) => r.evidence.some((e: any) => e.concept === b)).length;
    if (hits < results.length) w.push({ code: "biomarker_gap", message: `"${b}" appears in ${hits} of ${results.length} result records. Others may not list biomarker requirements.` });
  }
  const noLoc = results.filter((r) => r.locationCount === 0).length;
  if (intent.location && noLoc) w.push({ code: "missing_locations", message: `${noLoc} results list no site locations in the registry.` });
  if (results.length < 5) w.push({ code: "few_results", message: "Fewer than five results found. The registry may have limited records for this combination." });
  if (p.fallback) w.push({ code: "fallback", message: "Semantic ranking was unavailable, so results are in ClinicalTrials.gov order." });
  if (intent.droppedTokens.length > 3) w.push({ code: "dropped_words", message: `Some words were ignored as filler: ${intent.droppedTokens.slice(0, 6).join(", ")}.` });
  return w;
}
