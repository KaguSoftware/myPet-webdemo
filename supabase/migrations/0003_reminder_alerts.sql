-- Auto-generated health-alert reminders (e.g. a cat eating/drinking well
-- outside its recommended daily count) get a distinct flag and an optional
-- suggested vet, so the reminders UI can render a "Book vet" CTA.
alter table reminders
  add column alert boolean not null default false,
  add column vet_id text;
