-- Replaces the source app's boards.ts-derived project list: projects are now
-- data, managed from the Crew Admin dashboard.
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_active_idx ON public.projects (active);
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Replaces the source app's httpOnly cookie session (useSession), which has no
-- equivalent in React Native. A worker's phone stores this token in
-- expo-secure-store and sends it as `Authorization: Bearer <token>`.
CREATE TABLE public.crew_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.crew_workers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crew_sessions_worker_idx ON public.crew_sessions (worker_id);
CREATE INDEX crew_sessions_expires_idx ON public.crew_sessions (expires_at);
GRANT ALL ON public.crew_sessions TO service_role;
ALTER TABLE public.crew_sessions ENABLE ROW LEVEL SECURITY;
