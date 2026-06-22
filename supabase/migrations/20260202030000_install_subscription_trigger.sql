-- Install the missing auto-create-subscription trigger.
--
-- The 20260128040109 migration was supposed to install a trigger that
-- creates a free-tier subscriptions row when a new auth.users row is
-- created (alongside the existing handle_new_user profiles trigger).
-- That migration aborts on a duplicate "subscriptions already exists"
-- error before reaching the trigger statements, so new users never
-- get an auto-created subscription row — useSubscription.ts's fallback
-- INSERT covers most cases but creates a race condition where any
-- server-side code reading subscription state immediately after signup
-- gets nothing.
--
-- This migration installs the trigger as a standalone idempotent
-- migration. Free-tier defaults are explicit (tier='free', status=
-- 'active', no stripe IDs) so it satisfies the Phase 1 corrective
-- migration's restricted INSERT policy if RLS is ever enforced on
-- the trigger context (it isn't by default — definer security mode
-- bypasses RLS — but being explicit is good hygiene).

-- Drop existing trigger and function (idempotent: safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_subscription();

-- Create the function that runs on new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the trigger that fires after a new auth.users row
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();