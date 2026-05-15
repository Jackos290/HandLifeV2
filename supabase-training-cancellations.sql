-- Entraînements : annulation ponctuelle + périodes de vacances
-- A lancer une seule fois dans Supabase SQL Editor.

create table if not exists public.training_cancellations (
  id uuid primary key default gen_random_uuid(),
  training_template_id uuid not null references public.training_templates(id) on delete cascade,
  training_date date not null,
  reason text,
  cancelled_by text,
  created_at timestamptz not null default now(),
  unique(training_template_id, training_date)
);

create table if not exists public.training_breaks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  title text not null default 'Vacances',
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.training_cancellations enable row level security;
alter table public.training_breaks enable row level security;

drop policy if exists "training_cancellations_all" on public.training_cancellations;
create policy "training_cancellations_all" on public.training_cancellations
  for all using (true) with check (true);

drop policy if exists "training_breaks_all" on public.training_breaks;
create policy "training_breaks_all" on public.training_breaks
  for all using (true) with check (true);

