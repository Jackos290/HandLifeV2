-- Acces admin delegue pour parents/joueurs/coachs.
-- A executer dans Supabase SQL editor avant d'utiliser le nouvel onglet Admin > Acces admin.

create table if not exists public.admin_delegates (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('user', 'coach')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id)
);

alter table public.admin_delegates enable row level security;

drop policy if exists "admin_delegates_select_own_or_admin" on public.admin_delegates;
drop policy if exists "admin_delegates_write_admin_only" on public.admin_delegates;

create policy "admin_delegates_select_own_or_admin"
on public.admin_delegates
for select
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.auth_id = auth.uid()
      and ur.role = 'admin'
  )
  or (
    target_type = 'user'
    and exists (
      select 1
      from public.users u
      where u.id = target_id
        and u.auth_id = auth.uid()
    )
  )
  or (
    target_type = 'coach'
    and exists (
      select 1
      from public.coaches c
      where c.id = target_id
        and c.auth_id = auth.uid()
    )
  )
);

create policy "admin_delegates_write_admin_only"
on public.admin_delegates
for all
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.auth_id = auth.uid()
      and ur.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.auth_id = auth.uid()
      and ur.role = 'admin'
  )
);
