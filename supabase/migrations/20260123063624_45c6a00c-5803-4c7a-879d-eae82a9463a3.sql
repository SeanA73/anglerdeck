-- Create spot_reviews table for ratings and reviews
CREATE TABLE public.spot_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL DEFAULT 'Anonymous Angler',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  visit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spot_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view spot reviews"
ON public.spot_reviews
FOR SELECT
USING (true);

-- Anyone can create reviews
CREATE POLICY "Anyone can create spot reviews"
ON public.spot_reviews
FOR INSERT
WITH CHECK (true);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.spot_reviews
FOR UPDATE
USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.spot_reviews
FOR DELETE
USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Trigger for updated_at
CREATE TRIGGER update_spot_reviews_updated_at
BEFORE UPDATE ON public.spot_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_spot_reviews_spot_id ON public.spot_reviews(spot_id);