-- 1. Drop overly permissive UPDATE/DELETE policies on saved_cohorts
DROP POLICY IF EXISTS "anyone can update cohorts" ON public.saved_cohorts;
DROP POLICY IF EXISTS "anyone can delete cohorts" ON public.saved_cohorts;

-- 2. Drop overly permissive UPDATE/DELETE policies on cohort_trials
DROP POLICY IF EXISTS "anyone can update cohort trials" ON public.cohort_trials;
DROP POLICY IF EXISTS "anyone can delete cohort trials" ON public.cohort_trials;

-- 3. Drop public SELECT on audience_selections (write-only telemetry; never read from client)
DROP POLICY IF EXISTS "public read audience_selections" ON public.audience_selections;
