-- Local review only until separately approved for the intended Supabase project.
-- Intentionally NO policy seed: missing launch configuration fails closed.
begin;

create schema compiler_quota_private;
revoke all on schema compiler_quota_private from public, anon, authenticated, service_role;

create table compiler_quota_private.policy (
  singleton boolean primary key default true check (singleton),
  burst_limit integer not null check (burst_limit between 1 and 1000000),
  burst_window_seconds integer not null check (burst_window_seconds between 1 and 2678400),
  sustained_limit integer not null check (sustained_limit between 1 and 1000000),
  sustained_window_seconds integer not null check (sustained_window_seconds between 1 and 2678400),
  check (burst_window_seconds <= sustained_window_seconds),
  check (burst_limit <= sustained_limit)
);

-- One bounded row per user, no prompt, notes, request body or attempt history.
-- Account deletion removes its counter; expiry reuses the same row.
create table compiler_quota_private.usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  burst_used integer not null default 0 check (burst_used >= 0),
  burst_ends_at timestamptz not null default '-infinity',
  sustained_used integer not null default 0 check (sustained_used >= 0),
  sustained_ends_at timestamptz not null default '-infinity'
);

alter table compiler_quota_private.policy enable row level security;
alter table compiler_quota_private.usage enable row level security;
revoke all on all tables in schema compiler_quota_private from public, anon, authenticated, service_role;

create function public.reserve_compiler_attempt()
returns jsonb
language plpgsql
security definer
set search_path = ''
set lock_timeout = '3s'
as $$
declare
  verified_user uuid := auth.uid();
  limits compiler_quota_private.policy%rowtype;
  counters compiler_quota_private.usage%rowtype;
  observed_at timestamptz;
  retry_at timestamptz;
begin
  if verified_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  -- Lock policy before usage everywhere. Updates wait for in-flight reservations.
  select * into limits from compiler_quota_private.policy where singleton for share;
  if not found then
    raise exception 'Compiler quota is not configured' using errcode = '55000';
  end if;

  insert into compiler_quota_private.usage (user_id) values (verified_user)
    on conflict (user_id) do nothing;
  select * into strict counters from compiler_quota_private.usage
    where user_id = verified_user for update;

  -- Read wall clock AFTER acquiring the lock, including across a window boundary.
  observed_at := pg_catalog.clock_timestamp();
  if observed_at >= counters.burst_ends_at then
    counters.burst_used := 0;
    counters.burst_ends_at := pg_catalog.to_timestamp(
      (floor(extract(epoch from observed_at) / limits.burst_window_seconds) + 1)
        * limits.burst_window_seconds);
  end if;
  if observed_at >= counters.sustained_ends_at then
    counters.sustained_used := 0;
    counters.sustained_ends_at := pg_catalog.to_timestamp(
      (floor(extract(epoch from observed_at) / limits.sustained_window_seconds) + 1)
        * limits.sustained_window_seconds);
  end if;

  -- Either reserve BOTH counters, or neither. The later exhausted window wins.
  if counters.burst_used >= limits.burst_limit or counters.sustained_used >= limits.sustained_limit then
    retry_at := greatest(
      case when counters.burst_used >= limits.burst_limit then counters.burst_ends_at else observed_at end,
      case when counters.sustained_used >= limits.sustained_limit then counters.sustained_ends_at else observed_at end);
    return pg_catalog.jsonb_build_object('allowed', false, 'retry_after_seconds',
      greatest(1, ceil(extract(epoch from retry_at - observed_at)))::bigint);
  end if;

  update compiler_quota_private.usage set
    burst_used = counters.burst_used + 1,
    burst_ends_at = counters.burst_ends_at,
    sustained_used = counters.sustained_used + 1,
    sustained_ends_at = counters.sustained_ends_at
    where user_id = verified_user;
  return pg_catalog.jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
end;
$$;

-- Revoke Supabase default privileges as well as PostgreSQL's PUBLIC default.
revoke all on function public.reserve_compiler_attempt() from public, anon, authenticated, service_role;
grant execute on function public.reserve_compiler_attempt() to authenticated;
comment on function public.reserve_compiler_attempt() is
  'Reserves both compiler budgets for auth.uid(); no refunds or client configuration. Policy must be configured by an operator.';

commit;
