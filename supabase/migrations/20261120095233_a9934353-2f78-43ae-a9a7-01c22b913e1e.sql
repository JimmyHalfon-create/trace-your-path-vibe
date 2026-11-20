CREATE TABLE public.push_devices (
  token text PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('ios','android')),
  author_key text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  lang text NOT NULL DEFAULT 'fr',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.push_devices TO service_role;
REVOKE ALL ON public.push_devices FROM anon, authenticated;
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
CREATE INDEX push_devices_geo ON public.push_devices (latitude, longitude);