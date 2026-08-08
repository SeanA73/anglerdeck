import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Book, MessageCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FishingAssistant from "@/components/ai/FishingAssistant";
import { SEO } from "@/components/SEO";

// Accordion item value + DOM id for a FAQ entry, derived from its question so
// the category-card links below stay valid if the FAQ list is reordered.
const faqId = (question: string) =>
  question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const Support = () => {
  // `answer` points at the text of an existing FAQ question further down the
  // page. These are not article pages — no individual help articles exist yet,
  // so a topic with no matching FAQ is listed as plain text rather than as a
  // link that goes nowhere. Anything referencing a question that is later
  // renamed also degrades to plain text (see `faqQuestions` below), so this
  // page cannot regrow the dead `href="#"` links it used to ship.
  const helpTopics = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of using AnglerDeck to find and share fishing spots.",
      articles: [
        { label: "How to search for spots", answer: "How do I find fishing spots near me?" },
        { label: "Creating your first catch log", answer: "How do I log a catch?" },
        { label: "Understanding spot ratings", answer: "How do spot ratings work?" },
      ],
    },
    {
      icon: HelpCircle,
      title: "Account & Billing",
      description: "Manage your account settings, subscriptions, and payment methods.",
      articles: [
        { label: "Upgrading to Pro", answer: "How do I upgrade my subscription?" },
        { label: "Managing your subscription", answer: "Can I cancel my subscription anytime?" },
        { label: "Updating payment info", answer: null },
      ],
    },
    {
      icon: MessageCircle,
      title: "Community Guidelines",
      description: "Learn about our community standards and how to interact with other anglers.",
      articles: [
        { label: "Posting guidelines", answer: null },
        { label: "Reporting inappropriate content", answer: null },
        { label: "Earning badges", answer: null },
      ],
    },
  ];

  const faqCategories = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click the 'Get Started' button in the top navigation, then enter your email and create a password. You'll receive a confirmation email to verify your account.",
        },
        {
          q: "How do I find fishing spots near me?",
          a: "Use the Map View to see spots near your location, or browse the Explore Spots page and filter by distance. You can also search for specific locations or water bodies.",
        },
        {
          q: "What's included in the free tier?",
          a: "Free users can view up to 10 spots per month, log up to 5 catches, and access basic community features. Upgrade to Pro or Elite for unlimited access.",
        },
      ],
    },
    {
      category: "Features",
      questions: [
        {
          q: "How do I log a catch?",
          a: "Go to 'My Catches' from the navigation, click 'Add Catch', and fill in the details including species, weight, location, and optionally upload a photo.",
        },
        {
          q: "Can I save spots for later?",
          a: "Yes! Click the heart icon on any spot to save it to your favorites. Access your saved spots from the dropdown menu under your profile.",
        },
        {
          q: "How do spot ratings work?",
          a: "Users can rate spots from 1-5 stars based on their experience. The displayed rating is an average of all user reviews. You can also read detailed reviews from other anglers.",
        },
      ],
    },
    {
      category: "Subscriptions",
      questions: [
        {
          q: "What are the different subscription tiers?",
          a: "We offer Free, Pro ($9.99/month), and Elite ($29.99/month) tiers. Pro gives unlimited spot views, unlimited catch logging, community posting, and an ad-free experience. Elite is still in development — its additional features are listed as planned on the Pricing page and checkout for it is disabled until they ship.",
        },
        {
          q: "How do I upgrade my subscription?",
          a: "Visit the Pricing page from the navigation or click 'Go Pro'. Select your preferred tier and complete the checkout process securely via Stripe.",
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel at any time from your Account settings. You'll retain access until the end of your billing period, and no refunds are provided for partial months.",
        },
      ],
    },
    {
      category: "Technical",
      questions: [
        {
          q: "What browsers are supported?",
          a: "AnglerDeck works best on Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.",
        },
        {
          q: "Is my data secure?",
          a: "Yes, we use industry-standard encryption and secure authentication through Supabase. Your personal information and catch logs are only visible to you unless you choose to share them.",
        },
        {
          q: "How do I report a bug?",
          a: "Use our Contact page to report any issues. Please include details about what happened, what you expected, and your browser/device information to help us investigate.",
        },
      ],
    },
  ];

  // Every question actually on the page. A topic link only renders as a link
  // if its target is in here.
  const faqQuestions = new Set(
    faqCategories.flatMap((category) => category.questions.map((faq) => faq.q))
  );

  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState("");

  const search = query.trim().toLowerCase();
  const visibleCategories = search
    ? faqCategories
        .map((category) => ({
          ...category,
          questions: category.questions.filter(
            (faq) =>
              faq.q.toLowerCase().includes(search) ||
              faq.a.toLowerCase().includes(search)
          ),
        }))
        .filter((category) => category.questions.length > 0)
    : faqCategories;

  // Open the target question and bring it into view. Clearing any active
  // search first, otherwise the target may be filtered out of the DOM.
  const openAnswer = (question: string) => {
    const id = faqId(question);
    setQuery("");
    setOpenFaq(id);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Help & Support" description="Get help with AnglerDeck. FAQs, contact info, and support resources for anglers using our platform." canonicalPath="/support" />
      <Header />
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Help Center</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </motion.div>

        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search frequently asked questions..."
              aria-label="Search frequently asked questions"
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {helpTopics.map((topic, index) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <topic.icon className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-xl">{topic.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{topic.description}</p>
                  <ul className="space-y-2">
                    {topic.articles.map((article) => (
                      <li key={article.label}>
                        {article.answer && faqQuestions.has(article.answer) ? (
                          <button
                            type="button"
                            onClick={() => openAnswer(article.answer)}
                            className="text-sm text-accent hover:underline text-left"
                          >
                            {article.label}
                          </button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {article.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Accordion Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {visibleCategories.length === 0 && (
              <p className="text-center text-muted-foreground">
                No questions match “{query.trim()}”. Try a different term, or{" "}
                <a href="/contact" className="text-accent hover:underline">
                  contact support
                </a>
                .
              </p>
            )}
            {visibleCategories.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    // One shared open-item across all four accordions, so a
                    // category link can open an answer in a different card.
                    value={
                      category.questions.some((faq) => faqId(faq.q) === openFaq)
                        ? openFaq
                        : ""
                    }
                    onValueChange={setOpenFaq}
                  >
                    {category.questions.map((faq) => (
                      <AccordionItem key={faq.q} value={faqId(faq.q)} id={faqId(faq.q)}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Still need help?</h2>
            <p className="text-muted-foreground mb-6">
              Our support team is here to assist you with any questions.
            </p>
            <Button asChild>
              <a href="/contact">Contact Support</a>
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
      <FishingAssistant />
    </div>
  );
};

export default Support;
