// Validate environment variables FIRST — before any other imports that might
// depend on env vars. If any required var is missing or malformed, this throws
// with a clear error message rather than letting undefined values propagate
// into runtime code where they cause mysterious failures later.
import "@/lib/env";

import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initAnalytics } from "@/lib/analytics";
import { initGoogleConsentDefaults } from "@/lib/cookieConsent";

// Consent Mode defaults must be set before any Google tag (AdSense) loads.
initGoogleConsentDefaults();

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);