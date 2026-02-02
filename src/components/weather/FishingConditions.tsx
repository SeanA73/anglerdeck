import { Fish, Lightbulb, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  calculateFishingScore, 
  FishingConditionsInput, 
  FishingScore,
  getScoreBadgeClasses 
} from "@/lib/fishingConditions";

interface FishingConditionsProps {
  temperature: number;
  windSpeed: number;
  humidity: number;
  pressure?: number;
  cloudCover?: number;
  weatherCode?: number;
  isLoading?: boolean;
  className?: string;
}

export function FishingConditions({
  temperature,
  windSpeed,
  humidity,
  pressure,
  cloudCover,
  weatherCode,
  isLoading = false,
  className,
}: FishingConditionsProps) {
  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-2xl p-6 border border-border/50 space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const input: FishingConditionsInput = {
    temperature,
    windSpeed,
    humidity,
    pressure,
    cloudCover,
    weatherCode,
  };

  const score = calculateFishingScore(input);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("bg-card rounded-2xl p-6 border border-border/50", className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Fish className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Fishing Conditions</h2>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-4 mb-6">
        <ScoreCircle score={score.overall} color={score.color} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-foreground">{score.overall}</span>
            <span className="text-muted-foreground">/100</span>
          </div>
          <span className={cn(
            "inline-block px-3 py-1 rounded-full text-sm font-semibold border mt-1",
            getScoreBadgeClasses(score.label)
          )}>
            {score.label}
          </span>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-3 mb-6">
        <FactorBar label="Temperature" value={score.factors.temperature} />
        <FactorBar label="Wind" value={score.factors.wind} />
        <FactorBar label="Pressure" value={score.factors.pressure} />
        <FactorBar label="Conditions" value={score.factors.conditions} />
      </div>

      {/* Best Time Hint */}
      <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg mb-4">
        <Clock className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
        <p className="text-sm text-foreground">{score.bestTimeHint}</p>
      </div>

      {/* Recommendations */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Lightbulb className="w-4 h-4 text-accent" />
          <span>Tips</span>
        </div>
        <ul className="space-y-2">
          {score.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 flex-shrink-0" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 transform -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-muted"
        />
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <TrendingUp className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  const getBarColor = (val: number) => {
    if (val >= 80) return "bg-green-500";
    if (val >= 60) return "bg-blue-500";
    if (val >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={cn("h-full rounded-full", getBarColor(value))}
        />
      </div>
    </div>
  );
}

// Compact version for cards/popups
interface FishingScoreBadgeProps {
  temperature: number;
  windSpeed: number;
  humidity: number;
  pressure?: number;
  cloudCover?: number;
  weatherCode?: number;
  isLoading?: boolean;
  className?: string;
}

export function FishingScoreBadge({
  temperature,
  windSpeed,
  humidity,
  pressure,
  cloudCover,
  weatherCode,
  isLoading = false,
  className,
}: FishingScoreBadgeProps) {
  if (isLoading) {
    return <Skeleton className="h-5 w-20 rounded-full" />;
  }

  const score = calculateFishingScore({
    temperature,
    windSpeed,
    humidity,
    pressure,
    cloudCover,
    weatherCode,
  });

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
      getScoreBadgeClasses(score.label),
      className
    )}>
      <Fish className="w-3 h-3" />
      {score.label}
    </span>
  );
}

export default FishingConditions;
