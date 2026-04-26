ALTER TABLE public.plain_language_trials
  ADD COLUMN IF NOT EXISTS doc_checklist jsonb NOT NULL DEFAULT '[]'::jsonb;