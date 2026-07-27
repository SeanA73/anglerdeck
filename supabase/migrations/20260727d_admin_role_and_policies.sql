-- Admin role + RLS policies for the /admin dashboard (2026-07-27)

-- 1. Role column on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. Helper: is the current user an admin?
-- SECURITY DEFINER so it can be used inside RLS policies without recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Block self-promotion: only admins may change the role column.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL means SQL Editor / service role — always allowed
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 4. Admin write access to spots (public already has read)
DROP POLICY IF EXISTS "admin insert spots" ON public.spots;
DROP POLICY IF EXISTS "admin update spots" ON public.spots;
DROP POLICY IF EXISTS "admin delete spots" ON public.spots;
CREATE POLICY "admin insert spots" ON public.spots
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin update spots" ON public.spots
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "admin delete spots" ON public.spots
  FOR DELETE TO authenticated USING (public.is_admin());

-- 5. Admin access to affiliate tables
DROP POLICY IF EXISTS "admin manage affiliate products" ON public.affiliate_products;
CREATE POLICY "admin manage affiliate products" ON public.affiliate_products
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin read affiliate clicks" ON public.affiliate_clicks;
CREATE POLICY "admin read affiliate clicks" ON public.affiliate_clicks
  FOR SELECT TO authenticated USING (public.is_admin());

-- 6. Admin read access to activity / billing tables
DROP POLICY IF EXISTS "admin read subscriptions" ON public.subscriptions;
CREATE POLICY "admin read subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin read spot views" ON public.spot_views;
CREATE POLICY "admin read spot views" ON public.spot_views
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin read catch logs" ON public.catch_logs;
CREATE POLICY "admin read catch logs" ON public.catch_logs
  FOR SELECT TO authenticated USING (public.is_admin());

-- 7. Make Sean an admin
UPDATE public.profiles SET role = 'admin'
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'shadidawizz73@gmail.com');
