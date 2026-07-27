import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Star, Loader2 } from "lucide-react";

type Target = { table: "spot_reviews" | "posts" | "post_comments"; id: string; label: string };

const Empty = ({ label }: { label: string }) => (
  <TableRow>
    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
      No {label} yet.
    </TableCell>
  </TableRow>
);

const AdminModeration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target | null>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-mod-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spot_reviews")
        .select("id, spot_id, author_name, rating, title, content, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["admin-mod-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, author_name, post_type, content, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["admin-mod-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, post_id, author_name, content, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (t: Target) => {
      const { error } = await supabase.from(t.table).delete().eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: (_d, t) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mod-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-mod-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-mod-comments"] });
      toast({ title: `Deleted ${t.label}` });
      setTarget(null);
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Content Moderation</h1>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews ({reviews?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reviews ?? []).length === 0 && <Empty label="reviews" />}
                {(reviews ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium whitespace-nowrap">{r.author_name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-0.5">
                        {r.rating}<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {r.title && <div className="font-medium">{r.title}</div>}
                      <div className="text-sm text-muted-foreground line-clamp-2">{r.content}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setTarget({ table: "spot_reviews", id: r.id, label: "review" })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="posts">
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(posts ?? []).length === 0 && <Empty label="posts" />}
                {(posts ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium whitespace-nowrap">{p.author_name}</TableCell>
                    <TableCell><Badge variant="outline">{p.post_type}</Badge></TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm line-clamp-2">{p.content}</div>
                      {p.image_url && (
                        <a href={p.image_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                          image
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setTarget({ table: "posts", id: p.id, label: "post" })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(comments ?? []).length === 0 && <Empty label="comments" />}
                {(comments ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium whitespace-nowrap">{c.author_name}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-sm line-clamp-2">{c.content}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setTarget({ table: "post_comments", id: c.id, label: "comment" })}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {target?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the {target?.label} for all users. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => target && deleteMutation.mutate(target)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminModeration;
