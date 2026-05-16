-- Champs supporter pour les matchs.
-- A executer dans Supabase SQL editor.

alter table public.matches
add column if not exists fdm_url text,
add column if not exists supporter_summary text,
add column if not exists fdm_actions_text text;
