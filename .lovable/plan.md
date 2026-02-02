
# Real-Time Weather Integration Enhancement Plan

## Overview

The project already has a solid weather foundation with the `useWeather` hook using the free Open-Meteo API. This plan enhances the existing implementation to display weather prominently across the app and add intelligent fishing conditions recommendations.

## Current State

- Weather hook exists (`src/hooks/useWeather.ts`) using Open-Meteo API
- SpotDetail page already shows live weather data with icons
- Backup files exist for advanced water conditions dashboard

## Implementation Scope

### 1. Weather Display Component (New)
Create a reusable `WeatherBadge` component that can be used across the app:
- Compact mode: Shows temp + icon (for spot cards)
- Expanded mode: Shows temp, wind, humidity (for popups)
- Loading state with skeleton
- Error fallback to static data

### 2. Fishing Conditions Analyzer (New)
Create an intelligent fishing score calculator:
- Analyzes temperature, wind, pressure, and weather conditions
- Returns a score (0-100) with recommendation text
- Provides species-specific optimal conditions
- Color-coded visual indicator (Excellent/Good/Fair/Poor)

### 3. Enhanced Spot Cards
Add weather badges to spot cards showing:
- Current temperature with weather icon
- Wind speed indicator
- "Great fishing conditions" badge when score > 75

**Files affected:**
- `src/components/FeaturedSpots.tsx`
- `src/pages/Spots.tsx` (SpotCard component)

### 4. Map Popup Weather
Enhance map spot popups with:
- Current temperature and conditions
- Quick fishing score indicator
- "View Details" for full weather info

**Files affected:**
- `src/components/map/LeafletMap.tsx`

### 5. Fishing Conditions Dashboard
Restore and enhance the WaterConditionsDashboard component:
- Current conditions grid (temp, wind, humidity, pressure)
- Fishing score card with factor breakdown
- Best times recommendation
- Weather-based fishing tips

**Files affected:**
- New: `src/components/weather/WeatherBadge.tsx`
- New: `src/components/weather/FishingConditions.tsx`
- Restored: `src/components/WaterConditionsDashboard.tsx`
- Update: `src/pages/SpotDetail.tsx`

### 6. Enhanced Weather Hook
Extend `useWeather` to include:
- Barometric pressure (for fish activity prediction)
- UV index
- Sunrise/sunset times
- Caching optimization

---

## New Components

### WeatherBadge Component
```text
┌─────────────────────────────┐
│  ☀️  72°F  │  Wind: 8 mph  │  <- Compact mode on cards
└─────────────────────────────┘

┌────────────────────────────────────┐
│  ☀️  Clear Sky                     │
│  72°F (feels like 70°F)            │  <- Expanded mode
│  Wind: 8 mph NW  •  Humidity: 45%  │
└────────────────────────────────────┘
```

### FishingConditions Component
```text
┌─────────────────────────────────────────┐
│  🎣 Fishing Score: 82/100  [EXCELLENT]  │
├─────────────────────────────────────────┤
│  Temperature ████████░░  80%            │
│  Wind        █████████░  90%            │
│  Pressure    ███████░░░  70%            │
│  Conditions  █████████░  90%            │
├─────────────────────────────────────────┤
│  💡 Great conditions! Stable pressure   │
│  and mild winds are ideal for fishing.  │
└─────────────────────────────────────────┘
```

---

## Technical Details

### Files to Create
1. `src/components/weather/WeatherBadge.tsx` - Reusable weather display
2. `src/components/weather/FishingConditions.tsx` - Fishing score card
3. `src/lib/fishingConditions.ts` - Score calculation logic

### Files to Modify
1. `src/hooks/useWeather.ts` - Add pressure, UV, sunrise/sunset
2. `src/components/FeaturedSpots.tsx` - Add WeatherBadge to cards
3. `src/pages/Spots.tsx` - Add WeatherBadge to SpotCard
4. `src/components/map/LeafletMap.tsx` - Add weather to popups
5. `src/pages/SpotDetail.tsx` - Add FishingConditions component

### Weather Data Flow
```text
Open-Meteo API
     │
     ▼
useWeather Hook (cached 15 min)
     │
     ├──► WeatherBadge (spot cards, popups)
     │
     └──► FishingConditions (spot detail page)
              │
              ▼
         calculateFishingScore()
              │
              ▼
         Score + Recommendations
```

### Fishing Score Algorithm
Factors and weights:
- Temperature (25%): Optimal range 55-75°F
- Wind Speed (25%): Under 15 mph is ideal
- Barometric Pressure (25%): Stable/rising is better
- Cloud Cover (25%): Overcast often better than bright sun

Score thresholds:
- 80-100: Excellent (green badge)
- 60-79: Good (blue badge)
- 40-59: Fair (yellow badge)
- 0-39: Poor (red badge)

---

## Implementation Order

1. **Phase 1: Core Components**
   - Create WeatherBadge component
   - Create FishingConditions component
   - Create fishing score calculation utility

2. **Phase 2: Integration**
   - Add WeatherBadge to FeaturedSpots cards
   - Add WeatherBadge to Spots page cards
   - Enhance useWeather with additional data

3. **Phase 3: Advanced Features**
   - Add FishingConditions to SpotDetail page
   - Add weather to map popups
   - Add species-specific recommendations

---

## API Details

### Open-Meteo Parameters (Enhanced)
The existing API call will be extended to include:
```
current=temperature_2m,relative_humidity_2m,apparent_temperature,
        weather_code,wind_speed_10m,wind_direction_10m,
        surface_pressure,cloud_cover,uv_index,is_day
daily=sunrise,sunset
```

No API key required - Open-Meteo is free and reliable.

---

## Benefits

- **Real-time data**: Live weather updates every 15 minutes
- **Fishing intelligence**: Actionable recommendations for anglers
- **Visual appeal**: Weather icons and color-coded scores
- **Performance**: Cached queries reduce API calls
- **No cost**: Uses free Open-Meteo API

