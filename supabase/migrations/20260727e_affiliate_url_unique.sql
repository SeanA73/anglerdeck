-- Make affiliate_products.affiliate_url unique.
--
-- Why: the catalog is loaded by re-runnable INSERT scripts and by the
-- /admin/affiliate bulk importer, both of which key on the normalized Amazon
-- URL (https://www.amazon.com/dp/<ASIN>?tag=anglerdeck-20). Without a unique
-- index there is no conflict target, so `ON CONFLICT DO NOTHING` is a no-op
-- and re-running a seed script silently duplicates every product.
--
-- After this migration, catalog inserts can safely use:
--   INSERT INTO public.affiliate_products (...) VALUES (...)
--   ON CONFLICT (affiliate_url) DO NOTHING;

-- NOTE: this will fail if duplicate affiliate_url values already exist.
-- To find them first:
--   SELECT affiliate_url, count(*), array_agg(id ORDER BY created_at)
--   FROM public.affiliate_products
--   GROUP BY affiliate_url HAVING count(*) > 1;
-- Resolve by hand (keep the oldest, delete the rest) before re-running.

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_products_affiliate_url_key
  ON public.affiliate_products (affiliate_url);
