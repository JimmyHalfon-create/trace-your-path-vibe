-- 1. Content columns
ALTER TABLE public.traces RENAME COLUMN audio_url TO audio_path;
UPDATE public.traces SET audio_path = split_part(audio_path, '/voice-traces/', 2)
  WHERE audio_path LIKE '%/voice-traces/%';

-- 2. Server-side data rules
ALTER TABLE public.traces DROP CONSTRAINT traces_message_check;
ALTER TABLE public.traces
  ADD CONSTRAINT traces_message_len CHECK (char_length(message) BETWEEN 1 AND 70),
  ADD CONSTRAINT traces_lat_range CHECK (latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT traces_lng_range CHECK (longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT traces_type_audio CHECK (
    (trace_type = 'text' AND audio_path IS NULL) OR
    (trace_type = 'voice' AND audio_path IS NOT NULL AND audio_path ~ '^trace_[A-Za-z0-9_-]+\.(webm|mp4)$')
  );

-- 3. Lock down direct access
DROP POLICY IF EXISTS "Anyone can read all traces" ON public.traces;
DROP POLICY IF EXISTS "Anyone can create anonymous traces" ON public.traces;
REVOKE ALL ON public.traces FROM anon, authenticated;
GRANT SELECT, DELETE ON public.traces TO authenticated;
GRANT ALL ON public.traces TO service_role;
CREATE POLICY "Admins can read traces" ON public.traces FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Public marker feed (no content)
CREATE OR REPLACE FUNCTION public.get_trace_markers()
RETURNS TABLE (id uuid, latitude numeric, longitude numeric, trace_type text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, latitude, longitude, trace_type, created_at FROM public.traces ORDER BY created_at DESC LIMIT 5000
$$;
REVOKE ALL ON FUNCTION public.get_trace_markers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trace_markers() TO anon, authenticated, service_role;

-- 5. Anti-flood log (server only)
CREATE TABLE public.trace_rate_limits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.trace_rate_limits TO service_role;
ALTER TABLE public.trace_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX trace_rate_limits_ip_time ON public.trace_rate_limits (ip_hash, created_at DESC);

-- 6. Storage policies
DROP POLICY IF EXISTS "Anyone can view voice traces" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update voice traces" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload voice traces" ON storage.objects;
DROP POLICY IF EXISTS "Public can read voice traces" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to traces" ON storage.objects;
DROP POLICY IF EXISTS "Public upload to traces" ON storage.objects;
DROP POLICY IF EXISTS "Public update traces" ON storage.objects;
DROP POLICY IF EXISTS "Public delete traces" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload anonymous audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read trace files" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete trace files" ON storage.objects;
DROP POLICY IF EXISTS "Lecture publique des fichiers audio" ON storage.objects;
DROP POLICY IF EXISTS "Upload public anonyme des fichiers audio" ON storage.objects;
DROP POLICY IF EXISTS "Aucune modification des fichiers audio" ON storage.objects;
DROP POLICY IF EXISTS "Suppression admin uniquement des fichiers" ON storage.objects;

CREATE POLICY "Admins read voice traces" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-traces' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete voice traces" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'voice-traces' AND public.has_role(auth.uid(), 'admin'));

-- 7. Old bucket 'traces': verified empty and unused; its policies are removed above.