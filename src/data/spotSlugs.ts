/**
 * Build-time FALLBACK slug list for sitemap generation.
 *
 * The sitemap normally reads slugs live from the Supabase `spots` table
 * (see vite.config.ts). This list is only used if Supabase is unreachable
 * during a production build, so it does not need to be kept perfectly in sync.
 */
export const spotSlugs = [
  'sydney-harbour-kingfish',
  'port-phillip-bay-snapper',
  'cairns-black-marlin',
  'darwin-harbour-barramundi',
  'exmouth-ningaloo-flats',
  'great-lake-tasmania-trout',
  'murray-river-cod-yarrawonga',
  'coorong-mulloway-surf',
  'lake-jindabyne-trout',
  'hervey-bay-golden-trevally',
  'somerset-dam-bass',
  'albany-king-george-sound',
] as const;
