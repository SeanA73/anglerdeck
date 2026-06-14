import { useState, useEffect, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fish, MessageSquare, Lightbulb, Plus } from "lucide-react";
import PostCard from "@/components/community/PostCard";
import CreatePostDialog from "@/components/community/CreatePostDialog";
import { useToast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/ads/AdBanner";

type PostType = "all" | "catch" | "story" | "tip";

interface Post {
  id: string;
  author_name: string;
  content: string;
  post_type: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

const getSessionId = () => {
  let sessionId = localStorage.getItem("castlog_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("castlog_session_id", sessionId);
  }
  return sessionId;
};

const CommunityFeed = () => {
  const [activeTab, setActiveTab] = useState<PostType>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", activeTab],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query = query.eq("post_type", activeTab);
      }

      const { data: postsData, error } = await query;
      if (error) throw error;

      // Get likes and comments counts
      const postIds = postsData.map((p) => p.id);

      const [likesResult, commentsResult, userLikesResult] = await Promise.all([
        supabase
          .from("post_likes")
          .select("post_id")
          .in("post_id", postIds),
        supabase
          .from("post_comments")
          .select("post_id")
          .in("post_id", postIds),
        supabase
          .from("post_likes")
          .select("post_id")
          .eq("session_id", sessionId)
          .in("post_id", postIds),
      ]);

      const likesCount = postIds.reduce((acc, id) => {
        acc[id] = likesResult.data?.filter((l) => l.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = postIds.reduce((acc, id) => {
        acc[id] = commentsResult.data?.filter((c) => c.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userLikedPosts = new Set(userLikesResult.data?.map((l) => l.post_id) || []);

      return postsData.map((post) => ({
        ...post,
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        user_liked: userLikedPosts.has(post.id),
      })) as Post[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => queryClient.invalidateQueries({ queryKey: ["posts"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        () => queryClient.invalidateQueries({ queryKey: ["posts"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        () => queryClient.invalidateQueries({ queryKey: ["posts"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("session_id", sessionId);
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, session_id: sessionId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleLike = (postId: string, liked: boolean) => {
    likeMutation.mutate({ postId, liked });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 pb-8 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Community Feed</h1>
            <p className="text-muted-foreground mt-2">
              Share your catches, stories, and fishing tips with fellow anglers
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PostType)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="catch" className="gap-2">
              <Fish className="w-4 h-4" />
              Catches
            </TabsTrigger>
            <TabsTrigger value="story" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Stories
            </TabsTrigger>
            <TabsTrigger value="tip" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No posts yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share something with the community!
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  Create Post
                </Button>
              </div>
            ) : (
              posts.map((post, index) => (
                <Fragment key={post.id}>
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    sessionId={sessionId}
                  />
                  {(index + 1) % 5 === 0 && index < posts.length - 1 && (
                    <AdBanner
                      slot={import.meta.env.VITE_ADSENSE_SLOT_COMMUNITY || ''}
                      format="rectangle"
                    />
                  )}
                </Fragment>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <CreatePostDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        sessionId={sessionId}
      />

      <Footer />
    </div>
  );
};

export default CommunityFeed;
