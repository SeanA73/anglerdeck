import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Fish, MessageSquare, Lightbulb, ImagePlus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MagicWriteButton } from "@/components/ai/MagicWriteButton";
import { useSubscription } from "@/hooks/useSubscription";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

const CreatePostDialog = ({ open, onOpenChange, sessionId }: CreatePostDialogProps) => {
  const [authorName, setAuthorName] = useState(() =>
    localStorage.getItem("castlog_author_name") || ""
  );
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"catch" | "story" | "tip">("story");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscription, checkFeatureAccess } = useSubscription();
  
  // Pro and Elite users get AI features
  const hasAIAccess = checkFeatureAccess('ai_predictions') || 
    subscription?.tier === 'pro' || 
    subscription?.tier === 'elite';

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const name = authorName.trim() || "Anonymous Angler";
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${sessionId}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("catch-photos")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("catch-photos")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        author_name: name,
        content: content.trim(),
        post_type: postType,
        image_url: imageUrl,
      });

      if (error) throw error;
      localStorage.setItem("castlog_author_name", name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Post created successfully!" });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setContent("");
    setPostType("story");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPostMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authorName">Your Name (optional)</Label>
            <Input
              id="authorName"
              placeholder="Anonymous Angler"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postType">Post Type</Label>
            <Select value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="catch">
                  <div className="flex items-center gap-2">
                    <Fish className="w-4 h-4 text-emerald-500" />
                    Catch
                  </div>
                </SelectItem>
                <SelectItem value="story">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Story
                  </div>
                </SelectItem>
                <SelectItem value="tip">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Tip
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">What's on your mind?</Label>
              {hasAIAccess && (
                <MagicWriteButton
                  postType={postType}
                  onGenerated={(text) => setContent(text)}
                />
              )}
            </div>
            <Textarea
              id="content"
              placeholder={
                postType === "catch"
                  ? "Share your catch! What did you catch, where, and how?"
                  : postType === "tip"
                  ? "Share your fishing wisdom with the community..."
                  : "Tell us about your fishing adventure..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim() || createPostMutation.isPending}>
              {createPostMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Post
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
