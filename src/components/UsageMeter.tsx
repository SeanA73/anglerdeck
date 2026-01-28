import { motion } from 'framer-motion';
import { AlertCircle, Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageMeterProps {
  type: 'spots' | 'catches' | 'maps';
  current: number;
  limit: number | 'unlimited';
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const UsageMeter = ({
  type,
  current,
  limit,
  className,
  showLabel = true,
  compact = false,
}: UsageMeterProps) => {
  if (limit === 'unlimited' || limit === Infinity) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {showLabel && (
          <span className="text-sm text-muted-foreground capitalize">
            {type}:
          </span>
        )}
        <div className="flex items-center gap-1 text-sm text-primary">
          <Crown className="w-4 h-4" />
          <span>Unlimited</span>
        </div>
      </div>
    );
  }

  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  const label = {
    spots: 'Spot views',
    catches: 'Catch logs',
    maps: 'Offline maps',
  }[type];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            isAtLimit
              ? 'bg-destructive/10 text-destructive'
              : isNearLimit
              ? 'bg-amber-500/10 text-amber-600'
              : 'bg-primary/10 text-primary'
          )}
        >
          {current}/{limit}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span
            className={cn(
              'font-medium',
              isAtLimit
                ? 'text-destructive'
                : isNearLimit
                ? 'text-amber-600'
                : 'text-foreground'
            )}
          >
            {current} / {limit}
          </span>
        </div>
      )}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'absolute left-0 top-0 h-full rounded-full',
            isAtLimit
              ? 'bg-destructive'
              : isNearLimit
              ? 'bg-amber-500'
              : 'bg-primary'
          )}
        />
      </div>
      {isAtLimit && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>Limit reached - upgrade for unlimited access</span>
        </div>
      )}
      {!isAtLimit && isNearLimit && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertCircle className="w-3 h-3" />
          <span>Approaching limit</span>
        </div>
      )}
    </div>
  );
};

interface UsageSummaryProps {
  spotsUsed: number;
  spotsLimit: number | 'unlimited';
  catchesUsed: number;
  catchesLimit: number | 'unlimited';
  className?: string;
}

export const UsageSummary = ({
  spotsUsed,
  spotsLimit,
  catchesUsed,
  catchesLimit,
  className,
}: UsageSummaryProps) => {
  return (
    <div className={cn('space-y-4 p-4 bg-muted/50 rounded-xl', className)}>
      <h4 className="font-medium text-sm text-foreground">Monthly Usage</h4>
      <UsageMeter
        type="spots"
        current={spotsUsed}
        limit={spotsLimit}
      />
      <UsageMeter
        type="catches"
        current={catchesUsed}
        limit={catchesLimit}
      />
    </div>
  );
};
