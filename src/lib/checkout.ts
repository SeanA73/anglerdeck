import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionTier } from '@/lib/stripe';

export interface CreateCheckoutParams {
  tier: Exclude<SubscriptionTier, 'free'>;
  billingPeriod: 'monthly' | 'yearly';
}

/**
 * Thrown when the user already has an active paid subscription. The edge
 * function returns `use_portal: true` in this case — the caller should direct
 * the user to the billing portal (via `openBillingPortal` in useSubscription)
 * rather than showing a generic error.
 */
export class PortalRedirectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortalRedirectError';
  }
}

export const createCheckoutSession = async ({
  tier,
  billingPeriod,
}: CreateCheckoutParams): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { tier, interval: billingPeriod },
  });

  if (error) {
    // functions.invoke collapses every non-2xx into a generic "Edge Function
    // returned a non-2xx status code" — the edge function's own JSON body
    // (e.g. `use_portal: true` when the user already has an active
    // subscription) is on the Response it attaches, so read that when it's
    // there.
    const body = await (error as { context?: Response }).context
      ?.json()
      .catch(() => null);
    if (body?.use_portal) {
      throw new PortalRedirectError(body.error || error.message);
    }
    throw new Error(body?.error || error.message || 'Failed to create checkout session');
  }

  const url = (data as { url?: string })?.url;
  if (!url) {
    throw new Error('No checkout URL returned');
  }

  return url;
};
