-- Amazon Associates image compliance (2026-08-10)
--
-- 20260727g_seed_affiliate_products.sql stored m.media-amazon.com URLs directly
-- in affiliate_products.image_url. The Operating Agreement does not allow that:
-- Amazon product images may only be displayed through short-lived URLs obtained
-- from their API, never stored and re-served. It is also fragile — those URLs
-- change without notice, so they were a broken-image risk on top of the policy
-- problem.
--
-- The site now renders local category artwork (src/assets/gear/*.svg, mapped in
-- src/lib/gear.ts) for every Amazon row, so nulling these breaks nothing
-- visually. src/lib/gear.ts additionally refuses to render an Amazon-hosted
-- image even if one is entered again by hand, so this migration cleans up the
-- rows that exist rather than being the only line of defence.
--
-- `price` is deliberately LEFT POPULATED. It is no longer displayed anywhere
-- public — the site shows an editorial band derived from it — but it is useful
-- internally and it is what a future Amazon Creators API swap would replace.
-- Do not null it, and do not start displaying it again.
--
-- image_url is kept in the schema for non-Amazon merchants, where hosting
-- rights are clear.
--
-- Scope check before running:
--   SELECT merchant, count(*) FILTER (WHERE image_url IS NOT NULL) AS with_image
--   FROM public.affiliate_products GROUP BY merchant;

UPDATE public.affiliate_products
SET image_url = NULL,
    updated_at = now()
WHERE merchant = 'amazon'
  AND image_url IS NOT NULL;

-- Expect zero rows after running:
--   SELECT id, title, image_url FROM public.affiliate_products
--   WHERE merchant = 'amazon' AND image_url IS NOT NULL;
