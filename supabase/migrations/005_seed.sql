-- Police City Management System V2 - Supabase Seed Migration
-- File: 005_seed.sql

-- 1. Insert Initial Police Station
INSERT INTO public.police_stations (id, station_name, station_code, city, district, state, contact_number, station_head, address, status)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Central Police Station',
    'CPS-001',
    'City HQ',
    'Central',
    'Maharashtra',
    '020-26123456',
    'Inspector In-Charge',
    'Police Headquarters, City Center',
    'Active'
)
ON CONFLICT (station_code) DO NOTHING;

-- 2. Insert Initial Officer (Username: 7720075275, Password: 77200 hashed with bcrypt)
INSERT INTO public.officers (id, full_name, username, email, password_hash, role, police_station_id, police_station_name, status)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'Admin Officer',
    '7720075275',
    '7720075275@pcms.gov.in',
    '$2b$10$O5KZIzf0yZ6Irzy2J3yyOeUY4GIanQFVD2nyiD1kIJBCiUBsvQz2y', -- Hashed version of initial password '77200'
    'Admin',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Central Police Station',
    'Active'
)
ON CONFLICT (username) DO NOTHING;
