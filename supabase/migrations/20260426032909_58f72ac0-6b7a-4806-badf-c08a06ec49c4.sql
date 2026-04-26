
-- People Ops MVP schema
CREATE TYPE public.position_status AS ENUM ('open','interviewing','filled','on_hold','closed');
CREATE TYPE public.candidate_stage AS ENUM ('applied','screening','interview','offer','hired','rejected');
CREATE TYPE public.leave_type AS ENUM ('vacation','sick','personal','training','other');
CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected','cancelled');

CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  location text,
  seniority text,
  status public.position_status NOT NULL DEFAULT 'open',
  description text,
  team_id uuid,
  opened_at date DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid REFERENCES public.positions(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  stage public.candidate_stage NOT NULL DEFAULT 'applied',
  notes text,
  resume_url text,
  applied_at date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leave_type public.leave_type NOT NULL DEFAULT 'vacation',
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reason text,
  approver_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payroll_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_amount numeric(12,2) NOT NULL DEFAULT 0,
  bonus_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

-- Positions: all authenticated can view, admins manage
CREATE POLICY "Authenticated view positions" ON public.positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage positions" ON public.positions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Candidates: authenticated view, admins manage
CREATE POLICY "Authenticated view candidates" ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage candidates" ON public.candidates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Leave: owner manages own, managers view team, admins manage all
CREATE POLICY "Owner manages own leave" ON public.leave_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers view team leave" ON public.leave_requests FOR SELECT TO authenticated
  USING (public.manages_user(auth.uid(), user_id));
CREATE POLICY "Admins manage all leave" ON public.leave_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Payroll: owner views own, admins manage all
CREATE POLICY "Owner views own payroll" ON public.payroll_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all payroll" ON public.payroll_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_positions_updated BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_candidates_updated BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_leave_updated BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payroll_updated BEFORE UPDATE ON public.payroll_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
