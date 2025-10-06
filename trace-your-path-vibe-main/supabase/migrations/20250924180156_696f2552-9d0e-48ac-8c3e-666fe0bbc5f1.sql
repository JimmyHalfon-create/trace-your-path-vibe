-- Add DELETE policy for voice traces
CREATE POLICY "Anyone can delete voice traces" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'voice-traces');