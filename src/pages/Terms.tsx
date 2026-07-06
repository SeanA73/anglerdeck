import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Terms of Service" description="Terms and conditions for using AnglerDeck. User agreement, acceptable use, subscription terms, and disclaimers." canonicalPath="/terms" />
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 28, 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using AnglerDeck, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground">
                AnglerDeck is a platform for discovering, sharing, and reviewing fishing spots. 
                We provide tools for logging catches, connecting with other anglers, and 
                accessing fishing-related content and products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                To access certain features, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and complete information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. User Content</h2>
              <p className="text-muted-foreground">
                You retain ownership of content you post. By posting, you grant us a non-exclusive, 
                royalty-free license to use, display, and distribute your content on our platform. 
                You are solely responsible for the content you post and must not post content that 
                is illegal, harmful, or violates others' rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Prohibited Conduct</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Post false, misleading, or harmful content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use our service for any commercial purpose without permission</li>
                <li>Share fishing spots on private property without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Subscriptions and Payments</h2>
              <p className="text-muted-foreground">
                Some features require a paid subscription. Subscriptions automatically renew unless 
                cancelled. Refunds are provided in accordance with our refund policy. Prices may 
                change with notice to subscribers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Disclaimer</h2>
              <p className="text-muted-foreground">
                AnglerDeck is provided "as is" without warranties of any kind. We do not guarantee 
                the accuracy of fishing spot information, weather data, or user-submitted content. 
                Always verify local fishing regulations and conditions independently.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                AnglerDeck shall not be liable for any indirect, incidental, special, or consequential 
                damages arising from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at{" "}
                <a href="mailto:legal@anglerdeck.com" className="text-accent hover:underline">
                  legal@anglerdeck.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
