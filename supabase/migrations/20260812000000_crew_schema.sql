-- Shared trigger function, referenced by every table's updated_at trigger.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.crew_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.crew_workers TO service_role;
ALTER TABLE public.crew_workers ENABLE ROW LEVEL SECURITY;

-- Note: no `synced_to_sheet` column here — the Google Sheets mirror was dropped
-- when this feature was extracted into a standalone app.
CREATE TABLE public.crew_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.crew_workers(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  project_name text NOT NULL DEFAULT '',
  work_date date NOT NULL,
  clock_in_at timestamptz NOT NULL DEFAULT now(),
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_in_accuracy double precision,
  clock_out_at timestamptz,
  clock_out_lat double precision,
  clock_out_lng double precision,
  clock_out_accuracy double precision,
  worked_minutes integer,
  break_minutes integer NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crew_shifts_worker_date_idx ON public.crew_shifts (worker_id, work_date DESC);
CREATE INDEX crew_shifts_open_idx ON public.crew_shifts (worker_id) WHERE clock_out_at IS NULL;
GRANT ALL ON public.crew_shifts TO service_role;
ALTER TABLE public.crew_shifts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.crew_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.crew_shifts(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES public.crew_workers(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'meal',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crew_breaks_shift_idx ON public.crew_breaks (shift_id);
GRANT ALL ON public.crew_breaks TO service_role;
ALTER TABLE public.crew_breaks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.crew_safety_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.crew_workers(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.crew_shifts(id) ON DELETE SET NULL,
  project_id text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  work_date date NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text NOT NULL DEFAULT '',
  flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crew_safety_worker_date_idx ON public.crew_safety_checks (worker_id, work_date DESC);
GRANT ALL ON public.crew_safety_checks TO service_role;
ALTER TABLE public.crew_safety_checks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.crew_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.crew_workers(id) ON DELETE CASCADE,
  project_id text NOT NULL DEFAULT '',
  project_name text NOT NULL DEFAULT '',
  work_date date NOT NULL,
  kind text NOT NULL DEFAULT 'hazard',
  description text NOT NULL DEFAULT '',
  photo_urls text[] NOT NULL DEFAULT '{}',
  urgent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crew_incidents_date_idx ON public.crew_incidents (work_date DESC);
GRANT ALL ON public.crew_incidents TO service_role;
ALTER TABLE public.crew_incidents ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_crew_workers_updated_at BEFORE UPDATE ON public.crew_workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crew_shifts_updated_at BEFORE UPDATE ON public.crew_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crew_breaks_updated_at BEFORE UPDATE ON public.crew_breaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crew_safety_checks_updated_at BEFORE UPDATE ON public.crew_safety_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crew_incidents_updated_at BEFORE UPDATE ON public.crew_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- All five tables above are RLS-enabled with zero anon/authenticated policies,
-- which denies all access to those roles; only service_role (used exclusively
-- by Supabase Edge Functions, never shipped to a client) can read/write.
