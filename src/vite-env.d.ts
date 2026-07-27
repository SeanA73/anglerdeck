/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_GA_ID?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_AMAZON_AFFILIATE_TAG?: string;
  readonly VITE_AMAZON_ONELINK_ID?: string;
  readonly VITE_CLICKBANK_HOP_ID?: string;
  readonly VITE_BOOKING_AFFILIATE_ID?: string;
  readonly VITE_AIRBNB_AFFILIATE_ID?: string;
  readonly VITE_ADSENSE_CLIENT_ID?: string;
  readonly VITE_ADSENSE_SLOT_SPOTS?: string;
  readonly VITE_ADSENSE_SLOT_SPOT_DETAIL?: string;
  readonly VITE_ADSENSE_SLOT_COMMUNITY?: string;
  readonly VITE_ADSENSE_SLOT_MARKETPLACE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
