-- Sondages : plusieurs questions + lien externe
-- A lancer une seule fois dans Supabase SQL Editor.

alter table if exists public.polls
  add column if not exists external_url text,
  add column if not exists questions jsonb;

alter table if exists public.poll_options
  add column if not exists question_key text;

