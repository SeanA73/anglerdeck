-- Regulations audit log for the quarterly refresh task (2026-07-27)
-- Requires 20260727d_admin_role_and_policies.sql (is_admin()).

CREATE TABLE IF NOT EXISTS public.regs_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter_group text NOT NULL,          -- 'January', 'April', 'July', 'October'
  countries text[] NOT NULL,            -- ISO codes audited
  spots_updated integer NOT NULL DEFAULT 0,
  notes text,
  audited_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regs_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manage regs audit log" ON public.regs_audit_log;
CREATE POLICY "admin manage regs audit log" ON public.regs_audit_log
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed with the July 2026 audit (GB/NO/SE/FI group)
INSERT INTO public.regs_audit_log (quarter_group, countries, spots_updated, notes)
VALUES (
  'July',
  ARRAY['GB','NO','SE','FI'],
  4,
  'Gaula closed for rest of 2026 season (Miljodirektoratet, 1 Aug); Namsen mid-season restrictions; Finnish fee age corrected 18-64 -> 18-69 on Saimaa and Paijanne. Water temps: all 192 seasonal, no changes.'
);
