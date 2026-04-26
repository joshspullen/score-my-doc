-- Documentation hierarchy: extend business_processes (kept as table name for backwards compat)
DO $$ BEGIN
  CREATE TYPE public.doc_level AS ENUM ('policy', 'standard', 'procedure', 'work_instruction');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.business_processes
  ADD COLUMN IF NOT EXISTS doc_level public.doc_level NOT NULL DEFAULT 'procedure',
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.business_processes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_sanction TEXT,
  ADD COLUMN IF NOT EXISTS sanction_amount TEXT,
  ADD COLUMN IF NOT EXISTS sanction_year INTEGER,
  ADD COLUMN IF NOT EXISTS violation_summary TEXT,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS version TEXT;

CREATE INDEX IF NOT EXISTS idx_business_processes_parent ON public.business_processes(parent_id);
CREATE INDEX IF NOT EXISTS idx_business_processes_level ON public.business_processes(doc_level);