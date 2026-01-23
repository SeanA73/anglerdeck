-- Create catch_logs table for storing user catches
CREATE TABLE public.catch_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id INTEGER,
  species TEXT NOT NULL,
  weight DECIMAL(10, 2),
  weight_unit TEXT DEFAULT 'lbs',
  length DECIMAL(10, 2),
  length_unit TEXT DEFAULT 'in',
  photo_url TEXT,
  notes TEXT,
  caught_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_lat DECIMAL(10, 6),
  location_lng DECIMAL(10, 6),
  location_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.catch_logs ENABLE ROW LEVEL SECURITY;

-- Public catches are viewable by everyone (for the community feed)
CREATE POLICY "Anyone can view catch logs"
ON public.catch_logs
FOR SELECT
USING (true);

-- Users can create their own catch logs (allow anonymous for demo)
CREATE POLICY "Anyone can create catch logs"
ON public.catch_logs
FOR INSERT
WITH CHECK (true);

-- Users can update their own catch logs
CREATE POLICY "Users can update their own catch logs"
ON public.catch_logs
FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own catch logs
CREATE POLICY "Users can delete their own catch logs"
ON public.catch_logs
FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_catch_logs_updated_at
BEFORE UPDATE ON public.catch_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for catch photos
INSERT INTO storage.buckets (id, name, public) VALUES ('catch-photos', 'catch-photos', true);

-- Storage policies for catch photos
CREATE POLICY "Catch photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'catch-photos');

CREATE POLICY "Anyone can upload catch photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'catch-photos');

CREATE POLICY "Anyone can update catch photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'catch-photos');

CREATE POLICY "Anyone can delete catch photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'catch-photos');