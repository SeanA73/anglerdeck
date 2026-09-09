import { describe, it, expect } from "vitest";
import { inlineRuns, isPlain } from "../../scripts/guide-inline.mjs";
import { GUIDES, guideRoutes, guidePath, guidesForCountry } from "../../scripts/guides.mjs";
import { guideBySlug, guides } from "@/lib/guides";
import { COUNTRIES } from "@/lib/countries";
import { countryGuide } from "@/lib/country-guides";

/**
 * The /guides section is data-driven so that adding an article is a data change
 * and never a code change. These tests are what makes that safe: they pin the
 * contract the data has to satisfy, so an article added later fails here rather
 * than shipping a broken page or an unsourced claim.
 */

/** Every block type both renderers handle. Adding one means editing both. */
const RENDERABLE_BLOCK_TYPES = ["p", "list", "table"];

describe("inlineRuns", () => {
  it("returns one plain run for text with no markup", () => {
    expect(inlineRuns("just prose")).toEqual([{ text: "just prose" }]);
    expect(isPlain("just prose")).toBe(true);
  });

  it("marks bold and keeps the surrounding text", () => {
    expect(inlineRuns("a **b** c")).toEqual([
      { text: "a " },
      { text: "b", strong: true },
      { text: " c" },
    ]);
  });

  it("marks italic", () => {
    expect(inlineRuns("a *fiskekort* permit")).toEqual([
      { text: "a " },
      { text: "fiskekort", em: true },
      { text: " permit" },
    ]);
  });

  // Bold has to win, or every `**` parses as two empty italics and the text
  // between them loses its marker.
  it("prefers bold over italic when both could match", () => {
    expect(inlineRuns("**both**")).toEqual([{ text: "both", strong: true }]);
  });

  it("handles several marks in one string", () => {
    const runs = inlineRuns("**Italy**: file a *comunicazione* first");
    expect(runs.filter((r) => r.strong).map((r) => r.text)).toEqual(["Italy"]);
    expect(runs.filter((r) => r.em).map((r) => r.text)).toEqual(["comunicazione"]);
  });

  // A typo in guides.json should show as a visible asterisk, not swallow the
  // rest of the paragraph into a mark that never closes.
  it("leaves an unmatched asterisk alone", () => {
    expect(inlineRuns("2 * 3 is six")).toEqual([{ text: "2 * 3 is six" }]);
    expect(inlineRuns("**unclosed")).toEqual([{ text: "**unclosed" }]);
  });

  it("tolerates empty and nullish input", () => {
    expect(inlineRuns("")).toEqual([]);
    expect(inlineRuns(undefined)).toEqual([]);
  });
});

describe("guides data", () => {
  it("is the same article list on both sides of the build", () => {
    // scripts/guides.mjs reads the JSON with fs for the prerenderer and the
    // route list; src/lib/guides.ts imports it for the pages. Different readers,
    // one file — if these ever disagree, one of them is reading a stale copy.
    expect(guides().map((g) => g.slug)).toEqual(GUIDES.map((g) => g.slug));
  });

  it("has at least one article", () => {
    expect(GUIDES.length).toBeGreaterThan(0);
  });

  it("has unique slugs, and every slug resolves", () => {
    const slugs = GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(guideBySlug(slug)).toBeDefined();
  });

  it("gives every article the head tags a prerendered page needs", () => {
    for (const g of GUIDES) {
      expect(g.title, `${g.slug} title`).toBeTruthy();
      expect(g.headline, `${g.slug} headline`).toBeTruthy();
      expect(g.summary, `${g.slug} summary`).toBeTruthy();
      // Google truncates around 155-160 characters, and this string is also the
      // prerendered <meta name="description">.
      expect(g.description.length, `${g.slug} description length`).toBeLessThanOrEqual(160);
      // Article JSON-LD needs a real date, not a placeholder.
      expect(g.datePublished, `${g.slug} datePublished`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("only uses block types both renderers handle", () => {
    for (const g of GUIDES) {
      const blocks = [...(g.intro || []), ...g.sections.flatMap((s) => s.blocks || [])];
      expect(blocks.length, `${g.slug} has blocks`).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(RENDERABLE_BLOCK_TYPES, `${g.slug} block type`).toContain(block.type);
      }
    }
  });

  it("keeps table rows the same width as their columns", () => {
    for (const g of GUIDES) {
      const tables = g.sections
        .flatMap((s) => s.blocks || [])
        .filter((b) => b.type === "table");
      for (const table of tables) {
        for (const row of table.rows) {
          expect(row.length, `${g.slug} table row width`).toBe(table.columns.length);
        }
      }
    }
  });

  // Country codes are the mechanism for both the official-source links and the
  // hub cross-links, so a typo would silently drop an article's sources — the
  // one thing content rule 2 will not tolerate.
  it("cites only countries that exist and have a researched guide", () => {
    const known = new Set(COUNTRIES.map((c) => c.code));
    for (const g of GUIDES) {
      expect(g.countries.length, `${g.slug} covers a country`).toBeGreaterThan(0);
      for (const code of g.countries) {
        expect(known, `${g.slug} cites ${code}`).toContain(code);
        expect(countryGuide(code), `${g.slug} sources for ${code}`).toBeDefined();
      }
      for (const section of g.sections) {
        for (const code of section.countries || []) {
          expect(known, `${g.slug}/${section.heading} cites ${code}`).toContain(code);
          // A section citing a country the article does not declare would render
          // sources the hub never links back from.
          expect(g.countries, `${g.slug}/${section.heading}`).toContain(code);
        }
      }
    }
  });

  it("links every cited country's hub back to the article", () => {
    for (const g of GUIDES) {
      for (const code of g.countries) {
        expect(
          guidesForCountry(code).map((a) => a.slug),
          `hub for ${code}`
        ).toContain(g.slug);
      }
    }
  });

  // Drafts in Temp/ carry a "Notes for Sean" section that is explicitly not for
  // publication. This is the mechanical check that none of it ever ships.
  it("carries no draft-only notes", () => {
    const everything = JSON.stringify(GUIDES).toLowerCase();
    expect(everything).not.toContain("notes for sean");
    expect(everything).not.toContain("not for publication");
    expect(everything).not.toContain("draft");
  });

  // The gap the two AdSense rejections were about. A 300-word "comparison"
  // would be the same thin content in a new directory.
  it("is long enough to be worth publishing", () => {
    for (const g of GUIDES) {
      const words = [...(g.intro || []), ...g.sections.flatMap((s) => s.blocks || [])]
        .filter((b) => b.type === "p")
        .map((b) => b.text)
        .join(" ")
        .split(/\s+/).length;
      expect(words, `${g.slug} word count`).toBeGreaterThan(800);
    }
  });
});

describe("guideRoutes", () => {
  it("emits the index plus one route per article", () => {
    const routes = guideRoutes();
    expect(routes[0].path).toBe("/guides");
    expect(routes.map((r) => r.path).slice(1)).toEqual(
      GUIDES.map((g) => guidePath(g.slug))
    );
  });

  // prerender.mjs writes a page per STATIC_ROUTES entry and vite.config.ts puts
  // the same list in the sitemap, and both read title and description from here.
  it("gives every route the head tags the prerenderer needs", () => {
    for (const route of guideRoutes()) {
      expect(route.title, route.path).toBeTruthy();
      expect(route.description, route.path).toBeTruthy();
    }
  });
});
