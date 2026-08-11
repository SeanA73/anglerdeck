import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Terms and conditions for using AnglerDeck. User agreement, acceptable use, subscription terms, and disclaimers."
        canonicalPath="/terms"
      />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-16 max-w-3xl">
        <article className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: 6 July 2026</p>

          <p className="text-muted-foreground mb-6">
            These Terms of Service ("Terms") govern your use of AnglerDeck (the "Service")
            operated by MRS Design ("we", "us"). By creating an account or using the
            Service, you agree to these Terms. If you do not agree, do not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Your account</h2>
          <p className="text-muted-foreground mb-6">
            You must be at least 13 years old to use AnglerDeck. You are responsible for
            keeping your account credentials secure and for all activity that happens under
            your account. Notify us immediately at security@anglerdeck.com if you suspect
            unauthorised access.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Acceptable use</h2>
          <p className="text-muted-foreground mb-3">You agree not to:</p>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li>Use the Service for anything unlawful, harmful, or fraudulent.</li>
            <li>Post content that is harassing, hateful, defamatory, or infringes another person's rights.</li>
            <li>Attempt to reverse-engineer, hack, overwhelm, or otherwise misuse the Service.</li>
            <li>Scrape or systematically extract data without our written permission.</li>
            <li>Share your account with others or misrepresent your identity.</li>
            <li>Circumvent subscription or paywall features.</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            We may suspend or terminate accounts that violate these rules.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. User content</h2>
          <p className="text-muted-foreground mb-6">
            You retain ownership of the content you post (catch logs, reviews, community
            posts, photos). By posting content, you grant us a non-exclusive, worldwide,
            royalty-free licence to host, display, and share it within the Service (for
            example, community posts appear in other users' feeds). You are responsible for
            the content you post and for ensuring you have the rights to share it.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Subscriptions and payments</h2>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li>AnglerDeck offers free and paid subscription tiers (Pro and Elite). Current pricing is on the /pricing page.</li>
            <li>Paid subscriptions renew automatically at the end of each billing period until you cancel.</li>
            <li>You can cancel at any time from your Account page. Cancellation takes effect at the end of the current billing period; you retain paid access until then.</li>
            <li>All prices are shown in AUD and are GST-inclusive where applicable.</li>
            <li>Payments are processed by Stripe. Refunds are generally not offered for partial billing periods, though we may issue refunds at our discretion for exceptional circumstances.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Fishing information disclaimer</h2>
          <p className="text-muted-foreground mb-6">
            AnglerDeck provides information about fishing spots, conditions, regulations,
            and techniques. This information is provided as a guide only. It is your
            responsibility to:
          </p>
          <ul className="text-muted-foreground mb-6 list-disc pl-6 space-y-2">
            <li>Verify current fishing regulations with your state or territory's fisheries authority.</li>
            <li>Hold a valid fishing licence where required.</li>
            <li>Follow all size limits, bag limits, seasonal closures, and protected species rules.</li>
            <li>Assess safety conditions before fishing at any location.</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            We do not guarantee the accuracy of any spot information, weather forecast, or
            AI-generated suggestion. Always exercise independent judgment on the water.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. AI features</h2>
          <p className="text-muted-foreground mb-6">
            The AI Fishing Assistant and the community "Magic Write" tool (both available to
            Pro and Elite subscribers) use OpenAI's language models. Responses are generated
            by AI and may contain inaccuracies or outdated information. Do not rely on AI
            responses for safety-critical decisions. Messages you send to the AI Assistant,
            and the post details you supply to Magic Write, are transmitted to OpenAI. You
            remain responsible for any AI-generated text you choose to publish to the
            community feed.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Intellectual property</h2>
          <p className="text-muted-foreground mb-6">
            The AnglerDeck name, logo, design, and code are owned by MRS Design. You may
            not copy, redistribute, or create derivative works of the Service without our
            written permission.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Consumer guarantees</h2>
          <p className="text-muted-foreground mb-6">
            Nothing in these Terms limits your rights under the Australian Consumer Law.
            Our goods and services come with guarantees that cannot be excluded under
            Australian law. You are entitled to a replacement or refund for a major failure
            and to compensation for any other reasonably foreseeable loss or damage.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Limitation of liability</h2>
          <p className="text-muted-foreground mb-6">
            To the maximum extent permitted by law, MRS Design is not liable for indirect,
            incidental, or consequential damages arising from your use of the Service. Our
            total liability to you for any claim is limited to the amount you paid us in
            the twelve months before the claim arose, or one hundred Australian dollars,
            whichever is greater.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Termination</h2>
          <p className="text-muted-foreground mb-6">
            You can delete your account at any time by contacting privacy@anglerdeck.com or
            using the account deletion option in your settings. We may suspend or terminate
            your account if you violate these Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. Changes to these Terms</h2>
          <p className="text-muted-foreground mb-6">
            We may update these Terms from time to time. Material changes will be notified
            through the Service or by email. Continued use of the Service after changes
            take effect constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">12. Governing law</h2>
          <p className="text-muted-foreground mb-6">
            These Terms are governed by the laws of New South Wales, Australia. Any dispute
            arising from these Terms or your use of the Service will be resolved in the
            courts of New South Wales.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">13. Contact</h2>
          <p className="text-muted-foreground mb-6">
            Questions about these Terms: email legal@anglerdeck.com.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;