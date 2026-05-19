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
  duration_minutes integer not null check (duration_minutes > 0),
  description text
);

alter table public.training_exercise_library
add column if not exists description text;

insert into public.training_exercise_library (id, category, title, duration_minutes, description) values
('exo-1','Échauffement','Course progressive + mobilité',10,'Les joueurs courent en rythme léger puis accélèrent progressivement. Ajouter mobilité chevilles, hanches, épaules et poignets avec ballon en main.'),
('exo-2','Échauffement','Jeu du chasseur',8,'Un ou deux chasseurs tentent de toucher les joueurs. Les joueurs se déplacent dans un espace limité avec changements de direction rapides.'),
('exo-3','Échauffement','Montées de genoux + appuis',8,'Enchaîner montées de genoux, talons-fesses, pas chassés et petits appuis. Finir par deux accélérations courtes vers le but.'),
('exo-4','Échauffement','Réveil articulaire avec ballon',10,'Par deux, passes simples pendant que les joueurs mobilisent épaules, coudes et poignets. Monter progressivement l’intensité.'),
('exo-5','Échauffement','Relais coordination',8,'Former deux colonnes. Les joueurs réalisent un parcours d’appuis, récupèrent un ballon puis transmettent au suivant.'),
('exo-6','Dribble','Slalom main forte / main faible',10,'Installer des plots. Les joueurs traversent en dribble main forte puis main faible, tête levée, sans regarder le ballon.'),
('exo-7','Dribble','1 contre 1 couloir',12,'Créer un couloir. L’attaquant doit passer son défenseur en dribble et finir par un tir ou une passe propre.'),
('exo-8','Dribble','Dribble sous pression',10,'Un défenseur gêne sans voler brutalement le ballon. L’attaquant protège son dribble avec le corps et change de rythme.'),
('exo-9','Dribble','Changement de rythme',8,'Les joueurs dribblent lentement puis accélèrent au signal. Objectif : exploser sur les premiers appuis.'),
('exo-10','Dribble','Protection de balle',10,'Par deux, un joueur protège son ballon dans une zone pendant que l’autre met une pression contrôlée.'),
('exo-11','Passe','Passe et va',10,'Après chaque passe, le joueur court vers un nouvel espace. Insister sur passe devant le partenaire et appel clair.'),
('exo-12','Passe','Passe en mouvement',12,'Les joueurs avancent en binômes ou trinômes sans s’arrêter. Le ballon doit circuler pendant la course.'),
('exo-13','Passe','Carré de passes rapides',10,'Quatre plots en carré. Passes rapides dans le sens demandé, puis inversion au signal. Ajouter un défenseur si besoin.'),
('exo-14','Passe','Passe longue relance',8,'Depuis le gardien ou un arrière, chercher une passe longue vers un joueur lancé. Travailler précision et timing.'),
('exo-15','Passe','Passe sous pression défenseur',12,'Un défenseur gêne la ligne de passe. Les attaquants doivent se démarquer et passer au bon moment.'),
('exo-16','Tir','Tir en suspension',12,'Course d’élan, impulsion, armé haut et tir en suspension. Varier les zones de tir et la main utilisée.'),
('exo-17','Tir','Tir après croisé',12,'Deux arrières croisent leur course. Le porteur ressort avec vitesse et tire après le croisé.'),
('exo-18','Tir','Tir aile gauche / droite',10,'Départs depuis les ailes. Travailler angle de course, impulsion vers le terrain et tir au second poteau.'),
('exo-19','Tir','Tir pivot après bloc',10,'Le pivot pose un bloc ou se démarque dans les 6 mètres. Réception courte puis tir rapide.'),
('exo-20','Tir','Duel tireur gardien',12,'Un tireur attaque le but face au gardien. Varier impacts, feintes et temps de déclenchement.'),
('exo-21','Défense','Position de base + déplacements',10,'Travailler jambes fléchies, bras actifs et déplacements latéraux. Le défenseur garde toujours l’attaquant devant lui.'),
('exo-22','Défense','1 contre 1 défensif',12,'Dans un couloir, le défenseur doit ralentir puis stopper l’attaquant sans faute. Insister sur placement et distance.'),
('exo-23','Défense','Aide et fermeture',12,'Deux défenseurs coopèrent. Si un attaquant déborde, le partenaire vient aider puis referme l’espace.'),
('exo-24','Défense','Interception ligne de passe',10,'Le défenseur lit la trajectoire et coupe la ligne de passe. Démarrer sans contact puis augmenter le rythme.'),
('exo-25','Défense','Bloc / contre',10,'Sur tir adverse, monter les bras, fermer l’angle et rester équilibré. Travailler le timing du contre.'),
('exo-26','Gardien','Réflexes bas / haut',10,'Séries de tirs alternés bas puis haut. Le gardien se replace vite entre chaque ballon.'),
('exo-27','Gardien','Placement sur tir aile',10,'Tirs depuis les ailes. Le gardien ferme son angle, avance au bon moment et reste équilibré.'),
('exo-28','Gardien','Relance rapide',8,'Après arrêt ou ballon donné, le gardien relance immédiatement vers un joueur lancé. Chercher précision et vitesse.'),
('exo-29','Gardien','Lecture du bras tireur',10,'Le gardien observe l’orientation du bras et du corps du tireur pour anticiper l’impact.'),
('exo-30','Gardien','Duel 6 mètres',12,'Tirs proches à 6 mètres. Le gardien travaille sortie, présence corporelle et réaction courte.'),
('exo-31','Collectif','Montée de balle à 3',12,'Trois joueurs remontent le terrain en passes rapides. Objectif : largeur, vitesse et tir avant repli adverse.'),
('exo-32','Collectif','Croisé arrière / demi-centre',12,'Demi-centre et arrière croisent. Le joueur lancé attaque l’intervalle ou fixe pour donner.'),
('exo-33','Collectif','Enclenchement simple',15,'Mettre en place une combinaison courte avec départ, fixation, transmission et tir. Répéter des deux côtés.'),
('exo-34','Collectif','Jeu avec pivot',12,'Le pivot se place entre deux défenseurs. Les arrières fixent puis cherchent le pivot ou libèrent un tir.'),
('exo-35','Collectif','Fixer-donner',10,'L’attaquant fixe un défenseur avant de transmettre. Le partenaire reçoit lancé dans l’espace libéré.'),
('exo-36','Match','Match à thème 3 passes minimum',12,'Pendant le match, une équipe doit réaliser trois passes avant de tirer. Favorise patience et démarquage.'),
('exo-37','Match','Match surnombre',12,'Créer une situation 4 contre 3 ou 3 contre 2. L’équipe en attaque doit trouver vite le joueur libre.'),
('exo-38','Match','Match défense imposée',15,'Match avec système défensif imposé, par exemple 3-3, 2-4 ou défense étagée. Stopper pour corriger les placements.'),
('exo-39','Match','Match transition rapide',12,'Après chaque tir ou perte de balle, l’équipe doit se projeter ou se replier immédiatement.'),
('exo-40','Match','Tournoi court',15,'Petits matchs de 3 à 5 minutes. Changer vite les équipes et donner un thème simple à chaque rencontre.'),
('exo-41','Physique','Gainage ludique',8,'Ateliers courts de gainage avec ballon. Varier planche, côté, relais et défis par équipe.'),
('exo-42','Physique','Appuis échelle',8,'Utiliser une échelle ou des plots. Enchaîner petits appuis rapides, coordination et sortie explosive.'),
('exo-43','Physique','Vitesse réaction',8,'Au signal visuel ou sonore, les joueurs sprintent, changent de direction ou récupèrent un ballon.'),
('exo-44','Physique','Renforcement jambes',10,'Circuit court : squats, fentes, sauts contrôlés et appuis. Adapter l’intensité à l’âge.'),
('exo-45','Physique','Circuit explosivité',12,'Ateliers de 20 à 30 secondes : sprint, saut, changement d’appuis, tir final. Récupération courte.'),
('exo-46','Retour au calme','Étirements guidés',6,'Étirements simples des jambes, épaules et dos. Respirer calmement et relâcher progressivement.'),
('exo-47','Retour au calme','Débrief collectif',5,'Regrouper l’équipe. Chaque joueur partage un point réussi et un point à améliorer.'),
('exo-48','Retour au calme','Respiration + hydratation',5,'Retour au calme avec respiration lente, hydratation et discussion rapide sur la séance.'),
('exo-49','Retour au calme','Penalty plaisir',8,'Finir par une série de penalties ludique. Garder un rythme léger et valoriser le gardien.'),
('exo-50','Retour au calme','Challenge fair-play',6,'Petit défi collectif où l’attitude, l’encouragement et l’écoute comptent autant que le résultat.')
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  duration_minutes = excluded.duration_minutes,
  description = excluded.description;

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

drop policy if exists "training_exercise_library_insert_all" on public.training_exercise_library;
create policy "training_exercise_library_insert_all"
on public.training_exercise_library
for insert
with check (true);

drop policy if exists "training_exercise_library_update_all" on public.training_exercise_library;
create policy "training_exercise_library_update_all"
on public.training_exercise_library
for update
using (true)
with check (true);

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
