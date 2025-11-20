-- Helper: enable citext if desired
CREATE EXTENSION IF NOT EXISTS citext;

-- ENUMs for small fixed sets (better than text + CHECK)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recruiter_status') THEN
    CREATE TYPE public.recruiter_status AS ENUM ('active','suspended','revoked','expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_type') THEN
    CREATE TYPE public.incident_type AS ENUM ('abuse','trafficking','wage_theft','passport_confiscation','safety_concern','health_issue','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_severity') THEN
    CREATE TYPE public.incident_severity AS ENUM ('low','medium','high','critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
    CREATE TYPE public.incident_status AS ENUM ('reported','investigating','resolved','closed');
  END IF;
END$$;

-- Timestamp helper function + privilege hardening
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- Embassy contacts
CREATE TABLE IF NOT EXISTS public.embassy_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country citext NOT NULL,
  embassy_name text NOT NULL,
  phone_primary text NOT NULL,
  phone_secondary text,
  email text,
  address text,
  emergency_hotline text,
  working_hours text,
  website text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for embassy_contacts
CREATE INDEX IF NOT EXISTS idx_embassy_contacts_country ON public.embassy_contacts (country);

-- Recruiters (use enum and arrays with GIN index for countries)
CREATE TABLE IF NOT EXISTS public.recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name citext NOT NULL,
  license_number text UNIQUE,
  registration_date date,
  expiry_date date,
  status public.recruiter_status NOT NULL DEFAULT 'active',
  company_address text,
  phone text,
  email text,
  website text,
  verified_by text,
  countries_of_operation text[],
  warnings text[],
  complaints_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruiters_license ON public.recruiters (license_number);
CREATE INDEX IF NOT EXISTS idx_recruiters_status ON public.recruiters (status);
CREATE INDEX IF NOT EXISTS idx_recruiters_countries_gin ON public.recruiters USING gin (countries_of_operation);

-- Rights resources (use jsonb if content will have structure, else keep text)
CREATE TABLE IF NOT EXISTS public.rights_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('rights','safety','legal','health','reintegration','emergency')),
  title text NOT NULL,
  content text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  country_specific text,
  tags text[],
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rights_resources_category ON public.rights_resources (category);
CREATE INDEX IF NOT EXISTS idx_rights_resources_language ON public.rights_resources (language);
CREATE INDEX IF NOT EXISTS idx_rights_resources_tags_gin ON public.rights_resources USING gin (tags);

-- Incident reports (use ENUMs)
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_type public.incident_type NOT NULL,
  severity public.incident_severity NOT NULL,
  country citext,
  employer_name text,
  description text NOT NULL,
  status public.incident_status NOT NULL DEFAULT 'reported',
  embassy_contacted boolean NOT NULL DEFAULT false,
  police_contacted boolean NOT NULL DEFAULT false,
  follow_up_needed boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_reports_user_id ON public.incident_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON public.incident_reports (severity);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON public.incident_reports (status);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_embassy_contacts_updated_at ON public.embassy_contacts;
CREATE TRIGGER update_embassy_contacts_updated_at
  BEFORE UPDATE ON public.embassy_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_recruiters_updated_at ON public.recruiters;
CREATE TRIGGER update_recruiters_updated_at
  BEFORE UPDATE ON public.recruiters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rights_resources_updated_at ON public.rights_resources;
CREATE TRIGGER update_rights_resources_updated_at
  BEFORE UPDATE ON public.rights_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_incident_reports_updated_at ON public.incident_reports;
CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON public.incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Row-level security: enable RLS and create policies (idempotent creation)
ALTER TABLE public.embassy_contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- embassy_contacts_select_auth
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    WHERE p.polname = 'embassy_contacts_select_auth'
      AND p.polrelid = 'public.embassy_contacts'::regclass
  ) THEN
    CREATE POLICY embassy_contacts_select_auth
      ON public.embassy_contacts
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- recruiters_select_auth
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    WHERE p.polname = 'recruiters_select_auth'
      AND p.polrelid = 'public.recruiters'::regclass
  ) THEN
    CREATE POLICY recruiters_select_auth
      ON public.recruiters
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

ALTER TABLE public.rights_resources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- rights_resources_select_auth
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    WHERE p.polname = 'rights_resources_select_auth'
      AND p.polrelid = 'public.rights_resources'::regclass
  ) THEN
    CREATE POLICY rights_resources_select_auth
      ON public.rights_resources
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- incident_reports_select_owner
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    WHERE p.polname = 'incident_reports_select_owner'
      AND p.polrelid = 'public.incident_reports'::regclass
  ) THEN
    CREATE POLICY incident_reports_select_owner
      ON public.incident_reports
      FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  -- incident_reports_insert_owner
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    WHERE p.polname = 'incident_reports_insert_owner'
      AND p.polrelid = 'public.incident_reports'::regclass
  ) THEN
    CREATE POLICY incident_reports_insert_owner
      ON public.incident_reports
      FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  -- incident_reports_update_owner
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policy p
    WHERE p.polname = 'incident_reports_update_owner'
      AND p.polrelid = 'public.incident_reports'::regclass
  ) THEN
    CREATE POLICY incident_reports_update_owner
      ON public.incident_reports
      FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END$$;

-- Sample inserts (few rows). Keep inserts in separate transaction in production.
INSERT INTO public.embassy_contacts (country, embassy_name, phone_primary, phone_secondary, email, address, emergency_hotline, working_hours)
VALUES
('UAE', 'Uganda Embassy Dubai', '+971-4-397-7100', '+971-50-555-1234', 'dubai@mofa.go.ug', 'Villa 23, Street 18, Al Safa 2, Dubai', '+971-50-555-9999', '08:00 - 17:00 (Mon-Fri)'),
('Saudi Arabia', 'Uganda Embassy Riyadh', '+966-11-488-3305', '+966-50-123-4567', 'riyadh@mofa.go.ug', 'Diplomatic Quarter, Riyadh', '+966-50-999-8888', '08:00 - 16:00 (Sun-Thu)')
ON CONFLICT DO NOTHING;

INSERT INTO public.recruiters (company_name, license_number, registration_date, expiry_date, status, company_address, phone, countries_of_operation, complaints_count)
VALUES
('Safe Migration Services Ltd', 'UG-MIG-2023-001', '2023-01-15', '2025-01-15', 'active', 'Plot 123, Kampala Road, Kampala', '+256-414-123456', ARRAY['UAE','Qatar','Saudi Arabia'], 0)
ON CONFLICT DO NOTHING;