-- Credits: balances on profiles, an idempotent ledger, and atomic spend/grant functions.
-- All functions are service-role only (called from server routes / the signed webhook).

alter table public.profiles
  add column trial_credits integer not null default 0 check (trial_credits >= 0),
  add column sub_credits integer not null default 0 check (sub_credits >= 0),
  add column topup_credits integer not null default 0 check (topup_credits >= 0);

-- Existing users: 1 trial credit; existing Pro users: 40 subscription credits.
update public.profiles set trial_credits = 1;
update public.profiles set sub_credits = 40 where plan = 'pro';

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  bucket text not null check (bucket in ('trial', 'sub', 'topup')),
  reason text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  unique (reason, ref, bucket)
);
create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);
alter table public.credit_ledger enable row level security;
create policy "ledger: read own" on public.credit_ledger
  for select to authenticated using (user_id = auth.uid());

-- New signups get the 1-credit trial.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, trial_credits) values (new.id, new.email, 1)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Spend order: trial (only if p_use_trial), then subscription, then top-up.
-- Idempotent per (user, ref): a repeat call for an already-charged ref returns true without charging again.
create or replace function public.spend_credits(p_user uuid, p_cost integer, p_ref text, p_use_trial boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_ref text := p_user::text || ':' || p_ref;
  p public.profiles%rowtype;
  v_left integer := p_cost;
  t integer := 0; s integer := 0; u integer := 0;
begin
  if p_cost < 1 then raise exception 'cost must be positive'; end if;
  select * into p from public.profiles where id = p_user for update;
  if not found then return false; end if;
  if exists (select 1 from public.credit_ledger where reason = 'spend' and ref = v_ref) then return true; end if;

  if p_use_trial then t := least(p.trial_credits, v_left); v_left := v_left - t; end if;
  s := least(p.sub_credits, v_left); v_left := v_left - s;
  u := least(p.topup_credits, v_left); v_left := v_left - u;
  if v_left > 0 then return false; end if;

  update public.profiles
    set trial_credits = trial_credits - t, sub_credits = sub_credits - s, topup_credits = topup_credits - u
    where id = p_user;
  if t > 0 then insert into public.credit_ledger (user_id, delta, bucket, reason, ref) values (p_user, -t, 'trial', 'spend', v_ref); end if;
  if s > 0 then insert into public.credit_ledger (user_id, delta, bucket, reason, ref) values (p_user, -s, 'sub', 'spend', v_ref); end if;
  if u > 0 then insert into public.credit_ledger (user_id, delta, bucket, reason, ref) values (p_user, -u, 'topup', 'spend', v_ref); end if;
  return true;
end;
$$;

-- Undo a spend (e.g. usage insert failed). Removes the spend rows so the ref can be charged again.
create or replace function public.refund_spend(p_user uuid, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_ref text := p_user::text || ':' || p_ref;
  r record;
  t integer := 0; s integer := 0; u integer := 0;
begin
  perform 1 from public.profiles where id = p_user for update;
  for r in select * from public.credit_ledger where reason = 'spend' and ref = v_ref loop
    if r.bucket = 'trial' then t := t - r.delta; elsif r.bucket = 'sub' then s := s - r.delta; else u := u - r.delta; end if;
    insert into public.credit_ledger (user_id, delta, bucket, reason, ref)
      values (p_user, -r.delta, r.bucket, 'refund', v_ref || ':' || r.id::text);
  end loop;
  if t + s + u = 0 then return false; end if;
  delete from public.credit_ledger where reason = 'spend' and ref = v_ref;
  update public.profiles
    set trial_credits = trial_credits + t, sub_credits = sub_credits + s, topup_credits = topup_credits + u
    where id = p_user;
  return true;
end;
$$;

-- Add credits to a bucket ('topup' or 'sub'). Idempotent on (reason, ref): returns false if already applied.
create or replace function public.grant_credits(p_user uuid, p_bucket text, p_amount integer, p_reason text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if p_amount < 1 or p_bucket not in ('sub', 'topup') then raise exception 'invalid grant'; end if;
  perform 1 from public.profiles where id = p_user for update;
  if not found then return false; end if;
  insert into public.credit_ledger (user_id, delta, bucket, reason, ref)
    values (p_user, p_amount, p_bucket, p_reason, p_ref) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  if p_bucket = 'sub' then
    update public.profiles set sub_credits = sub_credits + p_amount where id = p_user;
  else
    update public.profiles set topup_credits = topup_credits + p_amount where id = p_user;
  end if;
  return true;
end;
$$;

-- Set subscription credits to an exact amount (monthly reset to 40, or 0 on cancel). Idempotent on p_ref.
create or replace function public.set_sub_credits(p_user uuid, p_amount integer, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
declare cur integer; n integer;
begin
  if p_amount < 0 then raise exception 'invalid amount'; end if;
  select sub_credits into cur from public.profiles where id = p_user for update;
  if not found then return false; end if;
  insert into public.credit_ledger (user_id, delta, bucket, reason, ref)
    values (p_user, p_amount - cur, 'sub', 'sub_reset', p_ref) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  update public.profiles set sub_credits = p_amount where id = p_user;
  return true;
end;
$$;

revoke all on function public.spend_credits(uuid, integer, text, boolean) from public, anon, authenticated;
revoke all on function public.refund_spend(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_credits(uuid, text, integer, text, text) from public, anon, authenticated;
revoke all on function public.set_sub_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.spend_credits(uuid, integer, text, boolean) to service_role;
grant execute on function public.refund_spend(uuid, text) to service_role;
grant execute on function public.grant_credits(uuid, text, integer, text, text) to service_role;
grant execute on function public.set_sub_credits(uuid, integer, text) to service_role;
