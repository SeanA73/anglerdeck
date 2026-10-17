import { afterEach, describe, expect, it, vi } from "vitest";
import { permitsAds, watchAdConsent, type TcData } from "@/lib/adConsent";

const consent: TcData = {
  cmpStatus: "loaded", eventStatus: "useractioncomplete", gdprApplies: true,
  tcString: "cmp-issued-string", purpose: { consents: { 1: true } },
  vendor: { consents: { 755: true } }, listenerId: 4,
};

afterEach(() => { delete window.__tcfapi; vi.useRealTimers(); });

describe("certified CMP ad eligibility", () => {
  it("requires a usable, completed Google consent signal", () => {
    expect(permitsAds(consent, true)).toBe(true);
    for (const change of [
      { cmpStatus: "loading" }, { gdprApplies: undefined }, { tcString: "" },
      { eventStatus: "cmpuishown" }, { purpose: { consents: { 1: false } } },
      { vendor: { consents: { 755: false } } },
    ]) expect(permitsAds({ ...consent, ...change }, true)).toBe(false);
    expect(permitsAds(consent, false)).toBe(false);
  });

  it("accepts the CMP's explicit out-of-region signal without local banner state", () => {
    expect(permitsAds({ cmpStatus: "loaded", gdprApplies: false }, true)).toBe(true);
  });

  it("connects to a late CMP and reacts to withdrawal", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    let notify: ((data: TcData, success: boolean) => void) | undefined;
    const stop = watchAdConsent(change);
    window.__tcfapi = vi.fn((command, _version, callback) => {
      if (command === "addEventListener") { notify = callback; callback(consent, true); }
    });
    vi.advanceTimersByTime(1000);
    expect(change).toHaveBeenLastCalledWith(true);
    notify!({ ...consent, purpose: { consents: { 1: false } } }, true);
    expect(change).toHaveBeenLastCalledWith(false);
    stop();
    expect(window.__tcfapi).toHaveBeenLastCalledWith("removeEventListener", 2, expect.any(Function), 4);
  });

  it("does not authorize ads when a CMP is absent", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    const stop = watchAdConsent(change);
    vi.advanceTimersByTime(2000);
    expect(change).not.toHaveBeenCalledWith(true);
    stop();
  });
});
