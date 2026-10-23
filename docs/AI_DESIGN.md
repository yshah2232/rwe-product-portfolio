# AI design: Clinical Trial Diversity Studio

How AI is used in this product, why it is used where it is, and how it is kept honest. Written from the product side; every behaviour described here is in the code under `supabase/functions/`.

---

## Principles

1. **AI rephrases and ranks the source. It never becomes the source.** Every AI output is anchored to a real ClinicalTrials.gov record and links back to it.
2. **Medical context means a lower ceiling on confidence.** When the model is unsure, the product says "unclear" or "not specified", never a guess.
3. **The product must still work when the AI does not.** Every AI step has a non-AI fallback or a clear error.
4. **Cost is a design constraint, not an afterthought.** This is a public demo on a fixed budget, so model choice, caching and rate limits are part of the product.

## Where AI is used

| Feature | User problem | What the model does | Model | Output contract |
|---|---|---|---|---|
| **Semantic search** (`ctg-search`) | Registry search needs registry vocabulary | Scores the 25 keyword-search candidates 0–100 for how well they match the *meaning* of the query, with a one-line reason | Gemini 2.5 Flash Lite | Typed function call: `{idx, score, reason}` per trial |
| **Plain language** (`ctg-plain-language`) | Trial records are written for protocol authors | Rewrites a trial at roughly an 8th-grade reading level, builds a participant journey and a checklist of documents to bring to a doctor | Gemini 3 Flash (preview) | Fixed JSON schema |
| **Eligibility self-check** (`ctg-eligibility-check`) | Patients cannot tell whether a trial might apply to them | Reads documents the patient uploads (images or PDF pages) against that trial's checklist and returns a verdict per item | Gemini 2.5 Flash (multimodal) | Per item: `likely_meets` / `unclear` / `likely_does_not_meet`, plus evidence |

AI is deliberately **not** used for cohort refresh, location normalization or sponsor/drug name canonicalization. Those are deterministic rules with a confidence score and a written note per rule, because they need to be repeatable and auditable.

## Key decisions

| Decision | Why | Trade-off |
|---|---|---|
| **Keyword retrieval + LLM re-ranker**, not embeddings | No vector index to build or keep in sync with a registry that changes daily; one model call per search; the reason per result is shown to the user | Recall is capped by the keyword step: a trial the keyword search misses can never be ranked in |
| **One model per job, sized to the job** | Ranking 25 short records needs a cheap, fast model; reading a protocol and writing for patients needs a stronger one; reading uploaded documents needs a multimodal one | Three models to monitor instead of one |
| **Structured output everywhere** (function calling or JSON mode) | The UI renders fields, not free text, so a malformed answer fails loudly instead of showing nonsense | Slightly more prompt engineering |
| **Cache plain-language rewrites per trial** | A trial is read many times and changes rarely; the model runs once per trial, not once per visitor | A rewrite can go stale until refreshed |
| **Never store uploaded medical documents** | The eligibility check needs the documents for a few seconds, not forever | Users re-upload to check another trial |
| **Show the model's score and reason on every result** | Users can see why a result ranked where it did and disagree with it | Exposes the model's mistakes as well as its wins |

## Guardrails

**Accuracy and safety (in the system prompts)**
- Rephrase only what the source says. Never invent numbers, dates, drugs or criteria. If information is missing, say "Not specified by the study".
- No medical advice, and no recommendation to join or avoid a trial.
- The eligibility check defaults to `unclear` when in doubt, quotes its evidence, and always ends with "Final eligibility must be confirmed by the trial site's medical team."
- Eligibility is judged only against criteria already extracted from the trial record. The model cannot add its own.

**Reliability**
- If the ranking model fails, search falls back to ClinicalTrials.gov's own order, labels the results "semantic ranking unavailable", and logs the fallback.
- Gateway rate-limit (429) and out-of-credit (402) responses return clear user-facing messages instead of a broken page.

**Cost and abuse**

| Control | Setting |
|---|---|
| Search: per-IP limits | 6 per minute, 30 per day |
| Search: candidates sent to the model | 25 maximum, 10 returned; one model call per search |
| Plain language: per-IP limit | 8 per minute, and only counted on a cache miss |
| Eligibility check: per-IP limit | 4 per minute; 6 files and 8 MB maximum |
| Query length | 3 to 200 characters |

## How quality is measured

**Instrumented today.** Every search and interaction writes to RLS-locked tables, so model quality can be judged from behaviour:

| Signal | Table | What it tells you about the AI |
|---|---|---|
| Search event, including whether the fallback was used | `search_events` | How often the model is unavailable |
| Result clicks and source-record follows | `result_interactions` | Whether top-ranked results are the ones people open |
| Thumbs up/down with a reason, per result | `result_feedback` | Direct relevance judgements on individual rankings |
| Query reformulations within a session | `search_refinements` | Searches where the first answer was not good enough |
| End-of-session "was this useful?" | `session_outcomes` | Overall task success |
| Eligibility verdicts (structured outcome only, no documents) | `eligibility_checks` | How often the model lands on `unclear` |

**Not built yet: offline evaluation.** The next step is a labelled query set: about 50 realistic queries from both audiences, each with the trials a domain expert considers relevant. That gives a fixed benchmark (precision at 5, NDCG at 10) to run before and after any prompt or model change, instead of judging changes by feel. For plain language, the equivalent is a review rubric (faithfulness to source, reading level, no advice) applied to a sample of rewrites.

**Release rule for model or prompt changes:** a change ships only if it does not lower relevance on the labelled set and does not raise the thumbs-down rate on live traffic.

## Known risks and limitations

| Risk | Current state | Mitigation or next step |
|---|---|---|
| Recall ceiling from keyword retrieval | A trial phrased very differently from the query is never a candidate | Measure on the labelled set; add query expansion or a hybrid retriever if recall is the bottleneck |
| A preview model in production | Plain language runs on `gemini-3-flash-preview`, which can change or be retired | Pin to a stable model once available; keep the cache so a model change does not rewrite every trial at once |
| Stale plain-language cache | Rewrites persist until regenerated | Regenerate when the source record's last-update date changes |
| No search-result cache | The code comment describes a 1-hour cache, but responses are sent with `no-store`, so every identical search calls the model again | Cache ranked results per normalized query for an hour; the cheapest cost win available |
| Rate limits reset on cold start | The limiter is in memory per function instance | Acceptable for a demo; move to a shared store before real traffic |
| Overtrust in the eligibility check | A patient may read `likely_meets` as "eligible" | Default-to-unclear, quoted evidence, and the mandatory site-confirmation line; test wording with patients |
| Unvalidated audiences | Neither persona has been confirmed in research | 5 to 8 interviews per audience before building further (see README) |

## Open questions

- Is relevance or recall the bigger problem for real users? The labelled set answers this.
- Does plain language change behaviour (more source-record and recruiting-site clicks), or is it only nicer to read?
- What is the acceptable `unclear` rate for the eligibility check before it stops being useful?
