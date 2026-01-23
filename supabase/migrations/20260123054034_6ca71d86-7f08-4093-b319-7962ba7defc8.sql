-- Create posts table for the social feed
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous Angler',
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'story' CHECK (post_type IN ('catch', 'story', 'tip')),
  image_url TEXT,
  catch_log_id UUID REFERENCES public.catch_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, session_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous Angler',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Posts policies - anyone can view, anyone can create
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING ((auth.uid() = user_id) OR (user_id IS NULL));
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Likes policies
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can like posts" ON public.post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can remove their own likes" ON public.post_likes FOR DELETE USING (true);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON public.post_comments FOR UPDATE USING ((auth.uid() = user_id) OR (user_id IS NULL));
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Create triggers for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for the social feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Create indexes for better performance
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_post_type ON public.posts(post_type);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);