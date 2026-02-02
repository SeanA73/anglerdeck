import { Sun, Cloud, CloudRain, CloudSun, CloudSnow, CloudLightning, Wind, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherBadgeProps {
  temperature?: number;
  condition?: string;
  icon?: string;
  windSpeed?: number;
  windDirection?: string;
  humidity?: number;
  isLoading?: boolean;
  variant?: "compact" | "expanded";
  className?: string;
}

const WeatherIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const iconClass = cn("text-accent", className);
  
  switch (icon) {
    case "sun":
      return <Sun className={iconClass} />;
    case "cloud-rain":
      return <CloudRain className={iconClass} />;
    case "cloud-sun":
      return <CloudSun className={iconClass} />;
    case "cloud-snow":
      return <CloudSnow className={iconClass} />;
    case "cloud-lightning":
      return <CloudLightning className={iconClass} />;
    default:
      return <Cloud className={iconClass} />;
  }
};

export function WeatherBadge({
  temperature,
  condition,
  icon = "cloud",
  windSpeed,
  windDirection,
  humidity,
  isLoading = false,
  variant = "compact",
  className,
}: WeatherBadgeProps) {
  if (isLoading) {
    if (variant === "compact") {
      return (
        <div className={cn("flex items-center gap-1.5", className)}>
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <Skeleton className="h-4 w-10" />
        </div>
      );
    }
    
    return (
      <div className={cn("bg-muted/50 rounded-lg p-3 space-y-2", className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (temperature === undefined) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 text-xs font-medium",
        className
      )}>
        <WeatherIcon icon={icon} className="w-3.5 h-3.5" />
        <span className="text-foreground">{temperature}°F</span>
        {windSpeed !== undefined && (
          <>
            <span className="text-muted-foreground">•</span>
            <Wind className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">{windSpeed}mph</span>
          </>
        )}
      </div>
    );
  }

  // Expanded variant
  return (
    <div className={cn(
      "bg-muted/50 rounded-xl p-4 space-y-2",
      className
    )}>
      <div className="flex items-center gap-3">
        <WeatherIcon icon={icon} className="w-8 h-8" />
        <div>
          <p className="text-lg font-bold text-foreground">{temperature}°F</p>
          <p className="text-sm text-muted-foreground">{condition}</p>
        </div>
      </div>
      
      {(windSpeed !== undefined || humidity !== undefined) && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
          {windSpeed !== undefined && (
            <div className="flex items-center gap-1">
              <Wind className="w-4 h-4" />
              <span>{windSpeed} mph {windDirection}</span>
            </div>
          )}
          {humidity !== undefined && (
            <div className="flex items-center gap-1">
              <span>{humidity}% humidity</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WeatherBadge;
