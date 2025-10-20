-- Sécurisation complète des traces pour garantir l'anonymat et la protection

-- 1. S'assurer que les traces restent totalement anonymes (pas de user_id)
-- La table traces n'a pas de user_id, ce qui est parfait pour l'anonymat

-- 2. Supprimer les anciennes policies pour recréer un système sécurisé
DROP POLICY IF EXISTS "Anyone can insert traces" ON public.traces;
DROP POLICY IF EXISTS "Anyone can read traces" ON public.traces;
DROP POLICY IF EXISTS "Admins can view all traces" ON public.traces;
DROP POLICY IF EXISTS "Admins can delete any trace" ON public.traces;

-- 3. Créer des policies strictes et sécurisées

-- Tout le monde peut créer une trace anonyme
CREATE POLICY "Anyone can create anonymous traces"
ON public.traces
FOR INSERT
TO public
WITH CHECK (true);

-- Tout le monde peut lire les traces (mais sans savoir qui les a créées)
CREATE POLICY "Anyone can read all traces"
ON public.traces
FOR SELECT
TO public
USING (true);

-- PERSONNE ne peut modifier une trace (même pas son créateur)
-- Pas de policy UPDATE = impossible de modifier

-- Seuls les admins peuvent supprimer des traces
CREATE POLICY "Only admins can delete traces"
ON public.traces
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Sécuriser le bucket de stockage des audios
-- Supprimer les anciennes policies sur storage.objects pour le bucket traces
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to traces bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read from traces bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from traces bucket" ON storage.objects;

-- Tout le monde peut uploader anonymement dans le bucket traces
CREATE POLICY "Anyone can upload anonymous audio"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'traces');

-- Tout le monde peut lire les fichiers du bucket traces
CREATE POLICY "Anyone can read trace files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'traces');

-- PERSONNE ne peut modifier les fichiers
-- Pas de policy UPDATE = impossible de modifier

-- Seuls les admins peuvent supprimer des fichiers
CREATE POLICY "Only admins can delete trace files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'traces' AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);