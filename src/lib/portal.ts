import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a Stripe Customer Portal session for the current user
 * and returns the URL to redirect to.
 *
 * Caller is responsible for redirecting (e.g. window.location.href = url).
 *
 * Throws if:
 * - User not logged in
 * - User has no Stripe customer (i.e. never subscribed)
 * - Server-side error
 */
export const createPortalSession = async (): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: {}, // No body needed — function uses JWT to identify user
  });

  if (error) {
    throw new Error(error.message || 'Failed to create portal session');
  }

  const url = (data as { url?: string })?.url;
  if (!url) {
    throw new Error('No portal URL returned');
  }

  return url;
};