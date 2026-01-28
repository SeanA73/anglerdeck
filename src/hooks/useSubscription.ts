// Custom hook for subscription management and feature access
// Note: This is a simplified version that works without database tables
// Full subscription tracking requires creating subscriptions table
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    SUBSCRIPTION_TIERS,
    hasFeatureAccess,
    type SubscriptionTier,
    type Feature,
} from '@/lib/stripe';

export interface Subscription {
    tier: SubscriptionTier;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
}

export interface UsageStats {
    spotsViewedThisMonth: number;
    catchesLoggedThisMonth: number;
    offlineMapsDownloaded: number;
}

export const useSubscription = () => {
    const { user } = useAuth();

    // Default to free tier - full implementation requires database tables
    const {
        data: subscription,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['subscription', user?.id],
        queryFn: async (): Promise<Subscription> => {
            // Default to free tier for all users
            // To enable paid tiers, create a subscriptions table and integrate Stripe
            return {
                tier: 'free' as SubscriptionTier,
                status: 'active' as const,
            };
        },
        enabled: !!user,
    });

    // Mock usage stats - full implementation requires database tables
    const { data: usageStats } = useQuery({
        queryKey: ['usage-stats', user?.id],
        queryFn: async (): Promise<UsageStats> => {
            return {
                spotsViewedThisMonth: 0,
                catchesLoggedThisMonth: 0,
                offlineMapsDownloaded: 0,
            };
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

    // Placeholder functions - full implementation requires Stripe integration
    const trackUsage = (type: 'spot_view' | 'catch_log' | 'offline_map') => {
        console.log('Usage tracking:', type);
    };

    const cancelSubscription = () => {
        console.log('Cancel subscription - requires Stripe integration');
    };

    const resumeSubscription = () => {
        console.log('Resume subscription - requires Stripe integration');
    };

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
