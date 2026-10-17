import { trackEvent } from '@/lib/analytics';
import { readConsent } from '@/lib/cookieConsent';

const amazonTag = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'anglerdeck-20';
const clickbankHop = import.meta.env.VITE_CLICKBANK_HOP_ID || 'anglerdeck';
export const bookingAffiliateId = import.meta.env.VITE_BOOKING_AFFILIATE_ID || '';
export const airbnbAffiliateId = import.meta.env.VITE_AIRBNB_AFFILIATE_ID || '';

export const buildAmazonUrl = (asin: string) =>
  `https://www.amazon.com/dp/${asin}?tag=${amazonTag}`;

/** Pull the 10-character ASIN out of any Amazon product URL shape. */
export const extractAsin = (url: string): string | null => {
  const m =
    url.match(/(?:\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i) ??
    url.match(/[?&]asin=([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
};

/**
 * Turn any pasted Amazon URL (search-result links, links with tracking
 * params, mobile links, someone else's tag…) into the canonical short form
 * carrying OUR affiliate tag. Returns null when no ASIN can be found.
 */
export const normalizeAmazonUrl = (url: string): string | null => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (
    !["https:", "http:"].includes(parsed.protocol) ||
    parsed.username || parsed.password || parsed.port ||
    !/^(?:www\.|m\.|smile\.)?amazon\.(?:com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp|in|com\.br|com\.mx|nl|se|pl|com\.be|ie|sg|ae|sa|com\.tr|eg|co\.za)$/.test(parsed.hostname)
  ) return null;
  const asin = extractAsin(parsed.pathname + parsed.search);
  return asin ? buildAmazonUrl(asin) : null;
};

export const buildClickbankUrl = (vendorPath: string) =>
  `https://${vendorPath}?hop=${clickbankHop}`;

export const trackAffiliateClick = (
  source: string,
  productId?: string,
  extra?: Record<string, unknown>
) => {
  if (readConsent()?.analytics !== true) return;
  trackEvent('affiliate_click', {
    product_source: source,
    product_id: productId,
    ...extra,
  });
};

export const getBookingUrl = (location: string) => {
  const params = new URLSearchParams({
    ss: location,
    ...(bookingAffiliateId ? { aid: bookingAffiliateId } : {}),
  });
  return `https://www.booking.com/searchresults.html?${params}`;
};

export const getAirbnbUrl = (location: string) => {
  const base = `https://www.airbnb.com/s/${encodeURIComponent(location)}/homes`;
  return airbnbAffiliateId ? `${base}?af_id=${airbnbAffiliateId}` : base;
};

export const parsePriceValue = (price: string): number => {
  const match = price.replace(/[^0-9.]/g, '');
  return parseFloat(match) || 0;
};
