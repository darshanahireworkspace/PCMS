-- Police City Management System V2 - Supabase Indexes Migration
-- File: 002_indexes.sql

-- Police Stations Indexes
CREATE INDEX IF NOT EXISTS idx_police_stations_status ON public.police_stations (status);
CREATE INDEX IF NOT EXISTS idx_police_stations_code ON public.police_stations (station_code);

-- Officers Indexes
CREATE INDEX IF NOT EXISTS idx_officers_username ON public.officers (username);
CREATE INDEX IF NOT EXISTS idx_officers_police_station ON public.officers (police_station_id);

-- Religious Places Indexes
CREATE INDEX IF NOT EXISTS idx_religious_places_type ON public.religious_places (place_type);
CREATE INDEX IF NOT EXISTS idx_religious_places_station ON public.religious_places (police_station);
CREATE INDEX IF NOT EXISTS idx_religious_places_risk ON public.religious_places (risk_level);
CREATE INDEX IF NOT EXISTS idx_religious_places_coords ON public.religious_places (latitude, longitude);

-- Festival Permissions Indexes
CREATE INDEX IF NOT EXISTS idx_festival_permissions_rel_place ON public.festival_permissions (religious_place_id);
CREATE INDEX IF NOT EXISTS idx_festival_permissions_status ON public.festival_permissions (permission_status);
CREATE INDEX IF NOT EXISTS idx_festival_permissions_verification ON public.festival_permissions (verification_status);
CREATE INDEX IF NOT EXISTS idx_festival_permissions_coords ON public.festival_permissions (latitude, longitude);

-- Other Places Indexes
CREATE INDEX IF NOT EXISTS idx_other_places_category ON public.other_places (category);
CREATE INDEX IF NOT EXISTS idx_other_places_coords ON public.other_places (latitude, longitude);

-- Activity Logs Index
CREATE INDEX IF NOT EXISTS idx_activity_logs_officer ON public.activity_logs (officer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);
