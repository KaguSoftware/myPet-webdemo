-- Per-pet cup size for the Fed portion picker, and grams fed per activity.

alter table pets add column cup_grams numeric not null default 60;
alter table activities add column grams numeric;
