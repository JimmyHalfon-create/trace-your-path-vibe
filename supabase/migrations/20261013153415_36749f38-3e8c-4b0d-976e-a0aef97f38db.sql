alter table public.traces
  add column moderation_flag boolean,
  add column moderation_reason text,
  add column moderated_at timestamptz;
create index traces_unmoderated_idx on public.traces (created_at) where moderated_at is null;