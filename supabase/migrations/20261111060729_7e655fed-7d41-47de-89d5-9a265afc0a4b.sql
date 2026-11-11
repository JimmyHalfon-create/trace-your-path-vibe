CREATE TABLE public.trace_read_limits (id bigserial PRIMARY KEY, ip_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.trace_read_limits TO service_role;
GRANT USAGE ON SEQUENCE public.trace_read_limits_id_seq TO service_role;
ALTER TABLE public.trace_read_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.trace_read_limits (ip_hash, created_at);