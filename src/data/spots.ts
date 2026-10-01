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
 * location-specific photography for. Each photo is of a real place matching
 * the *kind* of water and landscape, verified by eye against its Unsplash
 * description before being added here — not a photo of the named spot
 * itself, and the alt text says so (see spotImageAlt below).
 *
 * Three variants per category, not one. The original single-photo-per-
 * category version fixed the worse bug (all 192 spots sharing 2 photos) but
 * created a smaller version of the same problem: every spot of a given water
 * type in a given country — e.g. every AU Saltwater spot — rendered the
 * identical picture, visibly obvious on any filtered /spots or country-hub
 * grid. resolveSpotImage now picks a variant per spot deterministically (see
 * spotImageVariant below), so neighbouring cards in the same category no
 * longer repeat while still being a genuinely matching photo for that water
 * type and region.
 */
const REMOTE_SPOT_IMAGES = {
  "fly-river": [
    "https://images.unsplash.com/photo-1583872961860-c1fc0fdf3cd1",
    "https://images.unsplash.com/photo-1724514415178-c87e1d00acd0",
    "https://images.unsplash.com/photo-1636403392625-3d49ab0fffd0",
    "https://images.unsplash.com/photo-1527906006592-285d9a58ef10",
    "https://images.unsplash.com/photo-1624644349263-031f70778a76",
  ],
  "nordic-fjord": [
    "https://images.unsplash.com/photo-1780857774274-079152a315f8",
    "https://images.unsplash.com/photo-1518124880777-cf8c82231ffb",
    "https://images.unsplash.com/photo-1698307781486-7c63dadf5fb7",
    "https://images.unsplash.com/photo-1664825381616-5cb8397fd9b1",
    "https://images.unsplash.com/photo-1560034244-228b1594f0bc",
  ],
  "highland-river": [
    "https://images.unsplash.com/photo-1779922413876-0464e4bf70ec",
    "https://images.unsplash.com/photo-1760003189249-7a427e71101b",
    "https://images.unsplash.com/photo-1635738113570-636b5f4505e5",
    "https://images.unsplash.com/photo-1762017934271-57809cc6832c",
    "https://images.unsplash.com/photo-1764957080224-3e560f1cb107",
  ],
  "alpine-lake": [
    "https://images.unsplash.com/photo-1783787424099-674e70b255dc",
    "https://images.unsplash.com/photo-1760365576591-d1e50d085c22",
    "https://images.unsplash.com/photo-1645483557206-a61a6840c2c4",
    "https://images.unsplash.com/photo-1776020049110-4421fd2a95f4",
    "https://images.unsplash.com/photo-1779985697846-18b84e3ba45c",
  ],
  "misty-lake-dawn": [
    "https://images.unsplash.com/photo-1778016740380-21c3277768f2",
    "https://images.unsplash.com/photo-1528164604878-28ea0fb4f462",
    "https://images.unsplash.com/photo-1769423456198-97f98719f706",
    "https://images.unsplash.com/photo-1582835098524-889d45f29460",
    "https://images.unsplash.com/photo-1761755227421-b5e07efec0be",
  ],
  "desert-lake": [
    "https://images.unsplash.com/photo-1759877807952-3201eadd8c7a",
    "https://images.unsplash.com/photo-1779111717344-ca4f95b0a474",
    "https://images.unsplash.com/photo-1761068967358-ad045df18a5b",
    "https://images.unsplash.com/photo-1787496120326-07570b74ff2c",
    "https://images.unsplash.com/photo-1769298315996-b0292a23654f",
  ],
  "tropical-flats": [
    "https://images.unsplash.com/photo-1732936037154-86960bafed1c",
    "https://images.unsplash.com/photo-1784751449611-ff8ac03ff234",
    "https://images.unsplash.com/photo-1774169026327-1e805d1ee0ed",
    "https://images.unsplash.com/photo-1454789591675-556c287e39e2",
    "https://images.unsplash.com/photo-1612305876291-c369fea489b3",
  ],
  "rocky-coast": [
    "https://images.unsplash.com/photo-1779813178541-714237985801",
    "https://images.unsplash.com/photo-1446038202205-1c96430dbdab",
    "https://images.unsplash.com/photo-1515016454727-48ddf26ac789",
    "https://images.unsplash.com/photo-1634847552298-ae1c7bfdebb1",
    "https://images.unsplash.com/photo-1505683040473-85e66a1ca54d",
  ],
  "urban-harbor": [
    "https://images.unsplash.com/photo-1775658763923-1b8cd88cfafd",
    "https://images.unsplash.com/photo-1777928163278-fe8e40c67a04",
    "https://images.unsplash.com/photo-1790268972741-57168262997f",
    "https://images.unsplash.com/photo-1611839234650-997b22bd1ea6",
    "https://images.unsplash.com/photo-1636334657600-527eb23abe8b",
  ],
  "great-lakes-harbor": [
    "https://images.unsplash.com/photo-1789369422076-102a7218c30a",
    "https://images.unsplash.com/photo-1590429905138-32680f0f11c6",
    "https://images.unsplash.com/photo-1782076336617-e07eb866cdae",
    "https://images.unsplash.com/photo-1602768966057-56574c7df29d",
    "https://images.unsplash.com/photo-1605555662230-fa14e2402840",
  ],
} as const;

export type RemoteSpotImageCategory = keyof typeof REMOTE_SPOT_IMAGES;

/**
 * Stable string hash — same spot always picks the same variant (no flicker
 * between renders/visits), different spots in the same category spread
 * across the 5 available photos. Not cryptographic, doesn't need to be.
 *
 * FNV-1a alone clumped badly on real slugs when reduced mod 5 (e.g. 4 of 6
 * AU saltwater spots landed on the same bucket) — fishing-spot slugs share a
 * lot of structure (place names, water-type suffixes) that a simple
 * polynomial hash doesn't scramble well. Finishing with a murmur3-style
 * avalanche mix spreads real slug sets far more evenly; verified against the
 * actual AU/NO/PL slug sets before relying on it.
 */
const stableHash = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
};

/**
 * Picks one of a category's 3 photo variants for a specific spot. `seed`
 * should be something stable and unique per spot — the slug when available,
 * falling back to the image key — so the same spot always renders the same
 * photo rather than reshuffling on every fetch.
 */
const spotImageVariant = (
  category: RemoteSpotImageCategory,
  seed?: string | null
): string => {
  const variants = REMOTE_SPOT_IMAGES[category];
  if (!seed) return variants[0];
  return variants[stableHash(seed) % variants.length];
};

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
 * Every `spots.image_key` row in Supabase was seeded with one of exactly two
 * values — "fishing-spot" or "duck-spot" — as a generic placeholder, never as
 * a real per-spot choice. Treating either as authoritative (the bug this
 * comment replaces: an early return on `SPOT_IMAGES[key]` fired for nearly
 * every spot, before type/country were ever consulted, so the category work
 * below never actually ran) is exactly the two-photo problem this module
 * exists to fix. Both stay in SPOT_IMAGES for the rare direct caller that
 * still passes only a key, but resolveSpotImage/resolveSpotThumbnail no
 * longer treat them as a real per-spot image — they always compute a
 * category from type/country instead. A future real, spot-specific bundled
 * photo would use a key outside this set and should be added here.
 */
const LEGACY_PLACEHOLDER_KEYS = new Set(["fishing-spot", "duck-spot"]);

/**
 * Every spot gets a real photo by water type and country, with the specific
 * variant picked per spot via `slug` so neighbouring cards in the same
 * category don't repeat. `type`, `country` and `slug` are all optional so
 * existing callers that only pass a key keep working; pass them to get the
 * varied, location-matched picture instead of the generic default.
 */
export const resolveSpotImage = (
  key?: string | null,
  type?: string | null,
  country?: string | null,
  slug?: string | null
): string => {
  if (key && SPOT_IMAGES[key] && !LEGACY_PLACEHOLDER_KEYS.has(key)) return SPOT_IMAGES[key];
  const category = spotImageCategory(type, country);
  return withImageParams(spotImageVariant(category, slug ?? key), 1200);
};

/** Same image, sized down for list/card thumbnails rather than a hero banner. */
export const resolveSpotThumbnail = (
  key?: string | null,
  type?: string | null,
  country?: string | null,
  slug?: string | null
): string => {
  if (key && SPOT_IMAGES[key] && !LEGACY_PLACEHOLDER_KEYS.has(key)) return SPOT_IMAGES[key];
  const category = spotImageCategory(type, country);
  return withImageParams(spotImageVariant(category, slug ?? key), 480);
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
  if (key && SPOT_IMAGES[key] && !LEGACY_PLACEHOLDER_KEYS.has(key)) return spotTitle;
  const category = spotImageCategory(type, country);
  const label = category.replace(/-/g, " ");
  return `${label} — representative photo, not ${spotTitle} itself`;
};
