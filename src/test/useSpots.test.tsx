import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useSpots, useAllSpots } from "@/hooks/useSpots";

/**
 * useSpots is the single client-side chokepoint for the publication gate: seven
 * components read spots through it, and the reason the filter lives here rather
 * than in each of them is that a new consumer added later must not be able to
 * leak an unpublished spot into a list, a map or a search result.
 *
 * These tests pin that boundary — published-only by default, everything only via
 * the explicitly-named escape hatch — and the deliberate fail-open when approved
 * review counts cannot be read.
 */

const { state } = vi.hoisted(() => ({
  state: {
    spots: { data: [] as unknown[], error: null as { message: string } | null },
    reviews: {
      data: [] as { spot_id: number }[],
      error: null as { message: string } | null,
    },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    // Mirrors the two calls the hook makes:
    //   from("spots").select("*").order("id", …)
    //   from("spot_reviews").select("spot_id").eq("status", "approved")
    from: (table: string) => ({
      select: () => {
        const result = table === "spots" ? state.spots : state.reviews;
        return {
          order: () => Promise.resolve(result),
          eq: () => Promise.resolve(result),
        };
      },
    }),
  },
}));

/** A thin spot: scores 3, so it is withheld unless access or a review rescues it. */
const thinRow = (id: number, slug: string) => ({
  id,
  slug,
  title: `Spot ${id}`,
  location: "Somewhere",
  country: "AU",
  type: "Freshwater",
  species: ["trout", "perch", "pike"],
  image_key: "fishing-spot",
  featured: false,
  description: "x".repeat(300),
  coordinates: { lat: 0, lng: 0 },
  water_temperature: { current: 10, unit: "C", trend: "stable" },
  weather: {},
  tides: {},
  recommended_gear: { essential: ["rod", "reel", "line"], optional: [] },
  best_times: ["spring", "dawn"],
  difficulty: "Beginner",
  regulations: ["licence required", "closed season", "check local rules"],
  access: null,
  sponsored: null,
  sponsored_url: null,
});

/** The same spot with verified access detail: +2, so it publishes. */
const publishedRow = (id: number, slug: string) => ({
  ...thinRow(id, slug),
  access: { ramp: "Concrete ramp, north end", sourceUrl: "https://example.gov" },
});

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  state.spots = { data: [], error: null };
  state.reviews = { data: [], error: null };
});

describe("useSpots", () => {
  it("returns published spots only", async () => {
    state.spots.data = [publishedRow(1, "published-lake"), thinRow(2, "thin-lake")];

    const { result } = renderHook(() => useSpots(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.map((s) => s.slug)).toEqual(["published-lake"]);
  });

  it("counts approved reviews, so a review publishes an otherwise thin spot", async () => {
    state.spots.data = [thinRow(1, "reviewed-lake"), thinRow(2, "thin-lake")];
    state.reviews.data = [{ spot_id: 1 }];

    const { result } = renderHook(() => useSpots(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.map((s) => s.slug)).toEqual(["reviewed-lake"]);
  });

  it("fails open when approved review counts cannot be read", async () => {
    // Treating unreadable counts as zero would be the stricter guess and the
    // wrong one: it would hide spots the build published and 404 pages that
    // exist in dist/ and in the sitemap.
    state.spots.data = [publishedRow(1, "published-lake"), thinRow(2, "thin-lake")];
    state.reviews = { data: [], error: { message: "column does not exist" } };

    const { result } = renderHook(() => useSpots(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.map((s) => s.slug)).toEqual([
      "published-lake",
      "thin-lake",
    ]);
  });

  it("propagates a spots query failure rather than reporting an empty catalogue", async () => {
    state.spots = { data: [], error: { message: "network down" } };

    const { result } = renderHook(() => useSpots(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useAllSpots", () => {
  it("returns unpublished spots too, for the user's own saved and logged data", async () => {
    state.spots.data = [publishedRow(1, "published-lake"), thinRow(2, "thin-lake")];

    const { result } = renderHook(() => useAllSpots(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.map((s) => s.slug)).toEqual([
      "published-lake",
      "thin-lake",
    ]);
  });
});
