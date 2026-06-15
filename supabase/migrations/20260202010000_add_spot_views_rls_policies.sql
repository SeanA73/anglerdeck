-- Add missing RLS policies for spot_views.
--
-- Background: spot_views was created in 20260126_monetization_features.sql with
-- RLS enabled but zero policies defined. In Postgres+Supabase RLS, "RLS enabled
-- + no policies = deny all" — so legitimate user inserts return 403 Forbidden
-- and reads were inconsistent. This migration adds the standard user-scoped
-- policies that the Phase 1 corrective migration should have included but
-- missed.
--
-- The 20260202000000_fix_spot_views_spot_id_type.sql migration corrected the
-- column type from UUID to INTEGER, but reads/writes were still blocked by
-- this missing-policy issue. This migration completes the spot_views fix.

DROP POLICY IF EXISTS "Users can insert their own spot views" ON public.spot_views;
DROP POLICY IF EXISTS "Users can view their own spot views" ON public.spot_views;

CREATE POLICY "Authenticated users can record their own spot views"
  ON public.spot_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own spot views"
  ON public.spot_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE/DELETE policies: spot views are append-only analytics. Users
-- shouldn't be able to retroactively modify or delete their view history.
