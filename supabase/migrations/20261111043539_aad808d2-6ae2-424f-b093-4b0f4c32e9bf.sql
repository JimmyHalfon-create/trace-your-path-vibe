GRANT UPDATE (resolved_at) ON public.trace_reports TO authenticated;
CREATE POLICY "Admins resolve reports" ON public.trace_reports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER FUNCTION public.restore_trace(uuid) SECURITY INVOKER;