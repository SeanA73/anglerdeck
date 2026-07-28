-- Access details for spot pages (2026-07-29)
--
-- Shape (all fields optional — leave NULL rather than guessing):
-- {
--   "shore":      true|false,          -- land-based fishing possible?
--   "boat":       true|false,          -- boat access available/required?
--   "ramp":       "text",              -- nearest boat ramp and distance
--   "parking":    "text",              -- parking situation
--   "walkIn":     "text",              -- walk from parking to water
--   "facilities": ["toilets","BBQ"],   -- amenities on site
--   "notes":      "text",              -- access caveats: permits, 4WD, tides
--   "sourceUrl":  "https://..."        -- where this was verified
-- }
--
-- sourceUrl is deliberately part of the shape: anything that cannot be traced
-- to an official park, council or fisheries page should not be recorded here.

ALTER TABLE public.spots ADD COLUMN IF NOT EXISTS access jsonb;

COMMENT ON COLUMN public.spots.access IS
  'Verified access details. Every claim should be traceable via access->>''sourceUrl''. Leave NULL rather than guessing.';
