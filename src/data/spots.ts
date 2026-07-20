import fishingSpot from "@/assets/fishing-spot.jpg";
import duckSpot from "@/assets/duck-spot.jpg";

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
  sponsored?: boolean;
  sponsoredUrl?: string;
}

// Note: waterTemperature values are typical seasonal figures, not live readings.
// Live weather is fetched per-coordinates via useWeather (Open-Meteo); the static
// weather block below is only a fallback. Tide times are not available statically.

export const spots: FishingSpot[] = [
  {
    id: 1,
    slug: "sydney-harbour-kingfish",
    title: "Sydney Harbour Kingfish",
    location: "Sydney, NSW",
    country: "AU",
    type: "Saltwater",
    species: ["yellowtail kingfish", "bream", "flathead", "tailor"],
    image: fishingSpot,
    featured: true,
    description: "Australia's most famous harbour doubles as a serious kingfish fishery. Work the markers, moorings and washes from a boat or kayak, or chase bream and flathead from the countless wharves and flats inside the harbour.",
    coordinates: { lat: -33.8523, lng: 151.2108 },
    waterTemperature: { current: 17, unit: "°C", trend: "stable" },
    weather: {
      condition: "Partly Cloudy",
      temperature: 63,
      humidity: 60,
      windSpeed: 10,
      windDirection: "W"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Medium-heavy spin rod (PE2-3)", "Stickbaits and knife jigs", "Live squid or yakkas", "Fluorocarbon leader 40-60lb"],
      optional: ["Downrigger", "Kayak or boat", "Landing net", "Polarized sunglasses"]
    },
    bestTimes: ["Dawn tide changes", "Early morning (5-9 AM)", "Spring through autumn for kings"],
    difficulty: "Intermediate",
    regulations: ["NSW Recreational Fishing Fee required (18+)", "Kingfish minimum size and bag limits apply", "Check current NSW DPI Fisheries rules"]
  },
  {
    id: 2,
    slug: "port-phillip-bay-snapper",
    title: "Port Phillip Bay Snapper",
    location: "Melbourne, VIC",
    country: "AU",
    type: "Saltwater",
    species: ["snapper", "King George whiting", "flathead", "squid"],
    image: duckSpot,
    featured: false,
    description: "Melbourne's big bay fires from spring when snapper move in to spawn. Whiting, flathead and calamari keep the fishing going year-round, with launching ramps and land-based options right around the bay.",
    coordinates: { lat: -38.0900, lng: 144.8500 },
    waterTemperature: { current: 12, unit: "°C", trend: "stable" },
    weather: {
      condition: "Overcast",
      temperature: 55,
      humidity: 70,
      windSpeed: 12,
      windDirection: "SW"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["7ft medium spin rod", "Running sinker rigs", "Fresh squid and pilchards", "Berley"],
      optional: ["Sounder", "Squid jigs", "Rod holders", "Drift anchor"]
    },
    bestTimes: ["Snapper run (Oct-Dec)", "Dawn and dusk", "Light northerly mornings"],
    difficulty: "Beginner",
    regulations: ["Victorian Recreational Fishing Licence required", "Snapper size and bag limits apply", "Check current VFA rules"]
  },
  {
    id: 3,
    slug: "cairns-black-marlin",
    title: "Cairns Black Marlin Grounds",
    location: "Cairns, QLD",
    country: "AU",
    type: "Saltwater",
    species: ["black marlin", "Spanish mackerel", "coral trout", "yellowfin tuna"],
    image: fishingSpot,
    featured: true,
    description: "The waters off Cairns are the world's premier heavy-tackle black marlin fishery, with giants over 1,000lb taken each season along the reef edge. Inside the reef, coral trout and mackerel offer outstanding sport fishing.",
    coordinates: { lat: -16.7500, lng: 146.1000 },
    waterTemperature: { current: 24, unit: "°C", trend: "stable" },
    weather: {
      condition: "Sunny",
      temperature: 79,
      humidity: 65,
      windSpeed: 15,
      windDirection: "SE"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Heavy trolling outfit (37-60kg)", "Skirted lures and rigged baits", "Fighting harness", "Reef-safe sunscreen"],
      optional: ["Charter booking", "Outriggers", "Camera", "Seasickness tablets"]
    },
    bestTimes: ["Heavy tackle season (Sept-Dec)", "Reef fishing year-round", "Neap tides for reef species"],
    difficulty: "Advanced",
    regulations: ["No general QLD licence for tidal waters", "GBR Marine Park zoning applies — check zones", "Coral reef fin fish size/bag limits and closures apply"]
  },
  {
    id: 4,
    slug: "darwin-harbour-barramundi",
    title: "Darwin Harbour Barramundi",
    location: "Darwin, NT",
    country: "AU",
    type: "Saltwater",
    species: ["barramundi", "threadfin salmon", "mangrove jack", "queenfish"],
    image: duckSpot,
    featured: true,
    description: "Barra fishing on Darwin's doorstep. Work the creek mouths, rock bars and flats of the harbour arms for barramundi and threadfin, with the famous run-off season producing the Territory's best metre-plus fish.",
    coordinates: { lat: -12.4700, lng: 130.8300 },
    waterTemperature: { current: 26, unit: "°C", trend: "stable" },
    weather: {
      condition: "Sunny",
      temperature: 86,
      humidity: 55,
      windSpeed: 8,
      windDirection: "E"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Baitcast or spin combo (30-50lb braid)", "Hardbody lures 90-120mm", "Soft vibes", "Heavy mono leader 60-80lb"],
      optional: ["Boat or guided charter", "Cast net for live bait", "Sounder with side scan"]
    },
    bestTimes: ["Run-off (Feb-Apr)", "Build-up (Oct-Dec)", "Making tides around creek mouths"],
    difficulty: "Intermediate",
    regulations: ["No recreational fishing licence required in NT", "Barramundi size and possession limits apply", "Check NT Fisheries rules and closed areas"]
  },
  {
    id: 5,
    slug: "exmouth-ningaloo-flats",
    title: "Exmouth & Ningaloo Flats",
    location: "Exmouth, WA",
    country: "AU",
    type: "Saltwater",
    species: ["bonefish", "giant trevally", "queenfish", "golden trevally"],
    image: fishingSpot,
    featured: false,
    description: "World-class sight fishing on the flats inside Ningaloo Reef. Stalk bonefish, permit and cruising trevally in ankle-deep water, or head outside the reef for serious bluewater action.",
    coordinates: { lat: -21.9300, lng: 114.1200 },
    waterTemperature: { current: 23, unit: "°C", trend: "stable" },
    weather: {
      condition: "Clear",
      temperature: 77,
      humidity: 45,
      windSpeed: 14,
      windDirection: "SE"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["8-10 weight fly rod or 4000-size spin", "Crab and shrimp flies", "Flats booties", "Polarized sunglasses"],
      optional: ["Guide booking", "Sun gloves and buff", "Stripping basket"]
    },
    bestTimes: ["Morning low light with sun overhead by 9 AM", "Neap tides for the flats", "March-June prime"],
    difficulty: "Advanced",
    regulations: ["WA licence required only for boat-based fishing", "Ningaloo Marine Park sanctuary zones — no fishing zones apply", "Check current WA DPIRD rules"]
  },
  {
    id: 6,
    slug: "great-lake-tasmania-trout",
    title: "Great Lake Highland Trout",
    location: "Central Highlands, TAS",
    country: "AU",
    type: "Fly Fishing",
    species: ["brown trout", "rainbow trout"],
    image: duckSpot,
    featured: false,
    description: "Tasmania's Central Highlands hold some of the world's best wild brown trout water. Great Lake and the surrounding lakes offer polaroiding, tailing fish in the shallows, and classic loch-style fishing.",
    coordinates: { lat: -41.8700, lng: 146.6800 },
    waterTemperature: { current: 7, unit: "°C", trend: "stable" },
    weather: {
      condition: "Windy",
      temperature: 43,
      humidity: 75,
      windSpeed: 18,
      windDirection: "NW"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["6-weight fly rod", "Wet flies and nymphs", "Waders", "Warm layered clothing"],
      optional: ["Drift boat hire", "Polaroiding sunglasses", "Landing net"]
    },
    bestTimes: ["Early season wets (Aug-Oct)", "Summer polaroiding (Dec-Feb)", "Overcast days for loch-style"],
    difficulty: "Intermediate",
    regulations: ["Tasmanian Inland Fisheries licence required", "Season and method rules vary by water — check IFS", "Bag and size limits apply"]
  },
  {
    id: 7,
    slug: "murray-river-cod-yarrawonga",
    title: "Murray River Cod Country",
    location: "Yarrawonga, VIC/NSW",
    country: "AU",
    type: "Freshwater",
    species: ["Murray cod", "golden perch"],
    image: fishingSpot,
    featured: true,
    description: "The stretch of the Murray below Yarrawonga Weir is legendary Murray cod water. Cast big hardbodies and surface lures around snags and undercut banks for Australia's largest freshwater fish.",
    coordinates: { lat: -36.0200, lng: 146.0000 },
    waterTemperature: { current: 11, unit: "°C", trend: "stable" },
    weather: {
      condition: "Foggy Morning",
      temperature: 48,
      humidity: 85,
      windSpeed: 5,
      windDirection: "S"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Heavy baitcast combo (50lb braid)", "Large hardbodies and spinnerbaits", "Surface lures for dawn/dusk", "Heavy leader 60-80lb"],
      optional: ["Kayak or boat", "Large landing net", "Lip grips with scales"]
    },
    bestTimes: ["Cod opening (Dec 1)", "Surface bite on summer evenings", "Autumn stability"],
    difficulty: "Intermediate",
    regulations: ["NSW or VIC licence required depending on bank", "Murray cod closed season Sep 1 - Nov 30", "Slot limit applies to Murray cod — check current rules"]
  },
  {
    id: 8,
    slug: "coorong-mulloway-surf",
    title: "Coorong Surf Mulloway",
    location: "Coorong, SA",
    country: "AU",
    type: "Saltwater",
    species: ["mulloway", "Australian salmon", "bream", "flathead"],
    image: duckSpot,
    featured: false,
    description: "The wild surf beaches of the Coorong and Murray Mouth are South Australia's premier land-based mulloway fishery. Long beaches, big gutters, and the chance of a genuine metre-plus fish from the sand.",
    coordinates: { lat: -35.5500, lng: 138.8800 },
    waterTemperature: { current: 13, unit: "°C", trend: "stable" },
    weather: {
      condition: "Partly Cloudy",
      temperature: 57,
      humidity: 65,
      windSpeed: 16,
      windDirection: "SW"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["12-13ft surf rod", "Star or grapnel sinkers", "Fresh mullet or salmon fillet baits", "Beach rod holder"],
      optional: ["4WD beach access permit", "Headlamp for night sessions", "Bait pump for cockles"]
    },
    bestTimes: ["Night tides", "After onshore blows", "Autumn and spring runs"],
    difficulty: "Intermediate",
    regulations: ["No general SA fishing licence required", "Mulloway size and bag limits apply", "Coorong National Park access rules — check before driving the beach"]
  },
  {
    id: 9,
    slug: "lake-jindabyne-trout",
    title: "Lake Jindabyne Trout",
    location: "Snowy Mountains, NSW",
    country: "AU",
    type: "Freshwater",
    species: ["brown trout", "rainbow trout", "Atlantic salmon"],
    image: fishingSpot,
    featured: false,
    description: "A big, cold Snowy Mountains lake stocked with browns, rainbows and Atlantic salmon. Troll the drop-offs, fish bait from the bank, or fly fish the edges on dark for cruising browns.",
    coordinates: { lat: -36.4200, lng: 148.6200 },
    waterTemperature: { current: 8, unit: "°C", trend: "stable" },
    weather: {
      condition: "Cold and Clear",
      temperature: 39,
      humidity: 60,
      windSpeed: 9,
      windDirection: "W"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Light spin or 5-6wt fly rod", "Tasmanian Devil lures", "PowerBait or scrub worms", "Warm clothing"],
      optional: ["Boat or kayak", "Lead core trolling line", "Landing net"]
    },
    bestTimes: ["Dawn and dusk", "Evening rise in summer", "Winter for lake browns"],
    difficulty: "Beginner",
    regulations: ["NSW Recreational Fishing Fee required", "Trout bag and size limits apply", "Rivers upstream have seasonal closures — check NSW DPI"]
  },
  {
    id: 10,
    slug: "hervey-bay-golden-trevally",
    title: "Hervey Bay Flats & Bay",
    location: "Hervey Bay, QLD",
    country: "AU",
    type: "Saltwater",
    species: ["golden trevally", "longtail tuna", "whiting", "flathead"],
    image: duckSpot,
    featured: false,
    description: "Sheltered by K'gari (Fraser Island), Hervey Bay offers calm-water sight fishing for golden trevally on the flats, longtail tuna busting bait in the bay, and easy family fishing options year-round.",
    coordinates: { lat: -25.2900, lng: 152.8400 },
    waterTemperature: { current: 20, unit: "°C", trend: "stable" },
    weather: {
      condition: "Sunny",
      temperature: 72,
      humidity: 55,
      windSpeed: 11,
      windDirection: "SE"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["3000-4000 spin combo", "Soft plastics and metal slugs", "Yabby pump", "Light fluorocarbon leader"],
      optional: ["Flats skiff or kayak", "8-weight fly rod", "Polarized sunglasses"]
    },
    bestTimes: ["Making tide on the flats", "Tuna season (Aug-Nov)", "Winter whiting (May-Aug)"],
    difficulty: "Beginner",
    regulations: ["No general QLD licence for tidal waters", "Great Sandy Marine Park zoning applies", "Size and bag limits — check QLD DAF rules"]
  },
  {
    id: 11,
    slug: "somerset-dam-bass",
    title: "Somerset Dam Bass",
    location: "Somerset Region, QLD",
    country: "AU",
    type: "Freshwater",
    species: ["Australian bass", "golden perch", "saratoga"],
    image: fishingSpot,
    featured: false,
    description: "One of Queensland's premier stocked impoundments, famous for schooled Australian bass in open water. Sound up the schools and drop soft vibes or blades for hot mid-water action.",
    coordinates: { lat: -27.1200, lng: 152.5500 },
    waterTemperature: { current: 16, unit: "°C", trend: "stable" },
    weather: {
      condition: "Clear",
      temperature: 66,
      humidity: 50,
      windSpeed: 7,
      windDirection: "SW"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Light spin combo (10-15lb braid)", "Soft vibes and blades", "Sounder", "Tail spinners"],
      optional: ["Electric motor", "Kayak", "Trolling hardbodies"]
    },
    bestTimes: ["Schooled fish (autumn-winter)", "Dawn topwater in summer", "Stable weather patterns"],
    difficulty: "Beginner",
    regulations: ["Stocked Impoundment Permit (SIPS) required to fish the dam", "Bass closed season does not apply in impoundments", "Check QLD DAF rules"]
  },
  {
    id: 12,
    slug: "albany-king-george-sound",
    title: "Albany & King George Sound",
    location: "Albany, WA",
    country: "AU",
    type: "Saltwater",
    species: ["King George whiting", "Australian salmon", "snapper", "squid"],
    image: duckSpot,
    featured: false,
    description: "WA's rugged south coast at its best. Chase big King George whiting and squid in the protected sound, or fish the surf beaches when the famous autumn salmon run pushes schools along the coast.",
    coordinates: { lat: -35.0300, lng: 117.9200 },
    waterTemperature: { current: 16, unit: "°C", trend: "stable" },
    weather: {
      condition: "Showers",
      temperature: 59,
      humidity: 75,
      windSpeed: 20,
      windDirection: "SW"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Light spin combo for whiting", "Surf rod for salmon runs", "Squid jigs", "Fresh squid and worm baits"],
      optional: ["Boat for the sound", "Waders", "Rock fishing safety gear (lifejacket)"]
    },
    bestTimes: ["Autumn salmon run (Mar-May)", "Calm mornings in the sound", "Squid on light winds"],
    difficulty: "Beginner",
    regulations: ["WA licence required only for boat-based fishing", "Rock fishing safety rules — lifejackets recommended", "Check current WA DPIRD size and bag limits"]
  }
];

export const getSpotBySlug = (slug: string): FishingSpot | undefined => {
  return spots.find((spot) => spot.slug === slug);
};

export const getSpotById = (id: number): FishingSpot | undefined => {
  return spots.find((spot) => spot.id === id);
};
