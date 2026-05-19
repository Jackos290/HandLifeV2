-- Plans de seance d'entrainement.
-- A executer dans Supabase SQL editor.

create table if not exists public.training_session_items (
  id uuid primary key default gen_random_uuid(),
  training_template_id uuid not null references public.training_templates(id) on delete cascade,
  training_date date not null,
  coach_id uuid null references public.coaches(id) on delete set null,
  category text not null,
  title text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.training_session_items
add column if not exists coach_id uuid null references public.coaches(id) on delete set null;

create table if not exists public.training_exercise_library (
  id text primary key,
  category text not null,
  title text not null,
  duration_minutes integer not null check (duration_minutes > 0)
);

insert into public.training_exercise_library (id, category, title, duration_minutes) values
('exo-1','Échauffement','Course progressive + mobilité',10),
('exo-2','Échauffement','Jeu du chasseur',8),
('exo-3','Échauffement','Montées de genoux + appuis',8),
('exo-4','Échauffement','Réveil articulaire avec ballon',10),
('exo-5','Échauffement','Relais coordination',8),
('exo-6','Dribble','Slalom main forte / main faible',10),
('exo-7','Dribble','1 contre 1 couloir',12),
('exo-8','Dribble','Dribble sous pression',10),
('exo-9','Dribble','Changement de rythme',8),
('exo-10','Dribble','Protection de balle',10),
('exo-11','Passe','Passe et va',10),
('exo-12','Passe','Passe en mouvement',12),
('exo-13','Passe','Carré de passes rapides',10),
('exo-14','Passe','Passe longue relance',8),
('exo-15','Passe','Passe sous pression défenseur',12),
('exo-16','Tir','Tir en suspension',12),
('exo-17','Tir','Tir après croisé',12),
('exo-18','Tir','Tir aile gauche / droite',10),
('exo-19','Tir','Tir pivot après bloc',10),
('exo-20','Tir','Duel tireur gardien',12),
('exo-21','Défense','Position de base + déplacements',10),
('exo-22','Défense','1 contre 1 défensif',12),
('exo-23','Défense','Aide et fermeture',12),
('exo-24','Défense','Interception ligne de passe',10),
('exo-25','Défense','Bloc / contre',10),
('exo-26','Gardien','Réflexes bas / haut',10),
('exo-27','Gardien','Placement sur tir aile',10),
('exo-28','Gardien','Relance rapide',8),
('exo-29','Gardien','Lecture du bras tireur',10),
('exo-30','Gardien','Duel 6 mètres',12),
('exo-31','Collectif','Montée de balle à 3',12),
('exo-32','Collectif','Croisé arrière / demi-centre',12),
('exo-33','Collectif','Enclenchement simple',15),
('exo-34','Collectif','Jeu avec pivot',12),
('exo-35','Collectif','Fixer-donner',10),
('exo-36','Match','Match à thème 3 passes minimum',12),
('exo-37','Match','Match surnombre',12),
('exo-38','Match','Match défense imposée',15),
('exo-39','Match','Match transition rapide',12),
('exo-40','Match','Tournoi court',15),
('exo-41','Physique','Gainage ludique',8),
('exo-42','Physique','Appuis échelle',8),
('exo-43','Physique','Vitesse réaction',8),
('exo-44','Physique','Renforcement jambes',10),
('exo-45','Physique','Circuit explosivité',12),
('exo-46','Retour au calme','Étirements guidés',6),
('exo-47','Retour au calme','Débrief collectif',5),
('exo-48','Retour au calme','Respiration + hydratation',5),
('exo-49','Retour au calme','Penalty plaisir',8),
('exo-50','Retour au calme','Challenge fair-play',6)
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  duration_minutes = excluded.duration_minutes;

create index if not exists training_session_items_training_idx
on public.training_session_items (training_template_id, training_date, sort_order);

create index if not exists training_session_items_coach_idx
on public.training_session_items (coach_id, training_template_id, training_date);

alter table public.training_session_items enable row level security;
alter table public.training_exercise_library enable row level security;

drop policy if exists "training_exercise_library_select_all" on public.training_exercise_library;
create policy "training_exercise_library_select_all"
on public.training_exercise_library
for select
using (true);

drop policy if exists "training_session_items_select_all" on public.training_session_items;
create policy "training_session_items_select_all"
on public.training_session_items
for select
using (true);

drop policy if exists "training_session_items_insert_all" on public.training_session_items;
create policy "training_session_items_insert_all"
on public.training_session_items
for insert
with check (true);

drop policy if exists "training_session_items_update_all" on public.training_session_items;
create policy "training_session_items_update_all"
on public.training_session_items
for update
using (true)
with check (true);

drop policy if exists "training_session_items_delete_all" on public.training_session_items;
create policy "training_session_items_delete_all"
on public.training_session_items
for delete
using (true);
