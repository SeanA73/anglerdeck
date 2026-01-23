import { motion } from "framer-motion";
import { Globe, ChevronDown } from "lucide-react";
import { useState } from "react";

export const countries = [
  { code: "ALL", name: "All Countries", flag: "🌍" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
];

interface CountrySelectorProps {
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
}

const CountrySelector = ({ selectedCountry, onSelectCountry }: CountrySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentCountry = countries.find((c) => c.code === selectedCountry) || countries[0];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-accent/50 transition-colors min-w-[200px]"
      >
        <span className="text-2xl">{currentCountry.flag}</span>
        <span className="text-foreground font-medium flex-1 text-left">{currentCountry.name}</span>
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
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  onSelectCountry(country.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  selectedCountry === country.code ? "bg-accent/10 text-accent" : "text-foreground"
                }`}
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default CountrySelector;
