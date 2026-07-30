import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Bookmark, Search, Filter, X, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdBanner } from "@/components/ads/AdBanner";
import { FishingSpot } from "@/data/spots";
import { useSpots } from "@/hooks/useSpots";
import CountrySelector, { countries } from "@/components/CountrySelector";
import { COUNTRIES } from "@/lib/countries";
import FishSpeciesFilter from "@/components/FishSpeciesFilter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeatherBadge } from "@/components/weather/WeatherBadge";
import { FishingScoreBadge } from "@/components/weather/FishingConditions";
import { useWeather } from "@/hooks/useWeather";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import {
  COUNTRY_CENTROIDS,
  distanceKm,
  formatDistance,
  getVisitorCountry,
  requestPreciseLocation,
} from "@/lib/geo";

type SortOption = "name" | "distance";

const Spots = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [selectedSpecies, setSelectedSpecies] = useState("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [showFilters, setShowFilters] = useState(false);
  const { data: spots = [], isLoading: spotsLoading } = useSpots();

  // Visitor location: country is inferred from the browser timezone (no
  // prompt, no network). Precise coordinates only arrive if the visitor
  // taps "Near me" and grants permission.
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [didAutoSelectCountry, setDidAutoSelectCountry] = useState(false);

  useEffect(() => {
    if (didAutoSelectCountry || spots.length === 0) return;

    const country = getVisitorCountry();
    if (!country) {
      setDidAutoSelectCountry(true);
      return;
    }
    // Only pre-select if we actually have spots there, otherwise show everything.
    if (spots.some((s) => s.country === country)) {
      setSelectedCountry(country);
      if (COUNTRY_CENTROIDS[country]) {
        setOrigin(COUNTRY_CENTROIDS[country]);
        setSortBy("distance");
      }
    }
    setDidAutoSelectCountry(true);
  }, [spots, didAutoSelectCountry]);

  const handleNearMe = async () => {
    setLocating(true);
    try {
      const coords = await requestPreciseLocation();
      setOrigin(coords);
      setSortBy("distance");
      setSelectedCountry("ALL");
      toast.success("Sorting spots by distance from you");
    } catch {
      toast.error("Couldn't get your location. Check browser permissions.");
    } finally {
      setLocating(false);
    }
  };

  const filteredAndSortedSpots = useMemo(() => {
    const result = spots.filter((spot) => {
      const matchesSearch =
        searchQuery === "" ||
        spot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry =
        selectedCountry === "ALL" || spot.country === selectedCountry;

      const matchesSpecies =
        selectedSpecies === "ALL" || spot.species.includes(selectedSpecies);

      const matchesType =
        selectedType === "ALL" || spot.type === selectedType;

      return matchesSearch && matchesCountry && matchesSpecies && matchesType;
    });

    // Sort results
    result.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          if (!origin) return a.title.localeCompare(b.title);
          return distanceKm(origin, a.coordinates) - distanceKm(origin, b.coordinates);
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [spots, searchQuery, selectedCountry, selectedSpecies, selectedType, sortBy, origin]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCountry("ALL");
    setSelectedSpecies("ALL");
    setSelectedType("ALL");
    setSortBy("name");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCountry !== "ALL" ||
    selectedSpecies !== "ALL" ||
    selectedType !== "ALL";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Explore Fishing Spots Worldwide"
        description="Browse curated fishing spots across Australia, the US and Canada. Filter by country, species, freshwater or saltwater. Find your next perfect catch with AnglerDeck."
        canonicalPath="/spots"
      />
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Explore Fishing Spots
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the best fishing locations worldwide. Filter by country, species, and more.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search spots by name, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-xl"
              />
            </div>
          </motion.div>

          {/* Filter Toggle (Mobile) */}
          <div className="flex justify-center mb-6 md:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`flex flex-wrap items-center justify-center gap-4 mb-8 ${showFilters ? "block" : "hidden md:flex"
              }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Country:</span>
              <CountrySelector
                selectedCountry={selectedCountry}
                onSelectCountry={setSelectedCountry}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Species:</span>
              <FishSpeciesFilter
                selectedSpecies={selectedSpecies}
                onSelectSpecies={setSelectedSpecies}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Type:</span>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="Freshwater">Freshwater</SelectItem>
                  <SelectItem value="Saltwater">Saltwater</SelectItem>
                  <SelectItem value="Fly Fishing">Fly Fishing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Sort:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="distance" disabled={!origin}>
                    Nearest first
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNearMe}
                disabled={locating}
                className="gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                {locating ? "Locating…" : "Near me"}
              </Button>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </motion.div>

          {/* Results Count */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-muted-foreground mb-8"
          >
            Showing {filteredAndSortedSpots.length} of {spots.length} spots
          </motion.p>

          {/* Country hubs — user navigation and the internal link path that lets
              crawlers reach the aggregate pages able to rank for head terms. */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mb-10 text-center"
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Browse by country
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {COUNTRIES.filter((c) => spots.some((s) => s.country === c.code)).map(
                (c) => (
                  <Link
                    key={c.code}
                    to={`/fishing/${c.slug}`}
                    className="px-3 py-1.5 rounded-full border border-border/50 text-sm text-foreground hover:border-accent/50 hover:text-accent transition-colors"
                  >
                    Fishing in {c.name}
                  </Link>
                )
              )}
            </div>
          </motion.nav>

          {/* Spots Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {spotsLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <p className="text-muted-foreground text-lg">Loading spots…</p>
              </motion.div>
            ) : filteredAndSortedSpots.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <p className="text-muted-foreground text-lg">
                  No spots found matching your criteria.
                </p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              </motion.div>
            ) : (
              filteredAndSortedSpots.map((spot, index) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  index={index}
                  distance={origin ? distanceKm(origin, spot.coordinates) : undefined}
                />
              ))
            )}
          </div>

          {/* AdSense (hidden for Pro/Elite) */}
          <AdBanner slot={import.meta.env.VITE_ADSENSE_SLOT_SPOTS ?? ""} format="horizontal" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

const SpotCard = ({
  spot,
  index,
  distance,
}: {
  spot: FishingSpot;
  index: number;
  distance?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: '200px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const { data: weather, isLoading: weatherLoading } = useWeather(
    spot.coordinates.lat,
    spot.coordinates.lng,
    isVisible
  );

  const imageSrc = spot.image.includes('unsplash.com')
    ? `${spot.image}${spot.image.includes('?') ? '&' : '?'}w=600&h=400&fit=crop&auto=format`
    : spot.image;

  return (
    <Link to={`/spot/${spot.slug}`}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="group relative bg-card rounded-2xl overflow-hidden shadow-card border border-border/50 cursor-pointer"
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={imageSrc}
            alt={`${spot.title} fishing spot in ${spot.location}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            width={600}
            height={400}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Featured Badge */}
          {spot.featured && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
              Featured
            </div>
          )}
          {spot.sponsored && (
            <div className="absolute top-4 left-24 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              Sponsored
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => e.preventDefault()}
            aria-label="Save this spot"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:text-accent transition-colors"
          >
            <Bookmark className="w-5 h-5" />
          </motion.button>

          {/* Type Badge */}
          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs font-medium">
            {spot.type}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
            {spot.title}
          </h3>

          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">
              {spot.location},{" "}
              {countries.find((c) => c.code === spot.country)?.name || spot.country}
              {distance !== undefined && (
                <span className="text-accent"> · {formatDistance(distance)} away</span>
              )}
            </span>
          </div>

          {/* Weather Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <WeatherBadge
              temperature={weather?.temperature}
              icon={weather?.icon}
              windSpeed={weather?.windSpeed}
              isLoading={weatherLoading}
              variant="compact"
            />
            {weather && (
              <FishingScoreBadge
                temperature={weather.temperature}
                windSpeed={weather.windSpeed}
                humidity={weather.humidity}
                pressure={weather.pressure}
                cloudCover={weather.cloudCover}
                weatherCode={weather.weatherCode}
                isLoading={weatherLoading}
              />
            )}
          </div>

          {/* Species Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {spot.species.slice(0, 3).map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground capitalize"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default Spots;
