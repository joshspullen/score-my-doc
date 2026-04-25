-- Add regulation category enum and category column to compliance_requirements (kept as table name for stability)
CREATE TYPE public.regulation_category AS ENUM (
  'sanctions',
  'aml_cft',
  'prudential',
  'conduct_reporting',
  'operational_cyber'
);

ALTER TABLE public.compliance_requirements
  ADD COLUMN category public.regulation_category;
