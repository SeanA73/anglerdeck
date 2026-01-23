import { motion } from "framer-motion";
import { MapPin, Mail, Twitter, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Product: ["Features", "Premium", "Pricing", "Download"],
    Company: ["About", "Blog", "Careers", "Press"],
    Resources: ["Help Center", "Community", "Guides", "Regulations"],
    Legal: ["Privacy", "Terms", "Cookies", "Licenses"],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-accent-foreground font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-foreground">FishTrack</span>
            </motion.div>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Your ultimate companion for discovering and sharing the best fishing spots worldwide.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Instagram, Facebook].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-muted/80 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-accent transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 FishTrack. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            Made for anglers, everywhere
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;