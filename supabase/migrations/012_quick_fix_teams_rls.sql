-- =========================================================
-- PCMS V2 - 1-CLICK FIX FOR TEAMS & TEAM MEMBERS RLS & SCHEMAS
-- Execute this SQL in Supabase Dashboard -> SQL Editor (Project: pxemynoflshyfygtpuha)
-- =========================================================

-- 1. Ensure Table public.teams Exists
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL,
    description TEXT,
    police_station_id UUID,
    data_sharing BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Table public.team_members Exists
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, officer_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4. Create Open RLS Policies for Teams & Team Members
DROP POLICY IF EXISTS "Allow all on teams" ON public.teams;
CREATE POLICY "Allow all on teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on team_members" ON public.team_members;
CREATE POLICY "Allow all on team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

-- 5. Create Open RLS Policy for Audit Logs (if missing)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow all on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
