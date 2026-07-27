import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { normalizeAmazonUrl } from "@/lib/affiliate";
import { Plus, Pencil, Loader2, MousePointerClick, TrendingUp, Package, Import, Wand2 } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  affiliate_url: string;
  commission_rate: number | null;
  merchant: string | null;
  category: string | null;
  tags: string[] | null;
  is_active: boolean;
}

/** Infer spot-matching tags from a product title. */
const suggestTags = (title: string): string[] => {
  const t = title.toLowerCase();
  const out = new Set<string>();
  if (/\bfly\b|fly.?fish|tippet|tapered leader|waders|nymph|streamer/.test(t)) out.add("fly fishing");
  if (/salt|surf|offshore|jig|boat|pier|trolling|snapper|kingfish|tuna|marlin/.test(t)) out.add("saltwater");
  if (/freshwater|telescopic|bass|trout|pike|walleye|carp|zander|perch|spinnerbait|crankbait/.test(t)) out.add("freshwater");
  for (const sp of ["trout", "bass", "pike", "salmon", "carp", "walleye", "zander", "snapper", "tuna", "barramundi"]) {
    if (t.includes(sp)) out.add(sp);
  }
  if (out.size === 0) ["freshwater", "saltwater", "fly fishing"].forEach((x) => out.add(x));
  return [...out];
};

interface Click {
  id: string;
  product_id: string | null;
  clicked_at: string;
  converted: boolean;
  conversion_amount: number | null;
}

const emptyForm = {
  title: "", description: "", price: "", affiliate_url: "",
  commission_rate: "", merchant: "", category: "", tags: "", image_url: "",
};

const AdminAffiliate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-affiliate-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("affiliate_products")
        .select("id, title, description, price, image_url, affiliate_url, commission_rate, merchant, category, tags, is_active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: clicks } = useQuery({
    queryKey: ["admin-affiliate-clicks"],
    queryFn: async (): Promise<Click[]> => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("id, product_id, clicked_at, converted, conversion_amount")
        .order("clicked_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const all = clicks ?? [];
    const cutoff30 = Date.now() - 30 * 24 * 3600 * 1000;
    const last30 = all.filter((c) => new Date(c.clicked_at).getTime() > cutoff30);
    const conversions = all.filter((c) => c.converted);
    const revenue = conversions.reduce((sum, c) => sum + (c.conversion_amount ?? 0), 0);
    const byProduct = new Map<string, number>();
    for (const c of all) {
      if (c.product_id) byProduct.set(c.product_id, (byProduct.get(c.product_id) ?? 0) + 1);
    }
    return { total: all.length, last30: last30.length, conversions: conversions.length, revenue, byProduct };
  }, [clicks]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        price: form.price ? Number(form.price) : null,
        image_url: form.image_url || null,
        affiliate_url: form.affiliate_url,
        commission_rate: form.commission_rate ? Number(form.commission_rate) : null,
        merchant: form.merchant || null,
        category: form.category || null,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
          : null,
      };
      if (editing === "new") {
        const { error } = await supabase.from("affiliate_products").insert(payload);
        if (error) throw error;
      } else if (editing) {
        const { error } = await supabase
          .from("affiliate_products")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] });
      toast({ title: editing === "new" ? "Product added" : "Product updated" });
      setEditing(null);
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("affiliate_products")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] }),
    onError: (e: Error) =>
      toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const bulkImport = useMutation({
    mutationFn: async () => {
      const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
      const rows: { title: string; affiliate_url: string; merchant: string; is_active: boolean }[] = [];
      const skipped: string[] = [];
      for (const line of lines) {
        // Optional "URL | Title" format; bare URL otherwise
        const [urlPart, titlePart] = line.split("|").map((s) => s.trim());
        const normalized = normalizeAmazonUrl(urlPart);
        if (!normalized) {
          skipped.push(line);
          continue;
        }
        const asin = normalized.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ?? "unknown";
        rows.push({
          title: titlePart || `DRAFT — ${asin}`,
          affiliate_url: normalized,
          merchant: "amazon",
          is_active: false, // drafts stay off the site until finished
        });
      }
      let imported = 0;
      if (rows.length) {
        // affiliate_url is unique — ignoreDuplicates re-imports the same list
        // safely instead of erroring. .select() reports only the new rows.
        const { data, error } = await supabase
          .from("affiliate_products")
          .upsert(rows, { onConflict: "affiliate_url", ignoreDuplicates: true })
          .select("id");
        if (error) throw error;
        imported = data?.length ?? 0;
      }
      return { imported, duplicates: rows.length - imported, skipped: skipped.length };
    },
    onSuccess: ({ imported, duplicates, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-affiliate-products"] });
      const notes = [
        duplicates ? `${duplicates} already in the catalog` : null,
        skipped ? `${skipped} line(s) skipped (no ASIN found)` : null,
      ].filter(Boolean);
      toast({
        title: `Imported ${imported} draft${imported === 1 ? "" : "s"}`,
        description: [
          ...notes,
          "Drafts are inactive until you add a title and activate them.",
        ].join(". "),
      });
      setBulkOpen(false);
      setBulkText("");
    },
    onError: (e: Error) =>
      toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });

  const openEdit = (p: Product | "new") => {
    setEditing(p);
    setForm(
      p === "new"
        ? emptyForm
        : {
            title: p.title,
            description: p.description ?? "",
            price: p.price != null ? String(p.price) : "",
            affiliate_url: p.affiliate_url,
            commission_rate: p.commission_rate != null ? String(p.commission_rate) : "",
            merchant: p.merchant ?? "",
            category: p.category ?? "",
            tags: (p.tags ?? []).join(", "),
            image_url: p.image_url ?? "",
          }
    );
  };

  /** Paste any Amazon URL → canonical tagged link + merchant autofill. */
  const handleUrlChange = (raw: string) => {
    const normalized = normalizeAmazonUrl(raw);
    setForm((f) => ({
      ...f,
      affiliate_url: normalized ?? raw,
      merchant: normalized ? "amazon" : f.merchant,
    }));
  };

  if (productsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Import className="w-4 h-4 mr-1.5" />
            Bulk import
          </Button>
          <Button onClick={() => openEdit("new")}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MousePointerClick className="w-4 h-4" /> Clicks (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.last30}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total clicks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Conversions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.conversions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Tracked revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${stats.revenue.toFixed(2)}</CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(products ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No affiliate products yet — add your first one.
                </TableCell>
              </TableRow>
            )}
            {(products ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.title}</div>
                  <a
                    href={p.affiliate_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:underline truncate block max-w-56"
                  >
                    {p.affiliate_url}
                  </a>
                </TableCell>
                <TableCell>{p.merchant ?? "—"}</TableCell>
                <TableCell>
                  {p.category ? <Badge variant="outline">{p.category}</Badge> : "—"}
                </TableCell>
                <TableCell>{p.price != null ? `$${p.price}` : "—"}</TableCell>
                <TableCell>{p.commission_rate != null ? `${p.commission_rate}%` : "—"}</TableCell>
                <TableCell>{stats.byProduct.get(p.id) ?? 0}</TableCell>
                <TableCell>
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(v) => toggleActive.mutate({ id: p.id, is_active: v })}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add product" : "Edit product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Affiliate URL</Label>
              <Input
                value={form.affiliate_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste any Amazon product URL — auto-converts to your tagged link"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Amazon URLs are cleaned and re-tagged automatically (tag=anglerdeck-20).
              </p>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Commission (%)</Label>
                <Input
                  type="number"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Merchant</Label>
                <Input
                  value={form.merchant}
                  onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                  placeholder="amazon, bass_pro_shops…"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="rods, lures, apparel…"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Tags (comma-separated, match spots)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setForm({ ...form, tags: suggestTags(form.title).join(", ") })}
                  disabled={!form.title}
                >
                  <Wand2 className="w-3 h-3 mr-1" /> Suggest from title
                </Button>
              </div>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="fly fishing, trout, freshwater…"
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://m.media-amazon.com/images/…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title || !form.affiliate_url}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk import Amazon URLs</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>One product per line — any Amazon URL format works</Label>
            <Textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={
                "https://www.amazon.com/dp/B0C49KX7XD\nhttps://www.amazon.com/Some-Product/dp/B0EXAMPLE1?ref=sr_1_3 | Telescopic Rod Combo"
              }
            />
            <p className="text-xs text-muted-foreground">
              ASINs are extracted and links rebuilt with your tag. Add "| Title" after a URL to
              name it now. Everything imports as an <strong>inactive draft</strong> — finish
              titles/tags in the table, then flip the Active switch.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button
              onClick={() => bulkImport.mutate()}
              disabled={bulkImport.isPending || !bulkText.trim()}
            >
              {bulkImport.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAffiliate;
