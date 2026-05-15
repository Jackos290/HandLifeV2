-- Cartes joueur : super pouvoirs personnalisés.
-- A lancer une seule fois dans Supabase SQL Editor.

alter table if exists public.players
  add column if not exists card_powers jsonb;

