import { motion } from "framer-motion";
import { MapPin, Users, BookOpen, Shield, Wifi, Search } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Smart Location Finder",
    description: "Discover verified fishing spots with detailed info on weather, water conditions, and best times to fish.",
  },
  {
    icon: Wifi,
    title: "Offline Access",
    description: "Download maps and spot details for offline use. Never lose access in remote areas.",
  },
  {
    icon: Users,
    title: "Angler Community",
    description: "Share your catches, connect with local anglers, and learn from experienced fishermen.",
  },
  {
    icon: BookOpen,
    title: "Expert Content",
    description: "Access exclusive guides, seasonal tips, and up-to-date fishing regulations for every region.",
  },
  {
    icon: Search,
    title: "Advanced Filters",
    description: "Filter by fish species, season, technique, and get AI-powered recommendations.",
  },
  {
    icon: Shield,
    title: "Verified Spots",
    description: "Every location is community-verified with honest reviews and real catch photos.",
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