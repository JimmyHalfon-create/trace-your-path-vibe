-- Create traces table for anonymous location-based messages
CREATE TABLE public.traces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL CHECK (length(message) <= 280),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for public access
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read traces (public/anonymous access)
CREATE POLICY "Anyone can read traces" 
ON public.traces 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert traces (anonymous posting)
CREATE POLICY "Anyone can insert traces" 
ON public.traces 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient location-based queries
CREATE INDEX idx_traces_location ON public.traces (latitude, longitude);

-- Create index for temporal queries
CREATE INDEX idx_traces_created_at ON public.traces (created_at DESC);