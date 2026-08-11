import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Cookie Policy"
        description="How AnglerDeck uses cookies and similar tracking technologies. Manage your cookie preferences."
        canonicalPath="/cookies"
      />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-16 max-w-3xl">
        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: 6 July 2026</p>

          <p className="text-muted-foreground mb-6">
            This Cookie Policy explains how AnglerDeck uses cookies and similar
            technologies (like local storage) to recognise you when you visit the Service.
            It explains what these technologies are, why we use them, and your rights to
            control our use of them.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. What are cookies?</h2>
          <p className="text-muted-foreground mb-6">
            Cookies are small text files stored on your device when you visit a website.
            They allow the site to remember you between visits and pages. Local storage is
            a similar mechanism used by modern web apps for the same purpose.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Cookies we use</h2>

          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Essential (always active)</h3>
          <p className="text-muted-foreground mb-3">
            These are required for the Service to function. You cannot opt out of them
            without breaking the app.
          </p>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li><strong>Authentication:</strong> Supabase auth tokens that keep you logged in.</li>
            <li><strong>Session state:</strong> preferences like your last selected tab, dismissed onboarding tour, cookie consent choice.</li>
            <li><strong>Security:</strong> tokens used to prevent cross-site request forgery.</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Analytics (opt-in)</h3>
          <p className="text-muted-foreground mb-6">
            When you consent, we may use analytics services (such as Google Analytics or
            similar) to understand how you use the Service. This helps us improve features
            and fix issues. Analytics is off by default until you opt in through the cookie
            banner. We currently do not have any analytics cookies enabled by default.
          </p>

          <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Advertising and affiliate</h3>
          <p className="text-muted-foreground mb-6">
            We do not currently use advertising or third-party marketing cookies. If we
            introduce advertising or affiliate tracking in the future (for example, to
            support the free tier), we will update this policy and give you the ability to
            opt out.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Third-party cookies</h2>
          <p className="text-muted-foreground mb-3">Some cookies are set by third parties we use:</p>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li><strong>Stripe:</strong> during checkout, Stripe may set cookies for fraud prevention and to process your payment.</li>
            <li><strong>Supabase:</strong> sets authentication and session cookies.</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            These providers have their own cookie policies which we recommend reviewing:
            stripe.com/cookies-policy and supabase.com/privacy.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Managing your preferences</h2>
          <p className="text-muted-foreground mb-6">
            You can change your cookie preferences at any time using the{" "}
            <strong>Cookie preferences</strong> link at the bottom of any page, or by
            clearing cookies through your browser settings. Note that disabling essential
            cookies will prevent the Service from working properly.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Changes to this policy</h2>
          <p className="text-muted-foreground mb-6">
            We may update this Cookie Policy from time to time to reflect changes in our
            practices or applicable law. The "Last updated" date shows the most recent
            revision.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Contact</h2>
          <p className="text-muted-foreground mb-6">
            Questions about our use of cookies: email privacy@anglerdeck.com.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Cookies;