import { Crown, Calendar, TrendingUp, Settings, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe";
import { UsageSummary } from "@/components/UsageMeter";
import { useState } from "react";
import { toast } from "sonner";

const tierColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-accent text-accent-foreground",
  elite: "bg-primary text-primary-foreground",
};

const tierLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  elite: "Elite",
};

const AccountOverview = () => {
  const { subscription, usageStats, isLoading, cancelSubscription } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await cancelSubscription();
      // cancelSubscription redirects to Stripe portal, so this line is rarely reached
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tier = subscription?.tier || "free";
  const isPremium = tier !== "free";

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-accent" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={tierColors[tier]}>{tierLabels[tier]} Tier</Badge>
              {subscription?.status === "active" && (
                <span className="text-sm text-muted-foreground">Active</span>
              )}
            </div>
            {!isPremium && (
              <Button asChild variant="hero" size="sm">
                <Link to="/pricing">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade
                </Link>
              </Button>
            )}
          </div>

          {isPremium && subscription?.current_period_end && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {subscription.cancel_at_period_end
                  ? "Cancels on "
                  : "Renews on "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          )}

          {isPremium && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Manage Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageSummary
            spotsUsed={usageStats?.spotsViewedThisMonth || 0}
            spotsLimit={SUBSCRIPTION_TIERS[tier]?.limits.spotsPerMonth || 10}
            catchesUsed={usageStats?.catchesLoggedThisMonth || 0}
            catchesLimit={SUBSCRIPTION_TIERS[tier]?.limits.catchesPerMonth || 5}
          />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-foreground">
              {usageStats?.spotsViewedThisMonth || 0}
            </div>
            <div className="text-sm text-muted-foreground">Spots Viewed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-foreground">
              {usageStats?.catchesLoggedThisMonth || 0}
            </div>
            <div className="text-sm text-muted-foreground">Catches Logged</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountOverview;
