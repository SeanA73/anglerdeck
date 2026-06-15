import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CookiePreferencesDialog from "./CookiePreferencesDialog";

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "anglerdeck-cookie-consent";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsedPrefs = JSON.parse(stored);
        setPreferences(parsedPrefs);
      } catch {
        // Invalid stored data, show banner
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = (prefs: CookiePreferences) => {
    savePreferences(prefs);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent/10 hidden sm:block">
                  <Cookie className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Cookie className="w-5 h-5 text-accent sm:hidden" />
                      Cookie Preferences
                    </h3>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Close cookie banner"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                    By clicking "Accept All", you consent to our use of cookies. Read our{" "}
                    <Link to="/cookies" className="text-accent hover:underline">
                      Cookie Policy
                    </Link>{" "}
                    for more information.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleAcceptAll} variant="hero" size="sm">
                      Accept All
                    </Button>
                    <Button onClick={handleRejectNonEssential} variant="outline" size="sm">
                      Reject Non-Essential
                    </Button>
                    <Button
                      onClick={() => setShowPreferences(true)}
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Customize
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookiePreferencesDialog
        open={showPreferences}
        onOpenChange={setShowPreferences}
        preferences={preferences}
        onSave={handleSavePreferences}
      />
    </>
  );
};

export default CookieConsent;
