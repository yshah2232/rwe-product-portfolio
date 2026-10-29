CREATE TABLE public.public_ai_limits (bucket_key text PRIMARY KEY, purpose text NOT NULL, minute_start timestamptz NOT NULL, minute_attempts integer NOT NULL DEFAULT 0, daily_attempts integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL);
GRANT ALL ON public.public_ai_limits TO service_role;
REVOKE ALL ON public.public_ai_limits FROM PUBLIC, anon, authenticated;
ALTER TABLE public.public_ai_limits ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.public_ai_limits IS 'Short-lived keyed security counters only. No raw IP, document, message, search or visitor session contents.';
CREATE OR REPLACE FUNCTION public.consume_public_ai_attempt(p_key text, p_purpose text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE m integer; d integer; minute_cap integer; daily_cap integer;
BEGIN
 IF p_key !~ '^[a-f0-9]{64}$' OR p_purpose NOT IN ('review','comparison') THEN RETURN false; END IF;
 minute_cap := CASE WHEN p_purpose='review' THEN 4 ELSE 6 END;
 daily_cap := CASE WHEN p_purpose='review' THEN 20 ELSE 30 END;
 DELETE FROM public.public_ai_limits WHERE expires_at <= now();
 INSERT INTO public.public_ai_limits(bucket_key,purpose,minute_start,minute_attempts,daily_attempts,expires_at) VALUES(p_key,p_purpose,date_trunc('minute',now()),1,1,date_trunc('day',now())+interval '1 day')
 ON CONFLICT(bucket_key) DO UPDATE SET minute_attempts=CASE WHEN public_ai_limits.minute_start < date_trunc('minute',now()) THEN 1 ELSE public_ai_limits.minute_attempts+1 END, minute_start=date_trunc('minute',now()),daily_attempts=public_ai_limits.daily_attempts+1
 RETURNING minute_attempts,daily_attempts INTO m,d;
 RETURN m <= minute_cap AND d <= daily_cap;
END; $$;
REVOKE ALL ON FUNCTION public.consume_public_ai_attempt(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_ai_attempt(text,text) TO service_role;