import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import type { CookiePreferences } from "./CookieConsent";

interface CookiePreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: CookiePreferences;
  onSave: (preferences: CookiePreferences) => void;
}

const cookieTypes = [
  {
    key: "essential" as const,
    label: "Essential Cookies",
    description: "Required for the website to function properly. Cannot be disabled.",
    required: true,
  },
  {
    key: "functional" as const,
    label: "Functional Cookies",
    description: "Enable personalized features like remembering your preferences and saved spots.",
    required: false,
  },
  {
    key: "analytics" as const,
    label: "Analytics Cookies",
    description: "Help us understand how visitors use the site so we can improve the experience.",
    required: false,
  },
  {
    key: "marketing" as const,
    label: "Marketing Cookies",
    description: "Used to deliver relevant advertisements and track marketing campaign effectiveness.",
    required: false,
  },
];

const CookiePreferencesDialog = ({
  open,
  onOpenChange,
  preferences,
  onSave,
}: CookiePreferencesDialogProps) => {
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === "essential") return; // Cannot toggle essential cookies
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSave(localPreferences);
  };

  const handleAcceptAll = () => {
    onSave({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Manage your cookie preferences below. Essential cookies are required for the site to work properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {cookieTypes.map((cookie) => (
            <div
              key={cookie.key}
              className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={cookie.key} className="font-medium text-foreground">
                    {cookie.label}
                  </Label>
                  {cookie.required && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{cookie.description}</p>
              </div>
              <Switch
                id={cookie.key}
                checked={localPreferences[cookie.key]}
                onCheckedChange={() => handleToggle(cookie.key)}
                disabled={cookie.required}
                className="shrink-0"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleAcceptAll} variant="outline" className="w-full sm:w-auto">
            Accept All
          </Button>
          <Button onClick={handleSave} variant="hero" className="w-full sm:w-auto">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesDialog;
