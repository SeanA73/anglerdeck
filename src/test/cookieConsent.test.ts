import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  COOKIE_CONSENT_KEY,
  initGoogleConsentDefaults,
  readConsent,
  updateGoogleConsent,
} from "@/lib/cookieConsent";

type ConsentWindow = Window & { anglerdeckConsentDefaultsSet?: boolean };

beforeEach(() => {
  localStorage.clear();
  window.dataLayer = [];
  delete (window as ConsentWindow).anglerdeckConsentDefaultsSet;
});

describe("Google consent bootstrap", () => {
  it("queues denied defaults before the HTML AdSense loader", () => {
    const html = readFileSync("index.html", "utf8");
    const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/);
    expect(bootstrap).not.toBeNull();
    expect(html.indexOf(bootstrap![0])).toBeLessThan(html.indexOf('src="https://pagead2.'));
    const target = { dataLayer: [] as IArguments[] };
    runInNewContext(bootstrap![1], { window: target });
    const command = target.dataLayer[0];
    expect(Array.isArray(command)).toBe(false);
    expect(Array.from(command).slice(0, 2)).toEqual(["consent", "default"]);
    expect(command[2]).toMatchObject({
      ad_storage: "denied", ad_user_data: "denied",
      ad_personalization: "denied", analytics_storage: "denied",
    });
  });

  it("restores saved preferences with an update after HTML defaults", () => {
    (window as ConsentWindow).anglerdeckConsentDefaultsSet = true;
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ analytics: true, marketing: false }));
    initGoogleConsentDefaults();
    const command = window.dataLayer![0] as IArguments;
    expect(Array.from(command).slice(0, 2)).toEqual(["consent", "update"]);
    expect(command[2]).toMatchObject({ analytics_storage: "granted" });
    expect(command[2]).not.toHaveProperty("ad_storage");
  });

  it("sets defaults when used without the HTML bootstrap", () => {
    initGoogleConsentDefaults();
    expect(Array.from(window.dataLayer![0] as IArguments).slice(0, 2)).toEqual(["consent", "default"]);
    initGoogleConsentDefaults();
    expect(window.dataLayer).toHaveLength(1);
  });

  it("queues consent withdrawal using the Google command format", () => {
    updateGoogleConsent({ essential: true, functional: false, analytics: false, marketing: false });
    const command = window.dataLayer![0] as IArguments;
    expect(Array.isArray(command)).toBe(false);
    expect(command[2]).toMatchObject({ analytics_storage: "denied" });
    expect(command[2]).not.toHaveProperty("ad_storage");
  });
});

describe("stored cookie preferences", () => {
  it("never grants consent from truthy strings or numbers", () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ marketing: "false", analytics: 1, functional: true }));
    expect(readConsent()).toEqual({ essential: true, marketing: false, analytics: false, functional: true });
  });

  it("treats malformed records as no decision", () => {
    for (const value of ["null", "[]", '"yes"', "invalid"]) {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
      expect(readConsent()).toBeNull();
    }
  });
});
