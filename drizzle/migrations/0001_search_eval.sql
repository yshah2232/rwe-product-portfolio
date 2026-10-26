CREATE TABLE public.search_eval_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL CHECK (char_length(query) BETWEEN 3 AND 200),
  expected_concepts text[] NOT NULL DEFAULT '{}',
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.search_eval_cases TO service_role;
REVOKE ALL ON public.search_eval_cases FROM anon, authenticated;
ALTER TABLE public.search_eval_cases ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.search_eval_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.search_eval_cases(id) ON DELETE CASCADE,
  top5_ncts text[] NOT NULL DEFAULT '{}',
  relevant_in_top5 boolean NOT NULL,
  relevant_rank integer CHECK (relevant_rank IS NULL OR relevant_rank BETWEEN 1 AND 5),
  candidates_fetched integer,
  retrieval_passes integer,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.search_eval_runs TO service_role;
REVOKE ALL ON public.search_eval_runs FROM anon, authenticated;
ALTER TABLE public.search_eval_runs ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.search_eval_runs (case_id, created_at DESC);