-- Catalog requests: any user can request a new data source
CREATE TABLE public.data_source_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL,
  name TEXT NOT NULL,
  source_url TEXT,
  category TEXT,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.data_source_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view requests"
  ON public.data_source_requests FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users create own requests"
  ON public.data_source_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users update own requests"
  ON public.data_source_requests FOR UPDATE
  TO authenticated USING (auth.uid() = requested_by) WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins manage all requests"
  ON public.data_source_requests FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_data_source_requests_updated_at
  BEFORE UPDATE ON public.data_source_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();