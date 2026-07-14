-- 0009: fix the seed cat's weight.
--
-- Mozart (British Shorthair) was seeded at 200 kg with a 120→200 kg history —
-- absurd, and it contradicted the breed's own healthy range (4.5–5.5 kg) shown
-- right next to it on the weight chart. Adult British Shorthairs are ~4.5–5.5 kg.
--
-- Part 1 fixes NEW signups (the on-signup trigger). Part 2 fixes households
-- that were already seeded with the bad values.
--
-- Forward-only: this replaces the trigger body from 0001 rather than editing it.

-- 1) New signups: recreate handle_new_user() with the realistic cat weight + ramp.
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

-- 2) Existing households: correct the already-seeded 200 kg cat + its history.
update pets
  set weight_kg = 5.1
  where breed = 'British Shorthair' and name = 'Mozart' and weight_kg >= 100;

update weights
  set kg = case kg
    when 120 then 2.8
    when 140 then 3.4
    when 158 then 3.9
    when 172 then 4.3
    when 185 then 4.6
    when 194 then 4.9
    when 200 then 5.1
    else kg
  end
  where kg >= 100
    and pet_id in (select id from pets where breed = 'British Shorthair' and name = 'Mozart');

-- NOTE: no role normalization needed. The signup trigger seeds the owner as
-- 'Owner'; the app's isAdminRole() now treats 'owner' and 'admin' as admin, so
-- existing 'Owner' rows already get full Family-ID access without a data change.
