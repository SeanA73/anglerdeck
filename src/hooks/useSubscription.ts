// Custom hook for subscription management and feature access
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
    SUBSCRIPTION_TIERS,
    hasFeatureAccess,
    type SubscriptionTier,
    type Feature,
} from '@/lib/stripe';
import { toast } from 'sonner';

export interface Subscription {
    id: string;
    userId: string;
    tier: SubscriptionTier;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UsageStats {
    spotsViewedThisMonth: number;
    catchesLoggedThisMonth: number;
    offlineMapsDownloaded: number;
}

export const useSubscription = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch current subscription
    const {
        data: subscription,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['subscription', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                // If no subscription exists, user is on free tier
                if (error.code === 'PGRST116') {
                    return {
                        tier: 'free' as SubscriptionTier,
                        status: 'active' as const,
                    };
                }
                throw error;
            }

            return {
                id: data.id,
                userId: data.user_id,
                tier: data.tier as SubscriptionTier,
                status: data.status,
                stripeSubscriptionId: data.stripe_subscription_id,
                stripeCustomerId: data.stripe_customer_id,
                currentPeriodStart: data.current_period_start
                    ? new Date(data.current_period_start)
                    : null,
                currentPeriodEnd: data.current_period_end
                    ? new Date(data.current_period_end)
                    : null,
                cancelAtPeriodEnd: data.cancel_at_period_end,
                trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
                createdAt: new Date(data.created_at),
                updatedAt: new Date(data.updated_at),
            } as Subscription;
        },
        enabled: !!user,
    });

    // Fetch usage stats
    const { data: usageStats } = useQuery({
        queryKey: ['usage-stats', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Get spots viewed this month
            const { count: spotsViewed } = await supabase
                .from('spot_views')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('viewed_at', startOfMonth.toISOString());

            // Get catches logged this month
            const { count: catchesLogged } = await supabase
                .from('catch_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('caught_at', startOfMonth.toISOString());

            // Get offline maps downloaded
            const { count: offlineMaps } = await supabase
                .from('offline_maps')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            return {
                spotsViewedThisMonth: spotsViewed || 0,
                catchesLoggedThisMonth: catchesLogged || 0,
                offlineMapsDownloaded: offlineMaps || 0,
            } as UsageStats;
        },
        enabled: !!user,
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
    const trackUsage = useMutation({
        mutationFn: async (type: 'spot_view' | 'catch_log' | 'offline_map') => {
            if (!user) throw new Error('User not authenticated');

            switch (type) {
                case 'spot_view':
                    await supabase.from('spot_views').insert({
                        user_id: user.id,
                        viewed_at: new Date().toISOString(),
                    });
                    break;
                case 'catch_log':
                    // Handled in catch log creation
                    break;
                case 'offline_map':
                    await supabase.from('offline_maps').insert({
                        user_id: user.id,
                        downloaded_at: new Date().toISOString(),
                    });
                    break;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usage-stats', user?.id] });
        },
    });

    // Cancel subscription
    const cancelSubscription = useMutation({
        mutationFn: async () => {
            if (!subscription?.stripeSubscriptionId) {
                throw new Error('No active subscription');
            }

            // Call backend API to cancel subscription
            const response = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: subscription.stripeSubscriptionId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Subscription canceled. Access continues until period end.');
            queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
        },
        onError: (error) => {
            toast.error('Failed to cancel subscription');
            console.error(error);
        },
    });

    // Resume subscription
    const resumeSubscription = useMutation({
        mutationFn: async () => {
            if (!subscription?.stripeSubscriptionId) {
                throw new Error('No subscription to resume');
            }

            const response = await fetch('/api/subscriptions/resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: subscription.stripeSubscriptionId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to resume subscription');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Subscription resumed successfully!');
            queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
        },
        onError: (error) => {
            toast.error('Failed to resume subscription');
            console.error(error);
        },
    });

    return {
        subscription,
        usageStats,
        isLoading,
        error,
        hasReachedLimit,
        checkFeatureAccess,
        getRemainingUsage,
        trackUsage: trackUsage.mutate,
        cancelSubscription: cancelSubscription.mutate,
        resumeSubscription: resumeSubscription.mutate,
        isCanceling: cancelSubscription.isPending,
        isResuming: resumeSubscription.isPending,
    };
};
