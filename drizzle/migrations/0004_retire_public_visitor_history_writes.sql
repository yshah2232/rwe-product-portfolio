REVOKE ALL ON public.saved_cohorts, public.cohort_trials, public.audience_selections, public.ui_interactions, public.eligibility_checks FROM anon, authenticated;
GRANT ALL ON public.saved_cohorts, public.cohort_trials, public.audience_selections, public.ui_interactions, public.eligibility_checks TO service_role;
COMMENT ON TABLE public.saved_cohorts IS 'DEPRECATED for public visitors: direct memory-only trial comparison replaces cohort saving. Historical rows retained pending explicit deletion authorization.';
COMMENT ON TABLE public.cohort_trials IS 'DEPRECATED for public visitors: no new public cohort membership writes.';
COMMENT ON TABLE public.audience_selections IS 'DEPRECATED visitor collection: historical records only; public writes disabled.';
COMMENT ON TABLE public.ui_interactions IS 'DEPRECATED visitor collection: historical records only; public writes disabled.';
COMMENT ON TABLE public.eligibility_checks IS 'DEPRECATED visitor collection: new assessments are returned without application persistence.';