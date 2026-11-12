ALTER TABLE generation_jobs
 ADD COLUMN phase text NOT NULL DEFAULT 'ready' CHECK(phase IN ('ready','dispatching','pending','storing','done','unknown')),
 ADD COLUMN next_run_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN lease_token uuid,
 ADD COLUMN lease_expires_at timestamptz,
 ADD COLUMN max_attempts integer NOT NULL DEFAULT 3 CHECK(max_attempts BETWEEN 1 AND 10);
-- Pre-existing in-flight jobs must not be blindly resubmitted during cutover.
UPDATE generation_jobs SET phase='unknown',status='failed',error_code='PROVIDER_OUTCOME_UNKNOWN',finished_at=now()
 WHERE status='processing';
UPDATE generation_jobs SET phase='done' WHERE status IN ('succeeded','failed') AND phase<>'unknown';
CREATE INDEX jobs_available ON generation_jobs(next_run_at,created_at) WHERE status='queued';
CREATE INDEX jobs_leases ON generation_jobs(lease_expires_at) WHERE status='processing';
CREATE TABLE generation_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id),
 attempt_no integer NOT NULL,
 outcome text NOT NULL DEFAULT 'dispatching',
 error_code text, provider_reference text,
 started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 UNIQUE(job_id,attempt_no)
);
ALTER TABLE generation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_attempts FORCE ROW LEVEL SECURITY;
CREATE POLICY attempts_owner ON generation_attempts
 USING(user_id=nullif(current_setting('app.user_id',true),'')::uuid);
-- Role must be provisioned separately by an administrator (deploy/worker-role.sql).
-- current_user is the effective database role, never a client-controlled GUC.
CREATE POLICY jobs_worker ON generation_jobs USING(current_user='doodlelife_worker') WITH CHECK(current_user='doodlelife_worker');
CREATE POLICY attempts_worker ON generation_attempts USING(current_user='doodlelife_worker') WITH CHECK(current_user='doodlelife_worker');
CREATE POLICY entries_worker ON entries FOR SELECT USING(current_user='doodlelife_worker');
CREATE POLICY entries_worker_lock ON entries FOR UPDATE USING(current_user='doodlelife_worker') WITH CHECK(false);
CREATE POLICY stickers_worker ON stickers USING(current_user='doodlelife_worker') WITH CHECK(current_user='doodlelife_worker');
