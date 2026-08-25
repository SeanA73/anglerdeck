import { ExternalLink } from "lucide-react";
import { spotGuide } from "@/lib/spot-guides";

/**
 * Renders the researched prose for a spot, plus its citations.
 *
 * Returns null when the spot has no guide yet, so pages that have not been
 * deepened look exactly as they did before rather than sprouting empty
 * headings. Guides are written a few spots at a time; most slugs have none.
 *
 * The sources list is deliberately visible. Every claim in the prose is meant
 * to be traceable to an official page, and showing that is the point — it is
 * the difference between this and the guide sites that assert the same things
 * with no provenance at all.
 *
 * Headings come from the data rather than being fixed here. See the note in
 * spot-guides.json: identical headings across 49 pages would be a longer
 * template, not an escape from one.
 */
export const SpotGuideSections = ({ slug }: { slug: string }) => {
  const guide = spotGuide(slug);
  if (!guide?.sections?.length) return null;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 space-y-6">
      {guide.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-xl font-bold text-foreground mb-3">{section.heading}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {section.body}
          </p>
        </section>
      ))}

      {guide.sources.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-sm font-medium text-foreground mb-3">Sources</h3>
          <ul className="space-y-2">
            {guide.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline inline-flex items-start gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{source.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
