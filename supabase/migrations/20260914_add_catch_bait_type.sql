-- Additive only: nullable text[] column, no backfill, no default.
-- Existing rows stay NULL. The "log a catch" form treats bait as an optional
-- multi-select (a catch can list more than one bait/lure used in a session),
-- which is why this is an array rather than a single text column.
ALTER TABLE public.catch_logs
  ADD COLUMN IF NOT EXISTS bait_types text[];
