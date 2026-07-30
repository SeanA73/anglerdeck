import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { CONSENT_CHANGED_EVENT, readConsent } from '@/lib/cookieConsent';

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT_ID;

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
}

let adsenseScriptLoaded = false;

const loadAdSenseScript = () => {
  if (adsenseScriptLoaded || !ADSENSE_CLIENT || typeof document === 'undefined') return;
  if (document.querySelector('script[src*="adsbygoogle.js"]')) {
    adsenseScriptLoaded = true;
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
  adsenseScriptLoaded = true;
};

/**
 * AdSense unit, hidden for paying subscribers and gated on cookie consent.
 *
 * Three rules, in order:
 *  1. Never render until the subscription has loaded — otherwise Pro and Elite
 *     users see an ad flash on every page load, which is exactly what they paid
 *     to avoid.
 *  2. Never render until the visitor has answered the cookie banner. Once they
 *     have, ads may load either way: Google Consent Mode decides whether they
 *     are personalised, so declining marketing yields non-personalised ads
 *     rather than no ads at all.
 *  3. Never render without a configured client ID and slot.
 *
 * EEA/UK/SWITZERLAND COMPLIANCE: Google requires a *certified* Consent
 * Management Platform for traffic from the EEA, the UK and Switzerland. The
 * in-house banner sets Consent Mode signals correctly but is not certified, so
 * a certified CMP must be in place before serving ads to those visitors.
 */
export const AdBanner = ({ slot, format = 'auto', className = '' }: AdBannerProps) => {
  const { subscription, isLoading } = useSubscription();
  const [hasConsentDecision, setHasConsentDecision] = useState(
    () => readConsent() !== null
  );
  const pushed = useRef(false);

  useEffect(() => {
    const onChange = () => setHasConsentDecision(readConsent() !== null);
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  const isPaidTier =
    subscription?.tier === 'pro' || subscription?.tier === 'elite';

  const showAd =
    !isLoading &&
    !isPaidTier &&
    hasConsentDecision &&
    Boolean(ADSENSE_CLIENT) &&
    Boolean(slot);

  useEffect(() => {
    if (!showAd || pushed.current) return;
    loadAdSenseScript();
    try {
      const win = window as Window & { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [showAd, slot]);

  if (!showAd) {
    return null;
  }

  return (
    <div className={`my-4 text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Advertisement ·{' '}
        <Link to="/pricing" className="underline hover:text-foreground">
          Go ad-free
        </Link>
      </p>
    </div>
  );
};
