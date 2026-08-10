-- Police City Management System V2 - Supabase Migration
-- Migration: 008_festival_permissions_complete_repair.sql
-- Description: Complete schema repair for festival_permissions table to fix all missing column & relationship errors

-- 1. Ensure festival_permissions table exists
CREATE TABLE IF NOT EXISTS public.festival_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_name VARCHAR(255) NOT NULL DEFAULT 'Festival',
    organizer_name VARCHAR(255) NOT NULL DEFAULT 'Mandal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add all missing columns safely
ALTER TABLE public.festival_permissions
ADD COLUMN IF NOT EXISTS religious_place_id UUID REFERENCES public.religious_places(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS festival_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
ADD COLUMN IF NOT EXISTS mandal_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS president_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS president_mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS secretary_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS secretary_mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS vice_president_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS vice_president_mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS alternate_contact_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS permission_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS festival_start_date DATE,
ADD COLUMN IF NOT EXISTS festival_end_date DATE,
ADD COLUMN IF NOT EXISTS procession_date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS procession_start_time TIME,
ADD COLUMN IF NOT EXISTS procession_end_time TIME,
ADD COLUMN IF NOT EXISTS expected_crowd INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sound_permission BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS procession BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS procession_permission BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS route_details TEXT,
ADD COLUMN IF NOT EXISTS procession_route TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS area VARCHAR(150),
ADD COLUMN IF NOT EXISTS ward VARCHAR(100),
ADD COLUMN IF NOT EXISTS taluka VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS google_map_link TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS permission_status VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'Low',
ADD COLUMN IF NOT EXISTS police_notes TEXT,
ADD COLUMN IF NOT EXISTS police_verification_notes TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_officer UUID REFERENCES public.officers(id) ON DELETE SET NULL;

-- 3. Safely update NULL defaults for existing records
UPDATE public.festival_permissions SET permission_status = 'Pending' WHERE permission_status IS NULL;
UPDATE public.festival_permissions SET verification_status = 'Pending' WHERE verification_status IS NULL;
UPDATE public.festival_permissions SET risk_level = 'Low' WHERE risk_level IS NULL;

-- 4. Useful Performance Indexes
CREATE INDEX IF NOT EXISTS idx_festival_rel_place ON public.festival_permissions(religious_place_id);
CREATE INDEX IF NOT EXISTS idx_festival_perm_status ON public.festival_permissions(permission_status);
CREATE INDEX IF NOT EXISTS idx_festival_verif_status ON public.festival_permissions(verification_status);
CREATE INDEX IF NOT EXISTS idx_festival_risk_level ON public.festival_permissions(risk_level);
CREATE INDEX IF NOT EXISTS idx_festival_created_at ON public.festival_permissions(created_at);

-- 5. Grant RLS Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festival_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festival_permissions TO service_role;
