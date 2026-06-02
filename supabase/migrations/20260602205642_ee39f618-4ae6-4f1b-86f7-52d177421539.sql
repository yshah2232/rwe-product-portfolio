CREATE TABLE public.ui_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  path text NOT NULL,
  event_type text NOT NULL,
  x_norm numeric,
  y_norm numeric,
  viewport_w integer,
  viewport_h integer,
  scroll_depth_pct integer,
  selector text,
  element_text text,
  element_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ui_interactions_path_created ON public.ui_interactions (path, created_at DESC);
CREATE INDEX idx_ui_interactions_session ON public.ui_interactions (session_id);

GRANT SELECT, INSERT ON public.ui_interactions TO anon;
GRANT SELECT, INSERT ON public.ui_interactions TO authenticated;
GRANT ALL ON public.ui_interactions TO service_role;

ALTER TABLE public.ui_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert ui_interactions"
  ON public.ui_interactions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "public read ui_interactions"
  ON public.ui_interactions FOR SELECT
  TO public
  USING (true);
