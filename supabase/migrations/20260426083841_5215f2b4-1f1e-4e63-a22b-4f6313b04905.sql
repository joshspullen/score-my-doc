-- Policy documents library
CREATE TABLE IF NOT EXISTS public.policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_process_id uuid REFERENCES public.business_processes(id) ON DELETE CASCADE,
  compliance_requirement_id uuid REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  file_size integer NOT NULL DEFAULT 0,
  extracted_text text,
  extraction_status text NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending','ready','error')),
  extraction_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT policy_documents_target_required
    CHECK (business_process_id IS NOT NULL OR compliance_requirement_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_policy_documents_bp
  ON public.policy_documents (business_process_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_documents_cr
  ON public.policy_documents (compliance_requirement_id, created_at DESC);

ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated view policy documents" ON public.policy_documents;
CREATE POLICY "Authenticated view policy documents"
ON public.policy_documents FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage policy documents" ON public.policy_documents;
CREATE POLICY "Admins manage policy documents"
ON public.policy_documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_policy_documents_updated ON public.policy_documents;
CREATE TRIGGER trg_policy_documents_updated
BEFORE UPDATE ON public.policy_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for documents bucket, policies/ prefix
DROP POLICY IF EXISTS "Authenticated view policy files" ON storage.objects;
CREATE POLICY "Authenticated view policy files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = 'policies');

DROP POLICY IF EXISTS "Admins upload policy files" ON storage.objects;
CREATE POLICY "Admins upload policy files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'policies'
  AND public.has_role(auth.uid(),'admin')
);

DROP POLICY IF EXISTS "Admins update policy files" ON storage.objects;
CREATE POLICY "Admins update policy files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'policies'
  AND public.has_role(auth.uid(),'admin')
);

DROP POLICY IF EXISTS "Admins delete policy files" ON storage.objects;
CREATE POLICY "Admins delete policy files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'policies'
  AND public.has_role(auth.uid(),'admin')
);