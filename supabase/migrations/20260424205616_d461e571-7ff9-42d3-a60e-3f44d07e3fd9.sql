-- ── Learning + adaptation storage for Search Registry ──

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  ip_hash text,
  query text not null,
  query_normalized text,
  ctg_query text,
  filter_phase text,
  filter_status text,
  filter_country_us boolean default false,
  candidates_fetched integer,
  results_returned integer,
  total_count integer,
  used_fallback boolean default false,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_search_events_session on public.search_events(session_id, created_at);
create index if not exists idx_search_events_created on public.search_events(created_at desc);

create table if not exists public.result_interactions (
  id uuid primary key default gen_random_uuid(),
  search_event_id uuid references public.search_events(id) on delete cascade,
  session_id text not null,
  nct_id text not null,
  rank_position integer,
  semantic_score integer,
  event_type text not null check (event_type in ('card_click','ctg_link_click','dwell')),
  dwell_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_result_interactions_event on public.result_interactions(search_event_id);
create index if not exists idx_result_interactions_nct on public.result_interactions(nct_id);

create table if not exists public.result_feedback (
  id uuid primary key default gen_random_uuid(),
  search_event_id uuid references public.search_events(id) on delete cascade,
  session_id text not null,
  nct_id text not null,
  rating text not null check (rating in ('up','down')),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_result_feedback_event on public.result_feedback(search_event_id);

create table if not exists public.session_outcomes (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  rating smallint check (rating between 1 and 5),
  testimonial text,
  role text,
  use_case text,
  consent_to_show boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.search_refinements (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  prior_search_event_id uuid references public.search_events(id) on delete cascade,
  next_search_event_id uuid references public.search_events(id) on delete cascade,
  prior_query text,
  next_query text,
  seconds_between integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_search_refinements_session on public.search_refinements(session_id);

-- Enable RLS
alter table public.search_events enable row level security;
alter table public.result_interactions enable row level security;
alter table public.result_feedback enable row level security;
alter table public.session_outcomes enable row level security;
alter table public.search_refinements enable row level security;

-- INSERT-only policies for anonymous (the edge function uses service role anyway,
-- but this keeps the surface tight if anyone ever calls direct).
create policy "anon can insert search_events"  on public.search_events  for insert with check (true);
create policy "anon can insert result_interactions" on public.result_interactions for insert with check (true);
create policy "anon can insert result_feedback" on public.result_feedback for insert with check (true);
create policy "anon can insert session_outcomes" on public.session_outcomes for insert with check (true);
create policy "anon can upsert session_outcomes" on public.session_outcomes for update using (true) with check (true);
create policy "anon can insert search_refinements" on public.search_refinements for insert with check (true);

-- Public aggregate counters (security definer, no row-level leakage)
create or replace function public.search_registry_impact()
returns table(
  total_searches bigint,
  total_trials_surfaced bigint,
  unique_sessions bigint,
  positive_feedback_pct numeric,
  top_queries jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with f as (
    select
      count(*) filter (where rating = 'up')::numeric as ups,
      count(*) filter (where rating = 'down')::numeric as downs
    from public.result_feedback
  ),
  q as (
    select query_normalized, count(*) as n
    from public.search_events
    where query_normalized is not null
    group by query_normalized
    order by n desc
    limit 5
  )
  select
    (select count(*) from public.search_events) as total_searches,
    coalesce((select sum(results_returned) from public.search_events), 0)::bigint as total_trials_surfaced,
    (select count(distinct session_id) from public.search_events) as unique_sessions,
    case when (select ups + downs from f) > 0
         then round(((select ups from f) / (select ups + downs from f)) * 100, 1)
         else null end as positive_feedback_pct,
    coalesce((select jsonb_agg(jsonb_build_object('q', query_normalized, 'n', n)) from q), '[]'::jsonb) as top_queries;
$$;

grant execute on function public.search_registry_impact() to anon, authenticated;