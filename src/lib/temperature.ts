export const fahrenheitToCelsius = (f: number) => Math.round(((f - 32) * 5) / 9);

export const getDefaultUseCelsius = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const locale = navigator.language || 'en-US';
  return !locale.startsWith('en-US');
};

export const formatTemperature = (fahrenheit: number, useCelsius: boolean): string =>
  useCelsius ? `${fahrenheitToCelsius(fahrenheit)}°C` : `${fahrenheit}°F`;
