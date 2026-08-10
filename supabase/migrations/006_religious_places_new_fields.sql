-- Police City Management System V2 - Supabase Migration
-- Migration: 006_religious_places_new_fields.sql
-- Description: Add CCTV, camera, alternate contact, registration, and notes columns to religious_places table

ALTER TABLE public.religious_places
ADD COLUMN IF NOT EXISTS cctv_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cctv_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS camera_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS camera_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS alternate_mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS trust_management_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS registration_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Convert regular_crowd column to VARCHAR to support text values ("Low", "Medium", "High")
ALTER TABLE public.religious_places
ALTER COLUMN regular_crowd TYPE VARCHAR(50) USING regular_crowd::text;

-- Update RLS policies to grant access to updated columns
GRANT SELECT, INSERT, UPDATE, DELETE ON public.religious_places TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.religious_places TO service_role;
