import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

const countBy = (rows: { user_id: string | null }[] | null | undefined) => {
  const map = new Map<string, number>();
  for (const r of rows ?? []) {
    if (r.user_id) map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1);
  }
  return map;
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: views } = useQuery({
    queryKey: ["admin-users-views"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spot_views")
        .select("user_id")
        .limit(20000);
      if (error) throw error;
      return countBy(data);
    },
  });

  const { data: catches } = useQuery({
    queryKey: ["admin-users-catches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catch_logs")
        .select("user_id")
        .limit(20000);
      if (error) throw error;
      return countBy(data as { user_id: string | null }[]);
    },
  });

  const { data: subs } = useQuery({
    queryKey: ["admin-users-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("user_id, tier, status");
      if (error) throw error;
      return new Map(
        (data ?? [])
          .filter((s) => s.status === "active" || s.status === "trialing")
          .map((s) => [s.user_id, s.tier])
      );
    },
  });

  const filtered = useMemo(() => {
    let rows = profiles ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((p) => (p.display_name ?? "").toLowerCase().includes(q));
    }
    return rows;
  }, [profiles, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Users & Activity</h1>
          <p className="text-sm text-muted-foreground">
            {profiles?.length ?? 0} users (latest 500)
          </p>
        </div>
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Spot views</TableHead>
              <TableHead>Catches logged</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.user_id}>
                <TableCell className="font-medium">
                  {p.display_name ?? p.user_id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  {p.role === "admin" ? (
                    <Badge>admin</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">user</span>
                  )}
                </TableCell>
                <TableCell className="capitalize">
                  {subs?.get(p.user_id) ?? <span className="text-muted-foreground">free</span>}
                </TableCell>
                <TableCell>{views?.get(p.user_id) ?? 0}</TableCell>
                <TableCell>{catches?.get(p.user_id) ?? 0}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
