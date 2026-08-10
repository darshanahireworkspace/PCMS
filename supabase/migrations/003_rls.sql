-- Police City Management System V2 - Supabase Row Level Security (RLS) Migration
-- File: 003_rls.sql

-- Enable RLS on all tables
ALTER TABLE public.police_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.religious_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.other_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Police Stations RLS
-- Service role full access
CREATE POLICY "Service role full access on police_stations"
    ON public.police_stations FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users (officers) can read active police stations
CREATE POLICY "Authenticated officers view police_stations"
    ON public.police_stations FOR SELECT
    TO authenticated
    USING (status = 'Active');

-- Admin officers can manage police stations
CREATE POLICY "Admin officers manage police_stations"
    ON public.police_stations FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.officers WHERE username = auth.jwt()->>'preferred_username' AND role IN ('Admin', 'SuperAdmin')))
    WITH CHECK (EXISTS (SELECT 1 FROM public.officers WHERE username = auth.jwt()->>'preferred_username' AND role IN ('Admin', 'SuperAdmin')));

-- 2. Officers RLS
CREATE POLICY "Service role full access on officers"
    ON public.officers FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated officers view officer list"
    ON public.officers FOR SELECT
    TO authenticated
    USING (status = 'Active');

-- 3. Religious Places RLS
CREATE POLICY "Service role full access on religious_places"
    ON public.religious_places FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated officers select religious_places"
    ON public.religious_places FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated officers insert religious_places"
    ON public.religious_places FOR INSERT
    TO authenticated
    WITH CHECK (place_name IS NOT NULL AND place_type IS NOT NULL);

CREATE POLICY "Authenticated officers update religious_places"
    ON public.religious_places FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (place_name IS NOT NULL);

CREATE POLICY "Authenticated officers delete religious_places"
    ON public.religious_places FOR DELETE
    TO authenticated
    USING (true);

-- 4. Festival Permissions RLS
CREATE POLICY "Service role full access on festival_permissions"
    ON public.festival_permissions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated officers select festival_permissions"
    ON public.festival_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated officers insert festival_permissions"
    ON public.festival_permissions FOR INSERT
    TO authenticated
    WITH CHECK (festival_name IS NOT NULL AND organizer_name IS NOT NULL);

CREATE POLICY "Authenticated officers update festival_permissions"
    ON public.festival_permissions FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated officers delete festival_permissions"
    ON public.festival_permissions FOR DELETE
    TO authenticated
    USING (true);

-- 5. Other Places RLS
CREATE POLICY "Service role full access on other_places"
    ON public.other_places FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated officers select other_places"
    ON public.other_places FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated officers insert other_places"
    ON public.other_places FOR INSERT
    TO authenticated
    WITH CHECK (place_name IS NOT NULL AND category IS NOT NULL);

CREATE POLICY "Authenticated officers update other_places"
    ON public.other_places FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated officers delete other_places"
    ON public.other_places FOR DELETE
    TO authenticated
    USING (true);

-- 6. Activity Logs RLS
CREATE POLICY "Service role full access on activity_logs"
    ON public.activity_logs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated officers view activity_logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (true);
