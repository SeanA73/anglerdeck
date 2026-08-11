import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackAffiliateClick } from "@/lib/affiliate";
import { loadOneLinkScript } from "@/lib/onelink";
import { gearCtaLabel, gearImage, priceBand } from "@/lib/gear";

interface GearProduct {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  affiliate_url: string;
  merchant: string | null;
  category: string | null;
  tags: string[] | null;
}

/** Readable headings for the category slugs stored on each product. */
const CATEGORY_LABELS: Record<string, string> = {
  rods: "Rods",
  combos: "Rod & reel combos",
  reels: "Reels",
  lures: "Lures",
  flies: "Flies",
  line: "Line & leader",
  apparel: "Clothing & eyewear",
  electronics: "Electronics",
  tackle: "Tackle",
  tools: "Tools",
  storage: "Storage & packs",
};

const categoryLabel = (category: string | null): string =>
  CATEGORY_LABELS[String(category ?? "").toLowerCase().trim()] ??
  (category ? category.charAt(0).toUpperCase() + category.slice(1) : "Other gear");

/**
 * /gear — the full affiliate catalog, grouped by category.
 *
 * The same compliance rules as the spot-page card apply: no numeric price
 * (see PRICE_BANDS in src/lib/gear.ts), local category artwork rather than
 * hotlinked Amazon images, and the Associates disclosure on the page as well as
 * in the footer.
 *
 * Prerendered by scripts/prerender.mjs so it is crawlable for gear-intent
 * queries — keep the two in step when the structure changes.
 */
const Gear = () => {
  const { user } = useAuth();

  const { data: products, isLoading } = useQuery({
    queryKey: ["gear-catalog"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<GearProduct[]> => {
      const { data, error } = await supabase
        .from("affiliate_products")
        .select("id, title, description, price, image_url, affiliate_url, merchant, category, tags")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const hasAmazonProduct = products?.some((p) => p.merchant === "amazon") ?? false;
  useEffect(() => {
    if (hasAmazonProduct) loadOneLinkScript();
  }, [hasAmazonProduct]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, GearProduct[]>();
    for (const p of products ?? []) {
      const key = String(p.category ?? "").toLowerCase().trim();
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(p);
    }
    return [...byCategory.entries()].sort((a, b) =>
      categoryLabel(a[0]).localeCompare(categoryLabel(b[0]))
    );
  }, [products]);

  const handleClick = (p: GearProduct) => {
    trackAffiliateClick(p.merchant ?? "unknown", p.id, { title: p.title, surface: "gear_page" });
    supabase
      .from("affiliate_clicks")
      .insert({ product_id: p.id, user_id: user?.id ?? null })
      .then(({ error }) => {
        if (error) console.error("affiliate click insert failed:", error.message);
      });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Keep in step with the /gear entry in scripts/static-routes.mjs — that
          copy is what crawlers read. No price claims in either. */}
      <SEO
        title="Fishing Gear We Recommend"
        description="The rods, reels, lures, line and clothing we point anglers at, grouped by category. Affiliate links — we may earn a commission."
        canonicalPath="/gear"
      />
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-4 lg:px-8 py-12 pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-accent" />
            Fishing Gear
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Gear we point anglers at, grouped by what it is. Every spot page
            surfaces the items that suit its water and species — this is the
            whole list.
          </p>
          <p className="text-sm text-muted-foreground/80 max-w-3xl mt-4">
            These are affiliate links: as an Amazon Associate, AnglerDeck earns
            from qualifying purchases, at no extra cost to you. We show a price
            band rather than a figure, because we have no live price feed and a
            stale number would be worse than none — check the current price on
            the merchant's own page.
          </p>
        </motion.div>

        {isLoading && <p className="mt-12 text-muted-foreground">Loading gear…</p>}

        {!isLoading && grouped.length === 0 && (
          <p className="mt-12 text-muted-foreground">
            Nothing in the gear list right now. In the meantime,{" "}
            <Link to="/spots" className="text-accent hover:underline">
              browse the fishing spots
            </Link>
            .
          </p>
        )}

        {grouped.map(([category, items]) => (
          <section key={category} className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {categoryLabel(category)}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((p) => {
                const band = priceBand(p.price);
                return (
                  <a
                    key={p.id}
                    href={p.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => handleClick(p)}
                    className="group flex gap-4 p-5 rounded-xl border border-border/50 bg-card hover:border-accent/50 transition-colors"
                  >
                    <img
                      src={gearImage(p)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-lg flex-shrink-0 bg-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {p.title}
                      </h3>
                      {p.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                          {p.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        {band && <span className="font-semibold text-foreground/80">{band}</span>}
                        {band && <span aria-hidden="true">·</span>}
                        <span>{gearCtaLabel(p.merchant)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ))}

        <p className="mt-16 text-sm text-muted-foreground">
          Nothing here is a lab test or a ranked review — it is gear we are
          comfortable pointing at. Check the merchant's page for the current
          price, specification and availability before you buy.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default Gear;
