import fishingSpot from "@/assets/fishing-spot.jpg";
import duckSpot from "@/assets/duck-spot.jpg";

/**
 * Spot data now lives in the Supabase `spots` table (see
 * supabase/migrations/20260726_create_spots.sql). This module only holds the
 * shared type and the image-key → bundled asset mapping.
 *
 * Use the hooks in @/hooks/useSpots to read spots.
 */

/** Verified access details. Fields are optional — absent means "not verified". */
export interface SpotAccess {
  shore?: boolean;
  boat?: boolean;
  ramp?: string;
  parking?: string;
  walkIn?: string;
  facilities?: string[];
  notes?: string;
  /** Official source the details were verified against. */
  sourceUrl?: string;
}

export interface FishingSpot {
  id: number;
  slug: string;
  title: string;
  location: string;
  country: string;
  type: "Freshwater" | "Saltwater" | "Fly Fishing";
  species: string[];
  image: string;
  featured: boolean;
  description: string;
  coordinates: { lat: number; lng: number };
  waterTemperature: { current: number; unit: string; trend: "rising" | "falling" | "stable" };
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
  };
  tides: {
    nextHigh: string;
    nextLow: string;
    current: "incoming" | "outgoing" | "slack";
  };
  recommendedGear: {
    essential: string[];
    optional: string[];
  };
  bestTimes: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  regulations: string[];
  access?: SpotAccess;
  sponsored?: boolean;
  sponsoredUrl?: string;
}

const SPOT_IMAGES: Record<string, string> = {
  "fishing-spot": fishingSpot,
  "duck-spot": duckSpot,
};

export const resolveSpotImage = (key?: string | null): string =>
  SPOT_IMAGES[key ?? "fishing-spot"] ?? fishingSpot;
