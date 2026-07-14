-- Per-pet medications list (name/dosage/frequency), same shape as `supplies`.

create table meds (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets (id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  created_at timestamptz not null default now()
);
create index meds_pet_id_idx on meds (pet_id);

alter table meds enable row level security;

create policy "own household meds" on meds
  for all using (pet_id in (
    select p.id from pets p join households h on h.id = p.household_id where h.owner_id = auth.uid()
  ))
  with check (pet_id in (
    select p.id from pets p join households h on h.id = p.household_id where h.owner_id = auth.uid()
  ));
