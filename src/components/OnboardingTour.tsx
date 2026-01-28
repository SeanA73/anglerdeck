import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";

const OnboardingTour = () => {
  const {
    isOnboardingActive,
    currentStep,
    totalSteps,
    getCurrentStep,
    nextStep,
    previousStep,
    skipOnboarding,
  } = useOnboarding();

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const step = getCurrentStep();

  const updatePositions = useCallback(() => {
    if (!step) return;

    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightRect(rect);

        // Calculate tooltip position based on placement
        const padding = 16;
        let top = 0;
        let left = rect.left + rect.width / 2;

        switch (step.placement) {
          case "top":
            top = rect.top - padding;
            break;
          case "bottom":
            top = rect.bottom + padding;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - padding;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + padding;
            break;
          default:
            top = rect.bottom + padding;
        }

        setTooltipPosition({ top, left });
      }
    } else {
      // Center on screen for welcome step
      setSpotlightRect(null);
      setTooltipPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      });
    }
  }, [step]);

  useEffect(() => {
    if (isOnboardingActive) {
      updatePositions();
      window.addEventListener("resize", updatePositions);
      window.addEventListener("scroll", updatePositions);

      return () => {
        window.removeEventListener("resize", updatePositions);
        window.removeEventListener("scroll", updatePositions);
      };
    }
  }, [isOnboardingActive, updatePositions]);

  if (!isOnboardingActive || !step) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop with spotlight cutout */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm">
          {spotlightRect && (
            <div
              className="absolute rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] ring-4 ring-accent/50"
              style={{
                top: spotlightRect.top - 8,
                left: spotlightRect.left - 8,
                width: spotlightRect.width + 16,
                height: spotlightRect.height + 16,
              }}
            />
          )}
        </div>

        {/* Tooltip */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="absolute z-10 w-80 max-w-[calc(100vw-2rem)]"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: spotlightRect
              ? step.placement === "top"
                ? "translate(-50%, -100%)"
                : step.placement === "left"
                ? "translate(-100%, -50%)"
                : step.placement === "right"
                ? "translate(0, -50%)"
                : "translate(-50%, 0)"
              : "translate(-50%, -50%)",
          }}
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-foreground">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                </div>
                <button
                  onClick={skipOnboarding}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  aria-label="Skip tour"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-2">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={previousStep}
                disabled={isFirstStep}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={skipOnboarding}>
                  Skip Tour
                </Button>
                <Button variant="hero" size="sm" onClick={nextStep} className="gap-1">
                  {isLastStep ? "Finish" : "Next"}
                  {!isLastStep && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
