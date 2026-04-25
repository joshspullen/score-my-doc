
CREATE TABLE public.fictional_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  email text,
  job_title text,
  department text,
  avatar_seed text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fictional_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view fictional users" ON public.fictional_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage fictional users" ON public.fictional_users FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
