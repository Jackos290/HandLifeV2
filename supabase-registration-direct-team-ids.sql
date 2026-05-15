-- Inscriptions directes : permettre plusieurs catégories pour un même joueur.
-- A lancer une seule fois dans Supabase SQL Editor.

alter table if exists public.registrations
  add column if not exists direct_team_ids jsonb;

