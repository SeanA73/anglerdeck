import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { COUNTRIES } from "@/lib/countries";
import { countryGuide } from "@/lib/country-guides";

/**
 * One card per country AnglerDeck covers, built from COUNTRIES and
 * src/data/country-guides.json. scripts/prerender.mjs reads the same JSON for
 * the crawlable body, so the prerendered page and the hydrated page cannot
 * drift apart.
 *
 * This page used to cover four countries from regulation-regions.json, which
 * held a second copy of licensing facts that also appear on the country hubs.
 * One file now serves both, because a licence rule stated twice will eventually
 * be corrected once.
 */
const regions = COUNTRIES.map((country) => {
  const guide = countryGuide(country.code);
  return {
    name: country.name,
    slug: country.slug,
    description: guide?.regulations ?? "",
    links: guide ? [guide.authority, ...guide.links] : [],
  };
}).filter((region) => region.description);

const Regulations = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Keep in step with the /regulations entry in scripts/static-routes.mjs
          — that copy is what crawlers read, this one only applies after
          hydration. The previous description described a page that does not
          exist: state-by-state Australian rules with bag and size limits, on a
          page covering four countries and carrying no numbers at all. It now
          covers all nineteen, so both copies were updated together. */}
      <SEO title="Fishing Regulations" description="Licence requirements and official fisheries links for all 19 countries AnglerDeck covers, from the rod licence in England to Japan's local yugyo permits." canonicalPath="/regulations" />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wide mb-5">
            <MapPin className="w-3.5 h-3.5" />
            {regions.length} countries
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">Fishing Regulations</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            What a visiting angler actually needs in each of the {regions.length}{" "}
            countries AnglerDeck covers, with a link to the official authority in
            every case. Always fish responsibly and legally.
          </p>
        </motion.div>

        <Card className="bg-amber-500/10 border-amber-500/20 rounded-2xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Important Disclaimer</h3>
                <p className="text-muted-foreground">
                  Fishing regulations change frequently. The information on this page is for general guidance only. 
                  Always verify current regulations with official local authorities before fishing. 
                  AnglerDeck is not responsible for any violations resulting from outdated information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {regions.map((region, index) => (
            <motion.div
              key={region.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              // Capped: nineteen cards at 0.1s each would stagger for almost
              // two seconds, so later cards would appear to be missing.
              transition={{ delay: Math.min((index % 2) * 0.05, 0.4) }}
            >
              <Card className="h-full rounded-2xl border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <MapPin className="w-5 h-5 text-accent" />
                    </div>
                    <CardTitle>{region.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{region.description}</p>
                  <div className="space-y-2">
                    {region.links.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-accent hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.name}
                      </a>
                    ))}
                    <Link
                      to={`/fishing/${region.slug}`}
                      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border border-border text-sm text-foreground hover:border-accent hover:text-accent transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Fishing in {region.name}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle>General Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Always carry a valid fishing license for the area you're fishing in
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Respect catch limits and size restrictions for each species
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Be aware of seasonal closures and protected areas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Practice catch and release when appropriate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Leave no trace - pack out all garbage and fishing line
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Report any illegal fishing activity to local authorities
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Regulations;
