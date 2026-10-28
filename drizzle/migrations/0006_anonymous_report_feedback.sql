CREATE TABLE public.report_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.report_feedback TO service_role;
ALTER TABLE public.report_feedback ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.report_feedback IS 'Voluntary anonymous PDF experience feedback. No visitor, query, trial or report identifiers. Service role access only through validated intake and verified admin functions.';
CREATE INDEX report_feedback_created_at_idx ON public.report_feedback (created_at DESC);