// Custom hook for subscription management and feature access
// Connects to the subscriptions and spot_views tables
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  SUBSCRIPTION_TIERS,
  hasFeatureAccess,
  type SubscriptionTier,
  type Feature,
} from '@/lib/stripe';

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export interface UsageStats {
  spotsViewedThisMonth: number;
  catchesLoggedThisMonth: number;
  offlineMapsDownloaded: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch subscription from database
  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription> => {
      if (!user) {
        return { id: '', tier: 'free', status: 'active' };
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return { id: '', tier: 'free', status: 'active' };
      }

      if (!data) {
        // Create a free subscription for the user if none exists
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({ user_id: user.id, tier: 'free', status: 'active' })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating subscription:', insertError);
          return { id: '', tier: 'free', status: 'active' };
        }

        return {
          id: newSub.id,
          tier: newSub.tier as SubscriptionTier,
          status: newSub.status as 'active' | 'canceled' | 'past_due',
          stripe_customer_id: newSub.stripe_customer_id || undefined,
          stripe_subscription_id: newSub.stripe_subscription_id || undefined,
          current_period_end: newSub.current_period_end || undefined,
          cancel_at_period_end: newSub.cancel_at_period_end || undefined,
        };
      }

      return {
        id: data.id,
        tier: data.tier as SubscriptionTier,
        status: data.status as 'active' | 'canceled' | 'past_due',
        stripe_customer_id: data.stripe_customer_id || undefined,
        stripe_subscription_id: data.stripe_subscription_id || undefined,
        current_period_end: data.current_period_end || undefined,
        cancel_at_period_end: data.cancel_at_period_end || undefined,
      };
    },
    enabled: !!user,
  });

  // Fetch usage stats from database
  const { data: usageStats } = useQuery({
    queryKey: ['usage-stats', user?.id],
    queryFn: async (): Promise<UsageStats> => {
      if (!user) {
        return {
          spotsViewedThisMonth: 0,
          catchesLoggedThisMonth: 0,
          offlineMapsDownloaded: 0,
        };
      }

      // Get the start of the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Count spot views this month
      const { count: spotViewCount, error: spotViewError } = await supabase
        .from('spot_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('viewed_at', startOfMonth.toISOString());

      if (spotViewError) {
        console.error('Error fetching spot views:', spotViewError);
      }

      // Count catch logs this month
      const { count: catchCount, error: catchError } = await supabase
        .from('catch_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (catchError) {
        console.error('Error fetching catch logs:', catchError);
      }

      return {
        spotsViewedThisMonth: spotViewCount || 0,
        catchesLoggedThisMonth: catchCount || 0,
        offlineMapsDownloaded: 0, // Not tracked yet
      };
    },
    enabled: !!user,
  });

  // Track spot view mutation
  const trackSpotViewMutation = useMutation({
    mutationFn: async (spotId: number) => {
      if (!user) return;

      // Check if already viewed this spot today to avoid duplicate tracking
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: existingView } = await supabase
        .from('spot_views')
        .select('id')
        .eq('user_id', user.id)
        .eq('spot_id', spotId)
        .gte('viewed_at', today.toISOString())
        .maybeSingle();

      if (!existingView) {
        const { error } = await supabase
          .from('spot_views')
          .insert({ user_id: user.id, spot_id: spotId });

        if (error) {
          console.error('Error tracking spot view:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-stats', user?.id] });
    },
  });

  // Check if user has reached limits
  const hasReachedLimit = (type: 'spots' | 'catches' | 'maps'): boolean => {
    if (!subscription || !usageStats) return false;

    const tier = subscription.tier;
    const limits = SUBSCRIPTION_TIERS[tier].limits;

    switch (type) {
      case 'spots':
        return usageStats.spotsViewedThisMonth >= limits.spotsPerMonth;
      case 'catches':
        return usageStats.catchesLoggedThisMonth >= limits.catchesPerMonth;
      case 'maps':
        return usageStats.offlineMapsDownloaded >= limits.offlineMaps;
      default:
        return false;
    }
  };

  // Check feature access
  const checkFeatureAccess = (feature: Feature): boolean => {
    if (!subscription) return false;
    return hasFeatureAccess(subscription.tier, feature);
  };

  // Get remaining usage
  const getRemainingUsage = (
    type: 'spots' | 'catches' | 'maps'
  ): number | 'unlimited' => {
    if (!subscription || !usageStats) return 0;

    const tier = subscription.tier;
    const limits = SUBSCRIPTION_TIERS[tier].limits;

    switch (type) {
      case 'spots':
        if (limits.spotsPerMonth === Infinity) return 'unlimited';
        return Math.max(0, limits.spotsPerMonth - usageStats.spotsViewedThisMonth);
      case 'catches':
        if (limits.catchesPerMonth === Infinity) return 'unlimited';
        return Math.max(
          0,
          limits.catchesPerMonth - usageStats.catchesLoggedThisMonth
        );
      case 'maps':
        if (limits.offlineMaps === Infinity) return 'unlimited';
        return Math.max(0, limits.offlineMaps - usageStats.offlineMapsDownloaded);
      default:
        return 0;
    }
  };

  // Track usage
  const trackUsage = (type: 'spot_view' | 'catch_log' | 'offline_map', id?: number) => {
    if (type === 'spot_view' && id) {
      trackSpotViewMutation.mutate(id);
    }
    // catch_log tracking happens automatically when inserting to catch_logs table
    // offline_map tracking to be implemented later
  };

  // Open the Stripe Billing Portal — handles cancel, resume, and plan changes
  const openBillingPortal = async () => {
    const { data, error } = await supabase.functions.invoke('create-portal-session');
    if (error || !data?.url) {
      throw new Error(error?.message ?? 'Could not open billing portal');
    }
    window.location.href = data.url;
  };

  const cancelSubscription = openBillingPortal;
  const resumeSubscription = openBillingPortal;

  return {
    subscription,
    usageStats,
    isLoading,
    error,
    hasReachedLimit,
    checkFeatureAccess,
    getRemainingUsage,
    trackUsage,
    cancelSubscription,
    resumeSubscription,
    isCanceling: false,
    isResuming: false,
  };
};
