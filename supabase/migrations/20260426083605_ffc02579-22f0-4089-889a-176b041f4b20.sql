CREATE TABLE IF NOT EXISTS public.training_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('legacy', 'orchestrated', 'legacy_fallback')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error', 'fallback')),
  compliance_requirement_id uuid REFERENCES public.compliance_requirements(id) ON DELETE SET NULL,
  triggered_by_user_id uuid NOT NULL,
  policy_ids uuid[] NOT NULL DEFAULT '{}',
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  business_process_id uuid REFERENCES public.business_processes(id) ON DELETE SET NULL,
  schema_version text,
  prompt_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_name text,
  step_timings_ms jsonb NOT NULL DEFAULT '{}'::jsonb,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tgr_requirement_created
  ON public.training_generation_runs (compliance_requirement_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tgr_user_created
  ON public.training_generation_runs (triggered_by_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tgr_status_created
  ON public.training_generation_runs (status, created_at DESC);

ALTER TABLE public.training_generation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own generation runs" ON public.training_generation_runs;
CREATE POLICY "Users view own generation runs"
ON public.training_generation_runs FOR SELECT TO authenticated
USING (
  triggered_by_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins manage generation runs" ON public.training_generation_runs;
CREATE POLICY "Admins manage generation runs"
ON public.training_generation_runs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_tgr_updated ON public.training_generation_runs;
CREATE TRIGGER trg_tgr_updated
BEFORE UPDATE ON public.training_generation_runs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();