import fishingSpot from "@/assets/fishing-spot.jpg";
import duckSpot from "@/assets/duck-spot.jpg";

/**
 * Spot data now lives in the Supabase `spots` table (see
 * supabase/migrations/20260726_create_spots.sql). This module only holds the
 * shared type and the image-key → asset mapping.
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

/**
 * Real, free-license photos (Unsplash, hotlinked — their terms permit this,
 * no attribution required) standing in for the 192 spots we don't have
 * location-specific photography for. Each key is a real photo of a real
 * place matching the *kind* of water and landscape, verified by eye against
 * its Unsplash description before being added here — not a photo of the
 * named spot itself, and the alt text says so (see spotImageAlt below).
 *
 * This replaces two generic stock photos reused across all 192 spots with
 * ten, chosen by water type and region so a Norwegian fjord spot and a
 * Sonoran desert lake no longer render the same picture. It is a real,
 * disclosed improvement, not a claim that this is *the* spot.
 */
const REMOTE_SPOT_IMAGES = {
  "fly-river": "https://images.unsplash.com/photo-1583872961860-c1fc0fdf3cd1",
  "nordic-fjord": "https://images.unsplash.com/photo-1780857774274-079152a315f8",
  "highland-river": "https://images.unsplash.com/photo-1779922413876-0464e4bf70ec",
  "alpine-lake": "https://images.unsplash.com/photo-1783787424099-674e70b255dc",
  "misty-lake-dawn": "https://images.unsplash.com/photo-1778016740380-21c3277768f2",
  "desert-lake": "https://images.unsplash.com/photo-1759877807952-3201eadd8c7a",
  "tropical-flats": "https://images.unsplash.com/photo-1732936037154-86960bafed1c",
  "rocky-coast": "https://images.unsplash.com/photo-1779813178541-714237985801",
  "urban-harbor": "https://images.unsplash.com/photo-1775658763923-1b8cd88cfafd",
  "great-lakes-harbor": "https://images.unsplash.com/photo-1789369422076-102a7218c30a",
} as const;

export type RemoteSpotImageCategory = keyof typeof REMOTE_SPOT_IMAGES;

/** Unsplash's imgix params: fixed width, moderate quality, cropped to fill. */
const withImageParams = (url: string, width: number) =>
  `${url}?w=${width}&q=75&auto=format&fit=crop`;

/**
 * (country, type) → the closest of the ten real photos above. Countries not
 * listed fall through to a per-type default rather than guessing a region.
 * This is deliberately coarse — a country-level match, not a claim about the
 * specific spot — same spirit as gearScore()'s token matching: a real signal
 * used honestly, not stretched further than it supports.
 */
const COUNTRY_TYPE_IMAGE: Record<string, Partial<Record<string, RemoteSpotImageCategory>>> = {
  NO: { Saltwater: "nordic-fjord", "Fly Fishing": "highland-river", Freshwater: "nordic-fjord" },
  SE: { Saltwater: "nordic-fjord", Freshwater: "misty-lake-dawn", "Fly Fishing": "misty-lake-dawn" },
  FI: { Freshwater: "misty-lake-dawn", "Fly Fishing": "misty-lake-dawn", Saltwater: "nordic-fjord" },
  RU: { Freshwater: "misty-lake-dawn", "Fly Fishing": "highland-river", Saltwater: "rocky-coast" },
  GB: { "Fly Fishing": "highland-river", Freshwater: "highland-river", Saltwater: "rocky-coast" },
  DE: { Freshwater: "alpine-lake", "Fly Fishing": "fly-river", Saltwater: "rocky-coast" },
  FR: { Freshwater: "alpine-lake", "Fly Fishing": "fly-river", Saltwater: "rocky-coast" },
  IT: { Freshwater: "alpine-lake", Saltwater: "rocky-coast", "Fly Fishing": "fly-river" },
  ES: { Saltwater: "rocky-coast", Freshwater: "alpine-lake", "Fly Fishing": "fly-river" },
  PL: { Freshwater: "misty-lake-dawn", "Fly Fishing": "fly-river" },
  US: { Freshwater: "great-lakes-harbor", "Fly Fishing": "fly-river", Saltwater: "urban-harbor" },
  CA: { Freshwater: "alpine-lake", "Fly Fishing": "fly-river", Saltwater: "great-lakes-harbor" },
  MX: { Saltwater: "tropical-flats", Freshwater: "desert-lake" },
  AR: { Freshwater: "desert-lake", "Fly Fishing": "fly-river", Saltwater: "rocky-coast" },
  BR: { Saltwater: "tropical-flats", Freshwater: "tropical-flats" },
  AU: { Saltwater: "rocky-coast", Freshwater: "desert-lake", "Fly Fishing": "highland-river" },
  NZ: { "Fly Fishing": "fly-river", Freshwater: "alpine-lake", Saltwater: "rocky-coast" },
  JP: { Saltwater: "urban-harbor", Freshwater: "misty-lake-dawn", "Fly Fishing": "misty-lake-dawn" },
  ZA: { Saltwater: "rocky-coast", Freshwater: "desert-lake" },
};

const TYPE_DEFAULT: Record<string, RemoteSpotImageCategory> = {
  "Fly Fishing": "fly-river",
  Freshwater: "misty-lake-dawn",
  Saltwater: "rocky-coast",
};

/** Picks a category for a spot lacking a bundled image. Never throws. */
export const spotImageCategory = (
  type?: string | null,
  country?: string | null
): RemoteSpotImageCategory => {
  const byCountry = country ? COUNTRY_TYPE_IMAGE[country]?.[type ?? ""] : undefined;
  return byCountry ?? TYPE_DEFAULT[type ?? ""] ?? "misty-lake-dawn";
};

/**
 * Every spot without a bundled local image (i.e. every spot today — the two
 * bundled photos are legacy) gets a real photo by water type and country.
 * `type` and `country` are optional so existing callers that only pass a key
 * keep working; pass them to get the varied, location-matched picture.
 */
export const resolveSpotImage = (
  key?: string | null,
  type?: string | null,
  country?: string | null
): string => {
  if (key && SPOT_IMAGES[key]) return SPOT_IMAGES[key];
  const category = spotImageCategory(type, country);
  return withImageParams(REMOTE_SPOT_IMAGES[category], 1200);
};

/** Same image, sized down for list/card thumbnails rather than a hero banner. */
export const resolveSpotThumbnail = (
  key?: string | null,
  type?: string | null,
  country?: string | null
): string => {
  if (key && SPOT_IMAGES[key]) return SPOT_IMAGES[key];
  const category = spotImageCategory(type, country);
  return withImageParams(REMOTE_SPOT_IMAGES[category], 480);
};

/**
 * Given an already-resolved `spot.image` (what every list card actually has),
 * re-requests it at card size instead of hero size. Bundled local assets
 * (imported, so never contain a query string) pass through unchanged — only
 * the hotlinked Unsplash URLs are resized. Replaces, not appends: a previous
 * pass in a couple of card components appended a second `w=`/`h=` to
 * whatever resolveSpotImage already set, which produced duplicate params
 * that just left the first one live.
 */
export const shrinkForCard = (image: string, width = 480): string => {
  if (!image.includes("unsplash.com")) return image;
  const [base] = image.split("?");
  return withImageParams(base, width);
};

/**
 * Disclosed alt text — never implies this is a photo of the spot itself.
 * `CLAUDE.md` rule 1 ("never invent facts about a place") is about verified
 * claims, but the same honesty applies to imagery: a real photo of a
 * different, similar place must not be captioned as if it were this one.
 */
export const spotImageAlt = (
  spotTitle: string,
  key?: string | null,
  type?: string | null,
  country?: string | null
): string => {
  if (key && SPOT_IMAGES[key]) return spotTitle;
  const category = spotImageCategory(type, country);
  const label = category.replace(/-/g, " ");
  return `${label} — representative photo, not ${spotTitle} itself`;
};
