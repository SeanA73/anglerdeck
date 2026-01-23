import { motion } from "framer-motion";
import { MapPin, Star, Users, Bookmark } from "lucide-react";
import { useState } from "react";
import fishingSpot from "@/assets/fishing-spot.jpg";
import duckSpot from "@/assets/duck-spot.jpg";
import CountrySelector from "./CountrySelector";

const spots = [
  {
    id: 1,
    title: "Crystal Creek Trout Haven",
    location: "Colorado",
    country: "US",
    type: "Freshwater",
    rating: 4.9,
    saves: 2340,
    image: fishingSpot,
    featured: true,
  },
  {
    id: 2,
    title: "Gulf Coast Deep Sea",
    location: "Florida",
    country: "US",
    type: "Saltwater",
    rating: 4.8,
    saves: 1890,
    image: duckSpot,
    featured: false,
  },
  {
    id: 3,
    title: "Lake Michigan Charter",
    location: "Michigan",
    country: "US",
    type: "Freshwater",
    rating: 4.7,
    saves: 1560,
    image: fishingSpot,
    featured: false,
  },
  {
    id: 4,
    title: "Bow River Fly Fishing",
    location: "Alberta",
    country: "CA",
    type: "Fly Fishing",
    rating: 4.8,
    saves: 1920,
    image: duckSpot,
    featured: true,
  },
  {
    id: 5,
    title: "Great Barrier Reef Fishing",
    location: "Queensland",
    country: "AU",
    type: "Saltwater",
    rating: 4.9,
    saves: 3100,
    image: fishingSpot,
    featured: true,
  },
  {
    id: 6,
    title: "Scottish Salmon Rivers",
    location: "Highlands",
    country: "GB",
    type: "Fly Fishing",
    rating: 4.6,
    saves: 1340,
    image: duckSpot,
    featured: false,
  },
  {
    id: 7,
    title: "Rhine River Carp Fishing",
    location: "Baden-Württemberg",
    country: "DE",
    type: "Freshwater",
    rating: 4.7,
    saves: 980,
    image: fishingSpot,
    featured: false,
  },
  {
    id: 8,
    title: "Fjord Salmon Paradise",
    location: "Bergen",
    country: "NO",
    type: "Saltwater",
    rating: 4.9,
    saves: 2450,
    image: duckSpot,
    featured: true,
  },
  {
    id: 9,
    title: "Patagonia Trophy Trout",
    location: "Río Negro",
    country: "AR",
    type: "Fly Fishing",
    rating: 4.8,
    saves: 1670,
    image: fishingSpot,
    featured: false,
  },
];

const FeaturedSpots = () => {
  const [selectedCountry, setSelectedCountry] = useState("ALL");

  const filteredSpots = selectedCountry === "ALL" 
    ? spots 
    : spots.filter((spot) => spot.country === selectedCountry);

  const countryNames: Record<string, string> = {
    US: "USA",
    CA: "Canada",
    AU: "Australia",
    GB: "UK",
    DE: "Germany",
    NO: "Norway",
    AR: "Argentina",
  };

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
            Top Rated Locations
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Featured Spots
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover handpicked fishing locations verified by our community of anglers.
          </p>
        </motion.div>

        {/* Country Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <span className="text-muted-foreground font-medium">Filter by country:</span>
          <CountrySelector
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
          />
        </motion.div>

        {/* Spots Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredSpots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-16"
            >
              <p className="text-muted-foreground text-lg">No spots found for this country yet.</p>
              <p className="text-muted-foreground text-sm mt-2">Be the first to add one!</p>
            </motion.div>
          ) : (
            filteredSpots.map((spot, index) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-card rounded-2xl overflow-hidden shadow-card border border-border/50"
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
                  
                  <div className="flex items-center gap-1 text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{spot.location}, {countryNames[spot.country] || spot.country}</span>
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
          ))
          )}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <button className="px-8 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted/50 hover:border-accent/50 transition-all duration-300">
            View All Spots
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedSpots;