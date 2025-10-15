-- Supprimer toutes les politiques existantes sur storage.objects pour le bucket voice-traces
DROP POLICY IF EXISTS "Anyone can upload voice traces" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read voice traces" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete voice traces" ON storage.objects;
DROP POLICY IF EXISTS "Voice traces are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to voice-traces" ON storage.objects;

-- Recréer les bonnes politiques
CREATE POLICY "Public can upload voice traces"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'voice-traces');

CREATE POLICY "Public can read voice traces"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'voice-traces');