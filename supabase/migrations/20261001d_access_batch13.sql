-- Verified access details — batch 13
--
-- 1 spot(s) with records, 7 skipped. Every sourceUrl is an official
-- government, park-authority, council or fisheries-body page (CLAUDE.md content rules 1-3).
-- Apply by hand in the SQL Editor, then rebuild (migration first, then build).
--
-- volga-delta-catfish: Rosrybolovstvo (Federal Agency for Fisheries), Volga-Caspian territorial administration, "Pamyatka dlya rybolova-lyubitelya" for Astrakhan Oblast, read via WebFetch (Russian): amateur fishing on public water bodies is free and without charge under the Volga-Caspian fishing rules; fishing is prohibited 16 May-20 June across the region (except within settlements); sturgeon species are prohibited; prohibited zones include the Volga pre-mouth protected area, sturgeon and fish spawning grounds, hydro-facility safety zones and registered shipping channels; nets, traps and similar gear banned. The page's species list was machine-summarised inconsistently (zander appeared in one listing), so NO species other than sturgeon is stated, and the 2026 roach/vobla bans are not restated. CONTRADICTION/GAP FIXED: existing regulations did not mention the regional closed period or the prohibited zones.
--
-- Not included this batch:
-- - lake-baikal-omul: NOT RESEARCHED in this pass.
-- - ponoi-river: Lodge/camp-only access model (existing regulations already say so); ponoi river permits are held by licensed camps and no official page on it was located. CLAUDE.md marks this group as a separate "access-model" record, not researched here.
-- - lena-river-taimen: NOT RESEARCHED in this pass.
-- - black-sea-coast-russia: NOT RESEARCHED in this pass.
-- - karelia-lakes-pike: NOT RESEARCHED in this pass.
-- - lake-ladoga-salmon: NOT RESEARCHED in this pass.
-- - amur-river-kaluga: Rosrybolovstvo and Garant pages found are the Far East basin fishing rules as PDFs/long legal documents; kaluga/sturgeon prohibition is already in the existing regulations and could not be confirmed from a readable official page in this pass.
--

UPDATE public.spots SET access = '{"boat":true,"notes":"Rosrybolovstvo''s Volga-Caspian administration states that amateur fishing on public water bodies in Astrakhan Oblast is free and needs no permit, but fishing is prohibited across the region from 16 May to 20 June (except within settlement boundaries). Sturgeon species are prohibited. Fishing is not allowed in the Volga pre-mouth protected area, on sturgeon and other spawning grounds, in hydro-facility safety zones or in registered shipping channels, and nets, traps and similar gear are banned. Check the current Volga-Caspian basin rules and species bans before fishing.","sourceUrl":"https://vktu.fish.gov.ru/pravila-rybolovstva/pamyatka-dlya-rybolova-lyubitelya/"}'::jsonb, regulations = '["No general recreational licence is required on public water bodies in Astrakhan Oblast","Amateur fishing is prohibited across the region from 16 May to 20 June (except within settlement boundaries), and sturgeon are strictly protected — targeting or keeping them is a serious offence","Prohibited zones include the Volga pre-mouth protected area, spawning grounds, hydro-facility safety zones and shipping channels; some delta channels are within protected reserves — check the current Volga-Caspian rules"]'::jsonb, updated_at = now() WHERE slug = 'volga-delta-catfish';

