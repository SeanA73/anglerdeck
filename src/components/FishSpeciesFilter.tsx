import { motion } from "framer-motion";
import { Fish, ChevronDown } from "lucide-react";
import { useState } from "react";

export const fishSpecies = [
  { id: "ALL", name: "All Species", icon: "🐟" },
  { id: "bass", name: "Bass", icon: "🐟" },
  { id: "trout", name: "Trout", icon: "🐟" },
  { id: "salmon", name: "Salmon", icon: "🐟" },
  { id: "pike", name: "Pike", icon: "🐟" },
  { id: "carp", name: "Carp", icon: "🐟" },
  { id: "catfish", name: "Catfish", icon: "🐟" },
  { id: "tuna", name: "Tuna", icon: "🐟" },
  { id: "marlin", name: "Marlin", icon: "🐟" },
  { id: "snapper", name: "Snapper", icon: "🐟" },
  { id: "walleye", name: "Walleye", icon: "🐟" },
  { id: "perch", name: "Perch", icon: "🐟" },
];

interface FishSpeciesFilterProps {
  selectedSpecies: string;
  onSelectSpecies: (id: string) => void;
}

const FishSpeciesFilter = ({ selectedSpecies, onSelectSpecies }: FishSpeciesFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentSpecies = fishSpecies.find((s) => s.id === selectedSpecies) || fishSpecies[0];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-accent/50 transition-colors min-w-[180px]"
      >
        <Fish className="w-5 h-5 text-accent" />
        <span className="text-foreground font-medium flex-1 text-left">{currentSpecies.name}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {fishSpecies.map((species) => (
              <button
                key={species.id}
                onClick={() => {
                  onSelectSpecies(species.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  selectedSpecies === species.id ? "bg-accent/10 text-accent" : "text-foreground"
                }`}
              >
                <Fish className="w-4 h-4" />
                <span className="font-medium">{species.name}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default FishSpeciesFilter;
