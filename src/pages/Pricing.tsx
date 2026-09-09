import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_TIERS, formatPrice, getAnnualPrice } from '@/lib/stripe';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createCheckoutSession, PortalRedirectError } from '@/lib/checkout';
import { useSubscription } from '@/hooks/useSubscription';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(false);
    const { user } = useAuth();
    const { cancelSubscription } = useSubscription();
    const navigate = useNavigate();

    const handleSubscribe = async (tier: 'free' | 'pro' | 'elite') => {
        if (!user) {
            toast.error('Please sign in to subscribe');
            navigate('/auth');
            return;
        }

        if (tier === 'free') {
            toast.info('You\'re already on the free tier!');
            return;
        }

        try {
            toast.info('Redirecting to checkout...');
            const url = await createCheckoutSession({
                tier,
                billingPeriod: isAnnual ? 'yearly' : 'monthly',
            });
            window.location.href = url;
        } catch (err) {
            if (err instanceof PortalRedirectError) {
                // User already has an active subscription — send them to the
                // billing portal where they can change plan safely.
                toast.info('Opening your subscription settings...');
                try {
                    await cancelSubscription();
                } catch {
                    toast.error('Could not open billing portal. Try from your account page.');
                }
                return;
            }
            const message = err instanceof Error ? err.message : 'Checkout failed';
            toast.error(message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-forest-900 via-forest-800 to-forest-900">
            <SEO title="Pricing — AnglerDeck Pro" description="Choose the plan that matches your fishing. Free forever, or upgrade to Pro for unlimited spots, catch logging, and the AI Fishing Assistant." canonicalPath="/pricing" />
            <Header />

            {/* Content */}
            <main id="main-content" className="container mx-auto px-4 py-16 pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-forest-100 max-w-2xl mx-auto">
                        Unlock the full potential of AnglerDeck with unlimited access
                        and AI-powered insights
                    </p>

                    {/* Annual/Monthly Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={cn(
                            "text-lg font-medium transition-colors",
                            !isAnnual ? "text-white" : "text-forest-300"
                        )}>
                            Monthly
                        </span>
                        <Switch
                            checked={isAnnual}
                            onCheckedChange={setIsAnnual}
                            className="data-[state=checked]:bg-amber-500"
                        />
                        <span className={cn(
                            "text-lg font-medium transition-colors",
                            isAnnual ? "text-white" : "text-forest-300"
                        )}>
                            Annual
                            <Badge className="ml-2 bg-amber-500 text-white">
                                Save 20%
                            </Badge>
                        </span>
                    </div>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="relative overflow-hidden bg-forest-800/50 border-forest-700 backdrop-blur">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-5 h-5 text-forest-400" />
                                    <CardTitle className="text-white">
                                        {SUBSCRIPTION_TIERS.free.name}
                                    </CardTitle>
                                </div>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-white">$0</span>
                                    <span className="text-forest-300">/month</span>
                                </div>
                                <CardDescription className="text-forest-200">
                                    Perfect for casual anglers
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {SUBSCRIPTION_TIERS.free.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-forest-400 shrink-0 mt-0.5" />
                                            <span className="text-forest-100">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className="w-full bg-forest-700 hover:bg-forest-600 text-white"
                                    onClick={() => handleSubscribe('free')}
                                >
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Pro Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-2 border-amber-500 backdrop-blur scale-105 shadow-2xl">
                            <Badge className="absolute top-4 right-4 bg-amber-500 text-white">
                                Most Popular
                            </Badge>

                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                    <CardTitle className="text-white">
                                        {SUBSCRIPTION_TIERS.pro.name}
                                    </CardTitle>
                                </div>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-white">
                                        ${isAnnual ? (getAnnualPrice(SUBSCRIPTION_TIERS.pro.price) / 12).toFixed(2) : SUBSCRIPTION_TIERS.pro.price}
                                    </span>
                                    <span className="text-forest-200">/month</span>
                                </div>
                                {isAnnual && (
                                    <p className="text-sm text-amber-400">
                                        ${getAnnualPrice(SUBSCRIPTION_TIERS.pro.price).toFixed(2)}/year
                                    </p>
                                )}
                                <CardDescription className="text-forest-100">
                                    For serious anglers
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {SUBSCRIPTION_TIERS.pro.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                            <span className="text-white">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                                    onClick={() => handleSubscribe('pro')}
                                >
                                    Upgrade to Pro
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Elite Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/40 backdrop-blur opacity-80">
                            <Badge className="absolute top-4 right-4 bg-purple-500 text-white">
                                Coming Soon
                            </Badge>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="w-5 h-5 text-purple-400" />
                                    <CardTitle className="text-white">
                                        {SUBSCRIPTION_TIERS.elite.name}
                                    </CardTitle>
                                </div>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-white">
                                        ${isAnnual ? (getAnnualPrice(SUBSCRIPTION_TIERS.elite.price) / 12).toFixed(2) : SUBSCRIPTION_TIERS.elite.price}
                                    </span>
                                    <span className="text-forest-200">/month</span>
                                </div>
                                {isAnnual && (
                                    <p className="text-sm text-purple-400">
                                        ${getAnnualPrice(SUBSCRIPTION_TIERS.elite.price).toFixed(2)}/year
                                    </p>
                                )}
                                <CardDescription className="text-forest-100">
                                    For professional anglers
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {SUBSCRIPTION_TIERS.elite.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                            <span className="text-white">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className="w-full bg-purple-500/50 text-white font-semibold cursor-not-allowed"
                                    disabled
                                >
                                    Coming Soon
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 max-w-3xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-white text-center mb-8">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-4">

                        <Card className="bg-forest-800/50 border-forest-700">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">
                                    Can I cancel anytime?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-forest-200">
                                    Yes. Cancel from your account page at any time and you keep
                                    Pro access until the end of your billing period. No lock-in.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-forest-800/50 border-forest-700">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">
                                    What payment methods do you accept?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-forest-200">
                                    We accept all major credit cards, debit cards, and digital
                                    wallets through Stripe.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default Pricing;
