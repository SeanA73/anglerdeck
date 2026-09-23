-- Verified access details — batch 6 (2026-09-17)
--
-- Four spots, each currently unpublished and one access record away from
-- crossing PUBLISH_THRESHOLD. Per CLAUDE.md item 1, this is a deliberately
-- small batch, not the full "access alone would publish" list (143 spots as
-- of today's access-audit.mjs run, not 96 — that number, given in
-- conversation before the audit was actually re-run, was wrong).
--
-- great-lake-tasmania-trout (3 -> 5): Tasmania's Inland Fisheries Service
-- publishes a public ramp list for Yingina/Great Lake directly on its own
-- waters page — a clean government-fisheries source.
--
-- montauk-striped-bass (4 -> 6): NY State Parks' own page for Montauk Point
-- State Park. Left out the specific permit dollar amounts on principle —
-- they're fees, not bag/size limits, so rule 3 doesn't require it, but a
-- figure quoted here goes stale the same way the Amazon gear prices did.
--
-- river-tay-scotland (4 -> 6): no government ramp exists for this river —
-- Scottish salmon access runs entirely through private riparian rights, let
-- via associations and estates. Sourced to the Dunkeld & Birnam Angling
-- Association's own non-member permit page, the actual body that sells day
-- access to the stretches nearest Dunkeld, rather than to a tourism site
-- repeating the same information secondhand. Other Tay stretches are let
-- through other estates/associations not covered here — said so in the
-- record rather than implying DBAA covers the whole river.
--
-- lake-nipissing-walleye (4 -> 6): sourced only to the City of North Bay's
-- own announcement of its municipal launches. Nipissing Township, a
-- different municipality on the lake's south shore, runs three more public
-- docks (Wades Landing, Chapmans Landing, McQuaby Lake) — found during
-- research but not included here since mixing facts from a second,
-- differently-sourced page into one record breaks the one-record-one-source
-- convention this file otherwise follows. Worth a follow-up record of its
-- own.
--
-- Not attempted this batch: Lake of the Woods (Baudette, MN) — the MN DNR
-- site returned HTTP 403 to an automated fetch (same class of problem as the
-- New Brunswick block CLAUDE.md already documents: worth retrying with a
-- real browser, not concluding the DNR doesn't publish this). The one PDF
-- that did resolve (the Baudette fisheries management plan) is image-based
-- and didn't yield extractable text; poppler-utils isn't installed on this
-- box and apt is currently broken here (malformed docker.list entry), so it
-- wasn't fixed in this pass either.

UPDATE public.spots SET access = '{"shore": true, "boat": true, "ramp": "Concrete ramps at Swan Bay, Cramps Bay, Brandum Bay and Tods Corner; a gravel ramp at Haddens Bay; a low-water alternative at Boundary Bay on the western shore south of Liawenee", "facilities": ["Public toilet (Miena)", "Camping ground (Miena)"], "notes": "Ramps are built for the Full Supply Level down to roughly 17m below it — at low water the lake can be extremely shallow with submerged hazards, so check current levels before launching. Do not park on or obstruct a ramp. Fishing from a boat within 100m of an angler fishing from shore is prohibited unless the boat is securely moored. No fires permitted on the foreshore.", "sourceUrl": "https://www.ifs.tas.gov.au/fisheries/waters-a-z/yingina-great-lake/"}'::jsonb, updated_at = now() WHERE slug = 'great-lake-tasmania-trout';

UPDATE public.spots SET access = '{"shore": true, "boat": true, "parking": "Parking at the main Montauk Point State Park lot serves shoreline access and the lighthouse; after-hours parking permits for the Camp Hero and Lighthouse lots are sold separately at Montauk Downs", "walkIn": "The North Bar surf spot is roughly a half-mile walk northwest along the beach from the main parking area; Camp Hero State Park adjoins the same parking area to the south", "facilities": ["Restaurant and gift shop (day-use area)"], "notes": "A NY State sport fishing permit is required at Montauk Point State Park year-round (annual or 7-day options), and a separate Camp Hero fishing permit is required to fish there after dark (valid April 1 – December 31). Driving on the sand needs its own beach-vehicle permit, and a seasonal vehicle entrance fee applies at the day-use area. Confirm current permit terms with the park office before a trip.", "sourceUrl": "https://parks.ny.gov/parks/montaukpoint/details.aspx?os=os"}'::jsonb, updated_at = now() WHERE slug = 'montauk-striped-bass';

UPDATE public.spots SET access = '{"shore": true, "boat": true, "notes": "There is no rod licence in Scotland, but a beat permit is required. For the stretches nearest Dunkeld, the Dunkeld & Birnam Angling Association sells non-member day permits (separate adult/junior/senior rates) covering the River Braan, the Tay''s Dunkeld beat, the Murthly & Glendelvine beat and the Stanley–Upper Scone beat, booked online through its own site. Other stretches of the Tay are let separately through individual estates or other associations not covered by DBAA — confirm which body holds the beat you want before travelling. Whether a beat is fly-only or catch-and-release varies by stretch and season.", "sourceUrl": "https://dbaa.co.uk/non-member-permits/"}'::jsonb, updated_at = now() WHERE slug = 'river-tay-scotland';

UPDATE public.spots SET access = '{"shore": true, "boat": true, "ramp": "City of North Bay operates public boat launches directly on Lake Nipissing at Champlain Park, Sunset Park, Armstrong Park and the Waterfront Marina", "notes": "Facilities and any seasonal restrictions vary by launch — confirm current status with the City of North Bay before relying on one site. Lake Nipissing is large and other lakeshore municipalities run their own separate public access points.", "sourceUrl": "https://northbay.ca/news-media-advisories/city-opens-municipal-boat-launches/"}'::jsonb, updated_at = now() WHERE slug = 'lake-nipissing-walleye';
