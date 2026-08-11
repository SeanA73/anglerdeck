import { describe, it, expect } from "vitest";
import {
  spotScore,
  isPublished,
  isIndexable,
  PUBLISH_THRESHOLD,
  INDEX_THRESHOLD,
} from "../../scripts/spot-quality.mjs";

/**
 * The gate decides whether a spot page exists at all — it is not just an
 * indexing hint any more — and it is consulted from four places (prerender.mjs,
 * vite.config.ts, useSpots.ts, access-audit.mjs). So the behaviour worth pinning
 * is the shape of the decision, not the arithmetic: that a bare templated spot
 * is withheld, that verified access or an approved review is what rescues it,
 * and that reviews only count when the caller supplies an approved-only count.
 */

/**
 * A thin spot: not featured, nothing verified, and — like the real withheld
 * rows — not every templated field full either. Scores 3, so access detail (+2)
 * or a first approved review (+2) is exactly what publishes it.
 */
const templatedSpot = () => ({
  slug: "template-lake",
  featured: false,
  description: "x".repeat(300),
  species: ["trout", "perch", "pike"],
  regulations: ["licence required", "closed season", "check local rules"],
  best_times: ["spring", "dawn"],
  recommended_gear: { essential: ["rod", "reel", "line"] },
  access: null,
  reviewCount: 0,
});

describe("spotScore", () => {
  it("withholds a thin spot", () => {
    expect(spotScore(templatedSpot())).toBe(3);
    expect(isPublished(templatedSpot())).toBe(false);
  });

  it("publishes on template depth alone once every content field is full", () => {
    // Deliberate, and worth stating: five filled template fields reach the
    // threshold with no access record and no review. The gate rewards depth of
    // researched content, and this is the one path to publication that verified
    // access does not gate. If that ever stops being acceptable, raise
    // PUBLISH_THRESHOLD — do not special-case it at a call site.
    const deep = {
      ...templatedSpot(),
      best_times: ["spring", "dawn", "autumn"],
      recommended_gear: { essential: ["rod", "reel", "line", "net"] },
    };
    expect(spotScore(deep)).toBe(PUBLISH_THRESHOLD);
    expect(isPublished(deep)).toBe(true);
  });

  it("scores verified access detail at +2", () => {
    const spot = templatedSpot();
    const withAccess = {
      ...spot,
      access: { ramp: "Concrete ramp at the north end", sourceUrl: "https://example.gov" },
    };
    expect(spotScore(withAccess)).toBe(spotScore(spot) + 2);
  });

  it("scores one approved review at +2 and three at +3", () => {
    const spot = templatedSpot();
    expect(spotScore({ ...spot, reviewCount: 1 })).toBe(spotScore(spot) + 2);
    expect(spotScore({ ...spot, reviewCount: 2 })).toBe(spotScore(spot) + 2);
    expect(spotScore({ ...spot, reviewCount: 3 })).toBe(spotScore(spot) + 3);
  });

  it("treats a missing reviewCount as zero rather than crediting it", () => {
    const { reviewCount, ...noCount } = templatedSpot();
    expect(spotScore(noCount)).toBe(spotScore({ ...noCount, reviewCount: 0 }));
  });

  it("ignores an access record that verifies nothing", () => {
    const spot = templatedSpot();
    // shore/boat are how the spot is fished, not researched access detail, so
    // they must not earn the +2 on their own — otherwise a stub publishes a page.
    expect(spotScore({ ...spot, access: {} })).toBe(spotScore(spot));
    expect(spotScore({ ...spot, access: { shore: true, boat: true } })).toBe(spotScore(spot));
  });

  it("tolerates null and non-array fields instead of throwing", () => {
    expect(spotScore({})).toBe(0);
    expect(spotScore({ species: null, regulations: undefined, access: "nonsense" })).toBe(0);
  });
});

describe("isPublished", () => {
  it("publishes a featured spot with a full template", () => {
    // featured (+2) is what carries the marquee spots over on their own.
    expect(isPublished({ ...templatedSpot(), featured: true })).toBe(true);
  });

  it("publishes a withheld spot once access detail is added, with no code change", () => {
    const spot = templatedSpot();
    expect(isPublished(spot)).toBe(false);
    expect(isPublished({ ...spot, access: { parking: "Free gravel car park, 20 bays" } })).toBe(
      true
    );
  });

  it("publishes a withheld spot once a review is approved", () => {
    expect(isPublished({ ...templatedSpot(), reviewCount: 1 })).toBe(true);
  });

  it("agrees with the threshold constant", () => {
    expect(PUBLISH_THRESHOLD).toBe(5);
    // Publication and indexing are one decision now; the old name must resolve
    // to the same verdict rather than let a second gate grow.
    expect(INDEX_THRESHOLD).toBe(PUBLISH_THRESHOLD);
    expect(isIndexable).toBe(isPublished);
  });
});
