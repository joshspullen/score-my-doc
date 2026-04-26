
ALTER TABLE public.training_modules
  ADD COLUMN IF NOT EXISTS team_id uuid,
  ADD COLUMN IF NOT EXISTS business_process_id uuid,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS quiz jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.training_assignments
  ADD COLUMN IF NOT EXISTS score integer,
  ADD COLUMN IF NOT EXISTS last_attempt jsonb;
