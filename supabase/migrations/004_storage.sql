-- Police City Management System V2 - Supabase Storage Setup Migration
-- File: 004_storage.sql

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'city-management-photos',
    'city-management-photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Storage bucket access policies
CREATE POLICY "Public read access for city management photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'city-management-photos');

CREATE POLICY "Authenticated users upload city management photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'city-management-photos' AND
        (storage.foldername(name))[1] IN ('religious-places', 'festival-permissions', 'other-places')
    );

CREATE POLICY "Authenticated users update city management photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'city-management-photos');

CREATE POLICY "Authenticated users delete city management photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'city-management-photos');

CREATE POLICY "Service role full storage access"
    ON storage.objects FOR ALL
    USING (bucket_id = 'city-management-photos' AND auth.role() = 'service_role')
    WITH CHECK (bucket_id = 'city-management-photos' AND auth.role() = 'service_role');
