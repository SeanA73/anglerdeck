-- Review moderation for spot_reviews.
--
-- Reviews used to publish the instant they were submitted, onto pages Google
-- indexes and which emit AggregateRating structured data. One fabricated or
-- spam review therefore reached both the search index and the rating markup
-- with no human in the loop. Contributor outreach is about to raise volume, so
-- submissions now queue for approval.
--
-- Run by hand in the Supabase SQL Editor. Safe to re-run: the backfill only
-- fires on the run that actually creates the column.

BEGIN;

-- 1. Status column ----------------------------------------------------------
--
-- BACKFILL DECISION: rows that already exist are set to 'approved', not
-- 'pending'.
--
-- Any such row was published under the old instant-publish behaviour, so it is
-- already live, already crawled, already counted in AggregateRating and already
-- feeding the indexing quality gate. Flipping those to 'pending' would retract
-- published content and could drop spots back below INDEX_THRESHOLD — a review
-- is worth +2, and +1 more at three — de-indexing pages that currently rank.
-- The gate exists to promote deliberately; demoting by accident is the same
-- mistake pointed the other way.
--
-- The table is expected to be empty, so this is normally a no-op. The notice
-- reports what actually happened either way, and the guard means re-running the
-- file will never mass-approve a genuine queue.
DO $$
DECLARE
  col_existed boolean;
  n integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'spot_reviews'
      AND column_name = 'status'
  ) INTO col_existed;

  IF col_existed THEN
    RAISE NOTICE 'status column already present - backfill skipped';
  ELSE
    ALTER TABLE public.spot_reviews
      ADD COLUMN status text NOT NULL DEFAULT 'pending';
    UPDATE public.spot_reviews SET status = 'approved';
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'Backfilled % pre-existing review(s) to approved', n;
  END IF;
END $$;

ALTER TABLE public.spot_reviews
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'spot_reviews_status_check'
  ) THEN
    ALTER TABLE public.spot_reviews
      ADD CONSTRAINT spot_reviews_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 2. Indexes ----------------------------------------------------------------
-- Public reads are always "this spot, approved only"; the admin queue is always
-- "this status, newest first". A bare index on status alone would serve neither
-- as well.
CREATE INDEX IF NOT EXISTS spot_reviews_spot_id_status_idx
  ON public.spot_reviews (spot_id, status);
CREATE INDEX IF NOT EXISTS spot_reviews_status_created_at_idx
  ON public.spot_reviews (status, created_at DESC);

-- 3. Read policy ------------------------------------------------------------
-- Public sees approved only. Admins see everything. Authors see their own
-- review whatever its state, so a submission does not appear to have vanished.
DROP POLICY IF EXISTS "Anyone can view spot reviews" ON public.spot_reviews;
DROP POLICY IF EXISTS "Approved reviews are public" ON public.spot_reviews;
CREATE POLICY "Approved reviews are public"
  ON public.spot_reviews FOR SELECT
  USING (
    status = 'approved'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );

-- 4. Admin write policy -----------------------------------------------------
-- Admins already had DELETE (20260727e); approving and rejecting needs UPDATE.
DROP POLICY IF EXISTS "admin update spot reviews" ON public.spot_reviews;
CREATE POLICY "admin update spot reviews"
  ON public.spot_reviews FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Moderation cannot be self-served ---------------------------------------
--
-- RLS is row-level, not column-level. The existing policies let an author
-- INSERT a row where auth.uid() = user_id, and UPDATE that same row freely — so
-- with nothing but a status column, an author could submit or edit straight to
-- status='approved' and bypass the queue entirely. These two triggers are what
-- actually enforce moderation; the policies above only decide row visibility.
--
-- Modelled on prevent_role_escalation() in 20260727d.

CREATE OR REPLACE FUNCTION public.force_review_pending_on_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL means SQL Editor / service role — always allowed.
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.status := 'pending';
    NEW.moderated_at := NULL;
    NEW.moderated_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS force_review_pending_on_insert ON public.spot_reviews;
CREATE TRIGGER force_review_pending_on_insert
  BEFORE INSERT ON public.spot_reviews
  FOR EACH ROW EXECUTE FUNCTION public.force_review_pending_on_insert();

CREATE OR REPLACE FUNCTION public.enforce_review_moderation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.moderated_at IS DISTINCT FROM OLD.moderated_at
     OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by THEN
    RAISE EXCEPTION 'Only admins can moderate reviews';
  END IF;

  -- Editing a live review returns it to the queue. Without this, "get approved,
  -- then rewrite the content" is an unmoderated path onto an indexed page.
  IF OLD.status = 'approved'
     AND (NEW.content IS DISTINCT FROM OLD.content
          OR NEW.title IS DISTINCT FROM OLD.title
          OR NEW.rating IS DISTINCT FROM OLD.rating
          OR NEW.photo_urls IS DISTINCT FROM OLD.photo_urls) THEN
    NEW.status := 'pending';
    NEW.moderated_at := NULL;
    NEW.moderated_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_review_moderation ON public.spot_reviews;
CREATE TRIGGER enforce_review_moderation
  BEFORE UPDATE ON public.spot_reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_moderation();

COMMIT;
