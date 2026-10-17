import { CONSENT_CHANGED_EVENT, readConsent } from "@/lib/cookieConsent";
const RAW_GA_ID = import.meta.env.VITE_GA_ID;

/**
 * A real GA4 measurement ID is "G-" followed by an alphanumeric suffix. The
 * placeholder shipped in .env.example (G-XXXXXXXXXX) is a non-empty string, so
 * a plain truthiness check happily loads gtag against an ID that measures
 * nothing — which looks like working analytics until you go looking for data.
 */
const isRealGaId = (id?: string): boolean =>
  !!id && /^G-[A-Z0-9]+$/.test(id) && !/^G-X+$/.test(id);

export const GA_ID = isRealGaId(RAW_GA_ID) ? RAW_GA_ID : undefined;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let initialized = false;
let watchingConsent = false;

export const initAnalytics = () => {
  if (initialized || !GA_ID || typeof window === 'undefined') return;
  if (!watchingConsent) {
    watchingConsent = true;
    window.addEventListener(CONSENT_CHANGED_EVENT, initAnalytics);
  }
  if (readConsent()?.analytics !== true) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(..._args: unknown[]) {
    // Google consumes command arguments objects, rather than rest arrays.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  initialized = true;
};

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_ID && readConsent()?.analytics === true) {
    window.gtag('config', GA_ID, { page_path: url });
  }
};

export const trackEvent = (action: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag && readConsent()?.analytics === true) {
    window.gtag('event', action, params);
  }
};
