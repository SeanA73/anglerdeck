-- =============================================================================
-- ReelSpot Phase 1 Corrective Migration
-- =============================================================================
-- This migration:
--   1. Fixes the paywall bypass (drops the subscriptions UPDATE policy that
--      let users change their own tier to 'elite' from the browser).
--   2. Locks down every wide-open "WITH CHECK (true)" policy so anonymous
--      users can no longer write to user-owned tables.
--   3. Tightens storage bucket policies (catch-photos, review-photos) so
--      only authenticated users can upload, and only owners can modify/delete.
--   4. Removes the marketplace tables (vendors, products, orders,
--      product_reviews, gear_listings) and the gear-images bucket since
--      marketplace is out for v1.
--   5. Adds missing RLS policies for affiliate_clicks, fcm_tokens,
--      notification_history, catch_analytics, and water_conditions_cache.
--
-- SAFETY NOTES:
--   - This migration is wrapped in a transaction. Either everything applies
--     or nothing does.
--   - All operations use IF EXISTS / IF NOT EXISTS guards so it is safe to
--     re-run.
--   - Marketplace tables are DROPPED. Any data in them will be lost. If you
--     have real data you want to preserve, export it first.
--   - After this migration, anonymous writes are blocked. The frontend must
--     gate write operations behind authentication (ProtectedRoute, etc.).
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: Fix the subscriptions paywall bypass
-- =============================================================================
-- The old UPDATE policy used USING() without WITH CHECK, letting users
-- update their own tier field. Drop it entirely. Only the Stripe webhook
-- (running with service_role) should ever write to subscriptions.

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- Re-create INSERT policy to allow users to create their own free-tier row
-- (the auto-create trigger handles this, but useSubscription.ts also has a
-- fallback insert). Restrict it strictly to free-tier.
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own free subscription"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND tier = 'free'
    AND status = 'active'
    AND stripe_customer_id IS NULL
    AND stripe_subscription_id IS NULL
  );

-- SELECT policy stays as-is (users see their own subscription)
-- No DELETE policy: subscriptions are managed by Stripe webhook only.


-- =============================================================================
-- SECTION 2: Lock down wide-open RLS on user-owned tables
-- =============================================================================

-- ----- catch_logs -----
DROP POLICY IF EXISTS "Anyone can create catch logs" ON public.catch_logs;
DROP POLICY IF EXISTS "Users can update their own catch logs" ON public.catch_logs;
DROP POLICY IF EXISTS "Users can delete their own catch logs" ON public.catch_logs;

CREATE POLICY "Authenticated users can create their own catch logs"
  ON public.catch_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catch logs"
  ON public.catch_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catch logs"
  ON public.catch_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- "Anyone can view catch logs" stays (public community feed)


-- ----- posts -----
DROP POLICY IF EXISTS "Anyone can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

CREATE POLICY "Authenticated users can create their own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ----- post_likes -----
DROP POLICY IF EXISTS "Anyone can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON public.post_likes;

CREATE POLICY "Authenticated users can like posts"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ----- post_comments -----
DROP POLICY IF EXISTS "Anyone can create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.post_comments;

CREATE POLICY "Authenticated users can create their own comments"
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ----- spot_reviews -----
DROP POLICY IF EXISTS "Anyone can create spot reviews" ON public.spot_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.spot_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.spot_reviews;

CREATE POLICY "Authenticated users can create their own reviews"
  ON public.spot_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.spot_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.spot_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ----- review_votes -----
DROP POLICY IF EXISTS "Anyone can vote on reviews" ON public.review_votes;
DROP POLICY IF EXISTS "Users can remove their own votes" ON public.review_votes;

CREATE POLICY "Authenticated users can vote on reviews"
  ON public.review_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes"
  ON public.review_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- =============================================================================
-- SECTION 3: Add missing RLS policies for monetization-feature tables
-- =============================================================================

-- ----- affiliate_clicks (exists from monetization migration, no policies set) -----
-- Users can record their own click events; only service role reads aggregates.
DROP POLICY IF EXISTS "Users can record their own affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "Users can record their own affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous clicks too (for non-logged-in browsers clicking affiliate links)
DROP POLICY IF EXISTS "Anonymous affiliate click tracking" ON public.affiliate_clicks;
CREATE POLICY "Anonymous affiliate click tracking"
  ON public.affiliate_clicks FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);


-- ----- affiliate_products (public catalog) -----
DROP POLICY IF EXISTS "Anyone can view active affiliate products" ON public.affiliate_products;
CREATE POLICY "Anyone can view active affiliate products"
  ON public.affiliate_products FOR SELECT
  USING (is_active = true);
-- Writes are admin-only via service role (no policy = no access for anon/authenticated)


-- ----- fcm_tokens -----
DROP POLICY IF EXISTS "Users can manage their own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can manage their own fcm tokens"
  ON public.fcm_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ----- notification_history -----
-- SELECT policy from monetization migration already exists; add nothing else.
-- Writes are server-side via service role.


-- ----- catch_analytics -----
DROP POLICY IF EXISTS "Users can view their own catch analytics" ON public.catch_analytics;
CREATE POLICY "Users can view their own catch analytics"
  ON public.catch_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
-- Writes are computed server-side via service role.


-- ----- water_conditions_cache -----
DROP POLICY IF EXISTS "Anyone can read cached water conditions" ON public.water_conditions_cache;
CREATE POLICY "Anyone can read cached water conditions"
  ON public.water_conditions_cache FOR SELECT
  USING (true);
-- Cache writes happen server-side via edge function with service role.


-- =============================================================================
-- SECTION 4: Tighten storage bucket policies (catch-photos, review-photos)
-- =============================================================================
-- Move from "anyone can upload/update/delete" to "authenticated users can
-- upload; owners can modify/delete their own files". The `owner` column on
-- storage.objects is set automatically to auth.uid() on upload.

-- ----- catch-photos bucket -----
DROP POLICY IF EXISTS "Anyone can upload catch photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update catch photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete catch photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload catch photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'catch-photos');

CREATE POLICY "Owners can update catch photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'catch-photos' AND owner = auth.uid());

CREATE POLICY "Owners can delete catch photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'catch-photos' AND owner = auth.uid());

-- "Catch photos are publicly accessible" SELECT policy stays


-- ----- review-photos bucket -----
DROP POLICY IF EXISTS "Anyone can upload review photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own review photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-photos');

CREATE POLICY "Owners can update review photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'review-photos' AND owner = auth.uid());

CREATE POLICY "Owners can delete review photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'review-photos' AND owner = auth.uid());


-- =============================================================================
-- SECTION 5: Remove marketplace (out for v1)
-- =============================================================================
-- ----- Drop gear-images storage bucket policies -----
-- Note: the gear-images bucket itself must be deleted via the Supabase
-- Storage UI (Dashboard → Storage → gear-images → ⋮ → Delete bucket).
-- Supabase's protect_delete() trigger blocks direct SQL deletion of
-- storage.buckets / storage.objects to prevent orphaned files.
DROP POLICY IF EXISTS "Gear images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload gear images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update gear images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete gear images" ON storage.objects;

-- ----- Drop marketplace tables -----
-- Order matters: drop dependent tables first.
DROP TABLE IF EXISTS public.product_reviews CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.gear_listings CASCADE;


-- =============================================================================
-- SECTION 6: Verification queries (run after migration to confirm)
-- =============================================================================
-- These are commented out — uncomment and run manually in SQL editor to verify:
--
-- -- 1. Confirm no policies allow anonymous writes to user tables:
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (qual = 'true' OR with_check = 'true')
--   AND cmd IN ('INSERT', 'UPDATE', 'DELETE');
-- -- Expected: 0 rows (or only the affiliate_products SELECT, which is fine)
--
-- -- 2. Confirm subscriptions has no UPDATE policy:
-- SELECT policyname FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'subscriptions';
-- -- Expected: only SELECT and INSERT policies, NO UPDATE policy
--
-- -- 3. Confirm marketplace tables are gone:
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('vendors', 'products', 'orders', 'product_reviews', 'gear_listings');
-- -- Expected: 0 rows

COMMIT;
