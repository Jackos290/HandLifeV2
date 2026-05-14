alter table public.players
  add column if not exists gender text;

alter table public.players
  add constraint players_gender_check
  check (gender is null or gender in ('male', 'female'))
  not valid;

alter table public.players
  validate constraint players_gender_check;
