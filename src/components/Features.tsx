import { motion } from "framer-motion";
import { MapPin, Cloud, Sparkles, Fish, Map, ScrollText } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Curated Spot Discovery",
    description: "Browse a growing library of fishing spots with location, species, weather, and access details.",
  },
  {
    icon: Cloud,
    title: "Live Weather Conditions",
    description: "Real-time weather and a fishing conditions score for every spot, based on temperature, wind, pressure, and cloud cover.",
  },
  {
    icon: Sparkles,
    title: "AI Fishing Assistant",
    description: "Ask AI for species tips, technique suggestions, and recommendations for any spot. Available on Pro and Elite plans.",
  },
  {
    icon: Fish,
    title: "Personal Catch Log",
    description: "Log every catch with photos, weight, length, location, and notes. Build your personal fishing history.",
  },
  {
    icon: Map,
    title: "Interactive Map",
    description: "Explore fishing spots on a live map with species filters, water type filters, and clustering for nearby locations.",
  },
  {
    icon: ScrollText,
    title: "Regulations Reference",
    description: "Quick links to official fishing authorities in the US, Canada, UK, Australia, and more. Always verify with local rules before fishing.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-4">
            Powerful Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built for anglers who demand the best tools for their fishing adventures.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group p-8 rounded-2xl bg-gradient-card border border-border/50 hover:border-accent/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;