import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdConsent } from '@/lib/adConsent';

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
 *  2. Wait for the certified CMP's TCF response. Outside its regulated region,
 *     an explicit gdprApplies=false response suffices; within it, require
 *     completed storage consent for Google. No CMP response means no unit.
 *  3. Never render without a configured client ID and slot.
 *
 * EEA/UK/SWITZERLAND COMPLIANCE: Google requires a *certified* Consent
 * Management Platform for traffic from the EEA, the UK and Switzerland. The
 * local banner controls site analytics and affiliate localization only.
 * Publish the Google Privacy & messaging message before enabling ad units.
 */
export const AdBanner = ({ slot, format = 'auto', className = '' }: AdBannerProps) => {
  const { canShowAds } = useSubscription();
  const hasConsentDecision = useAdConsent();
  const unit = useRef<HTMLModElement | null>(null);
  const pushedUnit = useRef<HTMLModElement | null>(null);

  const showAd =
    canShowAds &&
    hasConsentDecision &&
    Boolean(ADSENSE_CLIENT) &&
    Boolean(slot);

  useEffect(() => {
    if (!showAd || !unit.current || pushedUnit.current === unit.current || unit.current.hasAttribute('data-adsbygoogle-status')) return;
    loadAdSenseScript();
    try {
      const win = window as Window & { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
      pushedUnit.current = unit.current;
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
        key={slot}
        ref={unit}
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
