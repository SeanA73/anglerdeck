import { getVisitorCountryStrict } from './geo';

export const fahrenheitToCelsius = (f: number) => Math.round(((f - 32) * 5) / 9);

/**
 * The only countries still using Fahrenheit for everyday weather.
 * (Plus a few US territories, which share the US timezones anyway.)
 */
const IMPERIAL_COUNTRIES = new Set(['US', 'LR', 'MM']);

/**
 * Defaults to Celsius everywhere except the handful of imperial countries.
 *
 * Detection is by browser timezone rather than `navigator.language`: a large
 * share of non-US users run their browser in `en-US` (it is the Windows
 * default), which previously showed Australian users Fahrenheit next to a
 * Celsius water temperature. `Australia/Sydney` has no such ambiguity.
 *
 * Users can still override this with the toggle on the spot page.
 */
export const getDefaultUseCelsius = (): boolean => {
  // Timezone only — never the locale, which misreports en-US browsers abroad.
  const country = getVisitorCountryStrict();
  if (!country) return true; // metric is the safer default worldwide
  return !IMPERIAL_COUNTRIES.has(country);
};

export const formatTemperature = (fahrenheit: number, useCelsius: boolean): string =>
  useCelsius ? `${fahrenheitToCelsius(fahrenheit)}°C` : `${fahrenheit}°F`;

export const mphToKmh = (mph: number) => Math.round(mph * 1.60934);

export const formatWindSpeed = (mph: number, useMetric: boolean): string =>
  useMetric ? `${mphToKmh(mph)} km/h` : `${mph} mph`;
