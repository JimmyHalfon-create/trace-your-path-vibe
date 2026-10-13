ALTER TABLE public.traces ADD COLUMN drawing jsonb;
ALTER TABLE public.traces DROP CONSTRAINT IF EXISTS traces_trace_type_check;
ALTER TABLE public.traces DROP CONSTRAINT IF EXISTS traces_type_audio;
ALTER TABLE public.traces
  ADD CONSTRAINT traces_trace_type_check CHECK (trace_type IN ('text','voice','tag')),
  ADD CONSTRAINT traces_type_audio CHECK (
    (trace_type = 'text' AND audio_path IS NULL AND drawing IS NULL) OR
    (trace_type = 'voice' AND drawing IS NULL AND audio_path IS NOT NULL AND audio_path ~ '^trace_[A-Za-z0-9_-]+\.(webm|mp4)$') OR
    (trace_type = 'tag' AND audio_path IS NULL AND jsonb_typeof(drawing) = 'array' AND octet_length(drawing::text) <= 20000)
  );