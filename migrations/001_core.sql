CREATE TABLE users (
 id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh' CHECK (timezone = 'Asia/Ho_Chi_Minh')
);
CREATE TABLE entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id),
 entry_date date NOT NULL,
 content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300 AND content = btrim(content)),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, entry_date), UNIQUE(id, user_id)
);
CREATE TABLE stickers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 entry_id uuid NOT NULL, content text NOT NULL,
 mood text NOT NULL DEFAULT 'neutral', time_of_day text NOT NULL,
 is_primary boolean NOT NULL DEFAULT true, is_fallback boolean NOT NULL DEFAULT false,
 object_path text UNIQUE, mime_type text CHECK (mime_type IN ('image/png','image/webp','image/jpeg')),
 size_bytes integer CHECK (size_bytes > 0 AND size_bytes <= 10485760),
 width integer CHECK (width > 0), height integer CHECK (height > 0),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(entry_id,user_id) REFERENCES entries(id,user_id) ON DELETE CASCADE,
 CHECK (object_path IS NULL OR object_path LIKE user_id::text || '/' || entry_id::text || '/%')
);
CREATE UNIQUE INDEX stickers_primary ON stickers(entry_id) WHERE is_primary;
CREATE TABLE generation_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, entry_id uuid NOT NULL,
 sticker_id uuid NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','succeeded','failed')),
 attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0), provider text, provider_reference text, error_code text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 started_at timestamptz, finished_at timestamptz,
 FOREIGN KEY(entry_id,user_id) REFERENCES entries(id,user_id) ON DELETE CASCADE
);
CREATE INDEX entries_owner_date ON entries(user_id,entry_date DESC,id DESC);
CREATE INDEX jobs_pending ON generation_jobs(status,created_at);
-- Defense in depth for non-superuser database roles. API also filters every query by owner.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_owner ON users USING (id = nullif(current_setting('app.user_id',true),'')::uuid) WITH CHECK (id = nullif(current_setting('app.user_id',true),'')::uuid);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','entries','stickers','generation_jobs'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY owner_only ON %I USING (user_id = nullif(current_setting(''app.user_id'',true),'''')::uuid) WITH CHECK (user_id = nullif(current_setting(''app.user_id'',true),'''')::uuid)',t);
 END LOOP;
END $$;
