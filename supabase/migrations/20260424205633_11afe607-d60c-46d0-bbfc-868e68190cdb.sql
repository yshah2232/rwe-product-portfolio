drop policy if exists "anon can insert search_events"  on public.search_events;
drop policy if exists "anon can insert result_interactions" on public.result_interactions;
drop policy if exists "anon can insert result_feedback" on public.result_feedback;
drop policy if exists "anon can insert session_outcomes" on public.session_outcomes;
drop policy if exists "anon can upsert session_outcomes" on public.session_outcomes;
drop policy if exists "anon can insert search_refinements" on public.search_refinements;