import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeAmazonUrl, trackAffiliateClick } from "@/lib/affiliate";
import { trackEvent } from "@/lib/analytics";
import { COOKIE_CONSENT_KEY } from "@/lib/cookieConsent";
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

describe("affiliate measurement preferences", () => {
  it("does not measure without an explicit analytics opt-in", () => {
    trackAffiliateClick("amazon", "product");
    expect(trackEvent).not.toHaveBeenCalled();
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ analytics: false }));
    trackAffiliateClick("amazon", "product");
    expect(trackEvent).not.toHaveBeenCalled();
  });
  it("records opted-in product clicks", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ analytics: true }));
    trackAffiliateClick("amazon", "product");
    expect(trackEvent).toHaveBeenCalledWith("affiliate_click", { product_source: "amazon", product_id: "product" });
  });
});

describe("Amazon affiliate URL normalization", () => {
  it("replaces another tag and preserves the product identity", () => {
    const result = normalizeAmazonUrl("https://www.amazon.com/dp/B012345678?tag=another-20");
    expect(result).toContain("https://www.amazon.com/dp/B012345678?tag=");
    expect(result).not.toContain("another-20");
  });

  it("accepts supported international and mobile product links", () => {
    for (const host of ["www.amazon.co.uk", "amazon.com.au", "m.amazon.de"]) {
      expect(normalizeAmazonUrl(`https://${host}/gp/product/B012345678`)).toContain("/dp/B012345678?");
    }
  });

  it("rejects lookalike hosts and links that only embed an Amazon URL", () => {
    for (const url of [
      "https://evil.example/amazon.com/dp/B012345678",
      "https://amazon.com.evil.example/dp/B012345678",
      "https://notamazon.com/dp/B012345678",
      "https://amazon.fake/dp/B012345678",
      "javascript:amazon.com/dp/B012345678",
      "https://user:password@amazon.com/dp/B012345678",
      "not a url",
    ]) expect(normalizeAmazonUrl(url)).toBeNull();
  });

  it("does not mistake search results for a product", () => {
    expect(normalizeAmazonUrl("https://www.amazon.com/s?k=fishing" )).toBeNull();
  });
});
