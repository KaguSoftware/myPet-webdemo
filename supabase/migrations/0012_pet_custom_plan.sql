-- User-editable per-pet care targets for pets whose breed has no vet-built
-- CARE_PLANS entry (e.g. an "Other"/custom-typed breed). Null means "use the
-- species-default targets"; any key present overrides the matching target.

alter table pets add column custom_plan jsonb;
