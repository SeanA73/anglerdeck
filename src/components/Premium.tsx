import { motion } from "framer-motion";
import { Check, Crown, Zap, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const premiumFeatures = [
  "Unlimited spot saves and downloads",
  "Exclusive detailed topographic maps",
  "Priority access to new locations",
  "Advanced weather forecasting",
  "Private spots and personal notes",
  "Expert guides and video tutorials",
  "Ad-free experience",
  "Early access to new features",
];

const Premium = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6">
              <Crown className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Premium</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Unlock the Full
              <span className="text-gradient-amber"> Experience</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get unlimited access to premium maps, exclusive spots, and expert content with WildTrack Pro.
            </p>
          </motion.div>

          {/* Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-3xl bg-gradient-card border border-accent/30 p-8 md:p-12 shadow-elevated"
          >
            {/* Decorative Icons */}
            <div className="absolute top-6 right-6 opacity-20">
              <Map className="w-24 h-24 text-accent" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left - Pricing */}
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-bold text-foreground">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  or $79.99/year (save 33%)
                </p>

                <div className="space-y-4 mb-8">
                  <Button variant="premium" size="xl" className="w-full">
                    <Zap className="w-5 h-5" />
                    Start 7-Day Free Trial
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Cancel anytime. No commitment.
                  </p>
                </div>
              </div>

              {/* Right - Features */}
              <div className="space-y-4">
                {premiumFeatures.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Premium;