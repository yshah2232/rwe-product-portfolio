DROP POLICY IF EXISTS "public read ui_interactions" ON public.ui_interactions;
DROP POLICY IF EXISTS "public insert ui_interactions" ON public.ui_interactions;
REVOKE SELECT ON public.ui_interactions FROM anon, authenticated;
GRANT INSERT ON public.ui_interactions TO anon, authenticated;
CREATE POLICY "public insert ui_interactions" ON public.ui_interactions FOR INSERT TO anon, authenticated
WITH CHECK (
  event_type IN ('click','rage_click','scroll_depth')
  AND char_length(path) <= 200
  AND char_length(session_id) <= 64
  AND (selector IS NULL OR char_length(selector) <= 300)
  AND (element_text IS NULL OR char_length(element_text) <= 120)
);