ALTER TABLE public.traces
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS author_key text,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

CREATE POLICY "Admins can update traces" ON public.traces FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT UPDATE ON public.traces TO authenticated;

CREATE TABLE public.trace_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES public.traces(id) ON DELETE CASCADE,
  reporter_key text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trace_id, reporter_key)
);
GRANT SELECT ON public.trace_reports TO authenticated;
GRANT ALL ON public.trace_reports TO service_role;
ALTER TABLE public.trace_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read reports" ON public.trace_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.banned_authors (
  author_key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.banned_authors TO authenticated;
GRANT ALL ON public.banned_authors TO service_role;
ALTER TABLE public.banned_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bans" ON public.banned_authors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.get_trace_markers();
CREATE FUNCTION public.get_trace_markers()
 RETURNS TABLE(id uuid, latitude numeric, longitude numeric, trace_type text, created_at timestamptz, author text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT id, latitude, longitude, trace_type, created_at, md5(coalesce(author_key, id::text))
  FROM public.traces WHERE NOT hidden ORDER BY created_at DESC LIMIT 5000
$$;
GRANT EXECUTE ON FUNCTION public.get_trace_markers() TO anon, authenticated;