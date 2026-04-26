-- Cache table for AI-generated plain-language rewrites of trials
CREATE TABLE public.plain_language_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nct_id TEXT NOT NULL UNIQUE,
  source_updated_at TIMESTAMPTZ,
  -- Rewritten fields (everyday language, ~8th grade reading level)
  plain_title TEXT NOT NULL,
  plain_summary TEXT NOT NULL,
  plain_condition TEXT,
  plain_intervention TEXT,
  plain_eligibility TEXT,
  plain_design TEXT,
  plain_time_commitment TEXT,
  plain_what_happens TEXT,
  -- Numbers in human terms (e.g. "1 in 3 get placebo", "visits every 3 weeks")
  key_numbers JSONB DEFAULT '[]'::jsonb,
  -- Flags
  is_recruiting BOOLEAN DEFAULT false,
  model_used TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plain_lang_nct ON public.plain_language_trials(nct_id);
CREATE INDEX idx_plain_lang_recruiting ON public.plain_language_trials(is_recruiting) WHERE is_recruiting = true;

ALTER TABLE public.plain_language_trials ENABLE ROW LEVEL SECURITY;

-- Public-readable cache (no PII; just rephrased public registry data)
CREATE POLICY "public read plain_language_trials"
ON public.plain_language_trials FOR SELECT
USING (true);

-- Edge function (service role) is the only writer; no public insert/update policy needed.

CREATE TRIGGER touch_plain_language_trials
BEFORE UPDATE ON public.plain_language_trials
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Track audience choice per session for analytics
CREATE TABLE public.audience_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('clinical', 'patient', 'unspecified')),
  plain_mode_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audience_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert audience_selections"
ON public.audience_selections FOR INSERT
WITH CHECK (true);

CREATE POLICY "public read audience_selections"
ON public.audience_selections FOR SELECT
USING (true);