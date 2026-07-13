-- PetPal schema: one household per account, RLS-scoped by auth.uid().
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- One household per signed-in user. Holds the gamification counters + prefs
-- that used to live at the top level of AppState.
create table households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  current_member_id uuid,
  premium boolean not null default false,
  coins integer not null default 0,
  xp integer not null default 0,
  streak integer not null default 0,
  units text not null default 'kg' check (units in ('kg', 'lb')),
  seen_welcome boolean not null default false,
  created_at timestamptz not null default now()
);

-- Family members (not logins) — matches lib/data.ts Member.
create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  emoji text not null,
  role text not null,
  gradient_from text not null,
  gradient_to text not null,
  created_at timestamptz not null default now()
);

alter table households
  add constraint households_current_member_fk
  foreign key (current_member_id) references members (id) on delete set null;

create table pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  species text not null check (species in ('cat', 'dog')),
  breed text not null,
  sex text check (sex in ('male', 'female')),
  emoji text not null,
  age_years numeric not null default 1,
  weight_kg numeric not null default 0,
  owned text[] not null default '{}',
  equipped jsonb not null default '{}',
  gradient_from text not null,
  gradient_to text not null,
  created_at timestamptz not null default now()
);

create table weights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  ts bigint not null,
  kg numeric not null
);
create index weights_pet_id_idx on weights (pet_id);

create table supplies (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  supply_key text not null,
  name text not null,
  icon text not null,
  level integer not null default 100
);
create index supplies_pet_id_idx on supplies (pet_id);

create table activities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  pet_id uuid not null references pets (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  type text not null check (type in ('fed', 'water', 'litter', 'walk', 'groomed', 'meds', 'vet')),
  ts bigint not null,
  note text
);
create index activities_household_id_idx on activities (household_id);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  pet_id uuid not null references pets (id) on delete cascade,
  title text not null,
  emoji text not null,
  due bigint not null,
  done boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'plan'))
);
create index reminders_household_id_idx on reminders (household_id);

create table booked_vets (
  household_id uuid not null references households (id) on delete cascade,
  vet_id text not null,
  primary key (household_id, vet_id)
);

-- Row Level Security: every row is reachable only through a household the
-- signed-in user owns.
alter table households enable row level security;
alter table members enable row level security;
alter table pets enable row level security;
alter table weights enable row level security;
alter table supplies enable row level security;
alter table activities enable row level security;
alter table reminders enable row level security;
alter table booked_vets enable row level security;

create policy "own household" on households
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own household members" on members
  for all using (household_id in (select id from households where owner_id = auth.uid()))
  with check (household_id in (select id from households where owner_id = auth.uid()));

create policy "own household pets" on pets
  for all using (household_id in (select id from households where owner_id = auth.uid()))
  with check (household_id in (select id from households where owner_id = auth.uid()));

create policy "own household weights" on weights
  for all using (pet_id in (
    select p.id from pets p join households h on h.id = p.household_id where h.owner_id = auth.uid()
  ))
  with check (pet_id in (
    select p.id from pets p join households h on h.id = p.household_id where h.owner_id = auth.uid()
  ));

create policy "own household supplies" on supplies
  for all using (pet_id in (
    select p.id from pets p join households h on h.id = p.household_id where h.owner_id = auth.uid()
  ))
  with check (pet_id in (
    select p.id from pets p join households h on h.id = p.household_id where h.owner_id = auth.uid()
  ));

create policy "own household activities" on activities
  for all using (household_id in (select id from households where owner_id = auth.uid()))
  with check (household_id in (select id from households where owner_id = auth.uid()));

create policy "own household reminders" on reminders
  for all using (household_id in (select id from households where owner_id = auth.uid()))
  with check (household_id in (select id from households where owner_id = auth.uid()));

create policy "own household booked vets" on booked_vets
  for all using (household_id in (select id from households where owner_id = auth.uid()))
  with check (household_id in (select id from households where owner_id = auth.uid()));

-- On signup: create the household + seed pets/members/activity so new users
-- land in a populated demo-like state instead of an empty app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  h_id uuid;
  m_you uuid;
  m_mom uuid;
  m_dad uuid;
  m_sara uuid;
  p_cat uuid;
  p_dog uuid;
  now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
  hour_ms bigint := 3600000;
  day_ms bigint := 86400000;
  week_ms bigint := 7 * 86400000;
begin
  insert into households (owner_id, coins, xp, streak, units)
  values (new.id, 340, 260, 4, 'kg')
  returning id into h_id;

  insert into members (household_id, name, emoji, role, gradient_from, gradient_to) values
    (h_id, coalesce(new.raw_user_meta_data ->> 'name', 'You'), '🧑‍💻', 'Owner', 'oklch(0.62 0.16 258)', 'oklch(0.5 0.18 280)')
    returning id into m_you;
  insert into members (household_id, name, emoji, role, gradient_from, gradient_to) values
    (h_id, 'Mom', '👩‍🦰', 'Admin', 'oklch(0.68 0.15 350)', 'oklch(0.56 0.17 20)')
    returning id into m_mom;
  insert into members (household_id, name, emoji, role, gradient_from, gradient_to) values
    (h_id, 'Dad', '👨‍🦳', 'Member', 'oklch(0.66 0.13 165)', 'oklch(0.54 0.13 200)')
    returning id into m_dad;
  insert into members (household_id, name, emoji, role, gradient_from, gradient_to) values
    (h_id, 'Sara', '👧', 'Member', 'oklch(0.72 0.14 85)', 'oklch(0.62 0.16 50)')
    returning id into m_sara;

  update households set current_member_id = m_you where id = h_id;

  insert into pets (id, household_id, name, species, breed, sex, emoji, age_years, weight_kg, owned, equipped, gradient_from, gradient_to)
  values (gen_random_uuid(), h_id, 'Mozart', 'cat', 'British Shorthair', 'male', '🐱', 10.0/12, 200,
          array['bowtie', 'glasses'], '{"neck":"bowtie"}'::jsonb, 'oklch(0.72 0.008 260)', 'oklch(0.5 0.01 260)')
  returning id into p_cat;

  insert into pets (id, household_id, name, species, breed, emoji, age_years, weight_kg, owned, equipped, gradient_from, gradient_to)
  values (gen_random_uuid(), h_id, 'Biscuit', 'dog', 'Golden Retriever', '🐶', 2, 29.5,
          array['cap'], '{"head":"cap"}'::jsonb, 'oklch(0.74 0.13 75)', 'oklch(0.6 0.15 45)')
  returning id into p_dog;

  insert into weights (pet_id, ts, kg) values
    (p_cat, now_ms - 24*week_ms, 120), (p_cat, now_ms - 20*week_ms, 140), (p_cat, now_ms - 16*week_ms, 158),
    (p_cat, now_ms - 12*week_ms, 172), (p_cat, now_ms - 8*week_ms, 185), (p_cat, now_ms - 4*week_ms, 194),
    (p_cat, now_ms, 200),
    (p_dog, now_ms - 24*week_ms, 24.0), (p_dog, now_ms - 20*week_ms, 25.8), (p_dog, now_ms - 16*week_ms, 27.0),
    (p_dog, now_ms - 12*week_ms, 28.1), (p_dog, now_ms - 8*week_ms, 28.9), (p_dog, now_ms - 4*week_ms, 29.2),
    (p_dog, now_ms, 29.5);

  insert into supplies (pet_id, supply_key, name, icon, level) values
    (p_cat, 'food', 'Dry food', 'bowl', 62),
    (p_cat, 'litter', 'Litter', 'broom', 18),
    (p_cat, 'treats', 'Dental treats', 'star', 80),
    (p_dog, 'food', 'Kibble', 'bowl', 45),
    (p_dog, 'poopbags', 'Poop bags', 'broom', 12),
    (p_dog, 'treats', 'Training treats', 'star', 70);

  insert into activities (household_id, pet_id, member_id, type, ts, note) values
    (h_id, p_cat, m_mom, 'fed', now_ms - 3*hour_ms, null),
    (h_id, p_dog, m_dad, 'walk', now_ms - 4*hour_ms, null),
    (h_id, p_cat, m_sara, 'water', now_ms - 6*hour_ms, null),
    (h_id, p_dog, m_you, 'fed', now_ms - 7*hour_ms, null),
    (h_id, p_cat, m_you, 'litter', now_ms - 26*hour_ms, null),
    (h_id, p_dog, m_mom, 'groomed', now_ms - 30*hour_ms, null),
    (h_id, p_cat, m_dad, 'fed', now_ms - 28*hour_ms, null),
    (h_id, p_dog, m_sara, 'walk', now_ms - 32*hour_ms, null),
    (h_id, p_cat, m_mom, 'meds', now_ms - 2*day_ms - 5*hour_ms, null),
    (h_id, p_cat, m_you, 'vet', now_ms - 12*day_ms, 'Regular checkup — all healthy!');

  insert into reminders (household_id, pet_id, title, emoji, due, done, source) values
    (h_id, p_cat, 'Flea treatment', '💊', now_ms + 1*day_ms, false, 'manual'),
    (h_id, p_dog, 'Buy more kibble', '🛒', now_ms + 2*day_ms, false, 'manual'),
    (h_id, p_cat, 'Full litter change', '🧹', now_ms + 3*day_ms, false, 'manual'),
    (h_id, p_dog, 'Bath day', '🛁', now_ms + 5*day_ms, false, 'manual');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
