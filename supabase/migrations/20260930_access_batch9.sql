-- Verified access details — batch 9 (2026-09-30)
--
-- Three spots, same small-batch approach as batches 6-8.
--
-- elbe-hamburg-zander: hamburg.de / BUKEA (the city's own environment and
-- agriculture authority) confirms the licence structure already stated in
-- this spot's regulations, plus a separate boat-fishing card for the Elbe
-- and harbour. Also carries BUKEA's own fish-consumption advisory — this is
-- the contamination check CLAUDE.md names the Elbe as a candidate for.
-- Historic dioxin-type contamination is real and BUKEA's current guidance
-- (heated preparation, 1-2 portions/week) is less restrictive than the
-- earlier 8-portions/year figure, so stating both avoids implying the fish
-- is unsafe when the authority's own current advice is more relaxed. No
-- specific ramp/parking location found for bank fishing, left NULL rather
-- than guessed.
--
-- haida-gwaii-halibut: parks.canada.ca's own Gwaii Haanas pages, fetched
-- directly — "Fishing" (licence requirement, freshwater closed) and
-- "Getting to Gwaii Haanas" (Moresby Camp as the boat launch, no roads into
-- the park itself, orientation/permit requirement). This was attempted and
-- dropped in batch 8 after Sandspit Harbour's own site refused the
-- connection and a guessed DFO Small Craft Harbours URL 404'd — the fix
-- here was going to Parks Canada's own site instead of a harbour-specific
-- one, same "real browser, fresh URL" lesson as the Bay of Islands case.
--
-- chesil-beach-dorset: Portland Town Council's own car-park page for the
-- Ferrybridge/Chesil Car Park, which states it's run by Dorset Council.
-- visit-dorset.com (a tourism board, not a local authority) was the only
-- other source for parking and was not used for that reason. No official
-- Environment Agency access page specific to this beach was found — the
-- licence claim already in this spot's regulations (no rod licence for sea
-- fishing) is unchanged and not restated as a new claim here.
--
-- Not included this batch:
-- - dullstroom-trout: dullstroom.co.za and similar tourism/lodge sites
--   consistently describe day-ticket private stillwater access, but none of
--   them are an official government or provincial source, and the
--   Mpumalanga Tourism and Parks Agency's own site has no page with
--   specific access detail for this water — only a general permits contact.
--   Per CLAUDE.md, the consensus of unofficial sources is not a source.
--   Left for a future batch once an MTPA page with real detail turns up.

UPDATE public.spots SET access = '{"boat": true, "notes": "A Fischereischein is required to fish German inland waters including the Elbe; a Touristenfischereischein is available to visitors without sitting the standard angling exam. Fishing the Elbe and Hamburg harbour from a boat additionally requires a separate Bootsangelkarte issued by the city''s environment authority (BUKEA). IMPORTANT HEALTH ADVICE: BUKEA''s own fish monitoring has found dioxin-type contamination in Elbe-caught fish. Current guidance is that fish prepared by heating/cooking can be eaten in moderation (around one to two portions a week), a relaxation from an earlier recommendation limiting unheated preparation to no more than eight portions a year. Check BUKEA''s current advice before eating your catch.", "sourceUrl": "https://www.hamburg.de/politik-und-verwaltung/behoerden/bukea/themen/agrarwirtschaft/fischerei/angel-dienstleistungen-179430"}'::jsonb, updated_at = now() WHERE slug = 'elbe-hamburg-zander';

UPDATE public.spots SET access = '{"boat": true, "ramp": "The closest boat launch to Gwaii Haanas is Moresby Camp, a provincial recreational site in Cumshewa Inlet, Moresby Island, reached by a rough logging road from Alliford Bay/Sandspit", "notes": "There are no roads into Gwaii Haanas itself — access is by boat or seaplane only, and freshwater fishing is not permitted anywhere in the park. Saltwater fishing requires a federal DFO Tidal Waters Fishing Licence. Independent visitors must reserve, pay the park''s visitor use fee and attend a mandatory orientation before entering; check current logging-road driving conditions with the Sandspit Airport or Daajing Giids Visitor Centre before driving to Moresby Camp.", "sourceUrl": "https://parks.canada.ca/pn-np/bc/gwaiihaanas/visit/planifiez-plan"}'::jsonb, updated_at = now() WHERE slug = 'haida-gwaii-halibut';

UPDATE public.spots SET access = '{"shore": true, "parking": "The main Chesil Car Park (postcode DT4 9XE), run by Dorset Council, is at Ferrybridge next to the Chesil Beach Centre — 616 spaces plus 8 disabled bays, pay-and-display, open 24 hours. A smaller National Trust car park with no facilities is further along the beach at Cogden (DT6 4RL) for the quieter western stretch.", "facilities": ["Public toilets (Ferrybridge car park)"], "notes": "Shore/beach fishing only — Chesil is a long shingle bank with no boat launch of its own.", "sourceUrl": "https://portlandtowncouncil.gov.uk/services/car-parks/chesil"}'::jsonb, updated_at = now() WHERE slug = 'chesil-beach-dorset';
