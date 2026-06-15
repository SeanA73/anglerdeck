import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const Licenses = () => {
  const licenses = [
    {
      name: "React",
      license: "MIT License",
      url: "https://github.com/facebook/react/blob/main/LICENSE",
    },
    {
      name: "Tailwind CSS",
      license: "MIT License",
      url: "https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE",
    },
    {
      name: "Leaflet",
      license: "BSD 2-Clause License",
      url: "https://github.com/Leaflet/Leaflet/blob/main/LICENSE",
    },
    {
      name: "Framer Motion",
      license: "MIT License",
      url: "https://github.com/framer/motion/blob/main/LICENSE.md",
    },
    {
      name: "Lucide Icons",
      license: "ISC License",
      url: "https://github.com/lucide-icons/lucide/blob/main/LICENSE",
    },
    {
      name: "Radix UI",
      license: "MIT License",
      url: "https://github.com/radix-ui/primitives/blob/main/LICENSE",
    },
    {
      name: "shadcn/ui",
      license: "MIT License",
      url: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md",
    },
    {
      name: "Recharts",
      license: "MIT License",
      url: "https://github.com/recharts/recharts/blob/master/LICENSE",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">Open Source Licenses</h1>
          <p className="text-muted-foreground mb-8">
            AnglerDeck is built with the help of amazing open source software. 
            We're grateful to the developers and communities behind these projects.
          </p>

          <div className="grid gap-4">
            {licenses.map((lib, index) => (
              <motion.div
                key={lib.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{lib.name}</h3>
                      <p className="text-sm text-muted-foreground">{lib.license}</p>
                    </div>
                    <a
                      href={lib.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      View License
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>AnglerDeck License</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                © 2026 AnglerDeck. All rights reserved. The AnglerDeck name, logo, and all related 
                marks are trademarks of AnglerDeck. This application and its original content are 
                protected by copyright law.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Licenses;
