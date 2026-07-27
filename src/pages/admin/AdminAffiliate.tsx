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
import { Plus, Pencil, Loader2, MousePointerClick, TrendingUp, Package } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  affiliate_url: string;
  commission_rate: number | null;
  merchant: string | null;
  category: string | null;
  is_active: boolean;
}

interface Click {
  id: string;
  product_id: string | null;
  clicked_at: string;
  converted: boolean;
  conversion_amount: number | null;
}

const emptyForm = {
  title: "", description: "", price: "", affiliate_url: "",
  commission_rate: "", merchant: "", category: "",
};

const AdminAffiliate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-affiliate-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("affiliate_products")
        .select("id, title, description, price, affiliate_url, commission_rate, merchant, category, is_active")
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
        affiliate_url: form.affiliate_url,
        commission_rate: form.commission_rate ? Number(form.commission_rate) : null,
        merchant: form.merchant || null,
        category: form.category || null,
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
          }
    );
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
        <Button onClick={() => openEdit("new")}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add product
        </Button>
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
                onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })}
                placeholder="https://…"
              />
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
    </div>
  );
};

export default AdminAffiliate;
