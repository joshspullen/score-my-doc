
-- Add manager role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team membership
CREATE TYPE public.team_member_role AS ENUM ('manager', 'member');

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  member_role public.team_member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Helper: is user manager of a given team?
CREATE OR REPLACE FUNCTION public.is_team_manager(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = _user_id AND team_id = _team_id AND member_role = 'manager'
  )
$$;

-- Helper: get all team_ids where _user_id is a manager
CREATE OR REPLACE FUNCTION public.teams_managed_by(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT team_id FROM public.team_members
  WHERE user_id = _user_id AND member_role = 'manager'
$$;

-- Helper: shared team check (does manager and target user share a managed team?)
CREATE OR REPLACE FUNCTION public.manages_user(_manager_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm_mgr
    JOIN public.team_members tm_member ON tm_mgr.team_id = tm_member.team_id
    WHERE tm_mgr.user_id = _manager_id
      AND tm_mgr.member_role = 'manager'
      AND tm_member.user_id = _target_user_id
  )
$$;

-- Updated_at trigger fn (reuse pattern)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER teams_set_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= RLS: teams =============
CREATE POLICY "Admins manage all teams"
ON public.teams FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Members view their teams"
ON public.teams FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid())
);

CREATE POLICY "Managers update their teams"
ON public.teams FOR UPDATE TO authenticated
USING (public.is_team_manager(auth.uid(), id))
WITH CHECK (public.is_team_manager(auth.uid(), id));

-- ============= RLS: team_members =============
CREATE POLICY "Admins manage all memberships"
ON public.team_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own memberships"
ON public.team_members FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers view their team memberships"
ON public.team_members FOR SELECT TO authenticated
USING (public.is_team_manager(auth.uid(), team_id));

CREATE POLICY "Managers add members to their team"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (public.is_team_manager(auth.uid(), team_id) AND member_role = 'member');

CREATE POLICY "Managers remove members from their team"
ON public.team_members FOR DELETE TO authenticated
USING (public.is_team_manager(auth.uid(), team_id) AND member_role = 'member');

-- ============= Extend RLS on existing tables =============

-- Documents: admins full control, managers can view team members' docs
CREATE POLICY "Admins manage all documents"
ON public.documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers view team documents"
ON public.documents FOR SELECT TO authenticated
USING (public.manages_user(auth.uid(), user_id));

-- Analyses: admins full control, managers view
CREATE POLICY "Admins manage all analyses"
ON public.analyses FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers view team analyses"
ON public.analyses FOR SELECT TO authenticated
USING (public.manages_user(auth.uid(), user_id));

-- Profiles: admins view all, managers view team members
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers view team profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.manages_user(auth.uid(), id));

-- user_roles: admins manage role assignments
CREATE POLICY "Admins view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins assign roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins remove roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
