-- Care-warning reminders ("Don't forget to feed Mozart") were previously
-- deduped and resolved by matching their exact title string, which embeds the
-- pet's name. Renaming a pet with an outstanding warning broke both the resolve
-- (logging the action no longer matched the stale title) and the dedup (a new
-- warning for the new name could be raised alongside the old one). Store a
-- stable kind on the reminder so raise/resolve can match on (pet_id, alert_kind)
-- instead of the volatile title.
alter table reminders
  add column if not exists alert_kind text;

-- Backfill existing outstanding care warnings from their title verb so already
-- raised alerts keep resolving after this migration. Health alerts (vet_id set)
-- are left null — they are matched per-day, not by kind.
update reminders set alert_kind = 'fed'
  where alert_kind is null and alert and vet_id is null and title ilike 'Don''t forget to feed %';
update reminders set alert_kind = 'water'
  where alert_kind is null and alert and vet_id is null and title ilike 'Don''t forget to give water to %';
update reminders set alert_kind = 'litter'
  where alert_kind is null and alert and vet_id is null and title ilike 'Don''t forget to clean the litter box for %';
update reminders set alert_kind = 'walk'
  where alert_kind is null and alert and vet_id is null and title ilike 'Don''t forget to take for a walk %';
