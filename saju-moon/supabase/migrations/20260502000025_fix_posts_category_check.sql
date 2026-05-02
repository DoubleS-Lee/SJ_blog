-- ============================================================
-- Allow "기타" category in posts
-- ============================================================

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_category_check
  CHECK (
    category IN (
      '연애·궁합',
      '커리어·이직',
      '재물·투자',
      '건강·체질',
      '육아·자녀교육',
      '기타'
    )
  );
