-- Vérifier si le bucket 'traces' existe et le rendre public
UPDATE storage.buckets
SET public = true
WHERE id = 'traces';

-- Si le bucket n'existe pas, le créer
INSERT INTO storage.buckets (id, name, public)
VALUES ('traces', 'traces', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Supprimer les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Traces audio are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload trace audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own trace audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their own trace audio" ON storage.objects;

-- Créer des policies pour permettre l'accès public en lecture
CREATE POLICY "Public read access to traces"
ON storage.objects FOR SELECT
USING (bucket_id = 'traces');

-- Permettre à tout le monde d'uploader des fichiers audio
CREATE POLICY "Public upload to traces"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'traces');

-- Permettre la mise à jour des fichiers
CREATE POLICY "Public update traces"
ON storage.objects FOR UPDATE
USING (bucket_id = 'traces');

-- Permettre la suppression des fichiers
CREATE POLICY "Public delete traces"
ON storage.objects FOR DELETE
USING (bucket_id = 'traces');