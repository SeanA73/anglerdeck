import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Star } from "lucide-react";
import { FishingSpot } from "@/data/spots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fix default marker icon issue with Leaflet + Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
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

  useEffect(() => {
    if (spots.length > 0) {
      const bounds = L.latLngBounds(
        spots.map((spot) => [spot.coordinates.lat, spot.coordinates.lng]),
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [spots, map]);

  return null;
};

interface LeafletMapProps {
  filteredSpots: FishingSpot[];
  onSpotSelect: (spot: FishingSpot) => void;
}

const LeafletMap = ({ filteredSpots, onSpotSelect }: LeafletMapProps) => {
  return (
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
            click: () => onSpotSelect(spot),
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
  );
};

export default LeafletMap;
