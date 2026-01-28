import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Book, MessageCircle, FileText, Search } from "lucide-react";
import { motion } from "framer-motion";

const Support = () => {
  const helpTopics = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of using ReelSpot to find and share fishing spots.",
      articles: ["How to search for spots", "Creating your first catch log", "Understanding spot ratings"],
    },
    {
      icon: HelpCircle,
      title: "Account & Billing",
      description: "Manage your account settings, subscriptions, and payment methods.",
      articles: ["Upgrading to Pro", "Managing your subscription", "Updating payment info"],
    },
    {
      icon: MessageCircle,
      title: "Community Guidelines",
      description: "Learn about our community standards and how to interact with other anglers.",
      articles: ["Posting guidelines", "Reporting inappropriate content", "Earning badges"],
    },
    {
      icon: FileText,
      title: "Marketplace Help",
      description: "Everything you need to know about buying and selling gear.",
      articles: ["Listing your gear", "Safe transactions", "Shipping guidelines"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              placeholder="Search for help articles..."
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
                      <li key={article}>
                        <a href="#" className="text-sm text-accent hover:underline">
                          {article}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

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
    </div>
  );
};

export default Support;
