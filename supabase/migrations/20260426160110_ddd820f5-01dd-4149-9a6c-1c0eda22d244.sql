-- 1) Extend plain_language_trials with journey + demographics
ALTER TABLE public.plain_language_trials
  ADD COLUMN IF NOT EXISTS journey_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS demographics jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) eligibility_checks: per-trial self-check results.
-- We never persist file content — only the structured checklist outcomes.
CREATE TABLE IF NOT EXISTS public.eligibility_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  nct_id text NOT NULL,
  files_count integer NOT NULL DEFAULT 0,
  total_bytes integer NOT NULL DEFAULT 0,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_signal text,            -- 'likely_eligible' | 'unclear' | 'likely_not_eligible' | 'no_docs'
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eligibility_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert eligibility_checks"
  ON public.eligibility_checks FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "public read eligibility_checks"
  ON public.eligibility_checks FOR SELECT
  TO public USING (true);

CREATE INDEX IF NOT EXISTS idx_eligibility_checks_nct ON public.eligibility_checks(nct_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_session ON public.eligibility_checks(session_id);