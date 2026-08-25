import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FishingSpot, SpotAccess, resolveSpotImage } from "@/data/spots";
// The same gate the build uses — scripts/prerender.mjs decides which pages to
// write with this function, vite.config.ts decides the sitemap with it, and this
// hook decides what the client renders and links to. Importing it rather than
// restating the rule is the point: a spot the build refused to publish must not
// appear in a list, a map or a search result either.
import { isPublished } from "../../scripts/spot-quality.mjs";

interface SpotRow {
  id: number;
  slug: string;
  title: string;
  location: string;
  country: string;
  type: FishingSpot["type"];
  species: string[];
  image_key: string;
  featured: boolean;
  description: string;
  coordinates: FishingSpot["coordinates"];
  water_temperature: FishingSpot["waterTemperature"];
  weather: FishingSpot["weather"];
  tides: FishingSpot["tides"];
  recommended_gear: FishingSpot["recommendedGear"];
  best_times: string[];
  difficulty: FishingSpot["difficulty"];
  regulations: string[];
  access: SpotAccess | null;
  sponsored: boolean | null;
  sponsored_url: string | null;
}

const mapRow = (row: SpotRow): FishingSpot => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  location: row.location,
  country: row.country,
  type: row.type,
  species: row.species ?? [],
  image: resolveSpotImage(row.image_key),
  featured: row.featured,
  description: row.description,
  coordinates: row.coordinates,
  waterTemperature: row.water_temperature,
  weather: row.weather,
  tides: row.tides,
  recommendedGear: row.recommended_gear,
  bestTimes: row.best_times ?? [],
  difficulty: row.difficulty,
  regulations: row.regulations ?? [],
  access: row.access ?? undefined,
  sponsored: row.sponsored ?? false,
  sponsoredUrl: row.sponsored_url ?? undefined,
});

interface SpotCatalog {
  /** Every spot in the database, published or not. */
  all: FishingSpot[];
  /** Spots that pass the publication gate — the only ones a public surface may show. */
  published: FishingSpot[];
}

/**
 * Approved review counts, which the gate scores at +2 (and +1 more at three).
 *
 * This is the fifth read path that has to filter `status`, and there is no
 * central chokepoint for that — RLS returns approved rows *plus the viewer's
 * own* whatever its state, so an unfiltered count here would let an author's
 * own pending review publish a spot for them alone.
 *
 * Returns null if the count is unavailable, which the caller treats as "do not
 * filter" rather than "zero". Zero would be the stricter guess and the wrong
 * one: it would hide spots the build published and 404 pages that exist in
 * dist/ and in the sitemap, which is the one inconsistency worth avoiding. Over-
 * showing during an outage is recoverable; contradicting the built site is not.
 */
const fetchApprovedReviewCounts = async (): Promise<Map<number, number> | null> => {
  const { data, error } = await supabase
    .from("spot_reviews")
    .select("spot_id")
    .eq("status", "approved");

  if (error) {
    // A 400 here means 20260802_add_review_moderation.sql has not been applied.
    console.warn(
      `[useSpots] approved review counts unavailable (${error.message}) — ` +
        "showing every spot rather than hiding ones the build published"
    );
    return null;
  }

  const counts = new Map<number, number>();
  for (const row of data ?? []) {
    counts.set(row.spot_id, (counts.get(row.spot_id) ?? 0) + 1);
  }
  return counts;
};

const loadCatalog = async (): Promise<SpotCatalog> => {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  // jsonb columns come back as `Json`; SpotRow narrows them to their shapes.
  const rows = (data ?? []) as unknown as SpotRow[];

  const reviewCounts = await fetchApprovedReviewCounts();
  // The gate reads snake_case, so score the raw rows before mapRow renames them.
  const published = rows.filter(
    (row) =>
      reviewCounts === null ||
      isPublished({ ...row, reviewCount: reviewCounts.get(row.id) ?? 0 })
  );

  return { all: rows.map(mapRow), published: published.map(mapRow) };
};

// Module-level so the react-query `select` identity is stable across renders.
const selectPublished = (catalog: SpotCatalog) => catalog.published;
const selectAll = (catalog: SpotCatalog) => catalog.all;

const useSpotCatalog = <T,>(select: (catalog: SpotCatalog) => T) =>
  useQuery({
    queryKey: ["spots"],
    queryFn: loadCatalog,
    select,
    staleTime: 1000 * 60 * 60, // 1 hour — catalog changes rarely
    gcTime: 1000 * 60 * 60 * 2,
  });

/**
 * Published spots — the default, and what every public surface must use:
 * /spots, /map, country hubs, featured spots, search.
 *
 * **Important**: This hook is the SINGLE source of truth for public browsing
 * surfaces. It filters to ONLY published spots using the exact same
 * isPublished() gate used by the build process (scripts/prerender.mjs). This
 * ensures the frontend and server-side have zero disagreement about which
 * spots are actually published and can be publicly displayed.
 */
export const useSpots = () => useSpotCatalog(selectPublished);

/**
 * Every spot, including unpublished ones. **Not for public browse surfaces.**
 *
 * Only for screens that resolve a spot the user themselves already referenced —
 * a saved spot, a logged catch — where dropping the row would make the user's
 * own data look corrupted or lost. Those screens are auth-gated and noindexed,
 * they must not link through to an unpublished spot page (there isn't one), and
 * they should say why it is unavailable rather than silently omit it.
 *
 * **Important**: This hook is ONLY for auth-gated, private surfaces where the
 * user has explicitly saved or referenced a spot. It must NOT be used for any
 * public browse surfaces (CountryHub, Spots, MapView, FeaturedSpots, etc.).
 * Those surfaces must use `useSpots` exclusively.
 */
export const useAllSpots = () => useSpotCatalog(selectAll);

export const useSpotBySlug = (slug: string) => {
  const query = useSpots();
  return {
    ...query,
    // Unpublished slugs resolve to undefined, which is what makes SpotDetail
    // show its not-found page for a spot that has no published page.
    spot: query.data?.find((s) => s.slug === slug),
  };
};

export const useSpotById = (id?: number | null) => {
  const query = useSpots();
  return {
    ...query,
    spot: id == null ? undefined : query.data?.find((s) => s.id === id),
  };
};
