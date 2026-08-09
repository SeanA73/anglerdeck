import { describe, it, expect } from "vitest";
import {
  matchStrength,
  gearScore,
  rankGear,
  priceBand,
  gearCtaLabel,
  categoryArt,
} from "@/lib/gear";

/**
 * The catalog tags products generically ("trout", "bass") while spots carry
 * specific species ("rainbow trout", "largemouth bass"). The previous scoring
 * compared them with `===`, so species matching never fired and every
 * freshwater product tied on water type alone. These tests pin the behaviour
 * that replaced it.
 */
describe("matchStrength", () => {
  it("treats identical values as exact", () => {
    expect(matchStrength("trout", "trout")).toBe("exact");
    expect(matchStrength("Fly Fishing", "fly fishing")).toBe("exact");
  });

  it("matches a generic tag inside a specific species name", () => {
    expect(matchStrength("trout", "rainbow trout")).toBe("partial");
    expect(matchStrength("bass", "largemouth bass")).toBe("partial");
    expect(matchStrength("salmon", "Atlantic salmon")).toBe("partial");
    expect(matchStrength("tuna", "yellowfin tuna")).toBe("partial");
    expect(matchStrength("kingfish", "yellowtail kingfish")).toBe("partial");
  });

  it("matches a specific tag against a generic species name", () => {
    expect(matchStrength("yellowfin tuna", "tuna")).toBe("partial");
  });

  it("matches bass inside sea bass, as a fair whole-word hit", () => {
    expect(matchStrength("bass", "sea bass")).toBe("partial");
    expect(matchStrength("bass", "Argentine sea bass")).toBe("partial");
  });

  it("does not match fragments inside unrelated words", () => {
    expect(matchStrength("bass", "bassdash")).toBe("none");
    expect(matchStrength("cod", "codling")).toBe("none");
    expect(matchStrength("carp", "carpenter")).toBe("none");
    expect(matchStrength("perch", "perchance")).toBe("none");
  });

  it("does not match unrelated species that merely share a filler word", () => {
    expect(matchStrength("trout", "brown bear")).toBe("none");
    expect(matchStrength("pike", "northern lights")).toBe("none");
  });

  it("ignores accents so tags reach accented species names", () => {
    expect(matchStrength("pacu", "pacú")).toBe("exact");
    expect(matchStrength("surubi", "surubí")).toBe("exact");
  });

  it("returns none for empty values", () => {
    expect(matchStrength("", "trout")).toBe("none");
    expect(matchStrength("trout", "")).toBe("none");
  });
});

const flies = {
  title: "BASSDASH Assorted Trout Flies",
  tags: ["fly fishing", "trout", "grayling", "salmon"],
  category: "flies",
};
const saltReel = {
  title: "KastKing Sharky Saltwater Spinning Reel",
  tags: ["saltwater", "snapper", "tuna", "kingfish", "barramundi"],
  category: "reels",
};
const genericFresh = {
  title: "KastKing SteelStream Tool Kit",
  tags: ["freshwater", "saltwater", "fly fishing"],
  category: "tools",
};
const bassLures = {
  title: "Freshwater Lure Kit for Bass and Trout",
  tags: ["freshwater", "bass", "trout", "pike", "perch"],
  category: "lures",
};

describe("gearScore", () => {
  it("ranks a species-tagged product above a generic one on a trout river", () => {
    const madison = { waterTypes: ["Fly Fishing"], species: ["brown trout", "rainbow trout"] };
    expect(gearScore(flies, madison)).toBeGreaterThan(gearScore(genericFresh, madison));
  });

  it("scores nothing for a saltwater product on a freshwater trout river", () => {
    const madison = { waterTypes: ["Fly Fishing"], species: ["brown trout", "rainbow trout"] };
    expect(gearScore(saltReel, madison)).toBe(0);
  });

  it("counts each tag once, not once per matching species", () => {
    const oneTrout = { waterTypes: [], species: ["rainbow trout"] };
    const twoTrout = { waterTypes: [], species: ["rainbow trout", "brown trout"] };
    expect(gearScore(flies, twoTrout)).toBe(gearScore(flies, oneTrout));
  });

  it("weights an exact species tag above a partial one", () => {
    const exact = { waterTypes: [], species: ["grayling"] };
    const partial = { waterTypes: [], species: ["rainbow trout"] };
    expect(gearScore(flies, exact)).toBeGreaterThan(gearScore(flies, partial));
  });

  it("lets water type break a tie but not decide a ranking", () => {
    const bassLake = { waterTypes: ["Freshwater"], species: ["largemouth bass"] };
    // genericFresh matches only on water type; bassLures matches the species too.
    expect(gearScore(genericFresh, bassLake)).toBe(1);
    expect(gearScore(bassLures, bassLake)).toBeGreaterThan(1);
  });

  it("returns 0 when a product carries no tags at all", () => {
    expect(gearScore({ tags: null, category: null }, { species: ["cod"] })).toBe(0);
  });

  /**
   * Cairns holds "coral trout" — a reef grouper, not a trout. Whole-word
   * matching alone scored freshwater trout gear onto an offshore marlin page.
   */
  it("keeps freshwater gear off a saltwater spot that holds a coral trout", () => {
    const cairns = {
      waterTypes: ["Saltwater"],
      species: ["black marlin", "Spanish mackerel", "coral trout", "yellowfin tuna"],
    };
    expect(gearScore(flies, cairns)).toBe(0);
    expect(gearScore(bassLures, cairns)).toBe(0);
    expect(gearScore(saltReel, cairns)).toBeGreaterThan(0);
  });

  it("keeps saltwater gear off a freshwater spot", () => {
    expect(gearScore(saltReel, { waterTypes: ["Freshwater"], species: ["largemouth bass"] })).toBe(0);
  });

  it("still ranks fly gear on a freshwater trout lake", () => {
    // `flies` declares only "fly fishing"; a Freshwater spot must not exclude it.
    expect(
      gearScore(flies, { waterTypes: ["Freshwater"], species: ["rainbow trout"] })
    ).toBeGreaterThan(0);
  });

  it("does not exclude a product that declares both realms", () => {
    const bothRealms = { tags: ["freshwater", "saltwater"], category: "line" };
    expect(gearScore(bothRealms, { waterTypes: ["Saltwater"], species: [] })).toBeGreaterThan(0);
    expect(gearScore(bothRealms, { waterTypes: ["Freshwater"], species: [] })).toBeGreaterThan(0);
  });

  it("does not exclude a product that declares no water at all", () => {
    const speciesOnly = { tags: ["trout"], category: "tools" };
    expect(
      gearScore(speciesOnly, { waterTypes: ["Saltwater"], species: ["sea trout"] })
    ).toBeGreaterThan(0);
  });
});

describe("rankGear", () => {
  it("reorders a mixed catalog around the spot, keeping ties stable", () => {
    const catalog = [genericFresh, saltReel, bassLures, flies];

    const marlinGround = {
      waterTypes: ["Saltwater"],
      species: ["black marlin", "yellowfin tuna", "giant trevally"],
    };
    expect(rankGear(catalog, marlinGround)[0]).toBe(saltReel);

    const bassImpoundment = {
      waterTypes: ["Freshwater"],
      species: ["largemouth bass", "golden perch"],
    };
    expect(rankGear(catalog, bassImpoundment)[0]).toBe(bassLures);

    const troutRiver = {
      waterTypes: ["Fly Fishing"],
      species: ["brown trout", "rainbow trout"],
    };
    expect(rankGear(catalog, troutRiver)[0]).toBe(flies);
  });
});

describe("priceBand", () => {
  it("bands a stored price rather than returning a number", () => {
    expect(priceBand(11.03)).toBe("Budget");
    expect(priceBand(25)).toBe("Budget");
    expect(priceBand(25.01)).toBe("Mid-range");
    expect(priceBand(75)).toBe("Mid-range");
    expect(priceBand(120)).toBe("Premium");
  });

  it("returns null when no price is recorded", () => {
    expect(priceBand(null)).toBeNull();
    expect(priceBand(undefined)).toBeNull();
    expect(priceBand(Number.NaN)).toBeNull();
  });
});

describe("gearCtaLabel", () => {
  it("tells Amazon visitors to check the price there", () => {
    expect(gearCtaLabel("amazon")).toBe("Check price on Amazon");
  });

  it("stays generic for other merchants", () => {
    expect(gearCtaLabel("bass_pro_shops")).toBe("View on bass pro shops");
    expect(gearCtaLabel(null)).toBe("View product");
  });
});

describe("categoryArt", () => {
  it("maps every seeded category to artwork and falls back for the rest", () => {
    const seeded = ["apparel", "line", "tools", "storage", "combos", "lures", "reels", "flies"];
    for (const c of seeded) expect(categoryArt(c)).toBeTruthy();
    expect(categoryArt("something-new")).toBe(categoryArt(null));
  });
});
