-- Seed the affiliate product catalog — Amazon Associates tag anglerdeck-20 (2026-07-27)
--
-- Requires 20260727e_affiliate_url_unique.sql (unique index on affiliate_url),
-- which gives ON CONFLICT a target so this script is safely re-runnable.
--
-- Prices are point-in-time (27 Jul 2026) and will drift; they are display-only
-- hints on the gear card, not checkout values. Refresh occasionally, or leave
-- price NULL if you would rather not show a figure that can go stale.
--
-- `tags` drive placement: AffiliateGear ranks products whose tags/category
-- match the spot's type ('freshwater' | 'saltwater' | 'fly fishing') or its
-- species names, all lowercase.

INSERT INTO public.affiliate_products
  (title, description, price, image_url, affiliate_url, merchant, category, tags, is_active)
VALUES
  ('KastKing SuperPower Braided Fishing Line',
   'Abrasion-resistant braid with near-zero stretch and a small diameter for longer casts. Available in a wide range of breaking strains for both light freshwater and heavy saltwater work.',
   11.03, 'https://m.media-amazon.com/images/I/81SWLMsvXoL._AC_UL320_.jpg',
   'https://www.amazon.com/dp/B01EFQZC6G?tag=anglerdeck-20',
   'amazon', 'line', ARRAY['freshwater','saltwater','bass','pike','snapper'], true),

  ('ANCHOR Floating Polarized Fishing Sunglasses',
   'Polarized lenses cut surface glare so you can read structure and spot fish, and the frames float if they go overboard.',
   35.00, 'https://m.media-amazon.com/images/I/61UTGwjMJtL._AC_UL320_.jpg',
   'https://www.amazon.com/dp/B0G26912RD?tag=anglerdeck-20',
   'amazon', 'apparel', ARRAY['freshwater','saltwater','fly fishing'], true),

  ('KastKing SteelStream 6-Piece Fishing Tool Kit',
   'Corrosion-resistant pliers, line cutters, scissors and hook remover with lanyards — the tools you actually reach for on every session.',
   25.58, 'https://m.media-amazon.com/images/I/71lyZLL1IQL._AC_UL320_.jpg',
   'https://www.amazon.com/dp/B0CNCYJHG5?tag=anglerdeck-20',
   'amazon', 'tools', ARRAY['freshwater','saltwater','fly fishing'], true),

  ('Piscifun 42L Fishing Tackle Backpack',
   'Water-resistant 42-litre pack with rod holders and room for four tackle trays. Built for walking into spots rather than fishing off the tailgate.',
   47.49, 'https://m.media-amazon.com/images/I/81KRjHpqUsL._AC_UL320_.jpg',
   'https://www.amazon.com/dp/B09T96YDJH?tag=anglerdeck-20',
   'amazon', 'storage', ARRAY['freshwater','saltwater','fly fishing'], true),

  ('PLUSINNO Telescopic Rod and Reel Combo',
   'Carbon fibre telescopic rod with a matched spinning reel — collapses small enough for a daypack, which makes it a sensible travel or backup outfit.',
   31.32, 'https://m.media-amazon.com/images/I/61vRldK4+8S._AC_UY218_.jpg',
   'https://www.amazon.com/dp/B07FVL7NK2?tag=anglerdeck-20',
   'amazon', 'combos', ARRAY['freshwater','bass','trout','perch'], true),

  ('Freshwater Lure Kit for Bass and Trout',
   'Mixed tackle kit of soft plastics, spinners, hooks and jig heads covering most freshwater situations — a cheap way to fill gaps in the box.',
   11.96, 'https://m.media-amazon.com/images/I/91QIBR7+qtS._AC_UL320_.jpg',
   'https://www.amazon.com/dp/B08DY9NGQV?tag=anglerdeck-20',
   'amazon', 'lures', ARRAY['freshwater','bass','trout','pike','perch'], true),

  ('KastKing Sharky Saltwater Spinning Reel',
   'Sealed, corrosion-resistant spinning reel with a strong drag — sized for surf, rock and inshore boat fishing where salt and grit kill lesser reels.',
   54.37, 'https://m.media-amazon.com/images/I/71RQeMLSjUL._AC_UY218_.jpg',
   'https://www.amazon.com/dp/B077JY28L4?tag=anglerdeck-20',
   'amazon', 'reels', ARRAY['saltwater','snapper','tuna','kingfish','barramundi'], true),

  ('BASSDASH Assorted Trout Flies — 64 Piece Kit',
   'Dry flies, nymphs, streamers and wet flies in a slotted-foam box. A solid starting selection for rivers and stillwaters.',
   23.98, 'https://m.media-amazon.com/images/I/819VVpk-OGL._AC_UL320_.jpg',
   'https://www.amazon.com/dp/B07CMY48MH?tag=anglerdeck-20',
   'amazon', 'flies', ARRAY['fly fishing','trout','grayling','salmon'], true),

  ('TIDEWE Waterproof Chest Waders',
   'Bootfoot chest waders for wading rivers and stillwaters in cold water — the difference between fishing the far bank and looking at it.',
   33.99, 'https://m.media-amazon.com/images/I/61OIirlNIyL._AC_UL320_.jpg',
   'https://www.amazon.com/dp/B07J4N9TM5?tag=anglerdeck-20',
   'amazon', 'apparel', ARRAY['fly fishing','freshwater','trout','salmon'], true)

ON CONFLICT (affiliate_url) DO NOTHING;
