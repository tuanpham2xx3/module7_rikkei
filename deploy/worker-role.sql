-- Administrator only. Never use this role as DATABASE_URL for HTTP API.
-- Set password outside Git, then use this identity in WORKER_DATABASE_URL.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='doodlelife_worker') THEN
  CREATE ROLE doodlelife_worker LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
END $$;
GRANT USAGE ON SCHEMA public TO doodlelife_worker;
GRANT SELECT ON entries TO doodlelife_worker;
GRANT UPDATE(id) ON entries TO doodlelife_worker;
GRANT SELECT,UPDATE ON stickers,generation_jobs TO doodlelife_worker;
GRANT SELECT,INSERT,UPDATE ON generation_attempts TO doodlelife_worker;
-- entries UPDATE privilege supports row locks; entries_worker_lock WITH CHECK(false)
-- prevents this identity from changing entry values.
