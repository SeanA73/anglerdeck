import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionTier } from '@/lib/stripe';

export interface CreateCheckoutParams {
  tier: Exclude<SubscriptionTier, 'free'>;
  billingPeriod: 'monthly' | 'yearly';
}

export const createCheckoutSession = async ({
  tier,
  billingPeriod,
}: CreateCheckoutParams): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { tier, interval: billingPeriod },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create checkout session');
  }

  const url = (data as { url?: string })?.url;
  if (!url) {
    throw new Error('No checkout URL returned');
  }

  return url;
};
