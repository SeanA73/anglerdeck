-- Verified access details — batch 7 (2026-09-17)
--
-- Four more spots, each currently unpublished and one access record away
-- from crossing PUBLISH_THRESHOLD. Same small-batch approach as batch 6.
--
-- somerset-dam-bass (4 -> 6): Seqwater (the QLD bulk water authority that
-- manages the dam) publishes ramp pages directly.
--
-- san-diego-offshore-tuna (4 -> 6): Port of San Diego's own boat-launching-
-- ramps page. Deliberately did NOT add the real OEHHA San Diego Bay fish
-- consumption advisory (mercury/PCBs) found while checking for one, the way
-- Sydney Harbour's dioxin advisory was added elsewhere — that advisory
-- covers bay species (perch, turbot, shiner perch) caught inside the bay,
-- not the offshore pelagics (tuna, yellowtail, dorado) this spot is about.
-- The Port ramps are just where the offshore boats launch from; applying a
-- bay-species advisory to an offshore-species spot would be the wrong kind
-- of claim to attach.
--
-- lake-simcoe-ontario (4 -> 6): Ontario Parks' own Sibbald Point Provincial
-- Park page. Covers only the provincial park launch, not the other
-- township-run accesses around the lake — said so in the record rather
-- than implying it's the only one, same reasoning as the North Bay/Nipissing
-- Township split in batch 6.
--
-- lake-windermere (4 -> 6): Westmorland and Furness Council's own Lake
-- Wardens page (the council took over the role from the former South
-- Lakeland District Council after 2023 local government reorganisation —
-- the URL redirected there when checked). This is the main public slipway;
-- the Lake District National Park Authority's byelaws separately restrict
-- launching a powered boat from the Waterhead beach at the north end.

UPDATE public.spots SET access = '{"shore": true, "boat": true, "ramp": "Seqwater''s public boat ramp at Westvale Road, at the northern end of Lake Somerset, is single-lane; boating and jetskiing are also based at the Kirkleagh Recreation Area", "facilities": ["Picnic areas (Westvale Road)"], "notes": "A 6-knot speed limit applies in the Westvale Road section of the lake. Fishing needs a Stocked Impoundment Permit (SIPS) as well as a Queensland fishing licence. Seqwater''s Lake Somerset Recreation Guide (downloadable from their site) has the full facility map.", "sourceUrl": "https://www.seqwater.com.au/things-to-do/westvale-road-boat-ramp"}'::jsonb, updated_at = now() WHERE slug = 'somerset-dam-bass';

UPDATE public.spots SET access = '{"shore": false, "boat": true, "ramp": "Port of San Diego operates free public launch ramps at Chula Vista (J Street Marina Park), National City (next to Pepper Park) and Shelter Island, each with trailer parking; Glorietta Bay in Coronado is a separate, city-run anchorage requiring a Harbor Police permit", "parking": "Large trailer-parking lots at all three Port-operated ramps", "facilities": ["Restrooms (all three Port ramps)", "Picnic areas (Chula Vista, National City)", "24-hour bait barge (Shelter Island)"], "notes": "These ramps are inside San Diego Bay, well short of the offshore grounds this spot is about — most anglers targeting tuna, yellowtail or dorado book a multi-day sport-boat charter rather than launching a trailered boat themselves.", "sourceUrl": "https://www.portofsandiego.org/coming-and-going/boating-san-diego-bay/boat-launching-ramps"}'::jsonb, updated_at = now() WHERE slug = 'san-diego-offshore-tuna';

UPDATE public.spots SET access = '{"shore": true, "boat": true, "ramp": "Sibbald Point Provincial Park, on the lake''s south shore, has a boat launch with dedicated parking", "facilities": ["Comfort stations (12)", "Vault toilets (15)", "Docks (4)", "Trailer dump/fill station", "Picnic shelters", "Beach"], "notes": "Day use at Sibbald Point runs year-round; camping is seasonal (roughly May to October). Other lakeshore townships around Lake Simcoe run their own separate public accesses not covered by this record.", "sourceUrl": "https://www.ontarioparks.ca/park/sibbaldpoint"}'::jsonb, updated_at = now() WHERE slug = 'lake-simcoe-ontario';

UPDATE public.spots SET access = '{"shore": true, "boat": true, "ramp": "The Lake Wardens (Westmorland and Furness Council) run the main public slipway at Ferry Nab, Bowness-on-Windermere, for trailered craft up to 8 tonnes", "parking": "Car and trailer parking at Ferry Nab", "facilities": ["Public jetties", "Mast hoist", "Boat/dinghy storage", "Showers", "Picnic area", "Refreshments"], "notes": "Opening hours vary through the year — confirm with the Lake Wardens (Ferry Nab office, open daily except Christmas Day) before travelling. Launching a powered boat elsewhere on the lake, e.g. the Waterhead beach at the northern end, is separately restricted by byelaw.", "sourceUrl": "https://www.westmorlandandfurness.gov.uk/parks-culture-and-leisure/windermere-lake/lake-wardens"}'::jsonb, updated_at = now() WHERE slug = 'lake-windermere';
