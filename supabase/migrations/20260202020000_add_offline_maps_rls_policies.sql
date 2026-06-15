-- Add missing RLS policies for offline_maps.
--
-- Same class of bug as spot_views (fixed in 20260202010000): offline_maps was
-- created in 20260126_monetization_features.sql with RLS enabled but zero
-- policies defined. In Postgres+Supabase, "RLS enabled + no policies = deny
-- all", so every authenticated write returned 403 Forbidden. Caught by a
-- policy audit during Phase 1 verification.

-- offline_maps RLS policies
DROP POLICY IF EXISTS "Users can insert their own offline maps" ON public.offline_maps;
DROP POLICY IF EXISTS "Users can view their own offline maps" ON public.offline_maps;
DROP POLICY IF EXISTS "Users can delete their own offline maps" ON public.offline_maps;

CREATE POLICY "Users can insert their own offline maps"
  ON public.offline_maps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own offline maps"
  ON public.offline_maps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offline maps"
  ON public.offline_maps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE policy: download records are immutable. To re-download,
-- delete and re-insert.
