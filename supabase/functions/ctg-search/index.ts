// Live CTG retrieval → BM25 and dense embeddings → RRF → registry constraint reranking.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { hybridScores, HybridError } from "../_shared/hybridSearch.ts";
import { diabetesSubtype, subtypeTier } from "../_shared/hybridRanking.ts";
import { isAllowedSearchOrigin } from '../_shared/searchOrigin.ts';
import { cleanSponsor, cleanIndication, cleanAsset } from "../_shared/canonicalize.ts";
import { parseQuery, groundConcepts, groundedReason, isWeak, RETRIEVAL_LIMITS, prefersUS, matchLocation, locationSentence, matchLabels, dedupeEvidence, type QueryIntent, type GroundFields } from "../_shared/queryIntent.ts";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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
      return { ok: false, reason: `Slow down, max ${MINUTE_CAP} searches per minute.` };
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
    const browserRegionUS = url.searchParams.get("region") === "US";
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
    const isBotUA = !userAgent || KNOWN_BOTS.some((b) => uaLower.includes(b));
    const missingHeaders = !acceptLang;
    const isReferrerSpam = !!referer && KNOWN_REFERRER_SPAM.some((r) => referer.includes(r));
    const isOriginOk = isAllowedSearchOrigin(origin);
    const isOriginSuspect = !isOriginOk;

    const suspicious = isBotUA || missingHeaders || isReferrerSpam || isOriginSuspect;

    if (suspicious) {
      // 4) Optional Turnstile escape hatch — if the client supplies a valid
      // Cloudflare Turnstile token AND TURNSTILE_SECRET is set, allow through.
      // Return an explicit blocked request, never pretend the registry has no trials.
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
        return json({
          error: 'Search was blocked by abuse protection. No registry search was performed. Reload the page and try again.',
          code: 'search_blocked',
          challenge: isOriginSuspect ? null : "turnstile",
        }, 403);
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

    const broadTerm = diabetesSubtype(query) ? `"${intent.conditionTerms[0]}"` : simplifyForCTG(query);
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
      await runPass((isComplex || diabetesSubtype(query)) && hasTargeted ? targeted : broad);
      let cands = shapeAll();
      const weakNow = () => isWeak(cands.length, coverageOf(cands));
      if (weakNow()) adaptiveReasons.push(`first pass weak (${cands.length} candidates)`);
      if (isComplex) adaptiveReasons.push(`complex query (${intent.complexity} concept types)`);
      // Pass 2: only when the query is complex or the first pool is weak.
      if (weakNow() || isComplex) {
        if (passes[0].label === "targeted" && passes[0].returned < 10 && intent.biomarkers.length && intent.conditionTerms.length > 1) {
          // Relax condition wording but keep the biomarker requirement.
          await runPass({ label: "targeted-relaxed", cond: intent.conditionTerms.map((t) => `"${t}"`).join(" OR "), term: targeted.term });
        } else if (passes[0].label === "targeted") await runPass(broad);
        else if (hasTargeted && isComplex) await runPass(targeted);
        else if (nextToken) await runPass({ ...nextToken.pass, label: `${nextToken.pass.label}-page2`, pageToken: nextToken.token });
        cands = shapeAll();
      }
      // Pass 3: only if still weak, or a complex query has not tried broad recall yet.
      if ((weakNow() || (isComplex && !passes.some((p) => p.label === "broad"))) && passes.length < RETRIEVAL_LIMITS.MAX_CTG_CALLS) {
        if (weakNow()) adaptiveReasons.push("still weak after second pass");
        if (!passes.some((p) => p.label === "broad")) await runPass(broad);
        else if (nextToken) await runPass({ ...nextToken.pass, label: `${nextToken.pass.label}-next`, pageToken: nextToken.token });
      }
    } catch (e) {
      if (e instanceof CtgError) return json({ error: `CTG.gov error [${e.status}]`, detail: e.detail.slice(0, 300) }, 502);
      throw e;
    }

    const candidates = shapeAll();
    const interpretation = {
      conditionTerms: intent.conditionTerms, biomarkers: intent.biomarkers, location: intent.location,
      locationConfidence: intent.locationConfidence,
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

    // Real request scoped BM25 + dense cosine search, reciprocal rank fusion,
    // then deterministic constraint reranking. No generated relevance facts.
    let hybrid;
    try { hybrid = await hybridScores(query, candidates.map((c) => c.ground), LOVABLE_API_KEY, req.signal); }
    catch (error) {
      if (error instanceof HybridError) return json({ error: error.message, code: 'hybrid_unavailable' }, error.status);
      throw error;
    }
    const preferUS = prefersUS(query, intent, browserRegionUS);
    const queryConceptCount = intent.conditionTerms.length + intent.biomarkers.length + intent.priorTreatments.length
      + (intent.location ? 1 : 0) + (intent.status ? 1 : 0) + (intent.phase ? 1 : 0);
    const scored = candidates.map((c, idx) => {
      const { evidence, notFound } = groundConcepts(intent, c.ground);
      const loc = intent.location ? matchLocation(intent.location, c.ground.sites ?? []) : null;
      const reason = groundedReason(evidence.filter((e) => e.type !== 'location'), notFound.filter((e) => e.type !== 'location'));
      const { ground, ...pub } = c;
      return {
        ...pub, semanticScore: null,
        semanticReason: (intent.location && loc ? `${locationSentence(intent.location, loc.confirmed, c.status === 'RECRUITING')} ` : '') + reason,
        reasonSource: 'registry_fields',
        keywordScore: hybrid.keyword[idx], denseSimilarity: hybrid.dense[idx], hybridScore: hybrid.fused[idx],
        subtype: subtypeTier(query, ground),
        locationEvidence: intent.location && loc ? { location: intent.location, confirmed: loc.confirmed, matchedSites: loc.matchedSites, recruitingSites: loc.recruitingMatched } : null,
        matchLabels: matchLabels(evidence, !!loc?.confirmed),
        evidenceRatio: queryConceptCount ? evidence.length / queryConceptCount : 0,
        evidence: dedupeEvidence(evidence), notFound,
      };
    });
    // Explicit subtype conflicts never outrank confirmed matches, whatever vector score or US preference.
    const key = (t: typeof scored[number]) => t.hybridScore * 1000 + t.evidenceRatio * 4 + (preferUS && t.countries.includes('United States') ? 0.5 : 0);
    scored.sort((a, b) => b.subtype - a.subtype || key(b) - key(a) || a.nctId.localeCompare(b.nctId));
    const top = scored.filter((t) => t.subtype >= 0).slice(0, 10);
    const scoreShown = false;
    const usedFallback = false;
    Object.assign(retrieval, { method: 'BM25 + dense cosine + reciprocal rank fusion + constraint reranking', embeddingModel: hybrid.model });

    // No visitor search history is written to application storage.
    const searchEventId = null;

    return new Response(
      JSON.stringify({
        query,
        totalCount,
        candidatesFetched: candidates.length,
        results: top,
        scoreShown,
        fallback: usedFallback || undefined,
        interpretation,
        retrieval,
        warnings: [...buildWarnings({ intent, interpretation, totalCount, candidates, results: top, fallback: usedFallback, countryUS }), ...(preferUS ? [{ code: "us_first", message: "United States sites receive preference among similarly relevant trials." }] : [])],
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
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
      sites: locs.map((l: any) => ({ city: l.city, state: l.state, country: l.country, status: l.status })),
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
