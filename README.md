# Clinical Trial Diversity Studio

**Search ClinicalTrials.gov in plain language.** An independent product exploration of what a more usable, AI-assisted trial registry could look like for clinical teams and for patients.

**Live demo:** https://rwe-ctg-new.lovable.app
**Status:** Public demo on live registry data. Not yet validated with users.
**Case study:** https://ysclin.xyz/work/clinical-trial-diversity-studio

> Independent build, outside of employment. Not affiliated with ClinicalTrials.gov, NIH or NLM. Informational only, not medical advice.

---

## The problem

ClinicalTrials.gov holds a huge amount of public trial information, but getting to a decision with it is hard:

- Search expects registry vocabulary, not the words people actually use.
- Trial records are dense, and eligibility criteria are written for protocol authors.
- There is no easy way to group trials into a cohort and compare them.
- Diversity and geographic context sits in other sources (Census, CDC), so nobody sees enrollment next to disease burden.

## Who it is for

| Audience | What they are trying to do |
|---|---|
| Clinical operations, feasibility and diversity-strategy teams | Find comparable trials, build a cohort, see where sites and populations line up |
| Patients and caregivers | Understand a recruiting trial and whether it might apply to them |

Both audiences are working assumptions. Neither has been confirmed as the primary persona yet.

## What is built

- **Plain-language search** over the live ClinicalTrials.gov v2 API, with semantic re-ranking and typo suggestions.
- **Two reading modes.** A first-visit prompt asks whether you are a clinician/researcher or a patient/caregiver, and a "plain language" toggle rewrites trial records in everyday words.
- **Eligibility checklist** generated from a trial's criteria.
- **Recruiting-site links**, with every result deep-linked back to the source record for verification.
- **Saved cohorts** by therapeutic area or program, with canonical sponsor, indication and asset names so the same company or drug is not counted three ways.
- **Diversity view** for a cohort, set against U.S. Census ACS reference data.
- **Data & Method page** documenting sources, canonicalization rules and how AI output is reported.

## Product decisions

| Decision | Why | Trade-off |
|---|---|---|
| One registry, two experiences | The same data serves very different needs, and splitting into two products would double the surface before either is proven | Risk of serving neither audience deeply |
| Ship live search first, stage the analytics | Cohort and diversity modules are only worth building on search behaviour that is known to be relevant | A narrower demo today |
| Deep-link every result to the source | In a medical context, trust comes from being checkable | Sends users off-site |
| Retire the synthetic dashboards | Earlier versions showed made-up patient-journey data, which undermined a product whose pitch is "real registry data" | Lost some visually impressive screens |

## AI design

AI is used in three places, each with a model sized to the job and an output the UI can verify:

| Feature | Model | Guardrail |
|---|---|---|
| Semantic re-ranking of search results | Gemini 2.5 Flash Lite | Falls back to registry order if the model is unavailable; score and reason shown on every result |
| Plain-language trial summaries | Gemini 3 Flash (preview) | Rephrases the source only; missing facts become "Not specified"; cached per trial |
| Eligibility self-check on uploaded documents | Gemini 2.5 Flash (multimodal) | Defaults to "unclear"; documents are never stored; always defers to the trial site |

Name canonicalization, location cleanup and cohort refresh are deliberately rule-based, because they need to be repeatable and auditable.

Full write-up of the decisions, guardrails, cost controls, quality signals and known risks: **[docs/AI_DESIGN.md](docs/AI_DESIGN.md)**.

## Analytics and instrumentation

The app is instrumented so product questions can be answered from behaviour rather than opinion:

- Search sessions are tracked from query to result click.
- An internal click heatmap shows where attention goes on each page, including scroll depth and rage clicks.
- A feedback endpoint captures relevance signals on results.

**What I would measure first**

| Question | Metric |
|---|---|
| Is search relevant? | Share of searches with a result click in the top 5; reformulation rate |
| Does plain language help? | Toggle adoption by audience; time on trial detail with and without it |
| Do people reach a next step? | Click-through to recruiting-site or source-record links |
| Is the cohort workflow real? | Searches that end in a saved cohort; return visits to a cohort |

## Where this is going

The registry is public. Understanding it should not require a specialist.

The long-term aim is one workspace with two front doors. A feasibility lead goes from a question ("where should we run a Phase 3 obesity trial that reflects who actually has the disease?") to a defensible site and population plan in an afternoon. A patient or caregiver goes from a diagnosis to a short list of trials they could realistically reach, written in words they can act on.

Both depend on the same foundation: search that understands intent, and trial data clean enough to compare.

## What is next

**Now**
- Run 5 to 8 interviews per audience to pick a primary persona.
- Build a small labelled query set to evaluate search relevance before and after re-ranking changes.

**Next**
- Trial comparison inside a cohort.
- Geographic analysis: sites against population and disease burden.

**Later**
- Site prioritization with a written rationale.
- Exportable cohort briefs for feasibility teams.

## Stack

React, TypeScript, Vite, Tailwind and shadcn/ui on the front end. Supabase edge functions handle registry search, plain-language rewriting, eligibility checks, location normalization and cohort refresh.

```sh
npm install
npm run dev
```

---

Built by [Yash Shah](https://ysclin.xyz), Senior Product Manager working on data and AI products.
