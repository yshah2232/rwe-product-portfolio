CREATE TABLE public.issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  message text NOT NULL,
  page_url text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.issue_reports TO service_role;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.issue_reports IS 'Visitor-submitted problem reports. Insert and read happen only through edge functions with the service role; no direct Data API access.';