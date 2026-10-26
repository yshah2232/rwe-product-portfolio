-- Module 3 (Barriers & Access) Phase 1 — ACS language access + socioeconomic strain
-- acs_barriers_cache: cached county/national LEP + poverty measures from Census ACS 2022 5-year
--   (Tables C16002 limited-English-speaking households, B17001 poverty status)
-- site_barriers: per-cohort-site snapshot linking a normalized location's county to cached measures

CREATE TABLE public.acs_barriers_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  geo_type TEXT NOT NULL,              -- 'county' | 'national'
  geo_id TEXT NOT NULL,                -- 5-digit FIPS e.g. '06037' | 'US'
  acs_year INTEGER NOT NULL,           -- e.g. 2022 (ACS 5-year endpoint)
  lep_population INTEGER,              -- members of limited-English-speaking households, pop 5+ (C16002_004E+007E+010E+013E)
  lep_total_population INTEGER,        -- population 5+ (C16002_001E)
  poverty_population INTEGER,          -- population for whom poverty status determined (B17001_001E)
  poverty_below_level INTEGER,         -- income below poverty level (B17001_002E)
  lep_pct NUMERIC(6,2),
  poverty_pct NUMERIC(6,2),
  source_url TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE (geo_type, geo_id, acs_year)
);

CREATE INDEX idx_acs_barriers_geo ON public.acs_barriers_cache(geo_type, geo_id, acs_year);

GRANT SELECT ON public.acs_barriers_cache TO anon;
GRANT ALL ON public.acs_barriers_cache TO service_role;
ALTER TABLE public.acs_barriers_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read acs_barriers_cache"
  ON public.acs_barriers_cache FOR SELECT TO public USING (true);

CREATE TABLE public.site_barriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID NOT NULL,
  nct_id TEXT NOT NULL,
  normalized_location_id UUID NOT NULL,
  county_fips TEXT NOT NULL,
  lep_pct NUMERIC(6,2),
  poverty_pct NUMERIC(6,2),
  barrier_score INTEGER,               -- 0-100 composite, null when components unavailable
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE (cohort_id, normalized_location_id)
);

CREATE INDEX idx_site_barriers_cohort ON public.site_barriers(cohort_id);
CREATE INDEX idx_site_barriers_county ON public.site_barriers(county_fips);

GRANT SELECT ON public.site_barriers TO anon;
GRANT ALL ON public.site_barriers TO service_role;
ALTER TABLE public.site_barriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site_barriers"
  ON public.site_barriers FOR SELECT TO public USING (true);
