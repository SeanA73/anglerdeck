import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
// TODO: image content still says CastLog/ReelSpot, needs to be regenerated with AnglerDeck branding.
import anglerdeckLogo from "@/assets/anglerdeck-logo.png";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// Social links — uncomment and add real handles before launch
// const socialLinks = [
//   { Icon: Twitter,   href: "https://twitter.com/anglerdeck" },
//   { Icon: Instagram, href: "https://instagram.com/anglerdeck" },
//   { Icon: Facebook,  href: "https://facebook.com/anglerdeck" },
//   { Icon: Youtube,   href: "https://youtube.com/@anglerdeck" },
// ];

const Footer = () => {
  const footerLinks = {
    Explore: [
      { name: "Fishing Spots", href: "/spots" },
      { name: "Map View", href: "/map" },
      { name: "My Catches", href: "/catches" },
    ],
    Premium: [
      { name: "Go Pro", href: "/pricing" },
      { name: "Pro Features", href: "/pricing#features" },
      { name: "Elite Membership", href: "/pricing#elite" },
      { name: "Compare Plans", href: "/pricing" },
    ],
    Support: [
      { name: "Help Center", href: "/support" },
      { name: "Contact Us", href: "/contact" },
      { name: "Regulations", href: "/regulations" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Licenses", href: "/licenses" },
    ],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-6"
            >
              <img src={anglerdeckLogo} alt="AnglerDeck" className="w-10 h-10 rounded-xl shadow-lg" />
              <span className="text-xl font-bold text-foreground">AnglerDeck</span>
            </motion.div>
            <p className="text-muted-foreground mb-4 max-w-xs">
              Your ultimate companion for discovering and sharing the best fishing spots worldwide.
            </p>
            <NewsletterSignup className="mb-6 max-w-sm" compact source="footer" />
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-1"
            >
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-accent transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-accent transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 AnglerDeck. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-accent" />
            Made for anglers, everywhere
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;