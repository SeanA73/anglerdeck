-- Add photo_urls column to spot_reviews
ALTER TABLE public.spot_reviews 
ADD COLUMN photo_urls text[] DEFAULT '{}';

-- Create review votes table
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.spot_reviews(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  is_helpful BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id),
  UNIQUE(review_id, session_id)
);

-- Enable RLS
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_votes
CREATE POLICY "Anyone can view review votes"
ON public.review_votes FOR SELECT
USING (true);

CREATE POLICY "Anyone can vote on reviews"
ON public.review_votes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can remove their own votes"
ON public.review_votes FOR DELETE
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true);

-- Storage policies for review photos
CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

CREATE POLICY "Anyone can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-photos');

CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'review-photos');