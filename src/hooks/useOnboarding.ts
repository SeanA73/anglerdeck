import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ONBOARDING_KEY = "reelspot-onboarding-completed";
const ONBOARDING_STEP_KEY = "reelspot-onboarding-step";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to ReelSpot! 🎣",
    description: "Let's take a quick tour to help you discover all the features available to you.",
    placement: "bottom",
  },
  {
    id: "explore-spots",
    title: "Explore Fishing Spots",
    description: "Browse our curated collection of fishing spots, complete with ratings, reviews, and species information.",
    targetSelector: "[data-onboarding='featured-spots']",
    placement: "top",
  },
  {
    id: "map-view",
    title: "Interactive Map",
    description: "Use the map view to find spots near your location. Filter by species, water type, and more!",
    targetSelector: "[data-onboarding='map-link']",
    placement: "bottom",
  },
  {
    id: "log-catches",
    title: "Log Your Catches",
    description: "Track your fishing adventures by logging catches with photos, weight, and location details.",
    targetSelector: "[data-onboarding='catches-link']",
    placement: "bottom",
  },
  {
    id: "community",
    title: "Join the Community",
    description: "Share your stories, connect with fellow anglers, and discover tips from the community.",
    targetSelector: "[data-onboarding='community-link']",
    placement: "bottom",
  },
];

export const useOnboarding = () => {
  const { user } = useAuth();
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  // Check if onboarding has been completed
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);

    if (completed === "true") {
      setHasCompletedOnboarding(true);
      setIsOnboardingActive(false);
    } else {
      setHasCompletedOnboarding(false);
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    }
  }, []);

  // Auto-start onboarding for new users who just signed up
  const startOnboarding = useCallback(() => {
    setIsOnboardingActive(true);
    setCurrentStep(0);
    localStorage.setItem(ONBOARDING_STEP_KEY, "0");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < onboardingSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      localStorage.setItem(ONBOARDING_STEP_KEY, String(newStep));
    } else {
      completeOnboarding();
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      localStorage.setItem(ONBOARDING_STEP_KEY, String(newStep));
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompletedOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompletedOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompletedOnboarding(false);
    setCurrentStep(0);
  }, []);

  const getCurrentStep = useCallback(() => {
    return onboardingSteps[currentStep] || null;
  }, [currentStep]);

  return {
    isOnboardingActive,
    currentStep,
    totalSteps: onboardingSteps.length,
    hasCompletedOnboarding,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    getCurrentStep,
    steps: onboardingSteps,
  };
};
