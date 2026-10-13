ALTER TABLE public.traces ADD COLUMN IF NOT EXISTS transcript text;
UPDATE public.traces SET moderated_at = NULL WHERE trace_type <> 'text' AND moderation_flag IS NULL;