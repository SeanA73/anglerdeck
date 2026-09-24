-- Verified access details — batch 8 (2026-09-17)
--
-- Four more spots, same small-batch approach as batches 6 and 7.
--
-- columbia-river-chinook (4 -> 6): WDFW's own Marine Area 1 (Ilwaco) page,
-- which names launches on both the WA and OR sides of the river mouth (this
-- spot straddles the state line at Buoy 10) plus jetty access for anglers
-- without a boat, and carries WDFW's own bar-crossing safety warning.
--
-- port-phillip-bay-snapper (4 -> 6): Parks Victoria's own Patterson River
-- page. Left "shore" unset rather than false — I found nothing tracing
-- shore/pier access for this spot, so per CLAUDE.md rule 1 it's left NULL
-- rather than guessed either way.
--
-- tobin-lake-saskatchewan (3 -> 5): Nipawin & District Regional Park's own
-- page (Saskatchewan Association of Regional Parks). Left out the specific
-- launch/season-pass dollar fees on the same staleness principle as the
-- Amazon gear prices — fees change, the existence of a required pass
-- doesn't.
--
-- hauraki-gulf-snapper (4 -> 6): Westhaven Marina's own page, which
-- confirms in its footer that Westhaven is operated by Auckland Council
-- (via its Panuku division) — the .co.nz domain reads like a private
-- marina but isn't.
--
-- Not attempted this batch:
-- - norfolk-broads-pike: norfolkbroads.com looks official but its own
--   About page says it's a private family tourism business, not the Broads
--   Authority. The Broads Authority's own boating/facilities page 403'd on
--   every fetch attempt — fetcher-blocked, not source-blocked, per the
--   New Brunswick precedent in CLAUDE.md; worth a retry with a real browser.
-- - haida-gwaii-halibut: Sandspit Harbour's own site (sandspitharbour.ca)
--   refused the connection outright (site down, not blocked), so its
--   facility details couldn't be verified firsthand even though a search
--   snippet quoted them. The DFO Small Craft Harbours page that should list
--   it 404'd on the guessed URL. Didn't want to cite a page I couldn't load
--   myself.
--
-- Also included below: a fix for an existing rule-3 violation found while
-- checking this spot's regulations for contradictions with the new access
-- record. hauraki-gulf-snapper.regulations already states a specific
-- "30cm minimum size" for snapper — a fifth instance of the problem
-- CLAUDE.md item 6 documents four of (Taupo, Rio Negro, Cabo San Lucas,
-- Lofoten). Rewording to remove the number; the "check Fisheries NZ for
-- current limits" line already covers it.

UPDATE public.spots SET access = '{"boat": true, "ramp": "On the Washington side, Ilwaco is the main launch for Marine Area 1, with an alternative at the Port of Chinook; on the Oregon side, boats also launch from Warrenton, Astoria and other Columbia River ports", "walkIn": "Bank/jetty access without a boat is available at the Columbia River North Jetty and A-Jetty near Cape Disappointment State Park, for lingcod, rockfish and seaperch", "notes": "The Columbia River bar here is one of the most dangerous in the country — check weather and tide tables and avoid crossing on a strong outgoing tide. This stretch straddles the WA/OR state line, matching the concurrent-waters rule already noted in this spot''s regulations.", "sourceUrl": "https://wdfw.wa.gov/fishing/locations/marine-areas/ilwaco"}'::jsonb, updated_at = now() WHERE slug = 'columbia-river-chinook';

UPDATE public.spots SET access = '{"boat": true, "ramp": "Patterson River at Carrum (Launching Way) is Port Phillip''s busiest boat ramp — ten lanes across four ramps (two 3-lane, two 2-lane), plus large car and trailer parking", "facilities": ["Picnic shelters and BBQs (west of Launching Way)", "Toilets", "Wheelchair-friendly picnic area (near Ramp 4)", "Free electric hoist for wheelchair users transferring into boats (safety induction required)"], "notes": "All Victorian boat ramps are free to use. The Boating Victoria app shows live carpark and queue status at Patterson River, which gets very busy in peak periods, especially through the main snapper season.", "sourceUrl": "https://www.parks.vic.gov.au/places-to-see/parks/patterson-river"}'::jsonb, updated_at = now() WHERE slug = 'port-phillip-bay-snapper';

UPDATE public.spots SET access = '{"boat": true, "ramp": "Nipawin & District Regional Park has a dual concrete boat launch (two ramps) with wheelchair-accessible docks, reached by a paved road from downtown Nipawin", "facilities": ["Free fish filleting shack (metal surfaces, spray hoses, garburator)", "Marina and boat rental (Aurora Houseboats, Twin Marine)"], "notes": "A facility pass is required from May 15 to October 15 to use the boat launch, filleting shack, beach and washrooms. Further public access exists on Tobin Lake''s north shore (Hwy 55) and south shore (Hwy 35), and the separate Resort Village of Tobin Lake runs its own launch and marina.", "sourceUrl": "https://saskregionalparks.ca/park/nipawin-district/"}'::jsonb, updated_at = now() WHERE slug = 'tobin-lake-saskatchewan';

UPDATE public.spots SET access = '{"boat": true, "ramp": "Westhaven Marina, run by Auckland Council (Panuku), has the main public launching ramp on the Waitematā Harbour side of the gulf, with parking for up to 60 boats and trailers (pay-by-plate, up to 4 days, paid at ramp machines or the INUGO app)", "notes": "Auckland Council and Auckland Transport manage all the other public boat ramps and wharves around the wider Auckland region — Westhaven is only the largest, not the only one.", "sourceUrl": "https://www.westhaven.co.nz/z-pier/general-information/launching-ramp/"}'::jsonb, updated_at = now() WHERE slug = 'hauraki-gulf-snapper';

-- Rule-3 fix: remove the specific size number, keep the high-level pointer.
UPDATE public.spots SET regulations = '["No licence required for recreational sea fishing", "Snapper bag limit and minimum size apply in this area", "Check Fisheries NZ for current limits and closed areas"]'::jsonb, updated_at = now() WHERE slug = 'hauraki-gulf-snapper';
