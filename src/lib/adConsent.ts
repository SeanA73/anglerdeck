import { useEffect, useState } from "react";

export interface TcData {
  listenerId?: number;
  cmpStatus?: string;
  eventStatus?: string;
  gdprApplies?: boolean;
  tcString?: string;
  purpose?: { consents?: Record<number, boolean> };
  vendor?: { consents?: Record<number, boolean> };
}

type TcfApi = (command: string, version: number, callback: (data: TcData, success: boolean) => void, parameter?: number) => void;
declare global {
  interface Window {
    __tcfapi?: TcfApi;
    googlefc?: { showRevocationMessage?: () => void };
  }
}

/** No geographic guesses and no homemade-banner substitute for a CMP signal. */
export const permitsAds = (data: TcData, success: boolean): boolean =>
  success && data.cmpStatus === "loaded" &&
  (data.gdprApplies === false || (
    data.gdprApplies === true && Boolean(data.tcString) &&
    ["tcloaded", "useractioncomplete"].includes(data.eventStatus ?? "") &&
    data.purpose?.consents?.[1] === true && data.vendor?.consents?.[755] === true
  ));

export const watchAdConsent = (onChange: (allowed: boolean) => void): (() => void) => {
  let active = true;
  let api: TcfApi | undefined;
  let listenerId: number | undefined;
  const connect = () => {
    if (api || !window.__tcfapi) return;
    api = window.__tcfapi;
    try {
      api("addEventListener", 2, (data, success) => {
        listenerId = data?.listenerId;
        if (!active) {
          if (listenerId != null) api?.("removeEventListener", 2, () => {}, listenerId);
          return;
        }
        onChange(data ? permitsAds(data, success) : false);
      });
    } catch {
      api = undefined;
      onChange(false);
    }
  };
  connect();
  // CMP code is injected asynchronously by the AdSense tag after account setup.
  const timer = window.setInterval(connect, 1000);
  const warning = window.setTimeout(() => {
    if (!api) console.warn("[AdSense] No CMP API detected; ad units remain disabled. Publish the site's Google Privacy & messaging consent message.");
  }, 15000);
  return () => {
    active = false;
    window.clearInterval(timer);
    window.clearTimeout(warning);
    if (listenerId != null) api?.("removeEventListener", 2, () => {}, listenerId);
  };
};

export const useAdConsent = (): boolean => {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => watchAdConsent(setAllowed), []);
  return allowed;
};
