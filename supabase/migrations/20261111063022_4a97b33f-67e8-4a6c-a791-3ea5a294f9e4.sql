CREATE OR REPLACE FUNCTION public.reserve_trace_read(_ip_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent_count bigint; daily_count bigint;
BEGIN
  IF _ip_hash IS NULL OR _ip_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid network fingerprint';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(_ip_hash, 0));
  SELECT count(*) FILTER (WHERE created_at >= now() - interval '10 minutes'), count(*)
    INTO recent_count, daily_count FROM public.trace_read_limits
    WHERE ip_hash = _ip_hash AND created_at >= now() - interval '24 hours';
  IF recent_count >= 60 OR daily_count >= 300 THEN RETURN false; END IF;
  INSERT INTO public.trace_read_limits(ip_hash) VALUES (_ip_hash);
  RETURN true;
END $$;
REVOKE ALL PRIVILEGES ON FUNCTION public.reserve_trace_read(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_trace_read(text) TO service_role;

DO $$
DECLARE k text := repeat('f', 64); i integer; allowed boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM public.trace_read_limits WHERE ip_hash = k) THEN
    RAISE EXCEPTION 'Test fingerprint already exists';
  END IF;
  BEGIN
    FOR i IN 1..60 LOOP
      allowed := public.reserve_trace_read(k);
      IF NOT allowed THEN RAISE EXCEPTION 'Read % refused before limit', i; END IF;
    END LOOP;
    IF public.reserve_trace_read(k) THEN RAISE EXCEPTION '61st read allowed'; END IF;
    RAISE EXCEPTION USING ERRCODE='Z0001', MESSAGE='rollback successful short-window test';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
  END;
  BEGIN
    INSERT INTO public.trace_read_limits(ip_hash, created_at)
      SELECT k, now() - interval '1 hour' FROM generate_series(1,299);
    IF NOT public.reserve_trace_read(k) THEN RAISE EXCEPTION '300th daily read refused'; END IF;
    IF public.reserve_trace_read(k) THEN RAISE EXCEPTION '301st daily read allowed'; END IF;
    RAISE EXCEPTION USING ERRCODE='Z0001', MESSAGE='rollback successful daily-window test';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
  END;
END $$;