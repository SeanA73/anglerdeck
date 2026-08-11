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
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Star, Loader2, Check, X, Calendar } from "lucide-react";

type Target = { table: "spot_reviews" | "posts" | "post_comments"; id: string; label: string };

type ReviewStatus = "pending" | "approved" | "rejected";

const STATUS_TABS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const Empty = ({ label, colSpan = 5 }: { label: string; colSpan?: number }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-10">
      No {label} yet.
    </TableCell>
  </TableRow>
);

const AdminModeration = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target | null>(null);
  // Pending first — the queue is the reason this page exists.
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("pending");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-mod-reviews", reviewStatus],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spot_reviews")
        .select(
          "id, spot_id, author_name, rating, title, content, created_at, visit_date, photo_urls, status"
        )
        .eq("status", reviewStatus)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Queue depth, independent of which tab is open.
  const { data: pendingCount } = useQuery({
    queryKey: ["admin-mod-reviews-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("spot_reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Reviews carry spot_id but no title, and the generated types do not describe
  // the FK, so a PostgREST embed would not typecheck. One small lookup instead.
  const { data: spotTitles } = useQuery({
    queryKey: ["admin-mod-spot-titles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spots").select("id, title, slug");
      if (error) throw error;
      return new Map((data ?? []).map((s) => [s.id, s]));
    },
    staleTime: 5 * 60 * 1000,
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

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      const { error } = await supabase
        .from("spot_reviews")
        .update({
          status,
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mod-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-mod-reviews-pending-count"] });
      toast({
        title: status === "approved" ? "Review approved" : "Review rejected",
        description:
          status === "approved"
            ? "It goes live on the next rebuild of the site."
            : "It stays hidden from the public.",
      });
    },
    onError: (e: Error) =>
      toast({ title: "Could not update review", description: e.message, variant: "destructive" }),
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
          <TabsTrigger value="reviews">Reviews ({pendingCount ?? 0} pending)</TabsTrigger>
          <TabsTrigger value="posts">Posts ({posts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-3">
          <div className="flex gap-2">
            {STATUS_TABS.map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={reviewStatus === s.value ? "default" : "outline"}
                onClick={() => setReviewStatus(s.value)}
              >
                {s.label}
                {s.value === "pending" && (pendingCount ?? 0) > 0 && ` (${pendingCount})`}
              </Button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Approved reviews appear on the spot page, in its prerendered HTML and in
            its <code className="text-xs">AggregateRating</code> markup, and count
            toward the indexing quality gate — after the next rebuild. Nothing here is
            public until you approve it.
          </p>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spot</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Visited</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reviews ?? []).length === 0 && (
                  <Empty label={`${reviewStatus} reviews`} colSpan={7} />
                )}
                {(reviews ?? []).map((r) => {
                  const spot = spotTitles?.get(r.spot_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {spot ? (
                          <a
                            href={`/spot/${spot.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline"
                          >
                            {spot.title}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">#{r.spot_id}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {r.author_name}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-0.5">
                          {r.rating}<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {r.title && <div className="font-medium">{r.title}</div>}
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {r.content}
                        </div>
                        {(r.photo_urls ?? []).length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {(r.photo_urls ?? []).map((url) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer">
                                <img
                                  src={url}
                                  alt=""
                                  loading="lazy"
                                  className="w-14 h-14 object-cover rounded border border-border"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {r.visit_date ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.visit_date).toLocaleDateString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.status !== "approved" && (
                            <Button
                              variant="ghost" size="icon" title="Approve" aria-label="Approve review"
                              disabled={moderateMutation.isPending}
                              onClick={() =>
                                moderateMutation.mutate({ id: r.id, status: "approved" })
                              }
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                            </Button>
                          )}
                          {r.status !== "rejected" && (
                            <Button
                              variant="ghost" size="icon" title="Reject" aria-label="Reject review"
                              disabled={moderateMutation.isPending}
                              onClick={() =>
                                moderateMutation.mutate({ id: r.id, status: "rejected" })
                              }
                            >
                              <X className="w-4 h-4 text-amber-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="icon" title="Delete permanently" aria-label="Delete review permanently"
                            onClick={() =>
                              setTarget({ table: "spot_reviews", id: r.id, label: "review" })
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                        variant="ghost" size="icon" title="Delete post" aria-label="Delete post"
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
                        variant="ghost" size="icon" title="Delete comment" aria-label="Delete comment"
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
