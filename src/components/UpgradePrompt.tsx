import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Lock, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'limit_reached' | 'premium_feature';
  feature?: string;
  limitType?: 'spots' | 'catches' | 'maps';
  currentUsage?: number;
  limit?: number;
}

export const UpgradePrompt = ({
  isOpen,
  onClose,
  type,
  feature,
  limitType,
  currentUsage,
  limit,
}: UpgradePromptProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  const proFeatures = [
    'Unlimited spot views',
    'Unlimited catch logs',
    'AI Fishing Assistant',
    'Post to the community feed',
    'Ad-free experience',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
            {type === 'limit_reached' ? (
              <Zap className="w-6 h-6 text-white" />
            ) : (
              <Lock className="w-6 h-6 text-white" />
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {type === 'limit_reached'
              ? 'Monthly Limit Reached'
              : 'Premium Feature'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {type === 'limit_reached' ? (
              <>
                You've used{' '}
                <span className="font-semibold text-foreground">
                  {currentUsage} of {limit}
                </span>{' '}
                {limitType === 'spots' && 'spot views'}
                {limitType === 'catches' && 'catch logs'}
                {limitType === 'maps' && 'offline maps'} this month.
                <br />
                Upgrade to unlock unlimited access!
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">{feature}</span>{' '}
                is a premium feature. Upgrade your plan to unlock it!
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-xl border border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 p-4"
          >
            <div className="absolute -top-2.5 left-4">
              <span className="px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                Most Popular
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">Pro</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">
                  ${SUBSCRIPTION_TIERS.pro.price}
                </span>
                <span className="text-muted-foreground">/mo</span>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleUpgrade} size="lg" className="w-full">
            <Crown className="w-4 h-4 mr-2" />
            View Pricing Plans
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
