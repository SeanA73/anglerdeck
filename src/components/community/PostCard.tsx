import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Fish, MessageSquare, Lightbulb, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string, liked: boolean) => void;
  sessionId: string;
}

const getPostTypeIcon = (type: string) => {
  switch (type) {
    case "catch":
      return <Fish className="w-3 h-3" />;
    case "story":
      return <MessageSquare className="w-3 h-3" />;
    case "tip":
      return <Lightbulb className="w-3 h-3" />;
    default:
      return null;
  }
};

const getPostTypeColor = (type: string) => {
  switch (type) {
    case "catch":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "story":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "tip":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "";
  }
};

const PostCard = ({ post, onLike, sessionId }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState(() => 
    localStorage.getItem("anglerdeck_author_name") || ""
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const name = authorName.trim() || "Anonymous Angler";
      const { error } = await supabase.from("post_comments").insert({
        post_id: post.id,
        author_name: name,
        content: newComment.trim(),
      });
      if (error) throw error;
      localStorage.setItem("anglerdeck_author_name", name);
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Comment added!" });
    },
    onError: () => {
      toast({ title: "Error adding comment", variant: "destructive" });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate();
  };

  return (
    <Card className="bg-card border-border/50 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {post.author_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{post.author_name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`gap-1 ${getPostTypeColor(post.post_type)}`}>
            {getPostTypeIcon(post.post_type)}
            {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <img
              src={post.image_url}
              alt={`Post photo by ${post.author_name}`}
              loading="lazy"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch pt-0">
        <div className="flex items-center gap-4 py-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${post.user_liked ? "text-red-500" : "text-muted-foreground"}`}
            onClick={() => onLike(post.id, post.user_liked)}
          >
            <Heart className={`w-4 h-4 ${post.user_liked ? "fill-current" : ""}`} />
            {post.likes_count}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            {post.comments_count}
          </Button>
        </div>

        {showComments && (
          <div className="pt-3 border-t border-border space-y-4">
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {comment.author_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-32 px-3 py-2 text-sm bg-background border border-border rounded-md"
              />
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 min-h-[40px] resize-none"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || commentMutation.isPending}
                aria-label="Post comment"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
