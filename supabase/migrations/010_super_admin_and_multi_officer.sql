-- Police City Management System V2 - Migration 010 (Corrected Dependency Order)
-- File: 010_super_admin_and_multi_officer.sql
-- Super Admin, Multi-Officer Roles, Teams, Data Ownership, Duplicate Reviews & Audit Logs

-- =========================================================
-- STEP 1: ALTER EXISTING MASTER TABLES (NO NEW FOREIGN KEYS YET)
-- =========================================================

-- Safely update officers role constraint to include SuperAdmin and HeadOfficer
ALTER TABLE public.officers DROP CONSTRAINT IF EXISTS officers_role_check;
ALTER TABLE public.officers ADD CONSTRAINT officers_role_check CHECK (role IN ('Admin', 'Officer', 'SuperAdmin', 'HeadOfficer'));

-- Add new officer profile and scope columns
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT 'Constable';
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 30;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS access_scope VARCHAR(50) DEFAULT 'OWN' CHECK (access_scope IN ('OWN', 'TEAM', 'ALL'));

-- Add ownership reference columns to master record tables (pointing to officers)
ALTER TABLE public.religious_places ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.religious_places ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.religious_places ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.festival_permissions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.festival_permissions ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.festival_permissions ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.other_places ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.other_places ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.other_places ADD COLUMN IF NOT EXISTS photo_url TEXT;


-- =========================================================
-- STEP 2: CREATE PARENT TABLES (TEAMS, AUDIT_LOGS, DUPLICATE_REVIEWS)
-- =========================================================

-- Create Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    police_station_id UUID REFERENCES public.police_stations(id) ON DELETE SET NULL,
    data_sharing BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Duplicate Reviews table
CREATE TABLE IF NOT EXISTS public.duplicate_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_place_id UUID NOT NULL,
    duplicate_place_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'religious_place',
    similarity_score NUMERIC(5, 2) DEFAULT 0.0,
    distance_meters NUMERIC(10, 2) DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Merged', 'KeptBoth', 'Rejected')),
    reviewed_by UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- STEP 3: CREATE DEPENDENT TABLES (REFERENCING TEAMS & OFFICERS)
-- =========================================================

-- Create Team Members table (depends on teams & officers)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, officer_id)
);

-- Create Place Officer Access table (individual sharing permissions)
CREATE TABLE IF NOT EXISTS public.place_officer_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'religious_place',
    officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL DEFAULT 'SHARED' CHECK (access_type IN ('OWNER', 'VERIFIED', 'SHARED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Place Visits table (verification history)
CREATE TABLE IF NOT EXISTS public.place_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'religious_place',
    officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    officer_name VARCHAR(255),
    visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- STEP 4: ADD TEAM_ID FOREIGN KEYS TO MASTER TABLES (NOW THAT TEAMS EXISTS)
-- =========================================================

ALTER TABLE public.religious_places ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.festival_permissions ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.other_places ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;


-- =========================================================
-- STEP 5: CREATE PERFORMANCE INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_officers_role ON public.officers(role);
CREATE INDEX IF NOT EXISTS idx_officers_username ON public.officers(username);
CREATE INDEX IF NOT EXISTS idx_religious_places_created_by ON public.religious_places(created_by);
CREATE INDEX IF NOT EXISTS idx_religious_places_team_id ON public.religious_places(team_id);
CREATE INDEX IF NOT EXISTS idx_festival_permissions_created_by ON public.festival_permissions(created_by);
CREATE INDEX IF NOT EXISTS idx_festival_permissions_team_id ON public.festival_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_other_places_created_by ON public.other_places(created_by);
CREATE INDEX IF NOT EXISTS idx_other_places_team_id ON public.other_places(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_officer ON public.team_members(officer_id);
CREATE INDEX IF NOT EXISTS idx_place_visits_place ON public.place_visits(place_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);


-- =========================================================
-- STEP 6: SUPER ADMIN SEED RECORD (SPMalegaon / SPMalegaon423203)
-- =========================================================

INSERT INTO public.officers (
    full_name,
    username,
    email,
    password_hash,
    role,
    access_scope,
    status,
    designation,
    police_station_name
)
VALUES (
    'Superintendent of Police Malegaon',
    'SPMalegaon',
    'sp.malegaon@mahapolice.gov.in',
    'c8c967ae734eaeb63d74f5d5611009060b453375e7af9dd6a2d45b522bbc7db3',
    'SuperAdmin',
    'ALL',
    'Active',
    'Superintendent of Police',
    'Malegaon Police Headquarters'
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = 'c8c967ae734eaeb63d74f5d5611009060b453375e7af9dd6a2d45b522bbc7db3',
    role = 'SuperAdmin',
    access_scope = 'ALL',
    status = 'Active';

-- Step 6.1: Deactivate legacy admin/test accounts so only SPMalegaon holds SuperAdmin status
UPDATE public.officers 
SET status = 'Inactive', role = 'Officer', access_scope = 'OWN' 
WHERE username = 'pcmsadmin';


-- =========================================================
-- STEP 7: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_officer_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_reviews ENABLE ROW LEVEL SECURITY;

-- Service role full access policies for Edge Functions
DROP POLICY IF EXISTS "Service role full access on teams" ON public.teams;
CREATE POLICY "Service role full access on teams" ON public.teams FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on team_members" ON public.team_members;
CREATE POLICY "Service role full access on team_members" ON public.team_members FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on place_officer_access" ON public.place_officer_access;
CREATE POLICY "Service role full access on place_officer_access" ON public.place_officer_access FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on place_visits" ON public.place_visits;
CREATE POLICY "Service role full access on place_visits" ON public.place_visits FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Service role full access on audit_logs" ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on duplicate_reviews" ON public.duplicate_reviews;
CREATE POLICY "Service role full access on duplicate_reviews" ON public.duplicate_reviews FOR ALL USING (auth.role() = 'service_role');

-- Authenticated and Anon full access permissions on management tables
DROP POLICY IF EXISTS "Authenticated users read teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users full access on teams" ON public.teams;
DROP POLICY IF EXISTS "Anon full access on teams" ON public.teams;
CREATE POLICY "Authenticated users full access on teams" ON public.teams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on teams" ON public.teams FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users read team_members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users full access on team_members" ON public.team_members;
DROP POLICY IF EXISTS "Anon full access on team_members" ON public.team_members;
CREATE POLICY "Authenticated users full access on team_members" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access on team_members" ON public.team_members FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users read place_visits" ON public.place_visits;
DROP POLICY IF EXISTS "Authenticated users full access on place_visits" ON public.place_visits;
CREATE POLICY "Authenticated users full access on place_visits" ON public.place_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users read place_access" ON public.place_officer_access;
DROP POLICY IF EXISTS "Authenticated users full access on place_access" ON public.place_officer_access;
CREATE POLICY "Authenticated users full access on place_access" ON public.place_officer_access FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users full access on audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated users full access on audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access on duplicate_reviews" ON public.duplicate_reviews;
CREATE POLICY "Authenticated users full access on duplicate_reviews" ON public.duplicate_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
