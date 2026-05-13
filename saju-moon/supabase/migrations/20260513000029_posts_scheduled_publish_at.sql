ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

UPDATE public.posts
SET
  scheduled_publish_at = published_at,
  published_at = NULL,
  is_published = false,
  updated_at = NOW()
WHERE is_published = true
  AND published_at IS NOT NULL
  AND published_at > NOW()
  AND scheduled_publish_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_scheduled_publish_at
  ON public.posts(scheduled_publish_at);

CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  UPDATE public.posts
  SET
    is_published = true,
    published_at = scheduled_publish_at,
    updated_at = NOW()
  WHERE is_published = false
    AND scheduled_publish_at IS NOT NULL
    AND scheduled_publish_at <= NOW();

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'publish-scheduled-posts-every-minute';

    PERFORM cron.schedule(
      'publish-scheduled-posts-every-minute',
      '* * * * *',
      'SELECT public.publish_scheduled_posts();'
    );
  END IF;
END;
$$;
