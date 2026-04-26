-- Module 2: Diversity & Access overlays
-- Three new tables: normalized_locations (geo enrichment of trial sites),
-- acs_cache (Census ACS demographic cache), disease_prevalence (benchmark rates).

-- 1. Normalized location records: one row per (nct_id, raw site) with FIPS + ZIP3.
CREATE TABLE public.normalized_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nct_id TEXT NOT NULL,
  raw_facility TEXT,
  raw_city TEXT,
  raw_state TEXT,
  raw_country TEXT NOT NULL,
  -- Resolved geo
  state_code TEXT,           -- e.g. "CA"
  county_name TEXT,          -- e.g. "Los Angeles County"
  county_fips TEXT,          -- 5-digit FIPS (state+county), e.g. "06037"
  zip3 TEXT,                 -- first 3 digits of ZIP, e.g. "900"
  resolution_method TEXT NOT NULL DEFAULT 'unresolved', -- 'city_state_lookup' | 'state_only' | 'unresolved'
  resolution_confidence INTEGER NOT NULL DEFAULT 0,    -- 0-100
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_field TEXT NOT NULL DEFAULT 'protocolSection.contactsLocationsModule.locations[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_normloc_nct ON public.normalized_locations(nct_id);
CREATE INDEX idx_normloc_county ON public.normalized_locations(county_fips) WHERE county_fips IS NOT NULL;
CREATE INDEX idx_normloc_zip3 ON public.normalized_locations(zip3) WHERE zip3 IS NOT NULL;

ALTER TABLE public.normalized_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read normalized_locations"
  ON public.normalized_locations FOR SELECT TO public USING (true);

-- Edge function (service role) handles inserts; no public insert policy needed.

-- 2. ACS demographic cache: one row per (geo_type, geo_id, year)
CREATE TABLE public.acs_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  geo_type TEXT NOT NULL,             -- 'county' | 'zip3' | 'national' | 'state'
  geo_id TEXT NOT NULL,               -- '06037' | '900' | 'US' | 'CA'
  acs_year INTEGER NOT NULL,          -- e.g. 2022 (5-year ACS endpoint)
  total_population INTEGER,
  -- Race/ethnicity (B03002, non-Hispanic + Hispanic combined)
  pop_white_nh INTEGER,
  pop_black_nh INTEGER,
  pop_asian_nh INTEGER,
  pop_aian_nh INTEGER,                -- American Indian / Alaska Native
  pop_nhpi_nh INTEGER,                -- Native Hawaiian / Pacific Islander
  pop_other_nh INTEGER,
  pop_multi_nh INTEGER,
  pop_hispanic INTEGER,
  -- Age (B01001 condensed)
  pop_age_under18 INTEGER,
  pop_age_18_64 INTEGER,
  pop_age_65plus INTEGER,
  -- Income
  median_household_income INTEGER,
  -- Provenance
  source_url TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE (geo_type, geo_id, acs_year)
);

CREATE INDEX idx_acs_lookup ON public.acs_cache(geo_type, geo_id, acs_year);
CREATE INDEX idx_acs_expires ON public.acs_cache(expires_at);

ALTER TABLE public.acs_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read acs_cache"
  ON public.acs_cache FOR SELECT TO public USING (true);

-- 3. Disease prevalence benchmarks (race/ethnicity-weighted prevalence per indication).
-- Manually curated from public sources (CDC, SEER, NIH). Each row carries source URL.
CREATE TABLE public.disease_prevalence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indication_clean TEXT NOT NULL,     -- matches indication_mappings.clean_value
  population_group TEXT NOT NULL,     -- 'white_nh' | 'black_nh' | 'asian_nh' | 'hispanic' | 'all'
  prevalence_per_100k NUMERIC,        -- crude or age-adjusted prevalence
  metric_type TEXT NOT NULL DEFAULT 'incidence_per_100k', -- 'incidence_per_100k' | 'prevalence_per_100k' | 'pct_of_diagnoses'
  source_name TEXT NOT NULL,          -- e.g. "SEER 2017-2021"
  source_url TEXT NOT NULL,
  source_year INTEGER NOT NULL,
  notes TEXT,
  confidence INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (indication_clean, population_group, metric_type)
);

CREATE INDEX idx_prev_indication ON public.disease_prevalence(indication_clean);

ALTER TABLE public.disease_prevalence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read disease_prevalence"
  ON public.disease_prevalence FOR SELECT TO public USING (true);

-- Touch trigger for updated_at on all three
CREATE TRIGGER touch_normloc BEFORE UPDATE ON public.normalized_locations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_prev BEFORE UPDATE ON public.disease_prevalence
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();