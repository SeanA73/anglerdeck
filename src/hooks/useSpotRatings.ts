import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpotRating {
  average: number;
  count: number;
}

/**
 * Approved-review average and count per spot, batched into one query for the
 * whole /spots list rather than one query per card.
 *
 * Mirrors the "approved only" rule useSpotReviews and useSpots already
 * enforce: an author's own pending review must never move the public rating.
 * Fails to an empty map rather than throwing, since a rating badge is
 * decoration — a spot with no data here simply shows none, never "0.0".
 */
const fetchSpotRatings = async (): Promise<Map<number, SpotRating>> => {
  const { data, error } = await supabase
    .from("spot_reviews")
    .select("spot_id, rating")
    .eq("status", "approved");

  if (error) {
    console.warn(`[useSpotRatings] approved ratings unavailable (${error.message})`);
    return new Map();
  }

  const sums = new Map<number, { total: number; count: number }>();
  for (const row of data ?? []) {
    const entry = sums.get(row.spot_id) ?? { total: 0, count: 0 };
    entry.total += row.rating;
    entry.count += 1;
    sums.set(row.spot_id, entry);
  }

  const ratings = new Map<number, SpotRating>();
  for (const [spotId, { total, count }] of sums) {
    ratings.set(spotId, { average: total / count, count });
  }
  return ratings;
};

export const useSpotRatings = () =>
  useQuery({
    queryKey: ["spot-ratings"],
    queryFn: fetchSpotRatings,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
  });
