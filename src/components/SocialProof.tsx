import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Fish, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Jake Thompson",
    location: "Colorado",
    avatar: "",
    rating: 5,
    text: "CastLog helped me discover hidden fishing spots I never knew existed. Caught my biggest trout ever thanks to this app!",
    achievement: "120 catches logged",
  },
  {
    name: "Maria Santos",
    location: "Florida",
    avatar: "",
    rating: 5,
    text: "The community here is incredible. Fellow anglers share real tips and the spot reviews are always accurate.",
    achievement: "Pro member since 2024",
  },
  {
    name: "David Chen",
    location: "Oregon",
    avatar: "",
    rating: 5,
    text: "I've tried other fishing apps, but CastLog's map view and species filters are unmatched. Worth every penny for Pro!",
    achievement: "50+ spots explored",
  },
  {
    name: "Sarah Miller",
    location: "Minnesota",
    avatar: "",
    rating: 5,
    text: "Perfect for planning fishing trips. The detailed reviews saved me hours of research. Highly recommend!",
    achievement: "Top contributor",
  },
];

const stats = [
  { icon: MapPin, label: "Fishing Spots", value: 2500, suffix: "+" },
  { icon: Fish, label: "Catches Logged", value: 45000, suffix: "+" },
  { icon: Users, label: "Active Anglers", value: 12000, suffix: "+" },
];

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const SocialProof = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by Anglers Worldwide
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12">
            Join thousands of fishing enthusiasts who've discovered their next great catch with CastLog.
          </p>

          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            What Anglers Are Saying
          </h3>

          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <Card className="bg-card border-border">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-14 w-14 border-2 border-accent/30">
                          <AvatarImage src={testimonial.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {testimonial.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                          ))}
                        </div>
                      </div>
                      <p className="text-foreground mb-4 text-lg italic">"{testimonial.text}"</p>
                      <div className="text-sm text-accent font-medium">{testimonial.achievement}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  currentTestimonial === index ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">Featured on</p>
          <div className="flex justify-center items-center gap-8 flex-wrap opacity-60">
            <div className="text-lg font-bold text-foreground">Field & Stream</div>
            <div className="text-lg font-bold text-foreground">Outdoor Life</div>
            <div className="text-lg font-bold text-foreground">Bassmaster</div>
            <div className="text-lg font-bold text-foreground">Fly Fisherman</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
