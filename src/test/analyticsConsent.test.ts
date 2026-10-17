import { expect, it, vi } from "vitest";
import { CONSENT_CHANGED_EVENT, COOKIE_CONSENT_KEY } from "@/lib/cookieConsent";

it("loads analytics only after opting in and stops app measurement on withdrawal", async () => {
  vi.stubEnv("VITE_GA_ID", "G-ABC1234567");
  vi.resetModules();
  const { initAnalytics, trackEvent, pageview } = await import("@/lib/analytics");
  const originalGtag = window.gtag;
  window.gtag = vi.fn();
  localStorage.clear();
  try {
    initAnalytics();
    trackEvent("affiliate_click");
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
    expect(window.gtag).not.toHaveBeenCalled();

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ analytics: true }));
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).not.toBeNull();
    trackEvent("affiliate_click");
    expect(window.gtag).toHaveBeenCalledWith("event", "affiliate_click", undefined);

    vi.mocked(window.gtag!).mockClear();
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ analytics: false }));
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    trackEvent("affiliate_click");
    pageview("/gear");
    expect(window.gtag).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener(CONSENT_CHANGED_EVENT, initAnalytics);
    document.querySelector('script[src*="googletagmanager.com/gtag/js"]')?.remove();
    window.gtag = originalGtag;
    localStorage.clear();
    vi.unstubAllEnvs();
  }
});
