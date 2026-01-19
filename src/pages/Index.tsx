import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedSpots from "@/components/FeaturedSpots";
import Features from "@/components/Features";
import Premium from "@/components/Premium";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedSpots />
      <Features />
      <Premium />
      <Footer />
    </div>
  );
};

export default Index;