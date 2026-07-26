import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FishingSpot, resolveSpotImage } from "@/data/spots";

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
  sponsored: row.sponsored ?? false,
  sponsoredUrl: row.sponsored_url ?? undefined,
});

export const useSpots = () =>
  useQuery({
    queryKey: ["spots"],
    queryFn: async (): Promise<FishingSpot[]> => {
      // `spots` is not yet in the generated Supabase types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("spots")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      return ((data ?? []) as SpotRow[]).map(mapRow);
    },
    staleTime: 1000 * 60 * 60, // 1 hour — catalog changes rarely
    gcTime: 1000 * 60 * 60 * 2,
  });

export const useSpotBySlug = (slug: string) => {
  const query = useSpots();
  return {
    ...query,
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
