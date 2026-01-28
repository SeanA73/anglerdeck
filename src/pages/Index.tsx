import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedSpots from "@/components/FeaturedSpots";
import SocialProof from "@/components/SocialProof";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import OnboardingTour from "@/components/OnboardingTour";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedSpots />
      <SocialProof />
      <Features />
      <Footer />
      <OnboardingTour />
    </div>
  );
};

export default Index;