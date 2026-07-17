-- Health records: pet identity fields (birth date, microchip, allergies, notes),
-- vaccination records, and vet-visit history. All timestamps are bigint ms epoch
-- (same convention as weights.ts / reminders.due).

-- 1. Pet identity upgrades ----------------------------------------------------

alter table pets add column if not exists birth_date bigint;   -- ms epoch; app derives age from it when present
alter table pets add column if not exists microchip text;
alter table pets add column if not exists allergies text;
alter table pets add column if not exists notes text;

-- 2. Vaccination records ------------------------------------------------------

create table vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  name text not null,
  date_given bigint not null,
  next_due bigint,
  notes text,
  created_at timestamptz not null default now()
);
create index vaccinations_pet_id_idx on vaccinations (pet_id);

alter table vaccinations enable row level security;

create policy "member household vaccinations" on vaccinations
  for all using (pet_id in (select id from pets where public.is_household_member(household_id)))
  with check (pet_id in (select id from pets where public.is_household_member(household_id)));

-- 3. Vet-visit history --------------------------------------------------------

create table vet_visits (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  ts bigint not null,
  vet_name text,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);
create index vet_visits_pet_id_idx on vet_visits (pet_id);

alter table vet_visits enable row level security;

create policy "member household vet visits" on vet_visits
  for all using (pet_id in (select id from pets where public.is_household_member(household_id)))
  with check (pet_id in (select id from pets where public.is_household_member(household_id)));

-- 4. Link auto-created vaccine reminders to their vaccination -----------------
-- Dedupe key so hydration can tell whether a vaccination already has its
-- reminder; cascade removes the reminder when the vaccination is deleted.

alter table reminders add column if not exists vaccination_id uuid references vaccinations (id) on delete cascade;
