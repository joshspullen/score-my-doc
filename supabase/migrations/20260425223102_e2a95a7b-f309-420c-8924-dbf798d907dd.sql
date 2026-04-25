
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN headline text,
  ADD COLUMN bio text,
  ADD COLUMN location text,
  ADD COLUMN avatar_url text,
  ADD COLUMN linkedin_url text,
  ADD COLUMN website_url text,
  ADD COLUMN github_url text,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Education
CREATE TABLE public.profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institution text NOT NULL,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;
CREATE INDEX profile_education_user_id_idx ON public.profile_education(user_id);
CREATE TRIGGER profile_education_set_updated_at
BEFORE UPDATE ON public.profile_education
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Experience
CREATE TABLE public.profile_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  location text,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_experience ENABLE ROW LEVEL SECURITY;
CREATE INDEX profile_experience_user_id_idx ON public.profile_experience(user_id);
CREATE TRIGGER profile_experience_set_updated_at
BEFORE UPDATE ON public.profile_experience
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Certifications
CREATE TABLE public.profile_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  issuer text,
  issue_date date,
  expiry_date date,
  credential_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_certifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX profile_certifications_user_id_idx ON public.profile_certifications(user_id);
CREATE TRIGGER profile_certifications_set_updated_at
BEFORE UPDATE ON public.profile_certifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS helper macro: owner OR admin OR manager-of-user
-- Education
CREATE POLICY "Owner manages education" ON public.profile_education
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all education" ON public.profile_education
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers view team education" ON public.profile_education
FOR SELECT TO authenticated
USING (public.manages_user(auth.uid(), user_id));

-- Experience
CREATE POLICY "Owner manages experience" ON public.profile_experience
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all experience" ON public.profile_experience
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers view team experience" ON public.profile_experience
FOR SELECT TO authenticated
USING (public.manages_user(auth.uid(), user_id));

-- Certifications
CREATE POLICY "Owner manages certifications" ON public.profile_certifications
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all certifications" ON public.profile_certifications
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers view team certifications" ON public.profile_certifications
FOR SELECT TO authenticated
USING (public.manages_user(auth.uid(), user_id));
