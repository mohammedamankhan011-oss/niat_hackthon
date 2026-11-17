-- ScamShield: cache of re-explanations per language.
-- explanations = { "<lang>": { "summary", "explanation", "red_flags", "actions" } }
-- so POST /api/scans/:id/explain can answer instantly after the first request.
alter table public.scans
  add column if not exists explanations jsonb not null default '{}'::jsonb;
