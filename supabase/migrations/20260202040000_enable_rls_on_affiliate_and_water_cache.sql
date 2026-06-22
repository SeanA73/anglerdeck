-- Enable RLS on affiliate_products and water_conditions_cache.
--
-- These two tables had policies defined in the Phase 1 hardening migration
-- (20260201000000_phase1_security_hardening.sql) but ENABLE ROW LEVEL
-- SECURITY was never called on them, making the policies inert. Tables
-- were effectively wide open to anonymous read/write despite the
-- restrictive policies. Caught by Supabase Security Advisor after deployment.

ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_conditions_cache ENABLE ROW LEVEL SECURITY;