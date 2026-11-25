DROP POLICY IF EXISTS "public read normalized_locations" ON public.normalized_locations;
DROP POLICY IF EXISTS "public read plain_language_trials" ON public.plain_language_trials;
DROP POLICY IF EXISTS "public read indication_mappings" ON public.indication_mappings;
DROP POLICY IF EXISTS "public read acs_cache" ON public.acs_cache;
DROP POLICY IF EXISTS "public read asset_mappings" ON public.asset_mappings;
DROP POLICY IF EXISTS "public read disease_prevalence" ON public.disease_prevalence;
DROP POLICY IF EXISTS "public read sponsor_mappings" ON public.sponsor_mappings;
REVOKE ALL ON public.normalized_locations, public.plain_language_trials, public.indication_mappings, public.acs_cache, public.asset_mappings, public.disease_prevalence, public.sponsor_mappings FROM anon, authenticated;
GRANT ALL ON public.normalized_locations, public.plain_language_trials, public.indication_mappings, public.acs_cache, public.asset_mappings, public.disease_prevalence, public.sponsor_mappings TO service_role;