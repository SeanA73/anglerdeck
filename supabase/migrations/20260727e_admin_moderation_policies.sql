-- Admin moderation + marketing policies (2026-07-27)
-- Requires 20260727d_admin_role_and_policies.sql (is_admin()).

-- Moderation: admins can delete any user content
DROP POLICY IF EXISTS "admin delete spot reviews" ON public.spot_reviews;
CREATE POLICY "admin delete spot reviews" ON public.spot_reviews
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin delete posts" ON public.posts;
CREATE POLICY "admin delete posts" ON public.posts
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin delete post comments" ON public.post_comments;
CREATE POLICY "admin delete post comments" ON public.post_comments
  FOR DELETE TO authenticated USING (public.is_admin());

-- Marketing: admins can read the newsletter list (public writes stay insert-only)
DROP POLICY IF EXISTS "admin read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "admin read newsletter subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.is_admin());
