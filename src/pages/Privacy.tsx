import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="How AnglerDeck collects, uses, and protects your data. Privacy policy for Australian users."
        canonicalPath="/privacy"
      />
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: 6 July 2026</p>

          <p className="text-muted-foreground mb-6">
            This Privacy Policy describes how MRS Design ("we", "us", "our") collects,
            uses, and shares personal information when you use AnglerDeck (the "Service")
            at anglerdeck.com or through our mobile and desktop apps.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Who we are</h2>
          <p className="text-muted-foreground mb-6">
            AnglerDeck is operated by MRS Design, a sole trader business registered in
            Australia. We can be contacted at privacy@anglerdeck.com.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Information we collect</h2>
          <p className="text-muted-foreground mb-3">When you use the Service, we may collect:</p>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li><strong>Account information:</strong> email address, display name, hashed password.</li>
            <li><strong>Profile information you choose to add:</strong> avatar, bio, location preferences.</li>
            <li><strong>Content you create:</strong> catch logs, reviews, photos, community posts, saved spots.</li>
            <li><strong>Usage data:</strong> pages you visit, features you use, approximate device type. Used to improve the Service and troubleshoot issues.</li>
            <li><strong>Payment information:</strong> handled entirely by Stripe. We never see or store your full card details.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. How we use your information</h2>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li>Provide, personalise, and improve the Service.</li>
            <li>Process subscriptions and payments through Stripe.</li>
            <li>Send transactional emails (receipts, password resets, security alerts).</li>
            <li>Send occasional product update emails (you can opt out at any time via the link in any such email).</li>
            <li>Respond to your support requests.</li>
            <li>Detect and prevent abuse or fraud.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Who we share your information with</h2>
          <p className="text-muted-foreground mb-3">
            We do <strong>not</strong> sell your personal information. We share it only with
            the following sub-processors that make the Service work:
          </p>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li><strong>Supabase</strong> (data hosting, authentication) — servers located in Sydney, Australia (ap-southeast-2).</li>
            <li><strong>Stripe</strong> (subscription billing and payment processing) — processes card details directly. See Stripe's privacy policy at stripe.com/privacy.</li>
            <li><strong>OpenAI</strong> (AI Fishing Assistant, Pro and Elite tiers only) — messages sent to the AI Assistant are transmitted to OpenAI for processing. Do not share sensitive personal information in AI chats.</li>
            <li><strong>Hosting and email providers</strong> — used to deliver the app and transactional emails.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Where your data lives</h2>
          <p className="text-muted-foreground mb-6">
            Primary data storage is in Sydney, Australia. Some sub-processors (Stripe,
            OpenAI) may process data in the United States or other jurisdictions in
            accordance with their own privacy policies.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. How long we keep your data</h2>
          <p className="text-muted-foreground mb-6">
            We keep your account data for as long as your account is active. If you delete
            your account, we permanently remove your personal information within 30 days,
            except where we are required to retain records for legal or accounting purposes
            (for example, tax records related to your subscription).
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Your rights</h2>
          <p className="text-muted-foreground mb-3">Under Australian privacy law and applicable international laws, you have the right to:</p>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li>Access the personal information we hold about you.</li>
            <li>Correct information that is inaccurate.</li>
            <li>Request deletion of your data.</li>
            <li>Withdraw consent for marketing emails at any time.</li>
            <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au.</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            To exercise any of these rights, email privacy@anglerdeck.com.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Age requirements</h2>
          <p className="text-muted-foreground mb-6">
            AnglerDeck is intended for users aged 13 and over. If you are under 13, please
            do not use the Service or provide us with any personal information. If we learn
            that we have collected information from someone under 13, we will delete it.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Security</h2>
          <p className="text-muted-foreground mb-6">
            We use industry-standard security practices including encryption in transit
            (HTTPS), encryption at rest for sensitive data, and Row Level Security (RLS)
            policies on our database to isolate user data. No system is perfectly secure,
            but we take security seriously and continuously improve our practices.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Changes to this policy</h2>
          <p className="text-muted-foreground mb-6">
            We may update this Privacy Policy from time to time. If we make material
            changes, we will notify you by email or through the Service. The "Last updated"
            date at the top of this page shows when the policy was most recently revised.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. Contact us</h2>
          <p className="text-muted-foreground mb-6">
            Questions or requests about your privacy: email privacy@anglerdeck.com.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;