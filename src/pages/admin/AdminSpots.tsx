import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import type { SpotAccess } from "@/data/spots";

interface AdminSpot {
  id: number;
  slug: string;
  title: string;
  location: string;
  country: string;
  featured: boolean;
  sponsored: boolean | null;
  sponsored_url: string | null;
  updated_at: string;
  water_temperature: { current: number; unit: string; trend: string };
  regulations: string[];
  access: SpotAccess | null;
}

const STALE_DAYS = 180;

const isStale = (updatedAt: string) =>
  Date.now() - new Date(updatedAt).getTime() > STALE_DAYS * 24 * 3600 * 1000;

const AdminSpots = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [editing, setEditing] = useState<AdminSpot | null>(null);

  // Edit form state
  const [form, setForm] = useState({
    title: "", location: "", waterTemp: "", trend: "stable",
    regulations: "", featured: false, sponsored: false, sponsoredUrl: "",
    // Access details — leave blank rather than guessing.
    shore: false, boat: false, ramp: "", parking: "", walkIn: "",
    facilities: "", accessNotes: "", accessSource: "",
  });

  const { data: spots, isLoading } = useQuery({
    queryKey: ["admin-spots"],
    queryFn: async (): Promise<AdminSpot[]> => {
      const { data, error } = await supabase
        .from("spots")
        .select("id, slug, title, location, country, featured, sponsored, sponsored_url, updated_at, water_temperature, regulations, access")
        .order("id");
      if (error) throw error;
      return (data ?? []) as unknown as AdminSpot[];
    },
  });

  const countries = useMemo(
    () => [...new Set((spots ?? []).map((s) => s.country))].sort(),
    [spots]
  );

  const filtered = useMemo(() => {
    let rows = spots ?? [];
    if (country !== "all") rows = rows.filter((s) => s.country === country);
    if (staleOnly) rows = rows.filter((s) => isStale(s.updated_at));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [spots, country, staleOnly, search]);

  const updateSpot = useMutation({
    mutationFn: async (payload: { id: number; changes: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("spots")
        .update({ ...payload.changes, updated_at: new Date().toISOString() })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-spots"] });
      queryClient.invalidateQueries({ queryKey: ["spots"] });
      toast({ title: "Spot updated" });
    },
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const openEdit = (spot: AdminSpot) => {
    setEditing(spot);
    setForm({
      title: spot.title,
      location: spot.location,
      waterTemp: String(spot.water_temperature?.current ?? ""),
      trend: spot.water_temperature?.trend ?? "stable",
      regulations: (spot.regulations ?? []).join("\n"),
      featured: spot.featured,
      sponsored: spot.sponsored ?? false,
      sponsoredUrl: spot.sponsored_url ?? "",
      shore: spot.access?.shore ?? false,
      boat: spot.access?.boat ?? false,
      ramp: spot.access?.ramp ?? "",
      parking: spot.access?.parking ?? "",
      walkIn: spot.access?.walkIn ?? "",
      facilities: (spot.access?.facilities ?? []).join(", "),
      accessNotes: spot.access?.notes ?? "",
      accessSource: spot.access?.sourceUrl ?? "",
    });
  };

  /** Builds the access object, or null when nothing has been filled in. */
  const buildAccess = (): SpotAccess | null => {
    const facilities = form.facilities
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const access: SpotAccess = {};
    if (form.shore) access.shore = true;
    if (form.boat) access.boat = true;
    if (form.ramp.trim()) access.ramp = form.ramp.trim();
    if (form.parking.trim()) access.parking = form.parking.trim();
    if (form.walkIn.trim()) access.walkIn = form.walkIn.trim();
    if (facilities.length) access.facilities = facilities;
    if (form.accessNotes.trim()) access.notes = form.accessNotes.trim();
    if (form.accessSource.trim()) access.sourceUrl = form.accessSource.trim();

    return Object.keys(access).length ? access : null;
  };

  const saveEdit = () => {
    if (!editing) return;
    updateSpot.mutate(
      {
        id: editing.id,
        changes: {
          title: form.title,
          location: form.location,
          water_temperature: {
            ...editing.water_temperature,
            current: Number(form.waterTemp),
            trend: form.trend,
          },
          regulations: form.regulations.split("\n").map((r) => r.trim()).filter(Boolean),
          featured: form.featured,
          sponsored: form.sponsored,
          sponsored_url: form.sponsored ? form.sponsoredUrl || null : null,
          access: buildAccess(),
        },
      },
      { onSuccess: () => setEditing(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const staleCount = (spots ?? []).filter((s) => isStale(s.updated_at)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Spots Manager</h1>
          <p className="text-sm text-muted-foreground">
            {spots?.length ?? 0} spots · {countries.length} countries
            {staleCount > 0 && ` · ${staleCount} stale (>${STALE_DAYS}d)`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search title, slug, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Switch id="stale" checked={staleOnly} onCheckedChange={setStaleOnly} />
            <Label htmlFor="stale" className="text-sm">Stale only</Label>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Spot</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Water</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Sponsored</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((spot) => (
              <TableRow key={spot.id}>
                <TableCell>
                  <div className="font-medium">{spot.title}</div>
                  <div className="text-xs text-muted-foreground">{spot.location}</div>
                </TableCell>
                <TableCell><Badge variant="outline">{spot.country}</Badge></TableCell>
                <TableCell className="whitespace-nowrap">
                  {spot.water_temperature?.current}
                  {spot.water_temperature?.unit} · {spot.water_temperature?.trend}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={spot.featured}
                    onCheckedChange={(v) =>
                      updateSpot.mutate({ id: spot.id, changes: { featured: v } })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={spot.sponsored ?? false}
                    onCheckedChange={(v) =>
                      updateSpot.mutate({ id: spot.id, changes: { sponsored: v } })
                    }
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(spot.updated_at).toLocaleDateString()}
                  {isStale(spot.updated_at) && (
                    <AlertTriangle className="w-3.5 h-3.5 inline ml-1 text-amber-500" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(spot)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`/spot/${spot.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit: {editing?.slug}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Water temp (°C)</Label>
                <Input
                  type="number"
                  value={form.waterTemp}
                  onChange={(e) => setForm({ ...form, waterTemp: e.target.value })}
                />
              </div>
              <div>
                <Label>Trend</Label>
                <Select value={form.trend} onValueChange={(v) => setForm({ ...form, trend: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rising">rising</SelectItem>
                    <SelectItem value="stable">stable</SelectItem>
                    <SelectItem value="falling">falling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Regulations (one per line)</Label>
              <Textarea
                rows={5}
                value={form.regulations}
                onChange={(e) => setForm({ ...form, regulations: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <Switch
                  id="edit-featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setForm({ ...form, featured: v })}
                />
                <Label htmlFor="edit-featured">Featured</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch
                  id="edit-sponsored"
                  checked={form.sponsored}
                  onCheckedChange={(v) => setForm({ ...form, sponsored: v })}
                />
                <Label htmlFor="edit-sponsored">Sponsored</Label>
              </div>
            </div>
            {form.sponsored && (
              <div>
                <Label>Sponsored URL</Label>
                <Input
                  value={form.sponsoredUrl}
                  onChange={(e) => setForm({ ...form, sponsoredUrl: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            )}

            <div className="border-t border-border pt-4 mt-2">
              <h4 className="font-semibold text-sm mb-1">Access details</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Only fill in what you know or can verify. Blank fields are hidden
                on the page — that is better than a confident guess.
              </p>

              <div className="flex flex-wrap gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="edit-shore"
                    checked={form.shore}
                    onCheckedChange={(v) => setForm({ ...form, shore: v })}
                  />
                  <Label htmlFor="edit-shore">Land-based</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="edit-boat"
                    checked={form.boat}
                    onCheckedChange={(v) => setForm({ ...form, boat: v })}
                  />
                  <Label htmlFor="edit-boat">Boat access</Label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Boat ramp</Label>
                  <Input
                    value={form.ramp}
                    onChange={(e) => setForm({ ...form, ramp: e.target.value })}
                    placeholder="e.g. Rose Bay public ramp, 2 km"
                  />
                </div>
                <div>
                  <Label>Parking</Label>
                  <Input
                    value={form.parking}
                    onChange={(e) => setForm({ ...form, parking: e.target.value })}
                    placeholder="e.g. Free car park, ~30 spaces"
                  />
                </div>
                <div>
                  <Label>Walk in</Label>
                  <Input
                    value={form.walkIn}
                    onChange={(e) => setForm({ ...form, walkIn: e.target.value })}
                    placeholder="e.g. 200 m on a formed track"
                  />
                </div>
                <div>
                  <Label>Facilities (comma separated)</Label>
                  <Input
                    value={form.facilities}
                    onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                    placeholder="Toilets, BBQ, Cleaning table"
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label>Access notes</Label>
                <Textarea
                  rows={2}
                  value={form.accessNotes}
                  onChange={(e) => setForm({ ...form, accessNotes: e.target.value })}
                  placeholder="Permits, 4WD only, tide-dependent access, seasonal closures…"
                />
              </div>

              <div className="mt-3">
                <Label>Source URL</Label>
                <Input
                  value={form.accessSource}
                  onChange={(e) => setForm({ ...form, accessSource: e.target.value })}
                  placeholder="https://… official park, council or fisheries page"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updateSpot.isPending}>
              {updateSpot.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSpots;
