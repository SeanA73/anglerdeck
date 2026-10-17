/**
 * Cookie consent state, readable outside the banner component.
 *
 * The banner writes preferences to localStorage; ad and analytics code needs to
 * read them (and react to changes) without being a child of the banner.
 */

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const COOKIE_CONSENT_KEY = "anglerdeck-cookie-consent";
export const CONSENT_CHANGED_EVENT = "anglerdeck-consent-changed";
export const OPEN_PREFERENCES_EVENT = "anglerdeck-open-cookie-preferences";

/**
 * Reopens the cookie preferences dialog from anywhere in the app.
 *
 * The banner only ever shows while no decision is stored, so without this there
 * is no way back into the dialog once a visitor has chosen. GDPR art. 7(3)
 * requires withdrawing consent to be as easy as giving it, and the privacy and
 * cookie policies both promise the choice can be changed at any time.
 */
export const openCookiePreferences = () => {
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
};

export const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

/** Returns stored preferences, or null if the visitor has not chosen yet. */
export const readConsent = (): CookiePreferences | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const values = parsed as Record<string, unknown>;
    return {
      essential: true,
      functional: values.functional === true,
      analytics: values.analytics === true,
      marketing: values.marketing === true,
    };
  } catch {
    return null;
  }
};

export const writeConsent = (prefs: CookiePreferences) => {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
  updateGoogleConsent(prefs);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: prefs }));
};

/**
 * Google Consent Mode v2.
 *
 * Defaults are set to denied before any Google tag loads, then updated once the
 * visitor chooses. This is required for serving personalised ads to visitors in
 * the EEA, the UK and Switzerland.
 *
 * NOTE: Consent Mode alone does not satisfy Google's requirement for a
 * *certified* CMP on EEA, UK and Swiss traffic. See docs in the AdBanner
 * component.
 */
type ConsentValue = "granted" | "denied";

interface GtagWindow extends Window {
  anglerdeckConsentDefaultsSet?: boolean;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

const gtag = function (..._args: unknown[]) {
  const win = window as GtagWindow;
  win.dataLayer = win.dataLayer || [];
  // Google's snippet requires `arguments`, not an array.
  // eslint-disable-next-line prefer-rest-params
  win.dataLayer.push(arguments);
};

export const initGoogleConsentDefaults = () => {
  if (typeof window === "undefined") return;
  const stored = readConsent();
  const win = window as GtagWindow;
  // The HTML bootstrap runs before AdSense; standalone consumers still need a default.
  if (win.anglerdeckConsentDefaultsSet) {
    if (stored) updateGoogleConsent(stored);
    return;
  }
  win.anglerdeckConsentDefaultsSet = true;
  const analytics: ConsentValue = stored?.analytics ? "granted" : "denied";

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: analytics,
    functionality_storage: stored?.functional ? "granted" : "denied",
    security_storage: "granted",
  });
};

export const updateGoogleConsent = (prefs: CookiePreferences) => {
  if (typeof window === "undefined") return;
  const analytics: ConsentValue = prefs.analytics ? "granted" : "denied";

  gtag("consent", "update", {
    // Ad signals belong to the certified CMP; local preferences cannot override it.
    analytics_storage: analytics,
    functionality_storage: prefs.functional ? "granted" : "denied",
    security_storage: "granted",
  });
};
