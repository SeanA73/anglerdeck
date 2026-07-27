import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackAffiliateClick } from "@/lib/affiliate";

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

interface AffiliateGearProps {
  /** Spot type ('Freshwater' | 'Saltwater' | 'Fly Fishing') used to rank matching products */
  spotType?: string;
  /** Spot species, matched against product tags for ranking */
  species?: string[];
  limit?: number;
}

/**
 * Renders admin-curated affiliate products (Amazon, ClickBank, …) as a
 * "Shop Gear" card. Products tagged to match the spot's type or species rank
 * first; falls back to the newest active products. Renders nothing when the
 * catalog is empty. Every click is recorded in affiliate_clicks (for the
 * /admin/affiliate dashboard) and as a GA event.
 */
export const AffiliateGear = ({ spotType, species = [], limit = 4 }: AffiliateGearProps) => {
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

  if (!products?.length) return null;

  const wanted = new Set(
    [spotType, ...species].filter(Boolean).map((s) => String(s).toLowerCase())
  );
  const score = (p: GearProduct) => {
    const haystack = [...(p.tags ?? []), p.category ?? ""].map((t) => t.toLowerCase());
    return haystack.filter((t) => wanted.has(t)).length;
  };
  const shown = [...products].sort((a, b) => score(b) - score(a)).slice(0, limit);

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
        Shop Gear
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Hand-picked gear for this spot. We may earn a commission on purchases.
      </p>
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
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.title}
                loading="lazy"
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                {p.title}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {p.price != null && <span className="font-semibold">${p.price}</span>}
                {p.merchant && <span className="capitalize">{p.merchant.replace(/_/g, " ")}</span>}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent flex-shrink-0" />
          </a>
        ))}
      </div>
    </motion.div>
  );
};

export default AffiliateGear;
