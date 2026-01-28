import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 28, 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground">
                Cookies are small text files stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences 
                and understanding how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Essential Cookies</h3>
              <p className="text-muted-foreground mb-4">
                Required for the website to function properly. These cannot be disabled.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Authentication and session management</li>
                <li>Security features</li>
                <li>Load balancing</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Functional Cookies</h3>
              <p className="text-muted-foreground mb-4">
                Remember your preferences and settings.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Language preferences</li>
                <li>Theme settings (light/dark mode)</li>
                <li>Recently viewed spots</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Analytics Cookies</h3>
              <p className="text-muted-foreground mb-4">
                Help us understand how visitors interact with our website.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Pages visited and time spent</li>
                <li>Features used</li>
                <li>Error tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground mb-4">
                You can control cookies through your browser settings. Note that disabling certain 
                cookies may affect the functionality of our website.
              </p>
              <p className="text-muted-foreground">
                Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
                <li>View what cookies are stored</li>
                <li>Delete cookies individually or all at once</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground">
                Some features may use cookies from third parties, such as embedded maps or 
                payment processors. These are governed by the respective third party's privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Updates to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time. Changes will be posted on 
                this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about our use of cookies, contact us at{" "}
                <a href="mailto:privacy@reelspot.com" className="text-accent hover:underline">
                  privacy@reelspot.com
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

export default Cookies;
