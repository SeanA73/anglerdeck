-- Create a table for gear listings
CREATE TABLE public.gear_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  condition TEXT NOT NULL DEFAULT 'good',
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  location TEXT,
  images TEXT[] DEFAULT '{}',
  is_sold BOOLEAN NOT NULL DEFAULT false,
  seller_name TEXT NOT NULL DEFAULT 'Anonymous Seller',
  contact_method TEXT,
  contact_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gear_listings ENABLE ROW LEVEL SECURITY;

-- Create policies for gear listings
CREATE POLICY "Anyone can view active gear listings" 
ON public.gear_listings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create gear listings" 
ON public.gear_listings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own listings" 
ON public.gear_listings 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Users can delete their own listings" 
ON public.gear_listings 
FOR DELETE 
USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gear_listings_updated_at
BEFORE UPDATE ON public.gear_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for gear images
INSERT INTO storage.buckets (id, name, public) VALUES ('gear-images', 'gear-images', true);

-- Create storage policies for gear images
CREATE POLICY "Gear images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gear-images');

CREATE POLICY "Anyone can upload gear images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gear-images');

CREATE POLICY "Anyone can update gear images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gear-images');

CREATE POLICY "Anyone can delete gear images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gear-images');