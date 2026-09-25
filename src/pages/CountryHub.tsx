import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Fish, ArrowRight, ExternalLink, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO, BASE_URL } from "@/components/SEO";
import { useSpots } from "@/hooks/useSpots";
import { countryBySlug } from "@/lib/countries";
import { countryGuide } from "@/lib/country-guides";
import { guidePath, guidesForCountry } from "@/lib/guides";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ads/AdBanner";
import { AffiliateGear } from "@/components/ads/AffiliateGear";

/**
 * Country hub page.
 *
 * Individual spot pages can only compete on long-tail queries. These hubs give
 * the site something that can rank for head terms like "fishing spots in
 * Norway", and act as the parent in the internal link hierarchy — global index
 * down to country, country down to spot, spot back up.
 */
const CountryHub = () => {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const country = countryBySlug(countrySlug || "");
  const { data: spots = [], isLoading } = useSpots();
  // Same guide the prerenderer writes into the crawlable body, so the hydrated
  // page and the static HTML say the same thing about licensing.
  const guide = country ? countryGuide(country.code) : undefined;
  // Articles that cover this country, matched on the ISO codes in guides.json.
  // The prerendered hub body renders the same list from the same data, and each
  // article section links back here — a comparison article nothing links to
  // earns nothing.
  const articles = country ? guidesForCountry(country.code) : [];

  const countrySpots = useMemo(
    () => spots.filter((s) => s.country === country?.code),
    [spots, country]
  );

  const species = useMemo(() => {
    const set = new Set<string>();
    countrySpots.forEach((s) => s.species.forEach((sp) => set.add(sp)));
    return [...set].sort();
  }, [countrySpots]);

  const waterTypes = useMemo(() => {
    const counts = new Map<string, number>();
    countrySpots.forEach((s) => counts.set(s.type, (counts.get(s.type) ?? 0) + 1));
    return [...counts.entries()];
  }, [countrySpots]);

  if (!country) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Country not found</h1>
          <Button asChild>
            <Link to="/spots">Browse all spots</Link>
          </Button>
        </div>
      </div>
    );
  }

  const title = `Fishing in ${country.name} — Spots, Licences & Access`;
  const description = `${countrySpots.length} researched fishing spots in ${country.name}, with verified access details, licence requirements and seasons.`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={title}
        description={description}
        canonicalPath={`/fishing/${country.slug}`}
      />
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-4 lg:px-8 py-12 pt-28">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/spots" className="hover:text-foreground">
            Fishing spots
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{country.name}</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wide mb-5">
            <MapPin className="w-3.5 h-3.5" />
            {country.name}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
            Fishing in {country.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl border-l-2 border-accent/50 pl-4">
            {country.blurb}
          </p>
        </motion.div>

        {countrySpots.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-8 text-sm">
            <div>
              <span className="text-2xl font-bold text-foreground">
                {countrySpots.length}
              </span>
              <span className="text-muted-foreground ml-2">spots</span>
            </div>
            {waterTypes.map(([type, n]) => (
              <div key={type}>
                <span className="text-2xl font-bold text-foreground">{n}</span>
                <span className="text-muted-foreground ml-2">{type}</span>
              </div>
            ))}
          </div>
        )}

        {/* The researched guide: how licensing works, the shape of the season and
            what the water is like. Every claim traces to the official source
            linked at the end of the section — see src/data/country-guides.json,
            which is also what the prerenderer reads. */}
        {guide && (
          <section className="mt-10 max-w-3xl">
            {[
              { heading: `Licences and permits in ${country.name}`, body: guide.licensing },
              { heading: `When to fish in ${country.name}`, body: guide.seasons },
              { heading: "What the fishing is like", body: guide.water },
            ].map((item, i) => (
              <motion.div
                key={item.heading}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4 }}
                className={i === 0 ? "" : "mt-10 pt-8 border-t border-border/50"}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono text-accent/70 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-xl font-bold text-foreground">{item.heading}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
            <div className="mt-10 pt-8 border-t border-border/50">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Official sources
              </h3>
              <div className="space-y-2">
                {[guide.authority, ...guide.links].map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Guides covering {country.name}
            </h2>
            <div className="space-y-3">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  to={guidePath(article.slug)}
                  className="group block p-4 rounded-2xl border border-border/50 bg-card hover:border-accent/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {article.headline}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {article.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {species.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <Fish className="w-5 h-5 text-accent" />
              Species you can target
            </h2>
            <div className="flex flex-wrap gap-2">
              {species.map((sp) => (
                <span
                  key={sp}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground"
                >
                  {sp}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Hubs are primary organic landing pages, so they carry a placement.
            Hidden from Pro and Elite subscribers by AdBanner. */}
        <AdBanner
          slot={import.meta.env.VITE_ADSENSE_SLOT_HUB ?? ""}
          format="horizontal"
        />

        {/* Matched on the water types this country actually has, not its
            species — a country-wide species list is too broad to rank
            usefully. Spot pages do the species-level matching. */}
        {countrySpots.length > 0 && (
          <div className="mt-8 max-w-xl">
            <AffiliateGear
              waterTypes={waterTypes.map(([type]) => type)}
              heading={`Gear for fishing in ${country.name}`}
              blurb="Hand-picked gear for the water here. We may earn a commission on purchases."
            />
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Fishing spots in {country.name}
          </h2>

          {isLoading ? (
            <p className="text-muted-foreground">Loading spots…</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {countrySpots.map((spot) => (
                <Link
                  key={spot.id}
                  to={`/spot/${spot.slug}`}
                  className="group block p-5 rounded-2xl border border-border/50 bg-card hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                        {spot.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {spot.location}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {spot.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {spot.type} · {spot.difficulty} ·{" "}
                        {spot.species.slice(0, 3).join(", ")}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="mt-12 text-sm text-muted-foreground">
          Licence requirements and closed seasons change regularly. Always confirm
          with the relevant fisheries authority before you fish — each spot page
          links to its source.
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default CountryHub;
export { BASE_URL };
