import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertTriangle, ClipboardList, Plus, Loader2 } from "lucide-react";

// Quarterly rotation from the refresh task
const QUARTER_GROUPS: Record<string, string[]> = {
  January: ["AU", "NZ"],
  April: ["US", "CA"],
  July: ["GB", "NO", "SE", "FI"],
  October: ["DE", "FR", "ES", "IT", "PL", "MX", "BR", "AR", "ZA", "JP", "RU"],
};

const quarterForMonth = (m: number) =>
  m <= 2 ? "January" : m <= 5 ? "April" : m <= 8 ? "July" : "October";

interface SpotHealth {
  id: number;
  slug: string;
  title: string;
  country: string;
  updated_at: string;
  coordinates: { lat: number; lng: number } | null;
  water_temperature: { current: number } | null;
  regulations: string[] | null;
  species: string[] | null;
  description: string;
}

interface Issue {
  slug: string;
  title: string;
  country: string;
  problem: string;
}

const checkSpot = (s: SpotHealth): string[] => {
  const problems: string[] = [];
  const lat = s.coordinates?.lat;
  const lng = s.coordinates?.lng;
  if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) {
    problems.push("missing/invalid coordinates");
  }
  const temp = s.water_temperature?.current;
  if (temp == null || Number.isNaN(temp)) problems.push("missing water temperature");
  else if (temp < -2 || temp > 35) problems.push(`implausible water temp (${temp}°C)`);
  if (!s.regulations?.length) problems.push("no regulations listed");
  if (!s.species?.length) problems.push("no species listed");
  if (!s.description?.trim()) problems.push("empty description");
  if (Date.now() - new Date(s.updated_at).getTime() > 180 * 24 * 3600 * 1000) {
    problems.push("stale (>180 days)");
  }
  return problems;
};

const AdminOps = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);
  const currentQuarter = quarterForMonth(new Date().getMonth());
  const [form, setForm] = useState({
    quarter_group: currentQuarter,
    spots_updated: "0",
    notes: "",
  });

  const { data: spots, isLoading } = useQuery({
    queryKey: ["admin-ops-spots"],
    queryFn: async (): Promise<SpotHealth[]> => {
      const { data, error } = await supabase
        .from("spots")
        .select("id, slug, title, country, updated_at, coordinates, water_temperature, regulations, species, description");
      if (error) throw error;
      return (data ?? []) as unknown as SpotHealth[];
    },
  });

  const { data: audits } = useQuery({
    queryKey: ["admin-ops-audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regs_audit_log")
        .select("id, quarter_group, countries, spots_updated, notes, audited_at")
        .order("audited_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const issues = useMemo<Issue[]>(() => {
    const out: Issue[] = [];
    for (const s of spots ?? []) {
      for (const problem of checkSpot(s)) {
        out.push({ slug: s.slug, title: s.title, country: s.country, problem });
      }
    }
    return out;
  }, [spots]);

  // Is the current quarter's audit already logged (within the last ~80 days)?
  const currentAuditDone = useMemo(() => {
    return (audits ?? []).some(
      (a) =>
        a.quarter_group === currentQuarter &&
        Date.now() - new Date(a.audited_at).getTime() < 80 * 24 * 3600 * 1000
    );
  }, [audits, currentQuarter]);

  const logAudit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("regs_audit_log").insert({
        quarter_group: form.quarter_group,
        countries: QUARTER_GROUPS[form.quarter_group] ?? [],
        spots_updated: Number(form.spots_updated) || 0,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ops-audits"] });
      toast({ title: "Audit logged" });
      setLogOpen(false);
    },
    onError: (e: Error) =>
      toast({ title: "Failed to log audit", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ops & Data Health</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data issues</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-2xl font-bold">{issues.length}</span>
            {issues.length === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current regs quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentQuarter}</div>
            <div className="text-xs text-muted-foreground">
              {QUARTER_GROUPS[currentQuarter].join(", ")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Audit status</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAuditDone ? (
              <Badge className="bg-green-600 hover:bg-green-600">done this quarter</Badge>
            ) : (
              <Badge variant="destructive">due</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Spot data issues</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All {spots?.length ?? 0} spots pass every check (coordinates, water temp, regulations,
            species, description, freshness).
          </p>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spot</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Problem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((i, idx) => (
                  <TableRow key={`${i.slug}-${idx}`}>
                    <TableCell>
                      <div className="font-medium">{i.title}</div>
                      <div className="text-xs text-muted-foreground">{i.slug}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{i.country}</Badge></TableCell>
                    <TableCell>{i.problem}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-1.5">
            <ClipboardList className="w-5 h-5" /> Regulations audit log
          </h2>
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Log audit
          </Button>
        </div>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Spots updated</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(audits ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No audits logged yet.
                  </TableCell>
                </TableRow>
              )}
              {(audits ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(a.audited_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell><Badge variant="outline">{a.quarter_group}</Badge></TableCell>
                  <TableCell className="text-sm">{a.countries.join(", ")}</TableCell>
                  <TableCell>{a.spots_updated}</TableCell>
                  <TableCell className="max-w-md text-sm text-muted-foreground">
                    {a.notes ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log a regulations audit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Quarter group</Label>
              <Input value={form.quarter_group} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                Covers: {QUARTER_GROUPS[form.quarter_group]?.join(", ")}
              </p>
            </div>
            <div>
              <Label>Spots updated</Label>
              <Input
                type="number"
                value={form.spots_updated}
                onChange={(e) => setForm({ ...form, spots_updated: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="What changed, sources checked…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button onClick={() => logAudit.mutate()} disabled={logAudit.isPending}>
              {logAudit.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOps;
