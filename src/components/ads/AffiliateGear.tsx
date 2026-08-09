import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, ExternalLink, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackAffiliateClick } from "@/lib/affiliate";
import { loadOneLinkScript } from "@/lib/onelink";
import { gearCtaLabel, gearImage, priceBand, rankGear } from "@/lib/gear";

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

export interface GearRowProduct {
  title: string;
  price: number | null;
  image_url: string | null;
  merchant: string | null;
  category: string | null;
}

/**
 * The visual body of one gear row, without the link or the click tracking.
 *
 * Exported so /admin/affiliate can preview a product exactly as it will appear
 * on a spot page. Keeping one component means the admin preview cannot show a
 * band or an image the live card would not.
 */
export const GearRow = ({ product }: { product: GearRowProduct }) => {
  const band = priceBand(product.price);
  return (
    <>
      <img
        src={gearImage(product)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={56}
        height={56}
        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
          {product.title}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          {band && <span className="font-semibold text-foreground/80">{band}</span>}
          {band && <span aria-hidden="true">·</span>}
          <span className="truncate">{gearCtaLabel(product.merchant)}</span>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0" />
    </>
  );
};

interface AffiliateGearProps {
  /**
   * Water types to match against — one for a spot page, several for a country
   * hub where the country spans freshwater, saltwater and fly water.
   */
  waterTypes?: string[];
  /** Spot species, matched against product tags for ranking */
  species?: string[];
  limit?: number;
  /** Heading override — country hubs say something broader than "this spot". */
  heading?: string;
  blurb?: string;
}

/**
 * Renders admin-curated affiliate products (Amazon, ClickBank, …) as a
 * "Shop Gear" card. Products tagged to match the spot's water type or species
 * rank first; falls back to the newest active products. Renders nothing when
 * the catalog is empty. Every click is recorded in affiliate_clicks (for the
 * /admin/affiliate dashboard) and as a GA event.
 *
 * No numeric price is ever rendered here — see the PRICE_BANDS comment in
 * src/lib/gear.ts for why, and do not "restore" one.
 */
export const AffiliateGear = ({
  waterTypes = [],
  species = [],
  limit = 4,
  heading = "Shop Gear",
  blurb = "Hand-picked gear for this spot. We may earn a commission on purchases.",
}: AffiliateGearProps) => {
  const { user } = useAuth();

  const { data: products } = useQuery({
    queryKey: ["affiliate-gear"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<GearProduct[]> => {
      const { data, error } = await supabase
        .from("affiliate_products")
        .select("id, title, description, price, image_url, affiliate_url, merchant, category, tags")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // OneLink rewrites our amazon.com links to the visitor's local store at click
  // time. Only pull the script in once there are actually links to rewrite.
  const hasAmazonProduct = products?.some((p) => p.merchant === "amazon") ?? false;
  useEffect(() => {
    if (hasAmazonProduct) loadOneLinkScript();
  }, [hasAmazonProduct]);

  if (!products?.length) return null;

  const shown = rankGear(products, { waterTypes, species }).slice(0, limit);

  const handleClick = async (p: GearProduct) => {
    trackAffiliateClick(p.merchant ?? "unknown", p.id, { title: p.title });
    // Fire-and-forget; never block the outbound navigation on this insert.
    supabase
      .from("affiliate_clicks")
      .insert({ product_id: p.id, user_id: user?.id ?? null })
      .then(({ error }) => {
        if (error) console.error("affiliate click insert failed:", error.message);
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl p-6 border border-border/50"
    >
      <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-accent" />
        {heading}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">{blurb}</p>
      <div className="space-y-3">
        {shown.map((p) => (
          <a
            key={p.id}
            href={p.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => handleClick(p)}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-accent/50 hover:bg-muted/50 transition-colors group"
          >
            <GearRow product={p} />
          </a>
        ))}
      </div>
      <Link
        to="/gear"
        className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
      >
        See all gear
        <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  );
};

export default AffiliateGear;
