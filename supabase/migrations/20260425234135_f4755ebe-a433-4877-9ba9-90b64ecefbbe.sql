CREATE TABLE public.regulators (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, short_code text NOT NULL UNIQUE, jurisdiction text, country text, website_url text, description text, category public.regulation_category, logo_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.regulators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view regulators" ON public.regulators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage regulators" ON public.regulators FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_regulators_updated_at BEFORE UPDATE ON public.regulators FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.regulator_subcategories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), regulator_id uuid NOT NULL REFERENCES public.regulators(id) ON DELETE CASCADE, name text NOT NULL, code text, description text, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX idx_subcat_regulator ON public.regulator_subcategories(regulator_id);
ALTER TABLE public.regulator_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view subcategories" ON public.regulator_subcategories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage subcategories" ON public.regulator_subcategories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.compliance_requirements ADD COLUMN regulator_id uuid REFERENCES public.regulators(id) ON DELETE SET NULL, ADD COLUMN subcategory_id uuid REFERENCES public.regulator_subcategories(id) ON DELETE SET NULL;
ALTER TABLE public.connectors ADD COLUMN regulator_id uuid REFERENCES public.regulators(id) ON DELETE SET NULL;

INSERT INTO public.regulators (name, short_code, jurisdiction, country, website_url, description, category) VALUES
('Autorité de Contrôle Prudentiel et de Résolution', 'ACPR', 'France', 'FR', 'https://acpr.banque-france.fr', 'French banking & insurance supervisor.', 'prudential'),
('European Banking Authority', 'EBA', 'European Union', 'EU', 'https://www.eba.europa.eu', 'EU banking regulator.', 'prudential'),
('European Central Bank', 'ECB', 'Eurozone', 'EU', 'https://www.ecb.europa.eu', 'Eurozone central bank, SSM.', 'prudential'),
('Financial Action Task Force', 'FATF', 'Global', 'INT', 'https://www.fatf-gafi.org', 'Global AML/CFT standard-setter.', 'aml_cft'),
('Office of Foreign Assets Control', 'OFAC', 'United States', 'US', 'https://ofac.treasury.gov', 'US sanctions enforcement.', 'sanctions'),
('Financial Conduct Authority', 'FCA', 'United Kingdom', 'UK', 'https://www.fca.org.uk', 'UK conduct regulator.', 'conduct_reporting'),
('Bundesanstalt für Finanzdienstleistungsaufsicht', 'BaFin', 'Germany', 'DE', 'https://www.bafin.de', 'German financial supervisor.', 'prudential'),
('European Union Agency for Cybersecurity', 'ENISA', 'European Union', 'EU', 'https://www.enisa.europa.eu', 'EU cybersecurity agency.', 'operational_cyber');

INSERT INTO public.regulator_subcategories (regulator_id, name, code, description)
SELECT id, 'OFAC SDN List', 'OFAC-SDN', 'Specially Designated Nationals.' FROM public.regulators WHERE short_code='OFAC'
UNION ALL SELECT id, 'OFAC 50% Rule', 'OFAC-50', 'Aggregate ownership rule.' FROM public.regulators WHERE short_code='OFAC'
UNION ALL SELECT id, 'EU Consolidated Sanctions List', 'EU-CFSP', 'Restrictive measures.' FROM public.regulators WHERE short_code='OFAC'
UNION ALL SELECT id, 'Customer Due Diligence', 'CDD', 'KYC and ongoing monitoring.' FROM public.regulators WHERE short_code='FATF'
UNION ALL SELECT id, 'Suspicious Transaction Reporting', 'STR', 'Filing to FIU.' FROM public.regulators WHERE short_code='FATF'
UNION ALL SELECT id, 'Beneficial Ownership', 'UBO', 'Identification of UBOs.' FROM public.regulators WHERE short_code='FATF'
UNION ALL SELECT id, 'Travel Rule', 'TR', 'Originator/beneficiary info.' FROM public.regulators WHERE short_code='FATF'
UNION ALL SELECT id, 'Capital Requirements (CRR/CRD)', 'CRR', 'Pillar 1 capital ratios.' FROM public.regulators WHERE short_code='EBA'
UNION ALL SELECT id, 'Liquidity Coverage Ratio', 'LCR', 'Short-term liquidity.' FROM public.regulators WHERE short_code='EBA'
UNION ALL SELECT id, 'Net Stable Funding Ratio', 'NSFR', 'Long-term stable funding.' FROM public.regulators WHERE short_code='EBA'
UNION ALL SELECT id, 'SREP', 'SREP', 'Supervisory Review & Evaluation.' FROM public.regulators WHERE short_code='ECB'
UNION ALL SELECT id, 'ICAAP / ILAAP', 'ICAAP', 'Internal adequacy.' FROM public.regulators WHERE short_code='ECB'
UNION ALL SELECT id, 'MaRisk', 'MARISK', 'Risk management.' FROM public.regulators WHERE short_code='BaFin'
UNION ALL SELECT id, 'Solvency Reporting (COREP)', 'COREP', 'Common reporting.' FROM public.regulators WHERE short_code='ACPR'
UNION ALL SELECT id, 'Consumer Duty', 'CD', 'Retail outcomes.' FROM public.regulators WHERE short_code='FCA'
UNION ALL SELECT id, 'SMCR', 'SMCR', 'Senior Managers Regime.' FROM public.regulators WHERE short_code='FCA'
UNION ALL SELECT id, 'Market Abuse (MAR)', 'MAR', 'Insider dealing.' FROM public.regulators WHERE short_code='FCA'
UNION ALL SELECT id, 'DORA', 'DORA', 'Digital Operational Resilience Act.' FROM public.regulators WHERE short_code='ENISA'
UNION ALL SELECT id, 'NIS2', 'NIS2', 'Network & Info Systems Directive 2.' FROM public.regulators WHERE short_code='ENISA'
UNION ALL SELECT id, 'ICT Risk Management', 'ICT', 'ICT incident reporting.' FROM public.regulators WHERE short_code='ENISA';

UPDATE public.compliance_requirements cr SET regulator_id = r.id FROM public.regulators r WHERE cr.regulator IS NOT NULL AND (cr.regulator ILIKE '%' || r.short_code || '%' OR cr.regulator ILIKE '%' || r.name || '%');