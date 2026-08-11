-- Police City Management System V2 - Migration 009
-- Multi-Officer, Super Admin, Teams, Data Ownership, Duplicate Visits & Audit Logs

-- 1. Update Officers Table Role & Fields
ALTER TABLE public.officers DROP CONSTRAINT IF EXISTS officers_role_check;
ALTER TABLE public.officers ADD CONSTRAINT officers_role_check CHECK (role IN ('Admin', 'Officer', 'SuperAdmin', 'HeadOfficer'));

ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE public.officers ADD COLUMN IF NOT EXISTS access_scope VARCHAR(50) DEFAULT 'OWN' CHECK (access_scope IN ('OWN', 'TEAM', 'ALL'));

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    police_station_id UUID REFERENCES public.police_stations(id) ON DELETE SET NULL,
    data_sharing BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, officer_id)
);

-- 4. Individual Place Access Table
CREATE TABLE IF NOT EXISTS public.place_officer_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'religious_place',
    officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL DEFAULT 'SHARED' CHECK (access_type IN ('OWNER', 'VERIFIED', 'SHARED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Place Verification Visits Table
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

-- 6. Audit Logs Table
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

-- 7. Add Ownership Columns & Triggers to Record Tables
ALTER TABLE public.religious_places ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.festival_permissions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.officers(id) ON DELETE SET NULL;
ALTER TABLE public.festival_permissions ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.other_places ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 8. Duplicate Flag Table for Admin Review
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

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER trigger_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_duplicate_reviews_updated_at BEFORE UPDATE ON public.duplicate_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
