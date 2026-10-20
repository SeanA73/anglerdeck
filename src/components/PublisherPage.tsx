import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import pages from "@/data/publisher-pages.json";

export default function PublisherPage({ page }: { page: keyof typeof pages }) {
  const content = pages[page];
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={content.title} description={content.description} canonicalPath={`/${page}`} />
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-28 pb-16 flex-1">
        <article className="max-w-3xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
            <p className="text-lg text-muted-foreground">{content.intro}</p>
          </header>
          {content.sections.map(section => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map(paragraph => (
                <p key={paragraph} className="text-muted-foreground leading-relaxed">{paragraph}</p>
              ))}
            </section>
          ))}
          <p>
            <a className="text-accent underline" href="mailto:support@anglerdeck.com">Email support@anglerdeck.com</a>
            {" · "}<Link className="text-accent underline" to={page === "about" ? "/contact" : "/about"}>
              {page === "about" ? "Contact us" : "About our research"}
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
