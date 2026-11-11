REVOKE ALL PRIVILEGES ON TABLE public.trace_rate_limits, public.trace_read_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.trace_rate_limits, public.trace_read_limits TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.trace_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.trace_reports TO authenticated;
GRANT UPDATE (resolved_at) ON TABLE public.trace_reports TO authenticated;
GRANT ALL ON TABLE public.trace_reports TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.banned_authors FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.banned_authors TO authenticated;
GRANT ALL ON TABLE public.banned_authors TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.traces FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.traces TO authenticated;
GRANT ALL ON TABLE public.traces TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_trace_markers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_trace_markers() TO anon, authenticated, service_role;