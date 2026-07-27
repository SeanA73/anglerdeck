import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe";
import { Loader2 } from "lucide-react";

interface Sub {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
}

const statusVariant = (status: string) =>
  status === "active" ? "default"
  : status === "trialing" ? "secondary"
  : status === "past_due" ? "destructive"
  : "outline";

const AdminSubscriptions = () => {
  const { data: subs, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async (): Promise<Sub[]> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, user_id, tier, status, current_period_end, cancel_at_period_end, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name");
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.user_id, p.display_name]));
    },
  });

  const stats = useMemo(() => {
    const all = subs ?? [];
    const active = all.filter((s) => s.status === "active" || s.status === "trialing");
    const pro = active.filter((s) => s.tier === "pro").length;
    const elite = active.filter((s) => s.tier === "elite").length;
    const mrr =
      pro * (SUBSCRIPTION_TIERS.pro?.price ?? 0) +
      elite * (SUBSCRIPTION_TIERS.elite?.price ?? 0);
    const canceling = active.filter((s) => s.cancel_at_period_end).length;
    return { total: all.length, pro, elite, mrr, canceling };
  }, [subs]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscriptions</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. MRR</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${stats.mrr.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pro (active)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.pro}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Elite (active)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.elite}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canceling at period end</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.canceling}</CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Renews / ends</TableHead>
              <TableHead>Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(subs ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No subscriptions yet.
                </TableCell>
              </TableRow>
            )}
            {(subs ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {profiles?.get(s.user_id) ?? s.user_id.slice(0, 8)}
                </TableCell>
                <TableCell className="capitalize">{s.tier}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                  {s.cancel_at_period_end && (
                    <Badge variant="outline" className="ml-1.5">canceling</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {s.current_period_end
                    ? new Date(s.current_period_end).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
