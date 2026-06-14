-- Fix spot_views.spot_id type mismatch
--
-- The column was created as UUID (in 20260126_monetization_features.sql)
-- but the frontend sends a numeric spot ID from src/data/spots.ts.
-- Every INSERT to spot_views fails with PostgreSQL error 22P02
-- (invalid_text_representation). Switch to INTEGER to match the
-- frontend type. There are zero rows in this table right now (the
-- INSERTs never succeeded), so no data conversion is needed.

ALTER TABLE public.spot_views
  ALTER COLUMN spot_id TYPE INTEGER USING NULL;

-- Note: USING NULL because there are zero existing rows. If you had
-- legitimate UUID data to preserve you'd need a different USING clause,
-- but here the table is empty so NULL is fine and avoids cast errors.
