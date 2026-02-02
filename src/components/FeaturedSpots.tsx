import { motion } from "framer-motion";
import { MapPin, Star, Users, Bookmark, RefreshCw } from "lucide-react";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { spots } from "@/data/spots";
import { countries } from "./CountrySelector";
import { Button } from "./ui/button";
import { WeatherBadge } from "./weather/WeatherBadge";
import { FishingScoreBadge } from "./weather/FishingConditions";
import { useWeather } from "@/hooks/useWeather";
const getRandomSpots = (count: number) => {
  const shuffled = [...spots].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const FeaturedSpots = () => {
  const [randomSpots, setRandomSpots] = useState(() => getRandomSpots(6));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRandomSpots(getRandomSpots(6));
      setIsRefreshing(false);
    }, 300);
  }, []);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Discover Fishing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Featured Spots
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover handpicked fishing locations verified by our community of anglers.
          </p>
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Spots
          </Button>
        </motion.div>

        {/* Spots Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {randomSpots.map((spot, index) => (
            <FeaturedSpotCard key={spot.id} spot={spot} index={index} />
          ))}
        </div>

        {/* View More Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link to="/spots">
            <Button variant="outline" size="lg" className="px-8">
              View More Spots
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Separate component for each spot card to enable individual weather hooks
const FeaturedSpotCard = ({ spot, index }: { spot: typeof spots[0]; index: number }) => {
  const { data: weather, isLoading: weatherLoading } = useWeather(
    spot.coordinates.lat,
    spot.coordinates.lng,
    true
  );

  return (
    <Link to={`/spot/${spot.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="group relative bg-card rounded-2xl overflow-hidden shadow-card border border-border/50 cursor-pointer"
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={spot.image}
            alt={spot.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          
          {/* Featured Badge */}
          {spot.featured && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
              Featured
            </div>
          )}

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => e.preventDefault()}
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
            <span className="text-sm">{spot.location}, {countries.find(c => c.code === spot.country)?.name || spot.country}</span>
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span className="text-sm font-medium text-foreground">
                {spot.rating}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{spot.saves.toLocaleString()} saves</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default FeaturedSpots;
