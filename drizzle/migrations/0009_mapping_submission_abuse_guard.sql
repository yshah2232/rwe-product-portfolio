CREATE TABLE public.mapping_submission_limits (bucket_key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL);
GRANT ALL ON public.mapping_submission_limits TO service_role;
REVOKE ALL ON public.mapping_submission_limits FROM PUBLIC, anon, authenticated;
ALTER TABLE public.mapping_submission_limits ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.mapping_submission_limits IS 'Short-lived keyed abuse counters only; no raw IP, query, session, or report contents.';
CREATE OR REPLACE FUNCTION public.submit_mapping_correction(p_bucket text, p_field text, p_raw text, p_clean text, p_note text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer; existing_id uuid;
BEGIN
 IF p_bucket !~ '^[a-f0-9]{64}$' OR p_field NOT IN ('sponsor','indication','asset') OR char_length(p_raw) NOT BETWEEN 1 AND 300 OR char_length(p_clean) NOT BETWEEN 2 AND 200 OR char_length(coalesce(p_note,'')) > 500 THEN RETURN 'invalid'; END IF;
 DELETE FROM public.mapping_submission_limits WHERE expires_at <= now();
 INSERT INTO public.mapping_submission_limits(bucket_key,attempts,expires_at) VALUES(p_bucket,1,now()+interval '1 hour') ON CONFLICT(bucket_key) DO UPDATE SET attempts=mapping_submission_limits.attempts+1 RETURNING attempts INTO n;
 IF n > 5 THEN RETURN 'limited'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_field || chr(31) || p_raw || chr(31) || p_clean,0));
 SELECT id INTO existing_id FROM public.mapping_overrides WHERE field_type=p_field AND raw_value=p_raw AND suggested_clean=p_clean AND status='pending' LIMIT 1;
 IF existing_id IS NOT NULL THEN RETURN 'duplicate'; END IF;
 INSERT INTO public.mapping_overrides(field_type,raw_value,suggested_clean,note,session_id,vote_count) VALUES(p_field,p_raw,p_clean,p_note,NULL,1);
 RETURN 'created';
END; $$;
REVOKE ALL ON FUNCTION public.submit_mapping_correction(text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_mapping_correction(text,text,text,text,text) TO service_role;