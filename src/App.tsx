import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { Loader2 } from "lucide-react";
import { pageview } from "@/lib/analytics";

const Index = lazy(() => import("./pages/Index"));
const SpotDetail = lazy(() => import("./pages/SpotDetail"));
const Spots = lazy(() => import("./pages/Spots"));
const CountryHub = lazy(() => import("./pages/CountryHub"));
const MapView = lazy(() => import("./pages/MapView"));
const CatchLog = lazy(() => import("./pages/CatchLog"));
const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const Auth = lazy(() => import("./pages/Auth"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Account = lazy(() => import("./pages/Account"));
const Support = lazy(() => import("./pages/Support"));
const Contact = lazy(() => import("./pages/Contact"));
const Regulations = lazy(() => import("./pages/Regulations"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideArticle = lazy(() => import("./pages/GuideArticle"));
const Gear = lazy(() => import("./pages/Gear"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Licenses = lazy(() => import("./pages/Licenses"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminSpots = lazy(() => import("./pages/admin/AdminSpots"));
const AdminAffiliate = lazy(() => import("./pages/admin/AdminAffiliate"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminOps = lazy(() => import("./pages/admin/AdminOps"));

const queryClient = new QueryClient();

const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    pageview(location.pathname + location.search);
  }, [location]);
  return null;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PageViewTracker />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/spots" element={<Spots />} />
                <Route path="/spot/:slug" element={<SpotDetail />} />
                <Route path="/fishing/:countrySlug" element={<CountryHub />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/catches" element={<ProtectedRoute><CatchLog /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><CommunityFeed /></ProtectedRoute>} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="/support" element={<Support />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/regulations" element={<Regulations />} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/:slug" element={<GuideArticle />} />
                <Route path="/gear" element={<Gear />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/licenses" element={<Licenses />} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminSpots />} />
                  <Route path="affiliate" element={<AdminAffiliate />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="moderation" element={<AdminModeration />} />
                  <Route path="marketing" element={<AdminMarketing />} />
                  <Route path="ops" element={<AdminOps />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
