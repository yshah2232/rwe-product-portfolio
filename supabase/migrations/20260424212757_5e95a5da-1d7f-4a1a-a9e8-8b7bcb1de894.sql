
-- ============================================================
-- Module 1 — Saved cohorts + Canonicalization mappings
-- ============================================================

-- ── SAVED COHORTS ──────────────────────────────────────────
CREATE TABLE public.saved_cohorts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT NOT NULL,
  name          TEXT NOT NULL,
  notes         TEXT,
  query_text    TEXT,
  filter_phase  TEXT,
  filter_status TEXT,
  filter_country_us BOOLEAN DEFAULT false,
  trial_count   INTEGER NOT NULL DEFAULT 0,
  refreshed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_cohorts_session ON public.saved_cohorts(session_id, created_at DESC);

ALTER TABLE public.saved_cohorts ENABLE ROW LEVEL SECURITY;

-- UUIDs are unguessable; treat the id like a share link.
CREATE POLICY "anyone can read cohorts"
  ON public.saved_cohorts FOR SELECT USING (true);
CREATE POLICY "anyone can create cohorts"
  ON public.saved_cohorts FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update cohorts"
  ON public.saved_cohorts FOR UPDATE USING (true);
CREATE POLICY "anyone can delete cohorts"
  ON public.saved_cohorts FOR DELETE USING (true);

-- ── COHORT TRIALS ──────────────────────────────────────────
CREATE TABLE public.cohort_trials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id       UUID NOT NULL REFERENCES public.saved_cohorts(id) ON DELETE CASCADE,
  nct_id          TEXT NOT NULL,
  brief_title     TEXT,
  overall_status  TEXT,
  phase           TEXT[],
  sponsor_raw     TEXT,
  sponsor_clean   TEXT,
  conditions_raw  TEXT[],
  conditions_clean TEXT[],
  interventions_raw TEXT[],
  interventions_clean TEXT[],
  enrollment      INTEGER,
  countries       TEXT[],
  semantic_score  INTEGER,
  semantic_reason TEXT,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, nct_id)
);

CREATE INDEX idx_cohort_trials_cohort ON public.cohort_trials(cohort_id);

ALTER TABLE public.cohort_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read cohort trials"
  ON public.cohort_trials FOR SELECT USING (true);
CREATE POLICY "anyone can insert cohort trials"
  ON public.cohort_trials FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update cohort trials"
  ON public.cohort_trials FOR UPDATE USING (true);
CREATE POLICY "anyone can delete cohort trials"
  ON public.cohort_trials FOR DELETE USING (true);

-- ── CANONICALIZATION MAPPINGS ──────────────────────────────
CREATE TABLE public.sponsor_mappings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_value   TEXT NOT NULL UNIQUE,
  clean_value TEXT NOT NULL,
  mapping_type TEXT NOT NULL DEFAULT 'rule',  -- 'rule' | 'manual' | 'llm'
  confidence  INTEGER NOT NULL DEFAULT 90,    -- 0-100
  source_note TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.indication_mappings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_value   TEXT NOT NULL UNIQUE,
  clean_value TEXT NOT NULL,
  mapping_type TEXT NOT NULL DEFAULT 'rule',
  confidence  INTEGER NOT NULL DEFAULT 90,
  source_note TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_mappings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_value   TEXT NOT NULL UNIQUE,
  clean_value TEXT NOT NULL,
  mapping_type TEXT NOT NULL DEFAULT 'rule',
  confidence  INTEGER NOT NULL DEFAULT 90,
  source_note TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsor_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indication_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_mappings ENABLE ROW LEVEL SECURITY;

-- Public read (so the trust drawer works on the client); writes only via service role.
CREATE POLICY "public read sponsor_mappings"   ON public.sponsor_mappings   FOR SELECT USING (true);
CREATE POLICY "public read indication_mappings" ON public.indication_mappings FOR SELECT USING (true);
CREATE POLICY "public read asset_mappings"     ON public.asset_mappings     FOR SELECT USING (true);

-- ── SEED canonicalization rules (small, hand-curated for V1) ──
INSERT INTO public.sponsor_mappings (raw_value, clean_value, mapping_type, confidence, source_note) VALUES
  ('Novo Nordisk A/S', 'Novo Nordisk', 'rule', 99, 'Trim legal suffix A/S'),
  ('Novo Nordisk Inc.', 'Novo Nordisk', 'rule', 99, 'Trim legal suffix Inc'),
  ('Eli Lilly and Company', 'Eli Lilly', 'rule', 99, 'Trim "and Company"'),
  ('Bristol-Myers Squibb', 'Bristol Myers Squibb', 'rule', 99, 'Drop hyphen'),
  ('AstraZeneca', 'AstraZeneca', 'rule', 99, 'Canonical'),
  ('Merck Sharp & Dohme LLC', 'Merck', 'rule', 95, 'MSD subsidiary'),
  ('Merck Sharp & Dohme Corp.', 'Merck', 'rule', 95, 'MSD subsidiary'),
  ('F. Hoffmann-La Roche Ltd', 'Roche', 'rule', 95, 'Trim legal'),
  ('Genentech, Inc.', 'Genentech (Roche)', 'rule', 90, 'Roche subsidiary'),
  ('Pfizer Inc.', 'Pfizer', 'rule', 99, 'Trim legal'),
  ('Pfizer', 'Pfizer', 'rule', 99, 'Canonical'),
  ('Sanofi', 'Sanofi', 'rule', 99, 'Canonical'),
  ('GlaxoSmithKline', 'GSK', 'rule', 95, 'Trade name'),
  ('Johnson & Johnson', 'Johnson & Johnson', 'rule', 99, 'Canonical'),
  ('Janssen Research & Development, LLC', 'Janssen (J&J)', 'rule', 90, 'J&J subsidiary')
ON CONFLICT (raw_value) DO NOTHING;

INSERT INTO public.indication_mappings (raw_value, clean_value, mapping_type, confidence, source_note) VALUES
  ('Non-Small Cell Lung Cancer', 'NSCLC', 'rule', 99, 'Standard abbreviation'),
  ('Non Small Cell Lung Cancer', 'NSCLC', 'rule', 99, 'Standard abbreviation'),
  ('NSCLC', 'NSCLC', 'rule', 99, 'Canonical'),
  ('Lung Neoplasms', 'Lung cancer', 'rule', 90, 'MeSH → plain term'),
  ('Carcinoma, Non-Small-Cell Lung', 'NSCLC', 'rule', 99, 'MeSH form'),
  ('Alzheimer Disease', 'Alzheimer''s disease', 'rule', 95, 'Possessive standard'),
  ('Alzheimer''s Disease', 'Alzheimer''s disease', 'rule', 99, 'Canonical'),
  ('Mild Cognitive Impairment', 'MCI', 'rule', 95, 'Standard abbreviation'),
  ('Obesity', 'Obesity', 'rule', 99, 'Canonical'),
  ('Type 2 Diabetes Mellitus', 'Type 2 diabetes', 'rule', 99, 'Drop "mellitus"'),
  ('Diabetes Mellitus, Type 2', 'Type 2 diabetes', 'rule', 99, 'MeSH form'),
  ('Breast Neoplasms', 'Breast cancer', 'rule', 90, 'MeSH → plain term'),
  ('Cardiovascular Diseases', 'Cardiovascular disease', 'rule', 95, 'Singular form')
ON CONFLICT (raw_value) DO NOTHING;

INSERT INTO public.asset_mappings (raw_value, clean_value, mapping_type, confidence, source_note) VALUES
  ('Semaglutide', 'Semaglutide (GLP-1)', 'rule', 95, 'GLP-1 agonist class tag'),
  ('semaglutide', 'Semaglutide (GLP-1)', 'rule', 95, 'Case-insensitive'),
  ('Tirzepatide', 'Tirzepatide (GIP/GLP-1)', 'rule', 95, 'Dual agonist class tag'),
  ('Liraglutide', 'Liraglutide (GLP-1)', 'rule', 95, 'GLP-1 agonist class tag'),
  ('Pembrolizumab', 'Pembrolizumab (anti-PD-1)', 'rule', 95, 'Checkpoint class'),
  ('Nivolumab', 'Nivolumab (anti-PD-1)', 'rule', 95, 'Checkpoint class'),
  ('Atezolizumab', 'Atezolizumab (anti-PD-L1)', 'rule', 95, 'Checkpoint class'),
  ('Durvalumab', 'Durvalumab (anti-PD-L1)', 'rule', 95, 'Checkpoint class'),
  ('Lecanemab', 'Lecanemab (anti-amyloid)', 'rule', 95, 'AD class'),
  ('Donanemab', 'Donanemab (anti-amyloid)', 'rule', 95, 'AD class'),
  ('Aducanumab', 'Aducanumab (anti-amyloid)', 'rule', 95, 'AD class')
ON CONFLICT (raw_value) DO NOTHING;

-- ── update_updated_at trigger (shared) ──
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_saved_cohorts_touch
  BEFORE UPDATE ON public.saved_cohorts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
