/**
 * Lightweight visitor-location helpers.
 *
 * Country is inferred from the browser's IANA timezone (and locale as a
 * fallback). This needs no network call, no third-party IP lookup and no
 * permission prompt, so it carries no privacy cost.
 *
 * Precise coordinates are only ever obtained via the Geolocation API, which
 * the user must explicitly trigger and approve.
 */

/** IANA timezone prefix/exact match → ISO country code. */
const TIMEZONE_COUNTRY: Record<string, string> = {
  "Australia/": "AU",
  "Pacific/Auckland": "NZ",
  "Pacific/Chatham": "NZ",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Regina": "CA",
  "America/Moncton": "CA",
  "America/Whitehorse": "CA",
  "America/Yellowknife": "CA",
  "America/": "US", // remaining US zones; checked after the Canadian entries
  "Europe/London": "GB",
  "Europe/Belfast": "GB",
  "Europe/Dublin": "IE",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Oslo": "NO",
  "Europe/Stockholm": "SE",
  "Europe/Helsinki": "FI",
  "Europe/Warsaw": "PL",
  "Europe/Moscow": "RU",
  "Africa/Johannesburg": "ZA",
  "America/Argentina/": "AR",
  "America/Sao_Paulo": "BR",
  "America/Mexico_City": "MX",
  "Asia/Tokyo": "JP",
};

/** Rough country centroids, used to order spots before precise coords exist. */
export const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AU: { lat: -25.3, lng: 133.8 },
  US: { lat: 39.8, lng: -98.6 },
  CA: { lat: 56.1, lng: -106.3 },
  NZ: { lat: -41.5, lng: 172.8 },
  GB: { lat: 54.0, lng: -2.0 },
};

/** Raw IANA timezone, or "" when unavailable. */
export const getVisitorTimezone = (): string => {
  if (typeof Intl === "undefined") return "";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

/**
 * Country from timezone alone. Returns null when the zone is not in the map.
 *
 * Deliberately has no locale fallback: a very large share of non-US users
 * browse with `navigator.language === "en-US"` (the Windows default), so
 * trusting locale misidentifies them as American. Use this wherever a wrong
 * answer is worse than no answer — measurement units, for instance.
 */
export const getVisitorCountryStrict = (): string | null => {
  const tz = getVisitorTimezone();
  if (!tz) return null;

  // Exact matches first, then prefixes (longest wins, so "America/Toronto"
  // beats the generic "America/" → US entry).
  if (TIMEZONE_COUNTRY[tz]) return TIMEZONE_COUNTRY[tz];

  const prefixes = Object.keys(TIMEZONE_COUNTRY)
    .filter((k) => k.endsWith("/") && tz.startsWith(k))
    .sort((a, b) => b.length - a.length);

  return prefixes.length > 0 ? TIMEZONE_COUNTRY[prefixes[0]] : null;
};

/**
 * Best-effort country, falling back to the locale region.
 *
 * Fine for soft personalisation like pre-selecting a country filter, where a
 * wrong guess is harmless and the user can simply change it.
 */
export const getVisitorCountry = (): string | null => {
  const fromTimezone = getVisitorCountryStrict();
  if (fromTimezone) return fromTimezone;

  const locale = typeof navigator !== "undefined" ? navigator.language : "";
  const region = locale?.split("-")[1];
  return region ? region.toUpperCase() : null;
};

/** Great-circle distance in kilometres. */
export const distanceKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const formatDistance = (km: number): string =>
  km >= 100 ? `${Math.round(km).toLocaleString()} km` : `${km.toFixed(0)} km`;

/** Prompts for precise location. Only call from a user gesture. */
export const requestPreciseLocation = (): Promise<{ lat: number; lng: number }> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
