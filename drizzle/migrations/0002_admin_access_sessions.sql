CREATE TABLE public.admin_access_sessions (
  token_hash text PRIMARY KEY,
  credential_version text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_access_sessions TO service_role;
ALTER TABLE public.admin_access_sessions ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.admin_login_limits (
  bucket_key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_login_limits TO service_role;
ALTER TABLE public.admin_login_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.consume_admin_login_attempt(p_key text, p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.admin_login_limits WHERE window_start < now() - interval '1 day';
  DELETE FROM public.admin_access_sessions WHERE expires_at < now();
  INSERT INTO public.admin_login_limits(bucket_key, attempts, window_start) VALUES(p_key, 1, now())
  ON CONFLICT (bucket_key) DO UPDATE SET
    attempts = CASE WHEN admin_login_limits.window_start < now() - interval '15 minutes' THEN 1 ELSE admin_login_limits.attempts + 1 END,
    window_start = CASE WHEN admin_login_limits.window_start < now() - interval '15 minutes' THEN now() ELSE admin_login_limits.window_start END
  RETURNING attempts INTO n;
  RETURN n <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_admin_login_attempt(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_admin_login_attempt(text, integer) TO service_role;