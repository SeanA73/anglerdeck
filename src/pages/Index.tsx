import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedSpots from "@/components/FeaturedSpots";
import SocialProof from "@/components/SocialProof";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import OnboardingTour from "@/components/OnboardingTour";
import { SEO } from "@/components/SEO";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="ReelSpot - Find Your Perfect Fishing Spots"
        description="Discover, save, and share the best fishing spots worldwide. Connect with fellow anglers and access expert tips."
        canonicalPath="/"
      />
      <Header />
      <Hero />
      <FeaturedSpots />
      <SocialProof />
      <Features />
      <section className="container mx-auto px-4 lg:px-8 py-12">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Stay in the loop</h2>
          <p className="text-muted-foreground mb-4">
            Weekly fishing tips, hot spots, and gear deals — straight to your inbox.
          </p>
          <NewsletterSignup />
        </div>
      </section>
      <Footer />
      <OnboardingTour />
    </div>
  );
};

export default Index;