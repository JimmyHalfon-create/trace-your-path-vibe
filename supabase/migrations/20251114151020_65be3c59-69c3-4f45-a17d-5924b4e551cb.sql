-- Création de la table traces
CREATE TABLE IF NOT EXISTS public.traces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  trace_type TEXT NOT NULL DEFAULT 'text' CHECK (trace_type IN ('text', 'voice')),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Création de la table user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour traces
DROP POLICY IF EXISTS "Lecture publique anonyme des traces" ON public.traces;
CREATE POLICY "Lecture publique anonyme des traces" 
ON public.traces 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insertion publique anonyme des traces" ON public.traces;
CREATE POLICY "Insertion publique anonyme des traces" 
ON public.traces 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Aucune modification des traces" ON public.traces;
CREATE POLICY "Aucune modification des traces" 
ON public.traces 
FOR UPDATE 
USING (false);

DROP POLICY IF EXISTS "Suppression admin uniquement" ON public.traces;
CREATE POLICY "Suppression admin uniquement" 
ON public.traces 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS Policies pour user_roles
DROP POLICY IF EXISTS "Lecture des rôles pour utilisateurs authentifiés" ON public.user_roles;
CREATE POLICY "Lecture des rôles pour utilisateurs authentifiés" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Seuls les admins peuvent modifier les rôles" ON public.user_roles;
CREATE POLICY "Seuls les admins peuvent modifier les rôles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Storage bucket pour les traces audio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('traces', 'traces', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Lecture publique des fichiers audio" ON storage.objects;
CREATE POLICY "Lecture publique des fichiers audio" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'traces');

DROP POLICY IF EXISTS "Upload public anonyme des fichiers audio" ON storage.objects;
CREATE POLICY "Upload public anonyme des fichiers audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'traces');

DROP POLICY IF EXISTS "Aucune modification des fichiers audio" ON storage.objects;
CREATE POLICY "Aucune modification des fichiers audio" 
ON storage.objects 
FOR UPDATE 
USING (false);

DROP POLICY IF EXISTS "Suppression admin uniquement des fichiers" ON storage.objects;
CREATE POLICY "Suppression admin uniquement des fichiers" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'traces' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);