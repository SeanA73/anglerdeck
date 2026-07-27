/**
 * Amazon OneLink loader.
 *
 * Our stored affiliate URLs always point at amazon.com with the US tag
 * (see buildAmazonUrl in ./affiliate). OneLink is what makes those links pay
 * on international traffic: once the script is present, Amazon rewrites the
 * link at click time to the visitor's local store (amazon.co.uk, .de, .com.au…)
 * under the linked tag for that marketplace. Without it, a UK angler lands on
 * the US store and any purchase earns nothing.
 *
 * The adInstanceId is issued per-account in Associates Central
 * (Tools → OneLink). When VITE_AMAZON_ONELINK_ID is unset this is a no-op, so
 * the site behaves exactly as before.
 */

const ONELINK_ID = import.meta.env.VITE_AMAZON_ONELINK_ID;

/** Home marketplace the stored links are built against — see buildAmazonUrl. */
const HOME_MARKETPLACE = "US";

let oneLinkScriptLoaded = false;

export const loadOneLinkScript = () => {
  if (oneLinkScriptLoaded || !ONELINK_ID || typeof document === "undefined") return;
  if (document.querySelector('script[src*="widgets/onejs"]')) {
    oneLinkScriptLoaded = true;
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://z-na.amazon-adsystem.com/widgets/onejs?MarketPlace=${HOME_MARKETPLACE}&adInstanceId=${ONELINK_ID}`;
  document.head.appendChild(script);
  oneLinkScriptLoaded = true;
};

export const oneLinkEnabled = Boolean(ONELINK_ID);
