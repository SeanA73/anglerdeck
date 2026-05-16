import { loadStripe } from '@stripe/stripe-js';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn('VITE_STRIPE_PUBLISHABLE_KEY is not set');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
    free: {
        id: 'free',
        name: 'Angler',
        price: 0,
        priceId: null,
        features: [
            '10 spot views per month',
            '5 catch logs per month',
            'Basic water conditions',
            'Community feed (view only)',
            'Basic weather info',
        ],
        limits: {
            spotsPerMonth: 10,
            catchesPerMonth: 5,
            offlineMaps: 0,
        },
    },
    pro: {
        id: 'pro',
        name: 'Pro Angler',
        price: 9.99,
        priceMonthly: 'price_pro_monthly',
        priceYearly: 'price_pro_yearly',
        features: [
            'Unlimited spot access',
            'Unlimited catch logging',
            'Ad-free experience',
            'Advanced water conditions (7-day forecast)',
            'Catch analytics dashboard',
            'Offline map downloads (10 regions)',
            'Priority customer support',
            'Pro badge on profile',
            'Export catch data (CSV, PDF)',
            'Real-time tide predictions',
        ],
        limits: {
            spotsPerMonth: Infinity,
            catchesPerMonth: Infinity,
            offlineMaps: 10,
        },
    },
    elite: {
        id: 'elite',
        name: 'Master Angler',
        price: 29.99,
        priceMonthly: 'price_elite_monthly',
        priceYearly: 'price_elite_yearly',
        features: [
            'Everything in Pro',
            'AI catch predictions',
            'Personalized spot recommendations',
            '1-on-1 monthly coaching call',
            'Access to exclusive Elite-only spots',
            'Advanced trip planning tools',
            'Unlimited offline maps',
            'White-glove customer support',
            'Early access to new features',
            '20% discount on marketplace purchases',
            'Priority listing in guide directory',
            'Custom profile themes',
        ],
        limits: {
            spotsPerMonth: Infinity,
            catchesPerMonth: Infinity,
            offlineMaps: Infinity,
        },
    },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export const FEATURE_ACCESS = {
    unlimited_spots: ['pro', 'elite'],
    unlimited_catches: ['pro', 'elite'],
    advanced_weather: ['pro', 'elite'],
    catch_analytics: ['pro', 'elite'],
    offline_maps: ['pro', 'elite'],
    ai_predictions: ['elite'],
    coaching: ['elite'],
    elite_spots: ['elite'],
    marketplace_discount: ['elite'],
    no_ads: ['pro', 'elite'],
    export_data: ['pro', 'elite'],
    trip_planning: ['elite'],
    custom_themes: ['elite'],
} as const;

export type Feature = keyof typeof FEATURE_ACCESS;

export const hasFeatureAccess = (
    userTier: SubscriptionTier,
    feature: Feature
): boolean => {
    const allowedTiers = FEATURE_ACCESS[feature] as readonly string[];
    return allowedTiers.includes(userTier);
};

export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
};

export const getAnnualDiscount = (monthlyPrice: number): number => {
    const annualPrice = monthlyPrice * 12 * 0.75;
    return monthlyPrice * 12 - annualPrice;
};

export const getAnnualPrice = (monthlyPrice: number): number => {
    return monthlyPrice * 12 * 0.75;
};
