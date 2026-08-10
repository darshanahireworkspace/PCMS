-- Police City Management System V2 - Supabase PostgreSQL Schema Migration
-- File: 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Police Stations Table
CREATE TABLE IF NOT EXISTS public.police_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_name VARCHAR(255) NOT NULL,
    station_code VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    contact_number VARCHAR(50),
    station_head VARCHAR(255),
    address TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Officers Table
CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Officer' CHECK (role IN ('Admin', 'Officer', 'SuperAdmin')),
    police_station_id UUID REFERENCES public.police_stations(id) ON DELETE SET NULL,
    police_station_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Religious Places Table
CREATE TABLE IF NOT EXISTS public.religious_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_name VARCHAR(255) NOT NULL,
    religion VARCHAR(100),
    place_type VARCHAR(100) NOT NULL,
    address TEXT,
    area VARCHAR(150),
    ward VARCHAR(100),
    taluka VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    google_map_link TEXT,
    police_station VARCHAR(255),
    regular_crowd INTEGER DEFAULT 0,
    special_day_crowd INTEGER DEFAULT 0,
    risk_level VARCHAR(50) DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    contact_person VARCHAR(255),
    contact_mobile VARCHAR(50),
    president_name VARCHAR(255),
    secretary_name VARCHAR(255),
    committee_details TEXT,
    sensitive_notes TEXT,
    image_url TEXT,
    created_by UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Festival Permissions Table
CREATE TABLE IF NOT EXISTS public.festival_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    religious_place_id UUID REFERENCES public.religious_places(id) ON DELETE SET NULL,
    festival_name VARCHAR(255) NOT NULL,
    festival_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    organizer_name VARCHAR(255) NOT NULL,
    president_name VARCHAR(255),
    president_mobile VARCHAR(50),
    permission_number VARCHAR(100),
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    expected_crowd INTEGER DEFAULT 0,
    sound_permission BOOLEAN DEFAULT FALSE,
    procession BOOLEAN DEFAULT FALSE,
    route_details TEXT,
    address TEXT,
    area VARCHAR(150),
    taluka VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    google_map_link TEXT,
    photo_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    permission_status VARCHAR(50) DEFAULT 'Pending' CHECK (permission_status IN ('Pending', 'Approved', 'Rejected', 'Expired')),
    assigned_officer UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    police_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Other Places Table
CREATE TABLE IF NOT EXISTS public.other_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    owner_name VARCHAR(255),
    mobile VARCHAR(50),
    address TEXT,
    area VARCHAR(150),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    google_map_link TEXT,
    photo_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at auto-trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_police_stations_updated_at BEFORE UPDATE ON public.police_stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_officers_updated_at BEFORE UPDATE ON public.officers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_religious_places_updated_at BEFORE UPDATE ON public.religious_places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_festival_permissions_updated_at BEFORE UPDATE ON public.festival_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trigger_other_places_updated_at BEFORE UPDATE ON public.other_places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
