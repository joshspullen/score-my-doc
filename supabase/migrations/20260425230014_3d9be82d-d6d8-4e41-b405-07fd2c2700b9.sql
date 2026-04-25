
-- Business processes catalog
CREATE TABLE public.business_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  name text NOT NULL,
  category text,
  owner text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view processes" ON public.business_processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage processes" ON public.business_processes FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bp_updated BEFORE UPDATE ON public.business_processes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Compliance requirements
CREATE TABLE public.compliance_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text,
  title text NOT NULL,
  regulator text,
  requirement_type text,
  severity text DEFAULT 'medium',
  description text,
  business_process_id uuid REFERENCES public.business_processes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view requirements" ON public.compliance_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage requirements" ON public.compliance_requirements FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_cr_updated BEFORE UPDATE ON public.compliance_requirements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Training modules
CREATE TABLE public.training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_url text,
  duration_minutes integer,
  compliance_requirement_id uuid REFERENCES public.compliance_requirements(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view modules" ON public.training_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage modules" ON public.training_modules FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tm_updated BEFORE UPDATE ON public.training_modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Compliance assignments (target = role | team | user)
CREATE TABLE public.compliance_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_requirement_id uuid NOT NULL REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('role','team','user')),
  target_role app_role,
  target_team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  target_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view assignments" ON public.compliance_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage assignments" ON public.compliance_assignments FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Training assignments
CREATE TABLE public.training_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_module_id uuid NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_module_id, user_id)
);
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own training" ON public.training_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own training" ON public.training_assignments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers view team training" ON public.training_assignments FOR SELECT TO authenticated USING (manages_user(auth.uid(), user_id));
CREATE POLICY "Admins manage training" ON public.training_assignments FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ta_updated BEFORE UPDATE ON public.training_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Connector type
ALTER TABLE public.connectors ADD COLUMN IF NOT EXISTS connector_type text NOT NULL DEFAULT 'api';
