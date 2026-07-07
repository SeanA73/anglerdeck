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

export const spots: FishingSpot[] = [
  {
    id: 1,
    slug: "crystal-creek-trout-haven",
    title: "Crystal Creek Trout Haven",
    location: "Colorado",
    country: "US",
    type: "Freshwater",
    species: ["trout", "bass"],
    image: fishingSpot,
    featured: true,
    sponsored: true,
    sponsoredUrl: "https://example.com/book-crystal-creek-lodge",
    description: "A pristine mountain stream nestled in the heart of Colorado's Rocky Mountains. Crystal-clear waters teem with rainbow and brown trout, making it a paradise for fly fishing enthusiasts.",
    coordinates: { lat: 39.5501, lng: -105.7821 },
    waterTemperature: { current: 52, unit: "°F", trend: "stable" },
    weather: {
      condition: "Partly Cloudy",
      temperature: 68,
      humidity: 45,
      windSpeed: 8,
      windDirection: "NW"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["5-weight fly rod", "Waders", "Polarized sunglasses", "Dry flies", "Nymphs"],
      optional: ["Wading staff", "Net", "Fly floatant", "Strike indicators"]
    },
    bestTimes: ["Early morning (6-9 AM)", "Late evening (5-8 PM)"],
    difficulty: "Intermediate",
    regulations: ["Catch and release only", "Barbless hooks required", "Valid Colorado fishing license"]
  },
  {
    id: 2,
    slug: "gulf-coast-deep-sea",
    title: "Gulf Coast Deep Sea",
    location: "Florida",
    country: "US",
    type: "Saltwater",
    species: ["tuna", "marlin", "snapper"],
    image: duckSpot,
    featured: false,
    description: "Experience world-class offshore fishing in the warm waters of the Gulf of Mexico. Trophy yellowfin tuna, blue marlin, and red snapper await adventurous anglers.",
    coordinates: { lat: 26.6406, lng: -81.8723 },
    waterTemperature: { current: 78, unit: "°F", trend: "rising" },
    weather: {
      condition: "Sunny",
      temperature: 85,
      humidity: 72,
      windSpeed: 12,
      windDirection: "SE"
    },
    tides: {
      nextHigh: "2:45 PM",
      nextLow: "8:30 PM",
      current: "incoming"
    },
    recommendedGear: {
      essential: ["Heavy trolling rod", "Penn reel", "Live bait", "Wire leaders", "Sunscreen"],
      optional: ["Outriggers", "Downriggers", "Fish finder", "Gaff"]
    },
    bestTimes: ["Dawn charter (5-11 AM)", "Afternoon run (1-6 PM)"],
    difficulty: "Advanced",
    regulations: ["Federal fishing license required", "Size limits apply", "Bag limits: 2 tuna per person"]
  },
  {
    id: 3,
    slug: "lake-michigan-charter",
    title: "Lake Michigan Charter",
    location: "Michigan",
    country: "US",
    type: "Freshwater",
    species: ["walleye", "perch", "bass"],
    image: fishingSpot,
    featured: false,
    description: "The Great Lakes offer exceptional fishing opportunities. Lake Michigan's deep, cold waters are home to trophy walleye and abundant yellow perch.",
    coordinates: { lat: 43.0004, lng: -86.1250 },
    waterTemperature: { current: 58, unit: "°F", trend: "falling" },
    weather: {
      condition: "Overcast",
      temperature: 62,
      humidity: 65,
      windSpeed: 15,
      windDirection: "E"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Medium-heavy spinning rod", "Jig heads", "Live minnows", "Depth finder"],
      optional: ["Downriggers", "Planer boards", "Trolling motor"]
    },
    bestTimes: ["Pre-dawn (4-7 AM)", "Dusk (6-9 PM)"],
    difficulty: "Intermediate",
    regulations: ["Michigan fishing license required", "Daily limit: 5 walleye", "15-inch minimum size"]
  },
  {
    id: 4,
    slug: "bow-river-fly-fishing",
    title: "Bow River Fly Fishing",
    location: "Alberta",
    country: "CA",
    type: "Fly Fishing",
    species: ["trout", "salmon"],
    image: duckSpot,
    featured: true,
    description: "World-renowned for its prolific brown and rainbow trout populations. The Bow River offers consistent dry fly fishing action with stunning mountain scenery.",
    coordinates: { lat: 51.0447, lng: -114.0719 },
    waterTemperature: { current: 48, unit: "°F", trend: "stable" },
    weather: {
      condition: "Clear",
      temperature: 55,
      humidity: 40,
      windSpeed: 10,
      windDirection: "W"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["6-weight fly rod", "Chest waders", "Blue Wing Olive flies", "Streamers"],
      optional: ["Drift boat", "Wading boots with studs", "Thermometer"]
    },
    bestTimes: ["Mid-morning (9 AM-12 PM)", "Afternoon hatch (2-5 PM)"],
    difficulty: "Intermediate",
    regulations: ["Alberta fishing license", "Catch and release encouraged", "Single barbless hooks"]
  },
  {
    id: 5,
    slug: "great-barrier-reef-fishing",
    title: "Great Barrier Reef Fishing",
    location: "Queensland",
    country: "AU",
    type: "Saltwater",
    species: ["tuna", "marlin", "snapper"],
    image: fishingSpot,
    featured: true,
    description: "Fish the world's largest coral reef system. Target giant trevally, coral trout, and legendary black marlin in crystal-clear tropical waters.",
    coordinates: { lat: -16.9186, lng: 145.7781 },
    waterTemperature: { current: 82, unit: "°F", trend: "stable" },
    weather: {
      condition: "Tropical",
      temperature: 88,
      humidity: 80,
      windSpeed: 18,
      windDirection: "NE"
    },
    tides: {
      nextHigh: "11:15 AM",
      nextLow: "5:45 PM",
      current: "outgoing"
    },
    recommendedGear: {
      essential: ["Heavy popping rod", "Large poppers", "Braided line", "Reef-safe sunscreen"],
      optional: ["Underwater camera", "Fighting belt", "Gloves"]
    },
    bestTimes: ["Early morning (5-9 AM)", "Tide changes"],
    difficulty: "Advanced",
    regulations: ["Queensland fishing permit", "Protected species list applies", "Bag and size limits"]
  },
  {
    id: 6,
    slug: "scottish-salmon-rivers",
    title: "Scottish Salmon Rivers",
    location: "Highlands",
    country: "GB",
    type: "Fly Fishing",
    species: ["salmon", "trout"],
    image: duckSpot,
    featured: false,
    description: "Experience the tradition of Atlantic salmon fishing on Scotland's legendary rivers. The Spey, Tay, and Dee offer classic fly fishing in breathtaking Highland scenery.",
    coordinates: { lat: 57.4778, lng: -4.2247 },
    waterTemperature: { current: 50, unit: "°F", trend: "rising" },
    weather: {
      condition: "Light Rain",
      temperature: 54,
      humidity: 85,
      windSpeed: 12,
      windDirection: "SW"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["15-foot Spey rod", "Spey lines", "Traditional flies", "Rain gear"],
      optional: ["Ghillie hire", "Wading staff", "Whisky flask"]
    },
    bestTimes: ["Spring run (March-May)", "Autumn run (Sept-Nov)"],
    difficulty: "Advanced",
    regulations: ["Salmon fishing permit required", "Catch and release in spring", "Beat booking essential"]
  },
  {
    id: 7,
    slug: "rhine-river-carp-fishing",
    title: "Rhine River Carp Fishing",
    location: "Baden-Württemberg",
    country: "DE",
    type: "Freshwater",
    species: ["carp", "pike", "catfish"],
    image: fishingSpot,
    featured: false,
    description: "Target massive European carp and Wels catfish in Germany's iconic Rhine River. Patient anglers are rewarded with trophy specimens.",
    coordinates: { lat: 49.0069, lng: 8.4037 },
    waterTemperature: { current: 62, unit: "°F", trend: "stable" },
    weather: {
      condition: "Cloudy",
      temperature: 65,
      humidity: 60,
      windSpeed: 6,
      windDirection: "N"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Carp rod", "Bite alarms", "Boilies", "Landing mat"],
      optional: ["Bivvy", "Pod", "Unhooking mat", "Weighing sling"]
    },
    bestTimes: ["Night sessions", "Early morning"],
    difficulty: "Intermediate",
    regulations: ["German fishing license required", "Night fishing permits", "Unhooking mat mandatory"]
  },
  {
    id: 8,
    slug: "fjord-salmon-paradise",
    title: "Fjord Salmon Paradise",
    location: "Bergen",
    country: "NO",
    type: "Saltwater",
    species: ["salmon", "trout"],
    image: duckSpot,
    featured: true,
    description: "Norway's dramatic fjords offer world-class sea trout and Atlantic salmon fishing. Pristine waters and midnight sun create unforgettable fishing experiences.",
    coordinates: { lat: 60.3913, lng: 5.3221 },
    waterTemperature: { current: 46, unit: "°F", trend: "rising" },
    weather: {
      condition: "Partly Cloudy",
      temperature: 52,
      humidity: 70,
      windSpeed: 8,
      windDirection: "W"
    },
    tides: {
      nextHigh: "3:30 PM",
      nextLow: "9:45 PM",
      current: "incoming"
    },
    recommendedGear: {
      essential: ["7-weight fly rod", "Sea trout flies", "Floating line", "Warm layers"],
      optional: ["Kayak", "Float tube", "GPS"]
    },
    bestTimes: ["Midnight sun (June-July)", "September runs"],
    difficulty: "Intermediate",
    regulations: ["Norwegian fishing license", "Disinfection required", "Catch limits apply"]
  },
  {
    id: 9,
    slug: "patagonia-trophy-trout",
    title: "Patagonia Trophy Trout",
    location: "Río Negro",
    country: "AR",
    type: "Fly Fishing",
    species: ["trout", "salmon"],
    image: fishingSpot,
    featured: false,
    description: "South America's premier trout destination. Crystal-clear Patagonian rivers hold wild brown and rainbow trout of legendary proportions.",
    coordinates: { lat: -41.1335, lng: -71.3103 },
    waterTemperature: { current: 50, unit: "°F", trend: "stable" },
    weather: {
      condition: "Windy",
      temperature: 58,
      humidity: 45,
      windSpeed: 25,
      windDirection: "W"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["7-weight rod", "Large streamers", "Wind-resistant flies", "Layered clothing"],
      optional: ["Guide service", "Drift boat", "High-vis fly line"]
    },
    bestTimes: ["November-April (Southern summer)", "Morning and evening"],
    difficulty: "Advanced",
    regulations: ["Argentine fishing license", "Catch and release zones", "Guide recommended"]
  },
  {
    id: 10,
    slug: "swedish-pike-adventure",
    title: "Swedish Pike Adventure",
    location: "Stockholm Archipelago",
    country: "SE",
    type: "Freshwater",
    species: ["pike", "perch"],
    image: duckSpot,
    featured: false,
    description: "Explore thousands of islands in pursuit of monster pike and jumbo perch. Sweden's archipelago offers incredible variety and stunning scenery.",
    coordinates: { lat: 59.3293, lng: 18.0686 },
    waterTemperature: { current: 54, unit: "°F", trend: "falling" },
    weather: {
      condition: "Clear",
      temperature: 60,
      humidity: 55,
      windSpeed: 10,
      windDirection: "SE"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Heavy casting rod", "Large swimbaits", "Wire leaders", "Jaw spreaders"],
      optional: ["Boat rental", "Fish finder", "Release tools"]
    },
    bestTimes: ["Spring (April-May)", "Autumn (Sept-Oct)"],
    difficulty: "Intermediate",
    regulations: ["Free fishing in most areas", "Size limits on pike", "Protected spawning periods"]
  },
  {
    id: 11,
    slug: "finnish-lake-district",
    title: "Finnish Lake District",
    location: "Lakeland",
    country: "FI",
    type: "Freshwater",
    species: ["pike", "perch", "walleye"],
    image: fishingSpot,
    featured: false,
    description: "Finland's lake district features over 180,000 lakes. Target trophy pike, massive perch, and elusive zander in pristine wilderness waters.",
    coordinates: { lat: 61.9241, lng: 28.8831 },
    waterTemperature: { current: 52, unit: "°F", trend: "stable" },
    weather: {
      condition: "Overcast",
      temperature: 55,
      humidity: 75,
      windSpeed: 5,
      windDirection: "N"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Spinning rod", "Jerkbaits", "Soft plastics", "Mosquito repellent"],
      optional: ["Cabin rental", "Sauna access", "Ice fishing gear (winter)"]
    },
    bestTimes: ["Summer (June-August)", "Ice fishing (Jan-March)"],
    difficulty: "Beginner",
    regulations: ["Finnish fishing permit", "Lure fishing license", "Everyman's rights apply"]
  },
  {
    id: 12,
    slug: "amazon-catfish-expedition",
    title: "Amazon Catfish Expedition",
    location: "Manaus",
    country: "BR",
    type: "Freshwater",
    species: ["catfish", "bass"],
    image: duckSpot,
    featured: true,
    description: "The ultimate freshwater adventure. Battle giant redtail catfish, peacock bass, and piranha in the world's largest river system.",
    coordinates: { lat: -3.1190, lng: -60.0217 },
    waterTemperature: { current: 84, unit: "°F", trend: "stable" },
    weather: {
      condition: "Humid",
      temperature: 92,
      humidity: 90,
      windSpeed: 5,
      windDirection: "E"
    },
    tides: {
      nextHigh: "N/A",
      nextLow: "N/A",
      current: "slack"
    },
    recommendedGear: {
      essential: ["Heavy baitcasting rod", "Large live bait", "Strong leaders", "Tropical clothing"],
      optional: ["Guided expedition", "Jungle lodge", "Antimalarial medication"]
    },
    bestTimes: ["Dry season (June-November)", "Early morning"],
    difficulty: "Advanced",
    regulations: ["Brazilian fishing license", "Catch limits vary", "Protected species list"]
  }
];

export const getSpotBySlug = (slug: string): FishingSpot | undefined => {
  return spots.find((spot) => spot.slug === slug);
};

export const getSpotById = (id: number): FishingSpot | undefined => {
  return spots.find((spot) => spot.id === id);
};
