import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedSpots from "@/components/FeaturedSpots";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import OnboardingTour from "@/components/OnboardingTour";
import { SEO } from "@/components/SEO";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AnglerDeck - Find Your Perfect Fishing Spots"
        description="Discover, save, and share the best fishing spots worldwide. Connect with fellow anglers and access expert tips."
        canonicalPath="/"
      />
      <Header />
      {/* Every other page wraps its content in <main id="main-content"> — the
          landmark the header's skip link targets. */}
      <main id="main-content">
        <Hero />
        <FeaturedSpots />
        <Features />
        <section className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Join the newsletter</h2>
            <p className="text-muted-foreground mb-4">
              We're launching a monthly newsletter with fishing tips, spot highlights, and updates. Leave your email to be notified when the first issue goes out.
            </p>
            <NewsletterSignup />
          </div>
        </section>
      </main>
      <Footer />
      <OnboardingTour />
    </div>
  );
};

export default Index;