-- Reminders v2: recurrence. Time-of-day needs no schema change — `due` is
-- already ms-precise; v1 simply always wrote day-bucket timestamps.

alter table reminders add column if not exists repeat_kind text not null default 'none'
  check (repeat_kind in ('none', 'daily', 'weekly', 'every_n_days'));
alter table reminders add column if not exists repeat_interval integer;  -- days; only used for every_n_days
