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
('exo-50','Retour au calme','Challenge fair-play',6,'Petit défi collectif où l’attitude, l’encouragement et l’écoute comptent autant que le résultat.'),
('exo-51','Échauffement','Passe en étoile',10,'Former une étoile avec plusieurs plots. Les joueurs passent puis suivent leur ballon pour réveiller les appuis et la lecture.'),
('exo-52','Échauffement','Épervier avec ballon',8,'Les joueurs traversent une zone en dribble pendant que les défenseurs tentent de gêner. Objectif : lever la tête et changer de rythme.'),
('exo-53','Échauffement','Activation gardien + tireurs',10,'Les tireurs enchaînent des tirs contrôlés sur zones annoncées. Le gardien travaille placement, rythme et premières sensations.'),
('exo-54','Échauffement','Appuis miroir',8,'Par deux, un joueur guide les déplacements et l’autre l’imite. Travailler réactivité, équilibre et déplacements latéraux.'),
('exo-55','Échauffement','Relais passes et sprint',10,'Deux équipes en relais. Chaque joueur réalise une passe précise, sprinte autour d’un plot puis revient transmettre.'),
('exo-56','Dribble','Dribble avec changement de main',10,'Les joueurs avancent en changeant de main à chaque plot. Insister sur protection du ballon et regard vers l’avant.'),
('exo-57','Dribble','Dribble stop-and-go',8,'Au signal, les joueurs stoppent net puis repartent fort. Objectif : maîtriser arrêt, reprise et accélération.'),
('exo-58','Dribble','Duel dribble + passe',12,'L’attaquant doit battre son défenseur puis trouver un partenaire démarqué. Valoriser la décision passe ou percussion.'),
('exo-59','Dribble','Dribble dans trafic',10,'Tous les joueurs dribblent dans une zone réduite sans se toucher. Ajouter des consignes de main ou de changement de direction.'),
('exo-60','Dribble','Sortie de pression',12,'Un attaquant reçoit dos à la pression et doit sortir proprement en dribble ou passe. Travailler calme et orientation du corps.'),
('exo-61','Passe','Passe à trois avec croisement',12,'Trois joueurs avancent en échangeant le ballon avec croisement des courses. Chercher timing et passes dans la course.'),
('exo-62','Passe','Passe pivot-remise',10,'Le pivot reçoit, protège et remet rapidement à un arrière lancé. Insister sur appuis forts et passe courte.'),
('exo-63','Passe','Passe après fixation',12,'Le porteur attaque un intervalle, fixe le défenseur puis donne au partenaire libre. Travailler patience et lecture.'),
('exo-64','Passe','Passe aveugle contrôlée',8,'Dans un cadre sécurisé, travailler des passes sans regarder directement le receveur. Objectif : vision périphérique.'),
('exo-65','Passe','Relance gardien ailier',10,'Le gardien ou un arrière cherche rapidement l’ailier lancé. Travailler appel, trajectoire et réception en vitesse.'),
('exo-66','Tir','Tir après duel 1 contre 1',12,'L’attaquant provoque son défenseur, gagne son intervalle puis tire. Corriger appuis, équilibre et choix d’impact.'),
('exo-67','Tir','Tir après montée de balle',12,'Les joueurs remontent vite le terrain en passes puis terminent par un tir. L’objectif est de tirer avant le repli adverse.'),
('exo-68','Tir','Tir sous fatigue',10,'Après un petit circuit physique court, le joueur tire en gardant précision et lucidité. Adapter l’intensité à l’âge.'),
('exo-69','Tir','Tir avec choix d’impact',10,'Le coach annonce ou montre une zone au dernier moment. Le tireur doit adapter rapidement son impact.'),
('exo-70','Tir','Tir en appui',10,'Travailler le tir sans suspension avec appui solide. Utile pour surprendre la défense et varier les déclenchements.'),
('exo-71','Défense','Glissement défensif à deux',12,'Deux défenseurs coulissent ensemble selon le ballon. Objectif : rester alignés, communiquer et fermer les intervalles.'),
('exo-72','Défense','Repli défensif urgence',10,'Après une perte de balle simulée, les joueurs sprintent en repli et se replacent entre adversaire et but.'),
('exo-73','Défense','Défense sur pivot',12,'Travailler le placement devant ou autour du pivot sans faute. Objectif : empêcher réception et rotation facile.'),
('exo-74','Défense','Sortie sur tireur',10,'Le défenseur sort vite sur l’arrière tireur puis revient dans l’alignement. Insister sur timing et équilibre.'),
('exo-75','Défense','Communication défensive',10,'Défense à plusieurs avec obligation d’annoncer aide, changement et joueur libre. Valoriser la parole et l’anticipation.'),
('exo-76','Gardien','Arrêts en rafale',10,'Série courte de tirs rapides avec replacement entre chaque ballon. Travailler concentration et vitesse de réaction.'),
('exo-77','Gardien','Sortie sur contre-attaque',8,'Le gardien lit une balle longue et décide de sortir ou rester. Travailler prise d’information et sécurité.'),
('exo-78','Gardien','Duel penalty',10,'Série de penalties avec consigne de lecture du tireur. Varier attente, feinte et explosivité.'),
('exo-79','Gardien','Déplacement poteau à poteau',8,'Le gardien se déplace latéralement entre les poteaux avant chaque tir. Objectif : appuis rapides et équilibre.'),
('exo-80','Gardien','Relance après arrêt',10,'Après l’arrêt, le gardien doit identifier vite la meilleure relance. Chercher joueur lancé et ballon exploitable.'),
('exo-81','Collectif','Montée de balle à deux',12,'Deux joueurs remontent le terrain en passes rapides, tirent, puis deviennent défenseurs sur le binôme suivant.'),
('exo-82','Collectif','Attaque placée 4 contre 4',15,'Mettre en place une attaque réduite avec espaces clairs. Travailler circulation, fixation et choix collectif.'),
('exo-83','Collectif','Décalage jusqu’à l’aile',12,'Les arrières fixent successivement pour créer un surnombre jusqu’à l’ailier. Insister sur vitesse de balle.'),
('exo-84','Collectif','Jeu en supériorité',12,'Situation 5 contre 4 ou 4 contre 3. L’équipe doit déplacer vite le ballon pour trouver le tir ouvert.'),
('exo-85','Collectif','Transition attaque-défense',15,'Après chaque tir, les attaquants se replient immédiatement. Travailler changement de statut et effort collectif.'),
('exo-86','Match','Match avec joker offensif',12,'Ajouter un joker toujours avec l’équipe qui attaque. Objectif : créer des solutions et travailler le surnombre.'),
('exo-87','Match','Match sans dribble',12,'Interdire le dribble pour obliger démarquage, appels et passes rapides. Très utile pour améliorer le jeu collectif.'),
('exo-88','Match','Match but après aile',12,'Un but compte double si l’action passe par une aile. Encourage l’écartement et le jeu sur toute la largeur.'),
('exo-89','Match','Match récupération rapide',12,'Après perte de balle, l’équipe a quelques secondes pour récupérer. Sinon elle doit se replacer en défense organisée.'),
('exo-90','Match','Match score bonus défense',15,'Une interception, un contre ou un repli réussi donne un point bonus. Valorise l’effort défensif.'),
('exo-91','Physique','Circuit appuis et tir',12,'Enchaîner appuis rapides, sprint court, réception de balle et tir. Travailler explosivité utile au jeu.'),
('exo-92','Physique','Duel vitesse réaction',8,'Deux joueurs partent au signal vers un ballon ou une zone. Varier les positions de départ.'),
('exo-93','Physique','Sauts contrôlés',8,'Petits sauts verticaux et latéraux avec réception stable. Objectif : coordination, équilibre et prévention.'),
('exo-94','Physique','Sprint repli montée',10,'Sprint vers l’avant puis retour défensif immédiat. Reproduire les efforts répétés du match.'),
('exo-95','Physique','Circuit gainage passes',10,'Gainage court puis passe précise au partenaire. Alterner effort physique et geste technique propre.'),
('exo-96','Retour au calme','Retour technique lent',6,'Réaliser quelques passes et tirs très contrôlés à faible intensité pour finir proprement.'),
('exo-97','Retour au calme','Cercle des réussites',5,'Chaque joueur cite une action positive d’un partenaire. Renforce confiance et cohésion.'),
('exo-98','Retour au calme','Étirements par binôme',6,'Par deux, étirements simples et contrôlés. Le coach rappelle les zones sollicitées pendant la séance.'),
('exo-99','Retour au calme','Bilan objectif séance',5,'Revenir sur l’objectif du jour : ce qui a progressé, ce qui reste à travailler, et la consigne pour la prochaine fois.'),
('exo-100','Retour au calme','Challenge précision léger',6,'Petit défi de tirs ou passes de précision sans intensité physique. Finir sur une note ludique et calme.')
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
