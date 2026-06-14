import { trackEvent } from '@/lib/analytics';

const amazonTag = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'castlog-20';
const clickbankHop = import.meta.env.VITE_CLICKBANK_HOP_ID || 'castlog';
export const bookingAffiliateId = import.meta.env.VITE_BOOKING_AFFILIATE_ID || '';
export const airbnbAffiliateId = import.meta.env.VITE_AIRBNB_AFFILIATE_ID || '';

export const buildAmazonUrl = (asin: string) =>
  `https://www.amazon.com/dp/${asin}?tag=${amazonTag}`;

export const buildClickbankUrl = (vendorPath: string) =>
  `https://${vendorPath}?hop=${clickbankHop}`;

export const trackAffiliateClick = (
  source: string,
  productId?: string,
  extra?: Record<string, unknown>
) => {
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
