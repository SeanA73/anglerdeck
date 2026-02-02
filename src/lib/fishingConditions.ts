export interface FishingConditionsInput {
  temperature: number; // °F
  windSpeed: number; // mph
  humidity: number;
  pressure?: number; // hPa
  cloudCover?: number; // %
  weatherCode?: number;
}

export interface FishingScore {
  overall: number; // 0-100
  label: "Excellent" | "Good" | "Fair" | "Poor";
  color: string;
  factors: {
    temperature: number;
    wind: number;
    pressure: number;
    conditions: number;
  };
  recommendations: string[];
  bestTimeHint: string;
}

// Optimal temperature ranges for fishing (°F)
const TEMP_OPTIMAL_MIN = 55;
const TEMP_OPTIMAL_MAX = 75;
const TEMP_ACCEPTABLE_MIN = 45;
const TEMP_ACCEPTABLE_MAX = 85;

// Wind speed thresholds (mph)
const WIND_IDEAL_MAX = 10;
const WIND_ACCEPTABLE_MAX = 20;
const WIND_POOR_MAX = 30;

// Pressure thresholds (hPa) - stable/rising pressure is better
const PRESSURE_LOW = 1000;
const PRESSURE_HIGH = 1025;

export function calculateFishingScore(input: FishingConditionsInput): FishingScore {
  const { temperature, windSpeed, humidity, pressure = 1013, cloudCover = 50, weatherCode = 0 } = input;

  // Calculate individual factor scores (0-100)
  const tempScore = calculateTemperatureScore(temperature);
  const windScore = calculateWindScore(windSpeed);
  const pressureScore = calculatePressureScore(pressure);
  const conditionsScore = calculateConditionsScore(weatherCode, cloudCover);

  // Weighted average
  const overall = Math.round(
    tempScore * 0.25 +
    windScore * 0.25 +
    pressureScore * 0.25 +
    conditionsScore * 0.25
  );

  // Determine label and color
  const { label, color } = getScoreLabel(overall);

  // Generate recommendations
  const recommendations = generateRecommendations({
    temperature,
    windSpeed,
    pressure,
    cloudCover,
    weatherCode,
    tempScore,
    windScore,
    pressureScore,
    conditionsScore,
  });

  // Best time hint
  const bestTimeHint = getBestTimeHint(cloudCover, temperature);

  return {
    overall,
    label,
    color,
    factors: {
      temperature: tempScore,
      wind: windScore,
      pressure: pressureScore,
      conditions: conditionsScore,
    },
    recommendations,
    bestTimeHint,
  };
}

function calculateTemperatureScore(temp: number): number {
  if (temp >= TEMP_OPTIMAL_MIN && temp <= TEMP_OPTIMAL_MAX) {
    return 100;
  }
  if (temp >= TEMP_ACCEPTABLE_MIN && temp < TEMP_OPTIMAL_MIN) {
    return 60 + ((temp - TEMP_ACCEPTABLE_MIN) / (TEMP_OPTIMAL_MIN - TEMP_ACCEPTABLE_MIN)) * 40;
  }
  if (temp > TEMP_OPTIMAL_MAX && temp <= TEMP_ACCEPTABLE_MAX) {
    return 60 + ((TEMP_ACCEPTABLE_MAX - temp) / (TEMP_ACCEPTABLE_MAX - TEMP_OPTIMAL_MAX)) * 40;
  }
  if (temp < TEMP_ACCEPTABLE_MIN) {
    return Math.max(0, 30 + (temp / TEMP_ACCEPTABLE_MIN) * 30);
  }
  return Math.max(0, 30 - ((temp - TEMP_ACCEPTABLE_MAX) / 10) * 30);
}

function calculateWindScore(wind: number): number {
  if (wind <= WIND_IDEAL_MAX) {
    return 100;
  }
  if (wind <= WIND_ACCEPTABLE_MAX) {
    return 70 + ((WIND_ACCEPTABLE_MAX - wind) / (WIND_ACCEPTABLE_MAX - WIND_IDEAL_MAX)) * 30;
  }
  if (wind <= WIND_POOR_MAX) {
    return 30 + ((WIND_POOR_MAX - wind) / (WIND_POOR_MAX - WIND_ACCEPTABLE_MAX)) * 40;
  }
  return Math.max(0, 30 - ((wind - WIND_POOR_MAX) / 10) * 30);
}

function calculatePressureScore(pressure: number): number {
  // Ideal range: 1010-1020 hPa (stable)
  if (pressure >= 1010 && pressure <= 1020) {
    return 100;
  }
  if (pressure >= 1005 && pressure < 1010) {
    return 80;
  }
  if (pressure > 1020 && pressure <= 1025) {
    return 85;
  }
  if (pressure < 1005 || pressure > 1025) {
    return 50;
  }
  return 70;
}

function calculateConditionsScore(weatherCode: number, cloudCover: number): number {
  // Clear or partly cloudy is often not ideal - some cloud cover is better
  // Rain can be good for fishing in moderation
  
  // Thunderstorms - poor
  if (weatherCode >= 95) return 20;
  
  // Heavy rain/snow - poor
  if (weatherCode >= 65 && weatherCode <= 77) return 40;
  
  // Moderate rain - fair to good
  if (weatherCode >= 61 && weatherCode <= 67) return 70;
  
  // Light rain/drizzle - good
  if (weatherCode >= 51 && weatherCode <= 57) return 85;
  
  // Fog - can be excellent
  if (weatherCode >= 45 && weatherCode <= 48) return 80;
  
  // Overcast - excellent
  if (weatherCode === 3) return 95;
  
  // Partly cloudy - good
  if (weatherCode === 2) return 85;
  
  // Mainly clear - fair (too sunny)
  if (weatherCode === 1) return 70;
  
  // Clear sky - fish may be less active
  if (weatherCode === 0) {
    // Adjust based on cloud cover
    if (cloudCover < 20) return 60;
    return 75;
  }
  
  return 70;
}

function getScoreLabel(score: number): { label: FishingScore["label"]; color: string } {
  if (score >= 80) return { label: "Excellent", color: "hsl(142 76% 36%)" }; // green
  if (score >= 60) return { label: "Good", color: "hsl(217 91% 60%)" }; // blue
  if (score >= 40) return { label: "Fair", color: "hsl(45 93% 47%)" }; // yellow
  return { label: "Poor", color: "hsl(0 84% 60%)" }; // red
}

interface RecommendationInput {
  temperature: number;
  windSpeed: number;
  pressure: number;
  cloudCover: number;
  weatherCode: number;
  tempScore: number;
  windScore: number;
  pressureScore: number;
  conditionsScore: number;
}

function generateRecommendations(input: RecommendationInput): string[] {
  const recommendations: string[] = [];

  // Temperature recommendations
  if (input.temperature < TEMP_ACCEPTABLE_MIN) {
    recommendations.push("Cold temperatures may slow fish activity. Try deeper waters where fish seek warmth.");
  } else if (input.temperature > TEMP_ACCEPTABLE_MAX) {
    recommendations.push("Hot conditions - fish early morning or late evening when temperatures are cooler.");
  } else if (input.tempScore >= 90) {
    recommendations.push("Temperature is ideal for active fish feeding.");
  }

  // Wind recommendations
  if (input.windSpeed > WIND_ACCEPTABLE_MAX) {
    recommendations.push("High winds may make casting difficult. Consider sheltered spots or bank fishing.");
  } else if (input.windSpeed >= 5 && input.windSpeed <= 15) {
    recommendations.push("Light wind creates surface disturbance - excellent for topwater fishing.");
  }

  // Pressure recommendations
  if (input.pressure < PRESSURE_LOW) {
    recommendations.push("Falling pressure often triggers feeding activity before a storm.");
  } else if (input.pressure > PRESSURE_HIGH) {
    recommendations.push("High pressure may slow surface activity. Try deeper presentations.");
  }

  // Weather-specific tips
  if (input.weatherCode >= 51 && input.weatherCode <= 57) {
    recommendations.push("Light rain can be excellent - insects fall into water attracting fish.");
  } else if (input.weatherCode === 3) {
    recommendations.push("Overcast skies reduce shadows and make fish less wary.");
  } else if (input.cloudCover < 30 && input.weatherCode === 0) {
    recommendations.push("Bright sun may push fish to shaded areas and deeper water.");
  }

  // Ensure at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push("Conditions are favorable for a variety of fishing techniques.");
  }

  return recommendations.slice(0, 3);
}

function getBestTimeHint(cloudCover: number, temperature: number): string {
  if (cloudCover > 70) {
    return "Overcast conditions - fish actively throughout the day";
  }
  if (temperature > 80) {
    return "Best times: Dawn (5-8 AM) and Dusk (6-8 PM)";
  }
  if (temperature < 50) {
    return "Best time: Late morning to early afternoon when water warms";
  }
  return "Peak activity: Early morning and late afternoon";
}

// Badge color utilities for components
export function getScoreBadgeClasses(label: FishingScore["label"]): string {
  switch (label) {
    case "Excellent":
      return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
    case "Good":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "Fair":
      return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    case "Poor":
      return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
  }
}
