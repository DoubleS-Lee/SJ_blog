-- ============================================================
-- Storage buckets and policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "post-images public read" ON storage.objects;
DROP POLICY IF EXISTS "post-images admin insert" ON storage.objects;
DROP POLICY IF EXISTS "post-images admin update" ON storage.objects;
DROP POLICY IF EXISTS "post-images admin delete" ON storage.objects;
DROP POLICY IF EXISTS "profile-images public read" ON storage.objects;
DROP POLICY IF EXISTS "profile-images owner insert" ON storage.objects;
DROP POLICY IF EXISTS "profile-images owner update" ON storage.objects;
DROP POLICY IF EXISTS "profile-images owner delete" ON storage.objects;

CREATE POLICY "post-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "post-images admin insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND public.is_admin()
  );

CREATE POLICY "post-images admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'post-images'
    AND public.is_admin()
  );

CREATE POLICY "post-images admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND public.is_admin()
  );

CREATE POLICY "profile-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "profile-images owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile-images owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile-images owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
