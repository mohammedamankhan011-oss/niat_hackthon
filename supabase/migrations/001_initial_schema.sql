-- ScamShield initial schema
-- All data is accessed only by the backend using the service role key.
-- RLS is enabled on every table with no policies, so the anon/authenticated
-- roles exposed by the Supabase Data API can never read or write rows.
-- Statements are idempotent so the file can be applied by either
-- `supabase db push` or `npm run migrate` without failing on re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(name) between 1 and 100),
  email              text not null,
  password_hash      text not null,
  preferred_language text not null default 'en'
                     check (preferred_language in ('en', 'hi', 'kn')),
  created_at         timestamptz not null default now(),
  constraint users_email_key unique (email),
  constraint users_email_lowercase check (email = lower(email))
);

-- ---------------------------------------------------------------------------
-- scans
-- ---------------------------------------------------------------------------
create table if not exists public.scans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  input_type    text not null check (input_type in ('image', 'text')),
  message_text  text check (message_text is null or char_length(message_text) <= 2000),
  risk_level    text not null check (risk_level in ('safe', 'suspicious', 'scam')),
  risk_score    integer not null check (risk_score between 0 and 100),
  scam_type     text not null default 'none',
  red_flags     jsonb not null default '[]'::jsonb,
  summary       text not null default '',
  explanation   text not null default '',
  actions       jsonb not null default '[]'::jsonb,
  safe_reasons  jsonb not null default '[]'::jsonb,
  language      text not null default 'en' check (language in ('en', 'hi', 'kn')),
  created_at    timestamptz not null default now(),
  constraint scans_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade
);

create index if not exists scans_user_id_idx    on public.scans (user_id);
create index if not exists scans_created_at_idx on public.scans (created_at desc);
create index if not exists scans_scam_type_idx  on public.scans (scam_type);

-- ---------------------------------------------------------------------------
-- guardians
--   user_id     = the person being protected
--   guardian_id = the family member who receives alerts
-- ---------------------------------------------------------------------------
create table if not exists public.guardians (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  guardian_id  uuid not null,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  constraint guardians_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade,
  constraint guardians_guardian_id_fkey
    foreign key (guardian_id) references public.users (id) on delete cascade,
  constraint guardians_user_guardian_key unique (user_id, guardian_id),
  constraint guardians_not_self check (user_id <> guardian_id)
);

create index if not exists guardians_user_id_idx     on public.guardians (user_id);
create index if not exists guardians_guardian_id_idx on public.guardians (guardian_id);

-- ---------------------------------------------------------------------------
-- alerts
-- ---------------------------------------------------------------------------
create table if not exists public.alerts (
  id           uuid primary key default gen_random_uuid(),
  guardian_id  uuid not null,
  user_id      uuid not null,
  scan_id      uuid not null,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint alerts_guardian_id_fkey
    foreign key (guardian_id) references public.users (id) on delete cascade,
  constraint alerts_user_id_fkey
    foreign key (user_id) references public.users (id) on delete cascade,
  constraint alerts_scan_id_fkey
    foreign key (scan_id) references public.scans (id) on delete cascade
);

create index if not exists alerts_guardian_id_idx on public.alerts (guardian_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: enabled, no policies => only service_role can access.
-- ---------------------------------------------------------------------------
alter table public.users     enable row level security;
alter table public.scans     enable row level security;
alter table public.guardians enable row level security;
alter table public.alerts    enable row level security;

revoke all on public.users, public.scans, public.guardians, public.alerts from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public trends: anonymous aggregate counts only, callable by service_role.
-- ---------------------------------------------------------------------------
create or replace function public.scan_trends()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'total_scans',  (select count(*) from public.scans),
    'scams_caught', (select count(*) from public.scans where risk_level = 'scam'),
    'last_7_days',  coalesce((
      select json_agg(json_build_object('scam_type', t.scam_type, 'count', t.cnt)
                      order by t.cnt desc, t.scam_type)
      from (
        select scam_type, count(*)::int as cnt
        from public.scans
        where created_at >= now() - interval '7 days'
          and scam_type <> 'none'
        group by scam_type
      ) t
    ), '[]'::json)
  );
$$;

revoke all on function public.scan_trends() from public, anon, authenticated;
grant execute on function public.scan_trends() to service_role;
