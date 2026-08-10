-- Police City Management System V2 - Supabase Migration
-- Migration: 007_festival_permissions_risk_level.sql
-- Description: Add risk_level column to festival_permissions table with default 'Low' and check constraint

ALTER TABLE public.festival_permissions
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'Low';

-- Safely update any existing NULL records to 'Low'
UPDATE public.festival_permissions
SET risk_level = 'Low'
WHERE risk_level IS NULL;

-- Add check constraint safely if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_festival_risk_level'
    ) THEN
        ALTER TABLE public.festival_permissions
        ADD CONSTRAINT chk_festival_risk_level CHECK (risk_level IN ('Low', 'Medium', 'High'));
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.festival_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festival_permissions TO service_role;
