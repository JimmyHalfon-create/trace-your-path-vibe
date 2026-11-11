ALTER TABLE public.trace_reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE OR REPLACE FUNCTION public.submit_trace_report(_trace_id uuid, _reporter_key text, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inserted_id uuid;
BEGIN
  PERFORM id FROM public.traces WHERE id = _trace_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trace introuvable'; END IF;
  INSERT INTO public.trace_reports(trace_id, reporter_key, reason)
  VALUES (_trace_id, _reporter_key, left(_reason, 80))
  ON CONFLICT (trace_id, reporter_key) DO NOTHING RETURNING id INTO inserted_id;
  IF inserted_id IS NULL THEN RETURN; END IF;
  UPDATE public.traces SET hidden = true, report_count = (
    SELECT count(*) FROM public.trace_reports WHERE trace_id = _trace_id AND resolved_at IS NULL
  ) WHERE id = _trace_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_trace_report(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_trace_report(uuid, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.restore_trace(_trace_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;
  PERFORM id FROM public.traces WHERE id = _trace_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trace introuvable'; END IF;
  UPDATE public.trace_reports SET resolved_at = now() WHERE trace_id = _trace_id AND resolved_at IS NULL;
  UPDATE public.traces SET hidden = false, report_count = 0, moderation_flag = false,
    moderation_reason = NULL, moderated_at = now() WHERE id = _trace_id;
END $$;
REVOKE ALL ON FUNCTION public.restore_trace(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_trace(uuid) TO authenticated;

-- Regression checks are rolled back with their fixture on success.
DO $$
DECLARE fixture uuid := gen_random_uuid(); suspended boolean; reports integer;
BEGIN
  BEGIN
    INSERT INTO public.traces(id, message, latitude, longitude) VALUES (fixture, 'moderation regression', 48.85, 2.35);
    PERFORM public.submit_trace_report(fixture, 'regression-device-1', NULL);
    SELECT hidden, report_count INTO suspended, reports FROM public.traces WHERE id = fixture;
    IF suspended IS DISTINCT FROM true OR reports <> 1 THEN RAISE EXCEPTION 'First report must suspend'; END IF;
    PERFORM public.submit_trace_report(fixture, 'regression-device-1', NULL);
    SELECT report_count INTO reports FROM public.traces WHERE id = fixture;
    IF reports <> 1 THEN RAISE EXCEPTION 'Duplicate report must not increment'; END IF;
    UPDATE public.trace_reports SET resolved_at = now() WHERE trace_id = fixture;
    UPDATE public.traces SET hidden = false, report_count = 0 WHERE id = fixture;
    PERFORM public.submit_trace_report(fixture, 'regression-device-1', NULL);
    SELECT hidden INTO suspended FROM public.traces WHERE id = fixture;
    IF suspended IS DISTINCT FROM false THEN RAISE EXCEPTION 'Resolved duplicate must not suspend again'; END IF;
    PERFORM public.submit_trace_report(fixture, 'regression-device-2', NULL);
    SELECT hidden, report_count INTO suspended, reports FROM public.traces WHERE id = fixture;
    IF suspended IS DISTINCT FROM true OR reports <> 1 THEN RAISE EXCEPTION 'New report must suspend again'; END IF;
    RAISE EXCEPTION USING ERRCODE = 'Z0001', MESSAGE = 'Rollback regression fixtures';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
  END;
END $$;