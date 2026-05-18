-- Likes / pouces pour les resumes supporter.
-- A executer dans Supabase SQL editor.

create table if not exists public.supporter_likes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  actor_type text not null check (actor_type in ('parent', 'player', 'coach')),
  actor_id uuid not null,
  created_at timestamptz not null default now(),
  unique (match_id, actor_type, actor_id)
);

alter table public.supporter_likes enable row level security;

drop policy if exists "supporter_likes_select_all" on public.supporter_likes;
create policy "supporter_likes_select_all"
on public.supporter_likes
for select
using (true);

drop policy if exists "supporter_likes_insert_all" on public.supporter_likes;
create policy "supporter_likes_insert_all"
on public.supporter_likes
for insert
with check (true);

drop policy if exists "supporter_likes_delete_all" on public.supporter_likes;
create policy "supporter_likes_delete_all"
on public.supporter_likes
for delete
using (true);
