-- Run once in the Supabase SQL editor with an administrative role.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('stickers','stickers',false,10485760,ARRAY['image/png','image/webp','image/jpeg'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=10485760,
allowed_mime_types=ARRAY['image/png','image/webp','image/jpeg'];
-- Deliberately no authenticated/anon policies for this bucket.
-- Only server service-role can upload/download; never expose that key to A.
-- Before enabling production, inspect existing policies: permissive policies
-- on storage.objects must not grant access to this bucket.
SELECT policyname,qual,with_check FROM pg_policies WHERE schemaname='storage' AND tablename='objects';
