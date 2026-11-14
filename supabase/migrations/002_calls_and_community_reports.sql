-- ScamShield: Live Call Guard + community scam database
-- * scans can now come from a call transcript (input_type = 'call')
-- * scans keep the phone numbers / UPI IDs / links found in the message and any
--   community report matches, so the result page can show and report them
-- * scam_reports holds community reports used by "Check before you pay"
-- Idempotent so it can also be applied with `npm run migrate`.

-- ---------------------------------------------------------------------------
-- scans: allow call transcripts, store identifiers + community matches
-- ---------------------------------------------------------------------------
alter table public.scans drop constraint if exists scans_input_type_check;
alter table public.scans
  add constraint scans_input_type_check check (input_type in ('image', 'text', 'call'));

alter table public.scans
  add column if not exists identifiers jsonb not null
    default '{"phones": [], "upi_ids": [], "urls": []}'::jsonb;

alter table public.scans
  add column if not exists community_matches jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- scam_reports: one row per community report of a phone / UPI ID / website
--   identifier_value is the normalised key:
--     phone -> 10 digits ("0000000001"), upi -> lowercase id, url -> lowercase host
-- ---------------------------------------------------------------------------
create table if not exists public.scam_reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid,
  identifier_type   text not null check (identifier_type in ('phone', 'upi', 'url')),
  identifier_value  text not null check (char_length(identifier_value) between 3 and 255),
  scam_type         text not null default 'other',
  created_at        timestamptz not null default now(),
  constraint scam_reports_reporter_id_fkey
    foreign key (reporter_id) references public.users (id) on delete set null,
  -- a user can report the same identifier only once (seeded reports have no reporter)
  constraint scam_reports_reporter_identifier_key
    unique (reporter_id, identifier_type, identifier_value)
);

create index if not exists scam_reports_identifier_idx
  on public.scam_reports (identifier_type, identifier_value);
create index if not exists scam_reports_created_at_idx
  on public.scam_reports (created_at desc);

alter table public.scam_reports enable row level security;
revoke all on public.scam_reports from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aggregated report stats for a list of "type:value" keys.
-- ---------------------------------------------------------------------------
create or replace function public.scam_report_stats(p_keys text[])
returns table (
  identifier_type    text,
  identifier_value   text,
  report_count       integer,
  last_7_days_count  integer,
  scam_types         text[],
  last_reported_at   timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with wanted as (
    select split_part(k, ':', 1) as identifier_type,
           substr(k, position(':' in k) + 1) as identifier_value
    from unnest(p_keys) as k
    where position(':' in k) > 0
  ),
  stats as (
    select r.identifier_type,
           r.identifier_value,
           count(*)::int as report_count,
           (count(*) filter (where r.created_at >= now() - interval '7 days'))::int as last_7_days_count,
           max(r.created_at) as last_reported_at
    from public.scam_reports r
    join wanted w
      on w.identifier_type = r.identifier_type
     and w.identifier_value = r.identifier_value
    group by r.identifier_type, r.identifier_value
  )
  select s.identifier_type,
         s.identifier_value,
         s.report_count,
         s.last_7_days_count,
         (
           select array_agg(t.scam_type order by t.n desc, t.scam_type)
           from (
             select x.scam_type, count(*) as n
             from public.scam_reports x
             where x.identifier_type = s.identifier_type
               and x.identifier_value = s.identifier_value
             group by x.scam_type
           ) t
         ) as scam_types,
         s.last_reported_at
  from stats s;
$$;

revoke all on function public.scam_report_stats(text[]) from public, anon, authenticated;
grant execute on function public.scam_report_stats(text[]) to service_role;
