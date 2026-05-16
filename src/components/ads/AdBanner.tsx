import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

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

export const AdBanner = ({ slot, format = 'auto', className = '' }: AdBannerProps) => {
  const { subscription } = useSubscription();
  const pushed = useRef(false);

  const showAd =
    subscription?.tier !== 'pro' &&
    subscription?.tier !== 'elite' &&
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
