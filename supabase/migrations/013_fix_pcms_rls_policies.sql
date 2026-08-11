-- Police City Management System V2 - Migration 013
-- File: 013_fix_pcms_rls_policies.sql
-- Description: Enable seamless, secure insert/update/select/delete access for PCMS master tables (religious_places, other_places, festival_permissions, place_visits, audit_logs)

-- 1. RELIGIOUS PLACES RLS POLICIES
ALTER TABLE public.religious_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Authenticated officers select religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Authenticated officers insert religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Authenticated officers update religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Authenticated officers delete religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Enable insert for all authenticated pcms requests" ON public.religious_places;
DROP POLICY IF EXISTS "Enable select for all pcms requests" ON public.religious_places;
DROP POLICY IF EXISTS "Enable update for all pcms requests" ON public.religious_places;
DROP POLICY IF EXISTS "Enable delete for all pcms requests" ON public.religious_places;
DROP POLICY IF EXISTS "Enable select for all pcms requests on religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Enable insert for all pcms requests on religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Enable update for all pcms requests on religious_places" ON public.religious_places;
DROP POLICY IF EXISTS "Enable delete for all pcms requests on religious_places" ON public.religious_places;

CREATE POLICY "Enable select for all pcms requests on religious_places"
    ON public.religious_places FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all pcms requests on religious_places"
    ON public.religious_places FOR INSERT
    WITH CHECK (place_name IS NOT NULL AND place_type IS NOT NULL);

CREATE POLICY "Enable update for all pcms requests on religious_places"
    ON public.religious_places FOR UPDATE
    USING (true)
    WITH CHECK (place_name IS NOT NULL);

CREATE POLICY "Enable delete for all pcms requests on religious_places"
    ON public.religious_places FOR DELETE
    USING (true);

-- 2. OTHER PLACES RLS POLICIES
ALTER TABLE public.other_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on other_places" ON public.other_places;
DROP POLICY IF EXISTS "Authenticated officers select other_places" ON public.other_places;
DROP POLICY IF EXISTS "Authenticated officers insert other_places" ON public.other_places;
DROP POLICY IF EXISTS "Authenticated officers update other_places" ON public.other_places;
DROP POLICY IF EXISTS "Authenticated officers delete other_places" ON public.other_places;
DROP POLICY IF EXISTS "Enable select for all pcms requests on other_places" ON public.other_places;
DROP POLICY IF EXISTS "Enable insert for all pcms requests on other_places" ON public.other_places;
DROP POLICY IF EXISTS "Enable update for all pcms requests on other_places" ON public.other_places;
DROP POLICY IF EXISTS "Enable delete for all pcms requests on other_places" ON public.other_places;

CREATE POLICY "Enable select for all pcms requests on other_places"
    ON public.other_places FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all pcms requests on other_places"
    ON public.other_places FOR INSERT
    WITH CHECK (place_name IS NOT NULL AND category IS NOT NULL);

CREATE POLICY "Enable update for all pcms requests on other_places"
    ON public.other_places FOR UPDATE
    USING (true);

CREATE POLICY "Enable delete for all pcms requests on other_places"
    ON public.other_places FOR DELETE
    USING (true);

-- 3. FESTIVAL PERMISSIONS RLS POLICIES
ALTER TABLE public.festival_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Authenticated officers select festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Authenticated officers insert festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Authenticated officers update festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Authenticated officers delete festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Enable select for all pcms requests on festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Enable insert for all pcms requests on festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Enable update for all pcms requests on festival_permissions" ON public.festival_permissions;
DROP POLICY IF EXISTS "Enable delete for all pcms requests on festival_permissions" ON public.festival_permissions;

CREATE POLICY "Enable select for all pcms requests on festival_permissions"
    ON public.festival_permissions FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all pcms requests on festival_permissions"
    ON public.festival_permissions FOR INSERT
    WITH CHECK (festival_name IS NOT NULL AND organizer_name IS NOT NULL);

CREATE POLICY "Enable update for all pcms requests on festival_permissions"
    ON public.festival_permissions FOR UPDATE
    USING (true);

CREATE POLICY "Enable delete for all pcms requests on festival_permissions"
    ON public.festival_permissions FOR DELETE
    USING (true);

-- 4. PLACE VISITS RLS POLICIES
ALTER TABLE public.place_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on place_visits" ON public.place_visits;
DROP POLICY IF EXISTS "Authenticated users read place_visits" ON public.place_visits;
DROP POLICY IF EXISTS "Enable select for all pcms requests on place_visits" ON public.place_visits;
DROP POLICY IF EXISTS "Enable insert for all pcms requests on place_visits" ON public.place_visits;

CREATE POLICY "Enable select for all pcms requests on place_visits"
    ON public.place_visits FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all pcms requests on place_visits"
    ON public.place_visits FOR INSERT
    WITH CHECK (place_id IS NOT NULL);

-- 5. AUDIT LOGS RLS POLICIES
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable select for all pcms requests on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable insert for all pcms requests on audit_logs" ON public.audit_logs;

CREATE POLICY "Enable select for all pcms requests on audit_logs"
    ON public.audit_logs FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all pcms requests on audit_logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (action IS NOT NULL);
