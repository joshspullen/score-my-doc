-- Enum
CREATE TYPE public.decision_outcome AS ENUM ('pending','correct','incorrect','divergent','n_a');

-- Traces
CREATE TABLE public.decision_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  policy_id uuid REFERENCES public.business_processes(id) ON DELETE SET NULL,
  category text,
  title text NOT NULL,
  trigger_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  options_presented jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_made jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_recommendation jsonb,
  outcome public.decision_outcome NOT NULL DEFAULT 'pending',
  outcome_notes text,
  deviation boolean NOT NULL DEFAULT false,
  duration_ms integer,
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dt_user_decided ON public.decision_traces (user_id, decided_at DESC);
CREATE INDEX idx_dt_policy ON public.decision_traces (policy_id);
CREATE INDEX idx_dt_outcome ON public.decision_traces (outcome);

-- Spans
CREATE TABLE public.decision_spans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES public.decision_traces(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  step_type text NOT NULL,
  label text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ds_trace ON public.decision_spans (trace_id, step_order);

-- RLS
ALTER TABLE public.decision_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_spans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all traces"
ON public.decision_traces FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner manages own traces"
ON public.decision_traces FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers view team traces"
ON public.decision_traces FOR SELECT TO authenticated
USING (public.manages_user(auth.uid(), user_id));

CREATE POLICY "Admins manage all spans"
ON public.decision_spans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "View spans via parent trace"
ON public.decision_spans FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.decision_traces t
  WHERE t.id = decision_spans.trace_id
    AND (t.user_id = auth.uid() OR public.manages_user(auth.uid(), t.user_id))
));

CREATE POLICY "Owner manages spans on own traces"
ON public.decision_spans FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.decision_traces t WHERE t.id = decision_spans.trace_id AND t.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.decision_traces t WHERE t.id = decision_spans.trace_id AND t.user_id = auth.uid()));

-- Seed: 8 traces across 3 fictional users + spans. Use deterministic UUIDs so re-runs idempotent on policies.
DO $$
DECLARE
  pol_kyc uuid;
  u1 uuid; u2 uuid; u3 uuid;
  t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid; t6 uuid; t7 uuid; t8 uuid;
BEGIN
  SELECT id INTO pol_kyc FROM public.business_processes ORDER BY created_at LIMIT 1;
  SELECT id INTO u1 FROM public.fictional_users ORDER BY created_at LIMIT 1;
  SELECT id INTO u2 FROM public.fictional_users ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO u3 FROM public.fictional_users ORDER BY created_at OFFSET 2 LIMIT 1;
  -- Fallback: if no fictional users, skip seeding
  IF u1 IS NULL THEN RETURN; END IF;
  IF u2 IS NULL THEN u2 := u1; END IF;
  IF u3 IS NULL THEN u3 := u1; END IF;

  t1 := gen_random_uuid(); t2 := gen_random_uuid(); t3 := gen_random_uuid(); t4 := gen_random_uuid();
  t5 := gen_random_uuid(); t6 := gen_random_uuid(); t7 := gen_random_uuid(); t8 := gen_random_uuid();

  INSERT INTO public.decision_traces (id, user_id, policy_id, category, title, trigger_context, options_presented, decision_made, ai_recommendation, outcome, deviation, duration_ms, decided_at) VALUES
   (t1, u1, pol_kyc, 'KYC', 'Onboard corporate client — Acme Holdings', '{"client":"Acme Holdings","risk":"medium","jurisdiction":"FR"}', '[{"id":"approve","label":"Approve"},{"id":"escalate","label":"Escalate to MLRO"},{"id":"reject","label":"Reject"}]', '{"choice":"approve","rationale":"Documents complete, BO verified"}', '{"choice":"approve","confidence":0.82}', 'correct', false, 184000, now() - interval '2 hours'),
   (t2, u2, pol_kyc, 'Sanctions', 'Sanctions hit — name match Smirnov A.', '{"hit":"OFAC SDN partial","score":0.74}', '[{"id":"clear","label":"Clear false positive"},{"id":"freeze","label":"Freeze & report"}]', '{"choice":"clear","rationale":"DOB mismatch confirmed"}', '{"choice":"freeze","confidence":0.66}', 'divergent', true, 421000, now() - interval '5 hours'),
   (t3, u3, pol_kyc, 'Credit', 'Credit override — SME loan EUR 250k', '{"applicant":"BlueRiver SARL","score":612,"limit":200000}', '[{"id":"approve_override","label":"Approve with override"},{"id":"approve_reduced","label":"Approve reduced amount"},{"id":"decline","label":"Decline"}]', '{"choice":"approve_reduced","amount":180000}', '{"choice":"decline","confidence":0.71}', 'pending', true, 612000, now() - interval '1 day'),
   (t4, u1, pol_kyc, 'KYC', 'Periodic review — high-risk client', '{"client":"Northwind Trading","last_review":"2024-03"}', '[{"id":"continue","label":"Continue"},{"id":"exit","label":"Exit relationship"}]', '{"choice":"continue"}', '{"choice":"continue","confidence":0.9}', 'correct', false, 95000, now() - interval '3 hours'),
   (t5, u2, pol_kyc, 'AML', 'Transaction monitoring alert review', '{"alert_id":"TM-44219","amount":48500,"pattern":"structuring"}', '[{"id":"sar","label":"File SAR"},{"id":"close","label":"Close — no action"}]', '{"choice":"sar"}', '{"choice":"sar","confidence":0.88}', 'correct', false, 232000, now() - interval '6 hours'),
   (t6, u3, pol_kyc, 'KYC', 'PEP onboarding — politically exposed', '{"client":"J. Martin","pep_role":"Mayor"}', '[{"id":"approve_edd","label":"Approve with EDD"},{"id":"reject","label":"Reject"}]', '{"choice":"approve_edd"}', '{"choice":"approve_edd","confidence":0.79}', 'correct', false, 305000, now() - interval '1 day 3 hours'),
   (t7, u1, pol_kyc, 'Sanctions', 'Wire screening — Iran nexus', '{"beneficiary":"Tehran Logistics","amount":12000}', '[{"id":"block","label":"Block"},{"id":"release","label":"Release"}]', '{"choice":"block"}', '{"choice":"block","confidence":0.97}', 'correct', false, 71000, now() - interval '8 hours'),
   (t8, u2, pol_kyc, 'KYC', 'Source of funds — cash deposit EUR 30k', '{"client":"R. Dubois","method":"cash"}', '[{"id":"accept","label":"Accept with docs"},{"id":"refuse","label":"Refuse"}]', '{"choice":"accept","docs":"property sale deed"}', '{"choice":"accept","confidence":0.74}', 'incorrect', true, 268000, now() - interval '2 days');

  -- Spans (5 each)
  INSERT INTO public.decision_spans (trace_id, step_order, step_type, label, payload, duration_ms)
  SELECT t.id, s.ord, s.stype, s.lbl, s.pl::jsonb, s.dur
  FROM (VALUES (t1),(t2),(t3),(t4),(t5),(t6),(t7),(t8)) AS t(id)
  CROSS JOIN (VALUES
    (1,'trigger','Trigger / Context','{"source":"workflow"}',2000),
    (2,'options','Options Presented','{"count":3}',5000),
    (3,'decision','Decision Made','{"by":"analyst"}',60000),
    (4,'policy_ref','Policy Referenced','{"section":"4.2"}',8000),
    (5,'outcome','Outcome','{"recorded":true}',3000)
  ) AS s(ord, stype, lbl, pl, dur);
END $$;