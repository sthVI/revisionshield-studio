CREATE TABLE public.project_intelligence_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  insight_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('dismissed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, insight_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_intelligence_states TO authenticated;
GRANT ALL ON public.project_intelligence_states TO service_role;
ALTER TABLE public.project_intelligence_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own intelligence states" ON public.project_intelligence_states
FOR ALL TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
);