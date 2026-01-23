import { motion } from "framer-motion";
import { MapPin, Star, Users, Bookmark } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { spots } from "@/data/spots";
import CountrySelector, { countries } from "./CountrySelector";
import FishSpeciesFilter from "./FishSpeciesFilter";


const FeaturedSpots = () => {
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [selectedSpecies, setSelectedSpecies] = useState("ALL");

  const filteredSpots = spots.filter((spot) => {
    const countryMatch = selectedCountry === "ALL" || spot.country === selectedCountry;
    const speciesMatch = selectedSpecies === "ALL" || spot.species.includes(selectedSpecies);
    return countryMatch && speciesMatch;
  });

  const currentCountry = countries.find((c) => c.code === selectedCountry);
  const countryLabel = currentCountry?.name || "Worldwide";
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
            {selectedCountry === "ALL" ? "Worldwide" : countryLabel} Fishing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {selectedCountry === "ALL" ? "Featured Spots" : `Fishing in ${countryLabel}`}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {selectedCountry === "ALL" 
              ? "Discover handpicked fishing locations verified by our community of anglers."
              : `Explore the best fishing destinations across ${countryLabel}.`}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="text-muted-foreground font-medium text-sm">Country:</span>
            <CountrySelector
              selectedCountry={selectedCountry}
              onSelectCountry={setSelectedCountry}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="text-muted-foreground font-medium text-sm">Species:</span>
            <FishSpeciesFilter
              selectedSpecies={selectedSpecies}
              onSelectSpecies={setSelectedSpecies}
            />
          </div>
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
              <Link to={`/spot/${spot.slug}`} key={spot.id}>
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