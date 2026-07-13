-- Lets the family admin protect the shared household with a password.
-- Hashed client-side (SHA-256) before it ever reaches the DB — this is a
-- demo-level guard against casual snooping on a shared device, not a real
-- credential store.
alter table households add column family_password_hash text;
