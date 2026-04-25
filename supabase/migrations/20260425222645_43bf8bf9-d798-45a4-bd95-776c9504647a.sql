
-- Connector registry
CREATE TABLE public.connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  homepage_url text,
  api_base_url text,
  requires_api_key boolean NOT NULL DEFAULT false,
  api_key_secret_name text,
  enabled boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  records_count integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER connectors_set_updated_at
BEFORE UPDATE ON public.connectors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Records pulled from connectors
CREATE TABLE public.connector_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  title text NOT NULL,
  summary text,
  url text,
  published_at timestamptz,
  record_type text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connector_id, external_id)
);

ALTER TABLE public.connector_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX connector_records_connector_id_idx ON public.connector_records(connector_id);
CREATE INDEX connector_records_published_at_idx ON public.connector_records(published_at DESC);

-- RLS: connectors
CREATE POLICY "Admins manage connectors"
ON public.connectors FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view connectors"
ON public.connectors FOR SELECT TO authenticated
USING (true);

-- RLS: connector_records
CREATE POLICY "Admins manage records"
ON public.connector_records FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view records"
ON public.connector_records FOR SELECT TO authenticated
USING (true);

-- Seed regulators
INSERT INTO public.connectors (slug, name, category, description, homepage_url, api_base_url, requires_api_key) VALUES
  ('acpr', 'ACPR', 'Banking Regulator (FR)', 'Autorité de contrôle prudentiel et de résolution — sanctions, decisions, registers (Banque de France).', 'https://acpr.banque-france.fr/en', 'https://acpr.banque-france.fr/en/api', false),
  ('eba', 'EBA', 'Banking Regulator (EU)', 'European Banking Authority — guidelines, breaches of EU law, public registers.', 'https://www.eba.europa.eu/', 'https://www.eba.europa.eu/api', false),
  ('esma', 'ESMA', 'Securities Regulator (EU)', 'European Securities and Markets Authority — registers, sanctions, MiFID/MAR enforcement.', 'https://www.esma.europa.eu/', 'https://registers.esma.europa.eu/publication/searchRegister/doMainAction', false),
  ('ofac', 'OFAC SDN', 'Sanctions (US)', 'US Treasury Office of Foreign Assets Control — Specially Designated Nationals consolidated list.', 'https://ofac.treasury.gov/', 'https://www.treasury.gov/ofac/downloads/sdn.csv', false),
  ('uk_hmt', 'UK HMT Sanctions', 'Sanctions (UK)', 'UK His Majesty''s Treasury Office of Financial Sanctions Implementation consolidated list.', 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets', 'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json', false),
  ('fatf', 'FATF', 'AML Standards (Global)', 'Financial Action Task Force — high-risk and other monitored jurisdictions.', 'https://www.fatf-gafi.org/', 'https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions.html', false);
