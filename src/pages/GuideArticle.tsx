import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { GuideBlocks } from "@/components/guides/GuideBlocks";
import { guideBySlug } from "@/lib/guides";
import { countryByCode } from "@/lib/countries";
import { countryGuide } from "@/lib/country-guides";
import { AdBanner } from "@/components/ads/AdBanner";

/**
 * One /guides article.
 *
 * The body comes from src/data/guides.json, which scripts/prerender.mjs also
 * reads to write the crawlable HTML — so this page and the static file say the
 * same thing. Adding an article is a change to that JSON and nothing else.
 *
 * A section's official sources are resolved here from country-guides.json by
 * the ISO codes the section carries, rather than stored on the article. That is
 * what lets the article promise a source for every claim without keeping a
 * second copy of any URL: the links are the ones the country hub and
 * /regulations already show.
 */

/** The sources and hub links for one section's countries. */
const SectionLinks = ({ codes }: { codes?: string[] }) => {
  if (!codes?.length) return null;

  const entries = codes
    .map((code) => ({ code, country: countryByCode(code), guide: countryGuide(code) }))
    .filter((e) => e.country);
  if (!entries.length) return null;

  const links = entries.flatMap((e) =>
    e.guide ? [e.guide.authority, ...e.guide.links] : []
  );

  return (
    <div className="mt-5 pl-4 border-l-2 border-border/60 space-y-2">
      {links.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Official sources
          </h3>
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-accent hover:underline"
            >
              <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
              {link.name}
            </a>
          ))}
        </>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
        {entries.map((e) => (
          <Link
            key={e.code}
            to={`/fishing/${e.country!.slug}`}
            className="flex items-center gap-1.5 text-sm text-foreground hover:text-accent transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Fishing in {e.country!.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

const GuideArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = guideBySlug(slug || "");

  // Unknown slugs are noindexed rather than published as an empty article, the
  // same call SpotDetail makes for an unpublished spot. Nothing links here and
  // the sitemap does not list it, but Google may hold a URL from a slug that was
  // renamed.
  if (!article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO
          title="Guide not found"
          description="This guide does not exist or has moved."
          noIndex
        />
        <Header />
        <main
          id="main-content"
          className="flex-1 container mx-auto px-4 py-24 text-center"
        >
          <h1 className="text-2xl font-bold text-foreground mb-4">Guide not found</h1>
          <p className="text-muted-foreground mb-6">
            This guide does not exist or has moved.
          </p>
          <Button asChild>
            <Link to="/guides">All fishing guides</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const countries = article.countries
    .map((code) => countryByCode(code))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Keep in step with src/data/guides.json, which is where the prerendered
          head tags for this route come from via scripts/static-routes.mjs. Both
          read the same `title` and `description`, so unlike every other page on
          the site there is no second copy here to fall out of step. */}
      <SEO
        title={article.title}
        description={article.description}
        canonicalPath={`/guides/${article.slug}`}
        ogType="article"
      />
      <Header />

      <main
        id="main-content"
        className="flex-1 container mx-auto px-4 lg:px-8 py-12 pt-28"
      >
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/guides" className="hover:text-foreground">
            Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{article.headline}</span>
        </nav>

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {article.headline}
          </h1>
          <p className="text-lg text-muted-foreground">{article.summary}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            <time dateTime={article.datePublished}>
              Published {article.datePublished}
            </time>
            {article.dateModified && article.dateModified !== article.datePublished && (
              <>
                {" · "}
                <time dateTime={article.dateModified}>
                  updated {article.dateModified}
                </time>
              </>
            )}
          </p>
        </motion.header>

        <div className="max-w-3xl mt-10 space-y-4">
          <GuideBlocks blocks={article.intro} />
        </div>

        {article.sections.map((section) => (
          <section key={section.heading} className="max-w-3xl mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {section.heading}
            </h2>
            <div className="space-y-4">
              <GuideBlocks blocks={section.blocks} />
            </div>
            <SectionLinks codes={section.countries} />
          </section>
        ))}

        {/* One placement, below the article. Hidden from Pro and Elite by
            AdBanner. Guides carry no gear block: this section exists to earn
            citations, and a commercial unit mid-argument is what makes a
            comparison look like an affiliate page. */}
        <div className="max-w-3xl">
          <AdBanner
            slot={import.meta.env.VITE_ADSENSE_SLOT_HUB ?? ""}
            format="horizontal"
          />
        </div>

        <div className="max-w-3xl mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Licence requirements and closed seasons change regularly. Always
            confirm with the relevant fisheries authority before you fish — every
            section above links to the official source for the claims it makes.
          </p>

          {countries.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-4">
                Countries covered in this guide
              </h2>
              <div className="flex flex-wrap gap-2">
                {countries.map((country) => (
                  <Link
                    key={country.code}
                    to={`/fishing/${country.slug}`}
                    className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                  >
                    Fishing in {country.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-4 mt-8 text-sm">
            <Link to="/guides" className="text-accent hover:underline">
              All fishing guides
            </Link>
            <Link to="/regulations" className="text-accent hover:underline">
              Regulations and licences by country
            </Link>
            <Link to="/spots" className="text-accent hover:underline">
              Browse all fishing spots
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GuideArticle;
