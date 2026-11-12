ALTER TABLE profiles ADD COLUMN daily_generation_limit integer NOT NULL DEFAULT 5 CHECK(daily_generation_limit BETWEEN 0 AND 1000);
ALTER TABLE generation_jobs ADD COLUMN run_version integer NOT NULL DEFAULT 1 CHECK(run_version>0);
ALTER TABLE generation_jobs ADD COLUMN run_started_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE generation_jobs ADD COLUMN user_retry_allowed boolean NOT NULL DEFAULT false;
UPDATE generation_jobs SET run_started_at=created_at;
ALTER TABLE generation_attempts ADD COLUMN run_version integer NOT NULL DEFAULT 1 CHECK(run_version>0);
ALTER TABLE generation_attempts DROP CONSTRAINT generation_attempts_job_id_attempt_no_key;
ALTER TABLE generation_attempts ADD CONSTRAINT attempts_per_run UNIQUE(job_id,run_version,attempt_no);
ALTER TABLE api_requests DROP CONSTRAINT api_requests_operation_check;
ALTER TABLE api_requests ADD CONSTRAINT requests_operation CHECK(operation IN ('create_entry','retry_entry'));
CREATE TABLE daily_generation_usage (
 user_id uuid NOT NULL REFERENCES users(id), usage_date date NOT NULL,
 used integer NOT NULL DEFAULT 0 CHECK(used>=0), PRIMARY KEY(user_id,usage_date)
);
-- Usage survives journal deletion; job pointer is nulled, never reset/refunded.
CREATE TABLE generation_usage_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 job_id uuid REFERENCES generation_jobs(id) ON DELETE SET NULL,
 run_version integer NOT NULL CHECK(run_version>0), usage_date date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(job_id,run_version)
);
ALTER TABLE daily_generation_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_generation_usage FORCE ROW LEVEL SECURITY;
CREATE POLICY usage_owner ON daily_generation_usage
 USING(user_id=nullif(current_setting('app.user_id',true),'')::uuid)
 WITH CHECK(user_id=nullif(current_setting('app.user_id',true),'')::uuid);
ALTER TABLE generation_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_usage_events FORCE ROW LEVEL SECURITY;
CREATE POLICY events_owner ON generation_usage_events
 USING(user_id=nullif(current_setting('app.user_id',true),'')::uuid)
 WITH CHECK(user_id=nullif(current_setting('app.user_id',true),'')::uuid);
-- Existing jobs retain their state/attempts. No fabricated historical quota usage.
