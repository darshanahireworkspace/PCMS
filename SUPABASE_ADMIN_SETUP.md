# Supabase Super Admin & PCMS V2 Migration Setup Guide

This guide provides the complete, dependency-ordered SQL migration for PCMS V2 and verification queries to ensure your Supabase database schema, Super Admin account, and metrics endpoints function cleanly.

---

## 1. Migration File Information
- **Migration File**: `010_super_admin_and_multi_officer.sql` (also available as `011_fix_super_admin_multi_officer_schema.sql`)
- **File Location**: [supabase/migrations/010_super_admin_and_multi_officer.sql](file:///d:/PCMS/police-city-management-system/supabase/migrations/010_super_admin_and_multi_officer.sql)

---

## 2. Root Cause & Dependency Fix Summary
- **Previous Error**: `ERROR: 42P01: relation "public.teams" does not exist`
- **Root Cause**: Foreign key column references (`ALTER TABLE ... ADD COLUMN team_id REFERENCES public.teams(id)`) were executed before `CREATE TABLE public.teams` was executed.
- **Fix Applied**: Re-ordered all DDL statements in strict dependency order:
  1. Alter existing base tables (`officers`, `religious_places`, `festival_permissions`, `other_places`) without new FKs.
  2. Create parent tables (`teams`, `audit_logs`, `duplicate_reviews`).
  3. Create dependent tables (`team_members`, `place_officer_access`, `place_visits`).
  4. Add foreign key columns (`team_id`) to master tables now that `teams` exists.
  5. Create indexes, seed `pcmsadmin`, and configure RLS policies.

---

## 3. Steps to Execute Migration in Supabase SQL Editor

1. Log in to **Supabase Dashboard** ([https://supabase.com/dashboard](https://supabase.com/dashboard)).
2. Open Project **pxemynoflshyfygtpuha**.
3. On the left sidebar, click **SQL Editor** (`>_`).
4. Click **+ New Query**.
5. Copy the complete SQL script from `supabase/migrations/010_super_admin_and_multi_officer.sql`.
6. Paste into the SQL Editor window and click **Run** (or press `Ctrl+Enter`).
7. Confirm query execution returns `Success`.

---

## 4. Verification SQL Queries

Run the following queries in the Supabase SQL Editor after executing the migration to verify the database state:

### A. Verify All Required Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
*Expected Output*: Includes `audit_logs`, `duplicate_reviews`, `festival_permissions`, `officers`, `other_places`, `place_officer_access`, `place_visits`, `police_stations`, `religious_places`, `team_members`, `teams`.

### B. Verify Officers Role Constraint & Columns
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'officers'
  AND column_name IN ('designation', 'age', 'gender', 'mobile', 'access_scope');
```

### C. Verify Super Admin Seed Account
```sql
SELECT id, full_name, username, role, access_scope, status
FROM public.officers
WHERE username = 'pcmsadmin';
```
*Expected Output*: 1 row with `role` = `SuperAdmin`, `access_scope` = `ALL`, `status` = `Active`.

### D. Verify Master Tables Ownership & Team Columns
```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('created_by', 'team_id', 'updated_by')
ORDER BY table_name, column_name;
```
*Expected Output*: Shows `created_by`, `team_id`, `updated_by` for `festival_permissions`, `other_places`, and `religious_places`.

---

## 5. Super Admin Credentials & Testing

- **Admin Portal URL**: `http://localhost:5173/admin/login`
- **Username**: `pcmsadmin`
- **Password**: `PCMS@Admin2026`
- **Role**: `SuperAdmin`
- **Scope**: `ALL`

### Verification Checklist
1. Open `http://localhost:5173/admin/login` in your browser.
2. Sign in using `pcmsadmin` / `PCMS@Admin2026`.
3. Confirm clean redirect to `/admin/dashboard`.
4. Verify Dashboard KPI Cards (Total Officers, Active Officers, Inactive Officers, Total Religious Places, Total Festival Permissions, Total Other Places, Total Records, Total Police Stations).
5. Navigate to **Officers** (`/admin/officers`) and test adding an officer with role `Officer` and scope `OWN`.
6. Navigate to **Teams**, **Access Control**, **Duplicate Review**, and **Audit Logs**.
