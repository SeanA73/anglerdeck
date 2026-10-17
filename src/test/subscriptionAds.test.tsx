import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";

const state = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false, sessionError: false },
  tier: "free", error: null as { message: string } | null,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => state.auth }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: state.error ? null : { id: "sub", tier: state.tier, status: "active" }, error: state.error }),
    gte: async () => ({ count: 0, error: null }),
  }) }) }) },
}));
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
    {children}
  </QueryClientProvider>
);
beforeEach(() => {
  state.auth = { user: null, loading: false, sessionError: false };
  state.tier = "free"; state.error = null;
});
describe("subscription ad protection", () => {
  it("withholds ads until authentication resolves", () => {
    state.auth.loading = true;
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current.canShowAds).toBe(false);
  });
  it("withholds ads when the session cannot be verified", () => {
    state.auth.sessionError = true;
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current.canShowAds).toBe(false);
  });
  it("permits ads for a confirmed signed-out visitor", () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current.canShowAds).toBe(true);
  });
  it.each(["pro", "elite"])("never permits ads for %s subscribers", async (tier) => {
    state.auth.user = { id: "user" }; state.tier = tier;
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current.canShowAds).toBe(false);
    await waitFor(() => expect(result.current.subscription?.tier).toBe(tier));
    expect(result.current.canShowAds).toBe(false);
  });
  it("does not downgrade a failed subscription lookup to free", async () => {
    state.auth.user = { id: "user" }; state.error = { message: "unavailable" };
    const { result } = renderHook(() => useSubscription(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.canShowAds).toBe(false);
    expect(result.current.subscription).toBeUndefined();
  });
  it("permits ads after a signed-in free tier is verified", async () => {
    state.auth.user = { id: "user" };
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current.canShowAds).toBe(false);
    await waitFor(() => expect(result.current.canShowAds).toBe(true));
  });
});
