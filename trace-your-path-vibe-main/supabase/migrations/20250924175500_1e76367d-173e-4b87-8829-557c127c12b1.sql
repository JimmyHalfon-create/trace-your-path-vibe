-- Add columns to support voice traces
ALTER TABLE public.traces 
ADD COLUMN trace_type text NOT NULL DEFAULT 'text' CHECK (trace_type IN ('text', 'voice')),
ADD COLUMN audio_url text;

-- Create storage bucket for voice traces
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-traces', 'voice-traces', true);

-- Create storage policies for voice traces
CREATE POLICY "Anyone can view voice traces" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-traces');

CREATE POLICY "Anyone can upload voice traces" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-traces');

CREATE POLICY "Anyone can update voice traces" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'voice-traces');