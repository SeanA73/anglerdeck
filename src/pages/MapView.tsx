import { useState, useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Star, Filter, X, Loader2 } from "lucide-react";
import { spots, FishingSpot } from "@/data/spots";
import { countries } from "@/components/CountrySelector";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Lazy load the map component to avoid SSR issues
const LeafletMap = lazy(() => import("@/components/map/LeafletMap"));

const MapView = () => {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);

  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const typeMatch = selectedType === "ALL" || spot.type === selectedType;
      const countryMatch = selectedCountry === "ALL" || spot.country === selectedCountry;
      return typeMatch && countryMatch;
    });
  }, [selectedType, selectedCountry]);

  const uniqueCountries = useMemo(() => {
    const countryCodes = [...new Set(spots.map(spot => spot.country))];
    return countries.filter(c => countryCodes.includes(c.code));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col pt-16 lg:pt-20">
        {/* Header */}
        <div className="bg-card border-b px-4 py-4">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Explore Fishing Spots</h1>
              <p className="text-muted-foreground">{filteredSpots.length} spots worldwide</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Water Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="Freshwater">Freshwater</SelectItem>
                  <SelectItem value="Saltwater">Saltwater</SelectItem>
                  <SelectItem value="Fly Fishing">Fly Fishing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Countries</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedType !== "ALL" || selectedCountry !== "ALL") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedType("ALL");
                    setSelectedCountry("ALL");
                  }}
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <Suspense fallback={
            <div className="w-full h-[calc(100vh-280px)] min-h-[500px] flex items-center justify-center bg-muted/50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          }>
            <LeafletMap
              filteredSpots={filteredSpots}
              onSpotSelect={setSelectedSpot}
            />
          </Suspense>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
            <p className="text-xs font-medium text-foreground mb-2">Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Freshwater</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Saltwater</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-muted-foreground">Fly Fishing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spots List (Mobile Sheet) */}
        <div className="md:hidden fixed bottom-20 right-4 z-[1000]">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg">
                <Filter className="w-5 h-5 mr-2" /> {filteredSpots.length} Spots
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>Fishing Spots</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(70vh-80px)]">
                {filteredSpots.map((spot) => (
                  <Link key={spot.id} to={`/spot/${spot.slug}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <img
                        src={spot.image}
                        alt={spot.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{spot.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {spot.location}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{spot.type}</Badge>
                          <span className="text-xs flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            {spot.rating}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapView;
