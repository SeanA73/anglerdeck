import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Mail, TrendingUp, Loader2 } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

const AdminMarketing = () => {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async (): Promise<Subscriber[]> => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, source, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const all = subscribers ?? [];
    const cutoff30 = Date.now() - 30 * 24 * 3600 * 1000;
    const last30 = all.filter((s) => new Date(s.created_at).getTime() > cutoff30).length;
    const bySource = new Map<string, number>();
    for (const s of all) {
      const key = s.source ?? "unknown";
      bySource.set(key, (bySource.get(key) ?? 0) + 1);
    }
    return { total: all.length, last30, bySource };
  }, [subscribers]);

  const exportCsv = () => {
    const rows = [["email", "source", "subscribed_at"]];
    for (const s of subscribers ?? []) {
      rows.push([s.email, s.source ?? "", s.created_at]);
    }
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anglerdeck-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketing</h1>
        <Button onClick={exportCsv} disabled={!subscribers?.length}>
          <Download className="w-4 h-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> New (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.last30}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top source</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold capitalize">
            {[...stats.bySource.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(subscribers ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                  No subscribers yet.
                </TableCell>
              </TableRow>
            )}
            {(subscribers ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.email}</TableCell>
                <TableCell>
                  {s.source ? <Badge variant="outline">{s.source}</Badge> : "—"}
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

export default AdminMarketing;
