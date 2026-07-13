-- Tracks when the household was last loaded, so the login catch-up
-- notification can show activity since the previous visit instead of a
-- fixed rolling window.
alter table households
  add column last_seen_at bigint;
