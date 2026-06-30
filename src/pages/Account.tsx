import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Settings, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import AccountOverview from "@/components/account/AccountOverview";
import SavedSpotsList from "@/components/account/SavedSpotsList";
import CatchHistoryList from "@/components/account/CatchHistoryList";
import { SEO } from "@/components/SEO";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Account = () => {
  const { user, profile, loading: isLoading } = useAuth();
  const { resetOnboarding, startOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();

  // Show a success message when returning from Stripe Checkout
  useEffect(() => {
    const checkoutStatus = searchParams.get("upgrade");
    if (checkoutStatus === "success" && user) {
      toast.success("🎉 Subscription activated! Welcome to the next level.", {
        duration: 6000,
      });
      // Force-refresh subscription data so the tier badge updates immediately
      queryClient.invalidateQueries({ queryKey: ["subscription", user.id] });
      // Remove the query params without adding a history entry
      setSearchParams((prev) => {
        prev.delete("upgrade");
        prev.delete("session_id");
        return prev;
      }, { replace: true });
    }
    if (checkoutStatus === "canceled") {
      toast.info("Checkout canceled — your plan was not changed.");
      setSearchParams((prev) => {
        prev.delete("upgrade");
        return prev;
      }, { replace: true });
    }
  }, [searchParams, user, queryClient, setSearchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto animate-pulse space-y-8">
            <div className="h-10 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const getInitials = (name: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const handleRestartTour = () => {
    resetOnboarding();
    startOnboarding();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Account" description="Manage your AnglerDeck account" canonicalPath="/account" noIndex />
      <Header />
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-16 w-16 border-2 border-accent/50">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(profile?.display_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {profile?.display_name || "Angler"}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="saved">Saved Spots</TabsTrigger>
              <TabsTrigger value="catches">My Catches</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AccountOverview />
            </TabsContent>

            <TabsContent value="saved">
              <SavedSpotsList />
            </TabsContent>

            <TabsContent value="catches">
              <CatchHistoryList />
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Billing & Subscription */}
                

                {/* Profile Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your display name and bio that other anglers will see.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        defaultValue={profile?.display_name || ""}
                        placeholder="Your display name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        defaultValue={profile?.bio || ""}
                        placeholder="Tell other anglers about yourself..."
                        rows={3}
                      />
                    </div>
                    <Button disabled>Save Changes</Button>
                    <p className="text-xs text-muted-foreground">
                      Profile editing coming soon.
                    </p>
                  </CardContent>
                </Card>

                {/* App Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      App Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">Restart App Tour</div>
                        <div className="text-sm text-muted-foreground">
                          Take the guided tour again to learn about features.
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleRestartTour}>
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Restart Tour
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;