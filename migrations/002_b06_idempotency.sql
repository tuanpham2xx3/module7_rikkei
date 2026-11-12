-- Fail rather than silently discard incompatible existing jobs.
ALTER TABLE stickers ADD CONSTRAINT stickers_identity_owner UNIQUE(id,entry_id,user_id);
ALTER TABLE generation_jobs ADD CONSTRAINT jobs_sticker_owner
 FOREIGN KEY(sticker_id,entry_id,user_id) REFERENCES stickers(id,entry_id,user_id) ON DELETE CASCADE;
ALTER TABLE generation_jobs ADD CONSTRAINT jobs_one_per_sticker UNIQUE(sticker_id);
CREATE TABLE api_requests (
 user_id uuid NOT NULL REFERENCES users(id),
 operation text NOT NULL CHECK(operation = 'create_entry'),
 idempotency_key uuid NOT NULL,
 request_hash text NOT NULL CHECK(length(request_hash)=64),
 entry_id uuid REFERENCES entries(id) ON DELETE SET NULL,
 job_id uuid REFERENCES generation_jobs(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,operation,idempotency_key)
);
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY requests_owner ON api_requests
 USING(user_id = nullif(current_setting('app.user_id',true),'')::uuid)
 WITH CHECK(user_id = nullif(current_setting('app.user_id',true),'')::uuid);
