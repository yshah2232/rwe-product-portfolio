REVOKE ALL ON public.report_feedback FROM anon, authenticated;
GRANT ALL ON public.report_feedback TO service_role;