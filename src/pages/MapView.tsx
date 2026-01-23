import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { MapPin, Star, Bookmark, Filter, X } from "lucide-react";
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

// Fix default marker icon issue with Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const createCustomIcon = (type: string) => {
  const color = type === "Freshwater" ? "#22c55e" : type === "Saltwater" ? "#3b82f6" : "#f59e0b";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to handle map bounds
const MapBounds = ({ spots }: { spots: FishingSpot[] }) => {
  const map = useMap();
  
  useMemo(() => {
    if (spots.length > 0) {
      const bounds = L.latLngBounds(
        spots.map(spot => [spot.coordinates.lat, spot.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [spots, map]);
  
  return null;
};

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
      
      <main className="flex-1 flex flex-col">
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
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className="w-full h-[calc(100vh-280px)] min-h-[500px]"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBounds spots={filteredSpots} />
            
            {filteredSpots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.coordinates.lat, spot.coordinates.lng]}
                icon={createCustomIcon(spot.type)}
                eventHandlers={{
                  click: () => setSelectedSpot(spot),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <img
                      src={spot.image}
                      alt={spot.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <h3 className="font-bold text-foreground">{spot.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" /> {spot.location}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{spot.type}</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {spot.rating}
                      </div>
                    </div>
                    <Link to={`/spot/${spot.slug}`}>
                      <Button size="sm" className="w-full">View Details</Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

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
