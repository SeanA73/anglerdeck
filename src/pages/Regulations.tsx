import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const Regulations = () => {
  const regions = [
    {
      name: "United States",
      description: "Fishing regulations vary by state. Check your state's fish and wildlife agency for current rules.",
      links: [
        { name: "U.S. Fish & Wildlife Service", url: "https://www.fws.gov" },
        { name: "State Fishing Licenses", url: "https://www.takemefishing.org/get-a-fishing-license/" },
      ],
    },
    {
      name: "Canada",
      description: "Provincial and territorial regulations apply. A license is required in most areas.",
      links: [
        { name: "Fisheries and Oceans Canada", url: "https://www.dfo-mpo.gc.ca" },
      ],
    },
    {
      name: "United Kingdom",
      description: "A rod licence is required for freshwater fishing. Different rules apply in Scotland.",
      links: [
        { name: "Environment Agency", url: "https://www.gov.uk/fishing-licences" },
      ],
    },
    {
      name: "Australia",
      description: "Each state and territory has its own fishing regulations and licensing requirements.",
      links: [
        { name: "Fisheries Management", url: "https://www.agriculture.gov.au/fisheries" },
      ],
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Fishing Regulations</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stay informed about fishing regulations in your area. Always fish responsibly and legally.
          </p>
        </motion.div>

        <Card className="bg-amber-500/10 border-amber-500/20 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Important Disclaimer</h3>
                <p className="text-muted-foreground">
                  Fishing regulations change frequently. The information on this page is for general guidance only. 
                  Always verify current regulations with official local authorities before fishing. 
                  AnglerDeck is not responsible for any violations resulting from outdated information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {regions.map((region, index) => (
            <motion.div
              key={region.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <MapPin className="w-5 h-5 text-accent" />
                    </div>
                    <CardTitle>{region.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{region.description}</p>
                  <div className="space-y-2">
                    {region.links.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-accent hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.name}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Always carry a valid fishing license for the area you're fishing in
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Respect catch limits and size restrictions for each species
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Be aware of seasonal closures and protected areas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Practice catch and release when appropriate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Leave no trace - pack out all garbage and fishing line
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Report any illegal fishing activity to local authorities
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Regulations;
