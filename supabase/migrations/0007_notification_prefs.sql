-- Per-member toggles for the /settings Notifications section — mute a
-- category of simulated in-app toast for that family member without
-- touching the underlying reminders/alerts data. Lives on `members` (not
-- `households`) since each family member has their own preference.
-- `if exists`/`if not exists` guards make this safe to run whether or not
-- an earlier household-level version of this migration was already applied.
alter table households drop column if exists notify_care_reminders;
alter table households drop column if exists notify_family_activity;
alter table households drop column if exists notify_vet_suggestions;

alter table members add column if not exists notify_care_reminders boolean not null default true;
alter table members add column if not exists notify_family_activity boolean not null default true;
alter table members add column if not exists notify_vet_suggestions boolean not null default true;
