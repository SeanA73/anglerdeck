import { motion } from 'framer-motion';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { guides } from '@/data/guides';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const Guides = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Fishing Guide Directory"
        description="Find professional fishing guides worldwide. Book local experts for trout, bass, saltwater, and fly fishing trips."
        canonicalPath="/guides"
      />
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Fishing Guide Directory
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Connect with licensed local guides. Elite members get priority listing placement.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {guides.map((guide, index) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden flex flex-col sm:flex-row"
              >
                <img
                  src={guide.image}
                  alt={guide.name}
                  className="sm:w-40 h-48 sm:h-auto object-cover"
                  loading="lazy"
                  width={160}
                  height={160}
                />
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-xl font-bold text-foreground">{guide.name}</h2>
                    {guide.featured && (
                      <Badge className="bg-accent text-accent-foreground shrink-0">Featured</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    {guide.location}, {guide.country}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{guide.bio}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {guide.specialties.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="font-medium">{guide.rating}</span>
                      <span className="text-muted-foreground">({guide.reviewCount} reviews)</span>
                    </div>
                    <span className="text-sm font-medium text-primary">{guide.priceRange}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4 gap-2" asChild>
                    <a href={guide.contactUrl || '/contact'} target="_blank" rel="noopener noreferrer">
                      Contact Guide
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-12 max-w-xl mx-auto">
            Are you a professional guide?{' '}
            <a href="/contact" className="text-accent hover:underline">
              List your services
            </a>{' '}
            — plans from $29/month.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Guides;
