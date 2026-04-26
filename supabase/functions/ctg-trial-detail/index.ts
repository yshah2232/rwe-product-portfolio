// ── Single trial detail fetch ──
// Pulls one NCT record from ClinicalTrials.gov v2 with full eligibility,
// locations, sponsor, contacts. Used by the Study Detail panel.
//
// Guardrails: per-IP minute cap (12), 1-hour edge cache, NCT format validated.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const CTG_BASE = "https://clinicaltrials.gov/api/v2";

const ipMinuteCount = new Map<string, { count: number; resetAt: number }>();
const MINUTE_CAP = 12;

function checkRateLimit(ip: string): { ok: boolean; reason?: string } {
  const now = Date.now();
  const minute = ipMinuteCount.get(ip);
  if (!minute || now > minute.resetAt) {
    ipMinuteCount.set(ip, { count: 1, resetAt: now + 60_000 });
    return { ok: true };
  }
  minute.count += 1;
  if (minute.count > MINUTE_CAP) {
    return { ok: false, reason: `Slow down — max ${MINUTE_CAP} detail requests per minute.` };
  }
  return { ok: true };
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const nctId = (url.searchParams.get("nctId") ?? "").trim().toUpperCase();

    // Validate NCT format strictly: NCT followed by 8 digits
    if (!/^NCT\d{8}$/.test(nctId)) {
      return json({ error: "Invalid NCT ID format. Expected NCT followed by 8 digits." }, 400);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";
    const rl = checkRateLimit(ip);
    if (!rl.ok) return json({ error: rl.reason }, 429);

    const ctgRes = await fetch(`${CTG_BASE}/studies/${nctId}?format=json`, {
      headers: { Accept: "application/json" },
    });
    if (ctgRes.status === 404) {
      return json({ error: "Trial not found on ClinicalTrials.gov" }, 404);
    }
    if (!ctgRes.ok) {
      const text = await ctgRes.text();
      return json({ error: `CTG.gov error [${ctgRes.status}]`, detail: text.slice(0, 300) }, 502);
    }

    const study = await ctgRes.json();
    const ps = study.protocolSection ?? {};
    const id = ps.identificationModule ?? {};
    const status = ps.statusModule ?? {};
    const design = ps.designModule ?? {};
    const cond = ps.conditionsModule ?? {};
    const arms = ps.armsInterventionsModule ?? {};
    const sponsor = ps.sponsorCollaboratorsModule?.leadSponsor ?? {};
    const collaborators = ps.sponsorCollaboratorsModule?.collaborators ?? [];
    const elig = ps.eligibilityModule ?? {};
    const desc = ps.descriptionModule ?? {};
    const contacts = ps.contactsLocationsModule ?? {};
    const locs = (contacts.locations ?? []) as any[];
    const centralContacts = (contacts.centralContacts ?? []) as any[];
    const overallOfficials = (contacts.overallOfficials ?? []) as any[];

    const out = {
      nctId: id.nctId ?? nctId,
      briefTitle: id.briefTitle ?? "",
      officialTitle: id.officialTitle ?? "",
      briefSummary: desc.briefSummary ?? "",
      detailedDescription: desc.detailedDescription ?? "",
      status: status.overallStatus ?? "",
      whyStopped: status.whyStopped ?? null,
      phase: (design.phases ?? []) as string[],
      studyType: design.studyType ?? "",
      conditions: (cond.conditions ?? []) as string[],
      keywords: (cond.keywords ?? []) as string[],
      interventions: ((arms.interventions ?? []) as any[]).map((i) => ({
        type: i.type ?? "",
        name: i.name ?? "",
        description: i.description ?? "",
      })),
      eligibility: {
        criteria: elig.eligibilityCriteria ?? "",
        sex: elig.sex ?? "",
        minAge: elig.minimumAge ?? "",
        maxAge: elig.maximumAge ?? "",
        healthyVolunteers: elig.healthyVolunteers ?? false,
      },
      enrollment: design.enrollmentInfo?.count ?? null,
      enrollmentType: design.enrollmentInfo?.type ?? "",
      startDate: status.startDateStruct?.date ?? "",
      completionDate: status.completionDateStruct?.date ?? "",
      primaryCompletionDate: status.primaryCompletionDateStruct?.date ?? "",
      leadSponsor: { name: sponsor.name ?? "", class: sponsor.class ?? "" },
      collaborators: (collaborators as any[]).map((c) => ({ name: c.name ?? "", class: c.class ?? "" })),
      locations: locs.map((l: any) => {
        // CTG.gov v2 nests per-site contacts here. Phone/email may be missing
        // — we surface what's there, never invent or fall back to web search.
        const siteContacts = (l.contacts ?? []) as any[];
        const primary = siteContacts[0] ?? null;
        return {
          facility: l.facility ?? "",
          city: l.city ?? "",
          state: l.state ?? "",
          country: l.country ?? "",
          zip: l.zip ?? "",
          status: l.status ?? "",
          contactName: primary?.name ?? "",
          contactRole: primary?.role ?? "",
          contactPhone: primary?.phone ?? "",
          contactEmail: primary?.email ?? "",
        };
      }),
      // Central contact for the whole study (often the only contact info available)
      centralContacts: centralContacts.map((c: any) => ({
        name: c.name ?? "",
        role: c.role ?? "",
        phone: c.phone ?? "",
        email: c.email ?? "",
      })),
      overallOfficials: overallOfficials.map((o: any) => ({
        name: o.name ?? "",
        affiliation: o.affiliation ?? "",
        role: o.role ?? "",
      })),
      countries: Array.from(new Set(locs.map((l: any) => l.country).filter(Boolean))) as string[],
      ctgUrl: `https://clinicaltrials.gov/study/${nctId}`,
      // Provenance — when the sponsor last updated the record on CTG.gov, and when we fetched it.
      lastUpdateSubmitDate: status.lastUpdateSubmitDate ?? status.lastUpdatePostDateStruct?.date ?? "",
      lastUpdatePostDate: status.lastUpdatePostDateStruct?.date ?? "",
      fetchedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("ctg-trial-detail error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
