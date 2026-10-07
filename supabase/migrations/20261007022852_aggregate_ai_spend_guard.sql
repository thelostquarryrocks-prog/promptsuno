-- Review/local CI only. No seed, activation, pricing assumption or live allowance.
begin;

create table compiler_quota_private.ai_spend_policy (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  model text not null check (model = 'gpt-5.6-luna'),
  pricing_version text not null check (length(pricing_version) between 1 and 120),
  pricing_valid_until timestamptz not null,
  input_microusd_per_million bigint not null check (input_microusd_per_million between 1 and 1000000000000),
  output_microusd_per_million bigint not null check (output_microusd_per_million between 1 and 1000000000000),
  lifetime_limit_microusd bigint not null check (lifetime_limit_microusd between 1 and 1000000000000),
  daily_limit_microusd bigint not null check (daily_limit_microusd between 1 and 1000000000000),
  lifetime_reserved_microusd bigint not null default 0 check (lifetime_reserved_microusd >= 0),
  daily_reserved_microusd bigint not null default 0 check (daily_reserved_microusd >= 0),
  usage_day date not null default (current_timestamp at time zone 'UTC')::date,
  check (daily_limit_microusd <= lifetime_limit_microusd)
);
alter table compiler_quota_private.ai_spend_policy enable row level security;
revoke all on compiler_quota_private.ai_spend_policy from public, anon, authenticated, service_role;

-- Follows the existing narrowly granted quota RPC boundary. No caller-supplied
-- price, identity, allowance, token count, timestamp or refund is accepted.
create function public.reserve_ai_attempt(requested_action text)
returns jsonb language plpgsql security definer
set search_path = '' set lock_timeout = '3s'
as $$
declare
  verified_user uuid := auth.uid();
  policy compiler_quota_private.ai_spend_policy%rowtype;
  observed_at timestamptz;
  today date;
  daily_used bigint;
  charge bigint;
  user_reservation jsonb;
begin
  if verified_user is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if requested_action is null or requested_action not in ('compile', 'assist') then
    raise exception 'Unsupported AI action' using errcode = '22023';
  end if;

  -- ALL actions/accounts serialize on this row. Operator shutoff updates take
  -- this same lock; requests already reserved before shutoff remain accounted.
  select * into policy from compiler_quota_private.ai_spend_policy where singleton for update;
  if not found then
    raise exception 'AI spending policy is not configured' using errcode = '55000';
  end if;
  observed_at := pg_catalog.clock_timestamp();
  if not policy.enabled or policy.pricing_valid_until <= observed_at then
    return pg_catalog.jsonb_build_object('contract_version', 1, 'allowed', false, 'reason', 'paused');
  end if;

  -- Fixed conservative text-only envelope shared with the server contract.
  -- Full input rate also covers cached input; output includes reasoning tokens.
  -- Rounded UP in integer micro-USD, retained even for failure/timeout/abort.
  charge := ceil((131072::numeric * policy.input_microusd_per_million
    + 2048::numeric * policy.output_microusd_per_million) / 1000000)::bigint;
  today := (observed_at at time zone 'UTC')::date;
  daily_used := case when policy.usage_day = today then policy.daily_reserved_microusd else 0 end;
  if charge > policy.lifetime_limit_microusd - policy.lifetime_reserved_microusd
    or charge > policy.daily_limit_microusd - daily_used then
    return pg_catalog.jsonb_build_object('contract_version', 1, 'allowed', false, 'reason', 'paused');
  end if;

  -- This nested reservation is in the SAME transaction. Any exception rolls
  -- back both budgets; a per-user denial consumes no aggregate allowance.
  user_reservation := public.reserve_compiler_attempt();
  if user_reservation->>'allowed' = 'false' then
    return pg_catalog.jsonb_build_object('contract_version', 1, 'allowed', false,
      'reason', 'quota', 'retry_after_seconds', user_reservation->'retry_after_seconds');
  end if;
  if user_reservation->>'allowed' is distinct from 'true' then
    raise exception 'Invalid quota reservation' using errcode = '55000';
  end if;
  update compiler_quota_private.ai_spend_policy set
    lifetime_reserved_microusd = lifetime_reserved_microusd + charge,
    daily_reserved_microusd = daily_used + charge, usage_day = today
    where singleton;
  return pg_catalog.jsonb_build_object('contract_version', 1, 'allowed', true,
    'model', policy.model, 'input_token_reservation', 131072, 'output_token_cap', 2048,
    'reserved_microusd', charge);
end;
$$;
revoke all on function public.reserve_ai_attempt(text) from public, anon, authenticated, service_role;
grant execute on function public.reserve_ai_attempt(text) to authenticated;
comment on function public.reserve_ai_attempt(text) is
  'Atomic shared aggregate liability and existing per-user quota reservation. No refunds; disabled/missing/expired configuration fails closed. Not a provider billing guarantee.';
commit;
