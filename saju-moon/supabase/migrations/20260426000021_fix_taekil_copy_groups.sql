-- ============================================================
-- Ensure taekil_copy accepts template group rows
-- ============================================================

ALTER TABLE public.taekil_copy
  DROP CONSTRAINT IF EXISTS taekil_copy_copy_group_check;

ALTER TABLE public.taekil_copy
  DROP CONSTRAINT IF EXISTS taekil_copy_group_check;

ALTER TABLE public.taekil_copy
  ADD CONSTRAINT taekil_copy_copy_group_check
  CHECK (copy_group IN ('page', 'purpose', 'level', 'panel', 'template'));
