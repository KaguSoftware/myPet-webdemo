-- 0011: Real multi-user shared households.
--
-- Until now a household belonged to exactly one auth user (households.owner_id
-- unique) and every RLS policy was scoped to `owner_id = auth.uid()`. The
-- "Share Family ID" UI was therefore decorative — a second account could never
-- read or attach to someone else's household.
--
-- This migration introduces a membership mapping so multiple auth users can
-- belong to one household, rewrites every policy to be membership-based, and
-- adds a join_household() RPC. It is BACKWARD-COMPATIBLE: each existing owner is
-- backfilled as an 'owner' member, so the current app (which still selects by
-- owner_id) keeps working unchanged after this runs. owner_id is retained as the
-- permanent record of the creator.
--
-- Forward-only. Order matters: create tables → backfill → helpers/triggers/RPC →
-- recreate handle_new_user → swap policies (helpers must exist before policies
-- reference them; backfill must precede the policy swap so no existing owner
-- loses access mid-transaction).

-- 0. Households get a display name (for the household switcher) --------------
alter table households add column if not exists name text not null default 'My household';

-- 1. Membership mapping + per-user active-household pointer -------------------

create table if not exists household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'admin', 'member')),
  member_id    uuid references members (id) on delete set null,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index if not exists household_members_user_id_idx on household_members (user_id);

create table if not exists user_profiles (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  active_household_id uuid references households (id) on delete set null
);

-- 2. Backfill existing single-owner households (critical for continuity) ------

insert into household_members (household_id, user_id, role)
  select id, owner_id, 'owner' from households
  on conflict do nothing;

insert into user_profiles (user_id, active_household_id)
  select owner_id, id from households
  on conflict (user_id) do nothing;

-- 3. Recursion-safe membership helper ----------------------------------------
-- SECURITY DEFINER: the inner read of household_members inside the definer body
-- does NOT re-trigger household_members' own RLS, so it is safe to call even
-- from that table's policies (avoids Postgres 42P17 infinite recursion).

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;
revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

-- 4. Auto-enroll the creator as an 'owner' member on household insert ---------
-- Keeps handle_new_user() and the client bootstrapHousehold() working without
-- each having to insert the membership row itself.

create or replace function public.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into household_members (household_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_household_created on households;
create trigger on_household_created
  after insert on households
  for each row execute function public.add_owner_membership();

-- 5. join_household RPC — the ONLY path to membership -------------------------

create or replace function public.join_household(target uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing_member uuid;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from households where id = target) then
    raise exception 'household not found' using errcode = 'P0002';
  end if;

  insert into household_members (household_id, user_id, role)
  values (target, uid, 'member')
  on conflict do nothing;

  -- Give the joining user their own decorative member card if they lack one.
  select member_id into existing_member
    from household_members where household_id = target and user_id = uid;
  if existing_member is null then
    insert into members (household_id, name, emoji, role, gradient_from, gradient_to)
    values (
      target,
      coalesce((select raw_user_meta_data ->> 'name' from auth.users where id = uid), 'New member'),
      '🧑', 'Member', 'oklch(0.6 0.13 200)', 'oklch(0.48 0.13 240)'
    )
    returning id into existing_member;
    update household_members set member_id = existing_member
      where household_id = target and user_id = uid;
  end if;

  insert into user_profiles (user_id, active_household_id)
  values (uid, target)
  on conflict (user_id) do update set active_household_id = excluded.active_household_id;

  return target;
end;
$$;
revoke all on function public.join_household(uuid) from public;
grant execute on function public.join_household(uuid) to authenticated;

-- 6. Recreate handle_new_user (body from 0009) + link member & set active -----

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
  insert into households (owner_id, name, coins, xp, streak, units)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'You') || '''s household', 340, 260, 4, 'kg')
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

  -- Link the creator's real auth user to their "You" member card, and mark this
  -- freshly-seeded household as their active one. (The on_household_created
  -- trigger already inserted the owner household_members row.)
  update household_members set member_id = m_you where household_id = h_id and user_id = new.id;
  insert into user_profiles (user_id, active_household_id)
  values (new.id, h_id)
  on conflict (user_id) do update set active_household_id = excluded.active_household_id;

  insert into pets (id, household_id, name, species, breed, sex, emoji, age_years, weight_kg, owned, equipped, gradient_from, gradient_to)
  values (gen_random_uuid(), h_id, 'Mozart', 'cat', 'British Shorthair', 'male', '🐱', 10.0/12, 5.1,
          array['bowtie', 'glasses'], '{"neck":"bowtie"}'::jsonb, 'oklch(0.72 0.008 260)', 'oklch(0.5 0.01 260)')
  returning id into p_cat;

  insert into pets (id, household_id, name, species, breed, emoji, age_years, weight_kg, owned, equipped, gradient_from, gradient_to)
  values (gen_random_uuid(), h_id, 'Biscuit', 'dog', 'Golden Retriever', '🐶', 2, 29.5,
          array['cap'], '{"head":"cap"}'::jsonb, 'oklch(0.74 0.13 75)', 'oklch(0.6 0.15 45)')
  returning id into p_dog;

  insert into weights (pet_id, ts, kg) values
    (p_cat, now_ms - 24*week_ms, 2.8), (p_cat, now_ms - 20*week_ms, 3.4), (p_cat, now_ms - 16*week_ms, 3.9),
    (p_cat, now_ms - 12*week_ms, 4.3), (p_cat, now_ms - 8*week_ms, 4.6), (p_cat, now_ms - 4*week_ms, 4.9),
    (p_cat, now_ms, 5.1),
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

-- 7. RLS on the two new tables -----------------------------------------------

alter table household_members enable row level security;
alter table user_profiles enable row level security;

drop policy if exists "see co-members" on household_members;
create policy "see co-members" on household_members
  for select using (user_id = auth.uid() or public.is_household_member(household_id));

drop policy if exists "leave household" on household_members;
create policy "leave household" on household_members
  for delete using (user_id = auth.uid());
-- No INSERT policy: membership is granted only via join_household()
-- (SECURITY DEFINER) and the add_owner_membership trigger.

-- A user may update their OWN membership row — used for per-user "view as"
-- (setting member_id). role is not an RLS boundary here (policies are
-- membership-based, not role-based; role only toggles UI affordances), so
-- allowing self-updates is safe for this app.
drop policy if exists "update own membership" on household_members;
create policy "update own membership" on household_members
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own profile" on user_profiles;
create policy "own profile" on user_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 8. Swap every owner-scoped policy for a membership-based one ----------------

drop policy if exists "own household" on households;
create policy "member household" on households
  for all using (public.is_household_member(id))
  -- with-check also allows the creator's own bootstrap/seed insert (owner_id =
  -- self) before the owner-membership trigger row is visible in the same stmt.
  with check (public.is_household_member(id) or owner_id = auth.uid());

drop policy if exists "own household members" on members;
create policy "member household members" on members
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "own household pets" on pets;
create policy "member household pets" on pets
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "own household activities" on activities;
create policy "member household activities" on activities
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "own household reminders" on reminders;
create policy "member household reminders" on reminders
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "own household booked vets" on booked_vets;
create policy "member household booked vets" on booked_vets
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists "own household weights" on weights;
create policy "member household weights" on weights
  for all using (pet_id in (select id from pets where public.is_household_member(household_id)))
  with check (pet_id in (select id from pets where public.is_household_member(household_id)));

drop policy if exists "own household supplies" on supplies;
create policy "member household supplies" on supplies
  for all using (pet_id in (select id from pets where public.is_household_member(household_id)))
  with check (pet_id in (select id from pets where public.is_household_member(household_id)));

drop policy if exists "own household meds" on meds;
create policy "member household meds" on meds
  for all using (pet_id in (select id from pets where public.is_household_member(household_id)))
  with check (pet_id in (select id from pets where public.is_household_member(household_id)));
