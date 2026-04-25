-- Enable scheduling extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.agent_pattern AS ENUM ('collection', 'analysis', 'action');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_trigger AS ENUM ('manual', 'hourly', 'daily', 'weekly', 'monthly', 'cron');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_status AS ENUM ('active', 'paused', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.agent_run_status AS ENUM ('running', 'success', 'error', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  pattern public.agent_pattern NOT NULL DEFAULT 'collection',
  status public.agent_status NOT NULL DEFAULT 'draft',
  trigger_type public.agent_trigger NOT NULL DEFAULT 'manual',
  cron_expression TEXT,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_run_status public.agent_run_status,
  regulator_id UUID REFERENCES public.regulators(id) ON DELETE SET NULL,
  connector_id UUID REFERENCES public.connectors(id) ON DELETE SET NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view agents" ON public.agents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage agents" ON public.agents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER agents_set_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Agent runs
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status public.agent_run_status NOT NULL DEFAULT 'running',
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  records_collected INTEGER NOT NULL DEFAULT 0,
  new_records INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view runs" ON public.agent_runs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage runs" ON public.agent_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON public.agent_runs(agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status, trigger_type);