import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Bookmark, 
  BookmarkCheck,
  Thermometer, 
  Wind, 
  Droplets, 
  Waves, 
  Clock, 
  Fish,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Compass,
  Sun,
  CloudRain,
  Cloud,
  CloudSun,
  Loader2,
  CloudSnow,
  CloudLightning
} from "lucide-react";
import { getSpotBySlug, FishingSpot } from "@/data/spots";
import { countries } from "@/components/CountrySelector";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useWeather } from "@/hooks/useWeather";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/contexts/AuthContext";
import { SpotReviews } from "@/components/spots/SpotReviews";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { UsageMeter } from "@/components/UsageMeter";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe";
import { FishingConditions } from "@/components/weather/FishingConditions";
import FishingAssistant from "@/components/ai/FishingAssistant";
import { SEO, BASE_URL } from "@/components/SEO";
import { AdBanner } from "@/components/ads/AdBanner";
import { getBookingUrl, getAirbnbUrl, trackAffiliateClick } from "@/lib/affiliate";
import { formatTemperature, getDefaultUseCelsius } from "@/lib/temperature";

const WeatherIcon = ({ icon }: { icon: string }) => {
  switch (icon) {
    case "sun":
      return <Sun className="w-8 h-8 text-accent" />;
    case "cloud-rain":
      return <CloudRain className="w-8 h-8 text-accent" />;
    case "cloud-sun":
      return <CloudSun className="w-8 h-8 text-accent" />;
    case "cloud-snow":
      return <CloudSnow className="w-8 h-8 text-accent" />;
    case "cloud-lightning":
      return <CloudLightning className="w-8 h-8 text-accent" />;
    default:
      return <Cloud className="w-8 h-8 text-accent" />;
  }
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "rising") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "falling") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

const SpotDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const spot = getSpotBySlug(slug || "");
  const { user } = useAuth();
  const { isSaved, toggleSave, isToggling } = useSavedItems();
  const { 
    subscription, 
    usageStats, 
    hasReachedLimit, 
    getRemainingUsage, 
    trackUsage 
  } = useSubscription();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [useCelsius, setUseCelsius] = useState(getDefaultUseCelsius);

  // Track spot view on mount (only for logged-in users)
  useEffect(() => {
    if (spot && user && !hasTrackedView) {
      // Check if at limit before tracking
      if (hasReachedLimit('spots')) {
        setShowUpgradePrompt(true);
      } else {
        trackUsage('spot_view', spot.id);
        setHasTrackedView(true);
      }
    }
  }, [spot, user, hasTrackedView, hasReachedLimit, trackUsage]);

  // Fetch live weather data
  const { data: liveWeather, isLoading: weatherLoading } = useWeather(
    spot?.coordinates.lat || 0,
    spot?.coordinates.lng || 0,
    !!spot
  );

  const spotsLimit = subscription 
    ? SUBSCRIPTION_TIERS[subscription.tier].limits.spotsPerMonth 
    : 10;
  const spotsRemaining = getRemainingUsage('spots');

  if (!spot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Spot not found</h1>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const countryName = countries.find((c) => c.code === spot.country)?.name || spot.country;
  const spotIsSaved = isSaved("spot", spot.slug);

  // Use live weather if available, otherwise fall back to static data
  const displayWeather = liveWeather || {
    temperature: spot.weather.temperature,
    condition: spot.weather.condition,
    humidity: spot.weather.humidity,
    windSpeed: spot.weather.windSpeed,
    windDirection: spot.weather.windDirection,
    icon: "cloud",
  };

  const spotSchema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: spot.title,
    description: spot.description,
    image: spot.image.startsWith("http") ? spot.image : `${BASE_URL}${spot.image}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: spot.location,
      addressCountry: spot.country,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: spot.rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: spot.saves,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: spot.coordinates.lat,
      longitude: spot.coordinates.lng,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Spots", item: `${BASE_URL}/spots` },
      { "@type": "ListItem", position: 3, name: spot.title, item: `${BASE_URL}/spot/${spot.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${spot.title} — ${spot.location} Fishing Spot`}
        description={`Fish for ${spot.species.join(", ")} at ${spot.title} in ${spot.location}. ${spot.description.slice(0, 120)}...`}
        canonicalPath={`/spot/${spot.slug}`}
        ogImage={spot.image}
        ogType="article"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(spotSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <Header />

      <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-24">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <li><Link to="/" className="hover:text-foreground">Home</Link></li>
          <li>/</li>
          <li><Link to="/spots" className="hover:text-foreground">Spots</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">{spot.title}</li>
        </ol>
      </nav>
      
      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        type="limit_reached"
        limitType="spots"
        currentUsage={usageStats?.spotsViewedThisMonth || 0}
        limit={spotsLimit === Infinity ? 999 : spotsLimit}
      />
      
      {/* Usage indicator for logged-in free users */}
      {user && subscription?.tier === 'free' && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg">
            <UsageMeter
              type="spots"
              current={usageStats?.spotsViewedThisMonth || 0}
              limit={spotsLimit}
              compact
            />
          </div>
        </div>
      )}
      
      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img
          src={spot.image}
          alt={spot.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="absolute top-24 left-4 lg:left-8 flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => toggleSave("spot", spot.slug)}
          disabled={isToggling}
          aria-label={spotIsSaved ? "Remove from saved spots" : "Save this spot"}
          className={`absolute top-24 right-4 lg:right-8 flex items-center gap-2 px-4 py-2 backdrop-blur-sm rounded-full transition-colors ${
            spotIsSaved 
              ? "bg-accent text-accent-foreground" 
              : "bg-background/80 text-foreground hover:bg-background"
          }`}
        >
          {isToggling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : spotIsSaved ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {spotIsSaved ? "Saved" : "Save"}
          </span>
        </motion.button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-primary-foreground text-sm font-medium">
                  {spot.type}
                </span>
                <span className="px-3 py-1 rounded-full bg-accent/20 backdrop-blur-sm text-accent text-sm font-medium">
                  {spot.difficulty}
                </span>
                {spot.featured && (
                  <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                    Featured
                  </span>
                )}
                {spot.sponsored && (
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    Sponsored
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3">
                {spot.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{spot.location}, {countryName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="text-foreground font-medium">{spot.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bookmark className="w-4 h-4" />
                  <span>{spot.saves.toLocaleString()} saves</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">About This Spot</h2>
              <p className="text-muted-foreground leading-relaxed">{spot.description}</p>
              
              {/* Species */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Fish className="w-4 h-4 text-accent" />
                  Target Species
                </h3>
                <div className="flex flex-wrap gap-2">
                  {spot.species.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 bg-muted rounded-full text-sm text-foreground capitalize"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            <AdBanner
              slot={import.meta.env.VITE_ADSENSE_SLOT_SPOT_DETAIL || ''}
              format="horizontal"
            />

            {/* Weather & Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Current Conditions</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUseCelsius((c) => !c)}
                    className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground"
                    aria-label={useCelsius ? "Switch to Fahrenheit" : "Switch to Celsius"}
                  >
                    {useCelsius ? "°C" : "°F"}
                  </button>
                  {liveWeather && (
                    <span className="text-xs text-accent flex items-center gap-1">
                      <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Weather */}
                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Weather</h3>
                    {weatherLoading ? (
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    ) : (
                      <WeatherIcon icon={displayWeather.icon || "cloud"} />
                    )}
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {formatTemperature(displayWeather.temperature, useCelsius)}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">{displayWeather.condition}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Droplets className="w-4 h-4" />
                      <span>{displayWeather.humidity}% humidity</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wind className="w-4 h-4" />
                      <span>{displayWeather.windSpeed} mph {displayWeather.windDirection}</span>
                    </div>
                  </div>
                </div>

                {/* Water Temperature */}
                <div className="bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Water Temperature</h3>
                    <Thermometer className="w-8 h-8 text-accent" />
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                    <p className="text-3xl font-bold text-foreground">
                      {spot.waterTemperature.current}{spot.waterTemperature.unit}
                    </p>
                    <TrendIcon trend={spot.waterTemperature.trend} />
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {spot.waterTemperature.trend}
                  </p>
                </div>
              </div>

              {/* Tide Chart */}
              {spot.type === "Saltwater" && (
                <div className="mt-6 bg-muted/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Waves className="w-5 h-5 text-accent" />
                    <h3 className="text-sm font-medium text-foreground">Tide Information</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Next High</p>
                      <p className="text-lg font-semibold text-foreground">{spot.tides.nextHigh}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Current</p>
                      <p className="text-lg font-semibold text-accent capitalize">{spot.tides.current}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Next Low</p>
                      <p className="text-lg font-semibold text-foreground">{spot.tides.nextLow}</p>
                    </div>
                  </div>
                  {/* Tide Visual */}
                  <div className="mt-4 h-16 bg-background/50 rounded-lg overflow-hidden relative">
                    <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="tideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="hsl(38 85% 55% / 0.4)" />
                          <stop offset="100%" stopColor="hsl(38 85% 55% / 0.1)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 20 Q 25 5, 50 20 T 100 20 T 150 20 T 200 20 L 200 40 L 0 40 Z"
                        fill="url(#tideGradient)"
                      />
                      <path
                        d="M 0 20 Q 25 5, 50 20 T 100 20 T 150 20 T 200 20"
                        fill="none"
                        stroke="hsl(38 85% 55%)"
                        strokeWidth="2"
                      />
                    </svg>
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-accent rounded-full shadow-lg"
                      style={{ left: spot.tides.current === "incoming" ? "25%" : spot.tides.current === "outgoing" ? "75%" : "50%" }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Regulations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Regulations & Requirements
              </h2>
              <ul className="space-y-3">
                {spot.regulations.map((reg, index) => (
                  <li key={index} className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                    <span>{reg}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <SpotReviews spotId={spot.id} spotTitle={spot.title} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fishing Conditions - AI Analysis */}
            {liveWeather && (
              <FishingConditions
                temperature={liveWeather.temperature}
                windSpeed={liveWeather.windSpeed}
                humidity={liveWeather.humidity}
                pressure={liveWeather.pressure}
                cloudCover={liveWeather.cloudCover}
                weatherCode={liveWeather.weatherCode}
                isLoading={weatherLoading}
              />
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Plan Your Trip</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Find accommodation near {spot.location} for your fishing trip.
              </p>
              <a
                href={getBookingUrl(spot.location)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => trackAffiliateClick('booking', spot.slug)}
              >
                Find Accommodation
              </a>
              <a
                href={getAirbnbUrl(spot.location)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors"
                onClick={() => trackAffiliateClick('airbnb', spot.slug)}
              >
                Find Cabins & Stays on Airbnb
              </a>
              {spot.sponsored && spot.sponsoredUrl && (
                <a
                  href={spot.sponsoredUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  onClick={() => trackAffiliateClick('sponsored_spot', spot.slug)}
                >
                  Book Now — Featured Partner
                </a>
              )}
            </motion.div>

            {/* Best Times */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Best Times to Fish
              </h3>
              <div className="space-y-3">
                {spot.bestTimes.map((time, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 bg-muted/50 rounded-lg text-sm text-foreground"
                  >
                    {time}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recommended Gear */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-accent" />
                Recommended Gear
              </h3>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-accent mb-3">Essential</h4>
                <ul className="space-y-2">
                  {spot.recommendedGear.essential.map((gear, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                      {gear}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Optional</h4>
                <ul className="space-y-2">
                  {spot.recommendedGear.optional.map((gear, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      {gear}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-forest rounded-2xl p-6 border border-accent/20"
            >
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Fish?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {user 
                  ? "Save this spot to your collection and get real-time updates."
                  : "Sign in to save spots and track your catches."}
              </p>
              <button 
                onClick={() => user ? toggleSave("spot", spot.slug) : navigate("/auth")}
                disabled={isToggling}
                aria-label={spotIsSaved ? "Remove from saved spots" : "Save this spot"}
                className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : spotIsSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    Saved to Collection
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    {user ? "Save Spot" : "Sign In to Save"}
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
      <FishingAssistant />
    </div>
  );
};

export default SpotDetail;
